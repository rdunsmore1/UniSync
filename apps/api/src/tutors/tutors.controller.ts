import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../common/request-with-user";
import { UpsertTutorProfileDto } from "./dto/upsert-tutor-profile.dto";
import { TutorsService } from "./tutors.service";

@Controller("tutors")
export class TutorsController {
  constructor(private readonly tutorsService: TutorsService) {}

  @Get()
  listTutors(@CurrentUser() user: AuthenticatedUser) {
    return this.tutorsService.listTutors(user);
  }

  @Post("profile")
  upsertProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertTutorProfileDto) {
    return this.tutorsService.upsertProfile(user, dto);
  }

  @Post(":id/contact")
  contactTutor(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.tutorsService.contactTutor(user, id);
  }
}
