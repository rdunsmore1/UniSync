import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { RequestWithUser } from "../common/request-with-user";
import { AuthService } from "./auth.service";

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    request.user = await this.authService.resolveUserFromRequest(request);
    return true;
  }
}
