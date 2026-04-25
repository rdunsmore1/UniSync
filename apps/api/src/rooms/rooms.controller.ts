import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../common/request-with-user";
import { CreateRoomDto } from "./dto/create-room.dto";
import { UpdateRoomDto } from "./dto/update-room.dto";
import { RoomsService } from "./rooms.service";

@Controller()
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get("rooms/:roomId")
  getRoom(
    @CurrentUser() user: AuthenticatedUser,
    @Param("roomId") roomId: string,
  ) {
    return this.roomsService.getRoom(user, roomId);
  }

  @Post("organizations/:organizationId/rooms")
  createRoom(
    @CurrentUser() user: AuthenticatedUser,
    @Param("organizationId") organizationId: string,
    @Body() dto: CreateRoomDto,
  ) {
    return this.roomsService.createRoom(user, organizationId, dto);
  }

  @Patch("rooms/:roomId")
  updateRoom(
    @CurrentUser() user: AuthenticatedUser,
    @Param("roomId") roomId: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomsService.updateRoom(user, roomId, dto);
  }

  @Delete("rooms/:roomId")
  deleteRoom(
    @CurrentUser() user: AuthenticatedUser,
    @Param("roomId") roomId: string,
  ) {
    return this.roomsService.deleteRoom(user, roomId);
  }
}
