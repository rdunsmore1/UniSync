import { Controller, Get } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../common/request-with-user";
import { UsersService } from "./users.service";

@Controller("me")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getMe(user.id);
  }

  @Get("dashboard")
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getDashboard(user);
  }
}
