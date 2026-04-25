import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../common/request-with-user";
import { OrganizationsService } from "./organizations.service";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { CreateReportDto } from "./dto/create-report.dto";
import { JoinOrganizationDto } from "./dto/join-organization.dto";
import { UpdateMemberRoleDto } from "./dto/update-member-role.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { UpdateOrganizationTagsDto } from "./dto/update-organization-tags.dto";

@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.organizationsService.listOrganizations(user);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrganizationDto) {
    return this.organizationsService.createOrganization(user, dto);
  }

  @Get(":slug")
  getBySlug(@CurrentUser() user: AuthenticatedUser, @Param("slug") slug: string) {
    return this.organizationsService.getOrganizationBySlug(user, slug);
  }

  @Post(":id/join")
  joinOrganization(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() _dto: JoinOrganizationDto,
  ) {
    return this.organizationsService.joinOrganization(user, id);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.updateOrganization(user, id, dto);
  }

  @Patch(":id/tags")
  updateTags(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateOrganizationTagsDto,
  ) {
    return this.organizationsService.updateOrganizationTags(user, id, dto.tags);
  }

  @Patch(":id/members/:userId/role")
  updateMemberRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Param("userId") userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.organizationsService.updateMemberRole(user, id, userId, dto.role);
  }

  @Delete(":id/members/:userId")
  removeMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Param("userId") userId: string,
  ) {
    return this.organizationsService.removeMember(user, id, userId);
  }

  @Post(":id/reports")
  reportOrganization(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: CreateReportDto,
  ) {
    return this.organizationsService.reportOrganization(user, id, dto);
  }
}
