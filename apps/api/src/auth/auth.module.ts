import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthCookieService } from "./auth-cookie.service";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { OptionalAuthGuard } from "./optional-auth.guard";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret",
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthCookieService,
    OptionalAuthGuard,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [AuthService, AuthCookieService, OptionalAuthGuard],
})
export class AuthModule {}
