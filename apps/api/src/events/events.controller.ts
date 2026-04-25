import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../common/request-with-user";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateRsvpDto } from "./dto/update-rsvp.dto";
import { EventsService } from "./events.service";

@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get("events")
  listEvents(@CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.listEvents(user);
  }

  @Post("organizations/:organizationId/events")
  createEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Param("organizationId") organizationId: string,
    @Body() dto: CreateEventDto,
  ) {
    return this.eventsService.createEvent(user, organizationId, dto);
  }

  @Post("events/:eventId/rsvp")
  rsvp(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventId") eventId: string,
    @Body() dto: UpdateRsvpDto,
  ) {
    return this.eventsService.rsvp(user, eventId, dto.status);
  }
}
