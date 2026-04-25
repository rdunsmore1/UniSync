import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import type { Response } from "express";
import type { AuthenticatedUser, RequestWithUser } from "../common/request-with-user";
import { PrismaService } from "../database/prisma.service";
import { AuthCookieService } from "./auth-cookie.service";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "./constants";
import { LoginDto } from "./dto/login.dto";
import { SignUpDto } from "./dto/signup.dto";
import type { AuthTokens, JwtAccessPayload } from "./auth.types";
import { generateOpaqueToken, getRefreshExpiryDate, hashToken } from "./auth.utils";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly authCookieService: AuthCookieService,
  ) {}

  async signUp(dto: SignUpDto) {
    const email = dto.email.toLowerCase().trim();
    const domain = email.split("@")[1];
    if (!domain) {
      throw new BadRequestException("A valid university email is required.");
    }

    const universityDomain = await this.prisma.universityEmailDomain.findUnique({
      where: { domain },
      include: { university: true },
    });

    if (!universityDomain) {
      throw new BadRequestException(
        "Please sign up with a recognized university email domain.",
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException("An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        universityId: universityDomain.universityId,
      },
    });

    await this.prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id, consumedAt: null },
    });

    const verificationToken = generateOpaqueToken(24);
    const verificationExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt: verificationExpiresAt,
      },
    });

    return {
      message: "Account created. Verify your university email to continue.",
      pendingEmail: email,
      detectedDomain: domain,
      verificationToken:
        process.env.NODE_ENV === "production" ? undefined : verificationToken,
    };
  }

  async login(dto: LoginDto, response: Response) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        university: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException("Verify your university email before logging in.");
    }

    const tokens = await this.createSessionTokens(user);
    this.authCookieService.setAuthCookies(
      response,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.refreshTokenExpiresAt,
    );

    return {
      message: "Login successful.",
      user: this.toSafeUser(user),
    };
  }

  async verifyEmail(token: string, response: Response) {
    const verificationToken = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
      include: {
        user: true,
      },
    });

    if (
      !verificationToken ||
      verificationToken.consumedAt ||
      verificationToken.expiresAt < new Date()
    ) {
      throw new BadRequestException("This verification link is invalid or expired.");
    }

    await this.prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { consumedAt: new Date() },
    });

    const user = await this.prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        isEmailVerified: true,
      },
      include: {
        university: true,
      },
    });

    const tokens = await this.createSessionTokens(user);
    this.authCookieService.setAuthCookies(
      response,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.refreshTokenExpiresAt,
    );

    return {
      message: "Email verified successfully.",
      user: this.toSafeUser(user),
    };
  }

  async logout(request: RequestWithUser, response: Response) {
    const refreshToken = this.extractRefreshToken(request);
    if (refreshToken) {
      await this.prisma.session.deleteMany({
        where: {
          sessionTokenHash: hashToken(refreshToken),
        },
      });
    }

    this.authCookieService.clearAuthCookies(response);
    return { success: true };
  }

  async refreshSession(request: RequestWithUser, response: Response) {
    const refreshToken = this.extractRefreshToken(request);

    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token missing.");
    }

    const session = await this.prisma.session.findUnique({
      where: {
        sessionTokenHash: hashToken(refreshToken),
      },
      include: {
        user: {
          include: {
            university: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token is invalid or expired.");
    }

    const rotatedRefreshToken = generateOpaqueToken();
    const refreshTokenExpiresAt = getRefreshExpiryDate();

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        sessionTokenHash: hashToken(rotatedRefreshToken),
        expiresAt: refreshTokenExpiresAt,
      },
    });

    const accessToken = await this.jwtService.signAsync(
      {
        sub: session.user.id,
        email: session.user.email,
        universityId: session.user.universityId,
      },
      {
        secret: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret",
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
      },
    );

    this.authCookieService.setAuthCookies(
      response,
      accessToken,
      rotatedRefreshToken,
      refreshTokenExpiresAt,
    );

    return {
      message: "Session refreshed.",
      user: this.toSafeUser(session.user),
    };
  }

  getSession(user?: AuthenticatedUser) {
    if (!user) {
      return {
        authenticated: false,
        user: null,
      };
    }

    return {
      authenticated: true,
      user,
    };
  }

  async resolveUserFromRequest(
    request: RequestWithUser,
  ): Promise<AuthenticatedUser | undefined> {
    const token = this.extractAccessToken(request);
    if (!token) {
      return undefined;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtAccessPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret",
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isEmailVerified) {
        return undefined;
      }

      return this.toSafeUser(user);
    } catch {
      return undefined;
    }
  }

  private async createSessionTokens(user: {
    id: string;
    email: string;
    universityId: string;
  }): Promise<AuthTokens> {
    const refreshToken = generateOpaqueToken();
    const refreshTokenExpiresAt = getRefreshExpiryDate();

    await this.prisma.session.create({
      data: {
        userId: user.id,
        sessionTokenHash: hashToken(refreshToken),
        expiresAt: refreshTokenExpiresAt,
      },
    });

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        universityId: user.universityId,
      },
      {
        secret: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret",
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
      },
    );

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt,
    };
  }

  private extractAccessToken(request: RequestWithUser) {
    const cookieToken = request.cookies?.[ACCESS_COOKIE_NAME];
    if (cookieToken) {
      return cookieToken;
    }

    const authorization = request.headers.authorization;
    if (authorization?.startsWith("Bearer ")) {
      return authorization.slice(7);
    }

    return undefined;
  }

  private extractRefreshToken(request: RequestWithUser) {
    return request.cookies?.[REFRESH_COOKIE_NAME];
  }

  private toSafeUser(user: {
    id: string;
    email: string;
    universityId: string;
    firstName: string;
    lastName: string;
    isEmailVerified: boolean;
  }): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      universityId: user.universityId,
      firstName: user.firstName,
      lastName: user.lastName,
      isEmailVerified: user.isEmailVerified,
    };
  }
}
