import { Injectable } from "@nestjs/common";
import type { Response } from "express";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "./constants";

@Injectable()
export class AuthCookieService {
  private getCookieConfig(maxAge: number) {
    const isProduction = process.env.NODE_ENV === "production";

    return {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: isProduction,
      path: "/",
      maxAge,
    };
  }

  setAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
    refreshTokenExpiresAt: Date,
  ) {
    response.cookie(
      ACCESS_COOKIE_NAME,
      accessToken,
      this.getCookieConfig(15 * 60 * 1000),
    );
    response.cookie(
      REFRESH_COOKIE_NAME,
      refreshToken,
      this.getCookieConfig(refreshTokenExpiresAt.getTime() - Date.now()),
    );
  }

  clearAuthCookies(response: Response) {
    response.clearCookie(ACCESS_COOKIE_NAME, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    response.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }
}
