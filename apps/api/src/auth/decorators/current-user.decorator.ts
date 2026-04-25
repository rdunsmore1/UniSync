import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthenticatedUser, RequestWithUser } from "../../common/request-with-user";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser | undefined => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
