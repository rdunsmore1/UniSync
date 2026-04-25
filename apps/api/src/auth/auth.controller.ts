import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import type { RequestWithUser } from "../common/request-with-user";
import { CurrentUser } from "./decorators/current-user.decorator";
import { Public } from "./decorators/public.decorator";
import { OptionalAuthGuard } from "./optional-auth.guard";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { SignUpDto } from "./dto/signup.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("signup")
  async signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @Public()
  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(dto, response);
  }

  @Public()
  @Post("verify-email")
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.verifyEmail(dto.token, response);
  }

  @Post("logout")
  async logout(
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logout(request, response);
  }

  @Public()
  @Post("refresh")
  async refresh(
    @Body() _dto: RefreshDto,
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.refreshSession(request, response);
  }

  @UseGuards(OptionalAuthGuard)
  @Public()
  @Get("session")
  getSession(@CurrentUser() user?: RequestWithUser["user"]) {
    return this.authService.getSession(user);
  }
}
