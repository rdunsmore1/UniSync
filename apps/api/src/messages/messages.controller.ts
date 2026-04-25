import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../common/request-with-user";
import { CreateDirectMessageDto } from "./dto/create-direct-message.dto";
import { CreateRoomMessageDto } from "./dto/create-room-message.dto";
import { ToggleRoomMessageReactionDto } from "./dto/toggle-room-message-reaction.dto";
import { MessagesService } from "./messages.service";

@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get("rooms/:roomId/messages")
  getRoomMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param("roomId") roomId: string,
  ) {
    return this.messagesService.getRoomMessages(user, roomId);
  }

  @Post("rooms/:roomId/messages")
  createRoomMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param("roomId") roomId: string,
    @Body() dto: CreateRoomMessageDto,
  ) {
    return this.messagesService.createRoomMessage(
      user,
      roomId,
      dto.body,
      dto.replyToMessageId,
    );
  }

  @Post("rooms/:roomId/messages/:messageId/reactions")
  toggleRoomMessageReaction(
    @CurrentUser() user: AuthenticatedUser,
    @Param("roomId") roomId: string,
    @Param("messageId") messageId: string,
    @Body() dto: ToggleRoomMessageReactionDto,
  ) {
    return this.messagesService.toggleRoomMessageReaction(
      user,
      roomId,
      messageId,
      dto.emoji,
    );
  }

  @Get("conversations/:conversationId/messages")
  getDirectMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param("conversationId") conversationId: string,
  ) {
    return this.messagesService.getDirectMessages(user, conversationId);
  }

  @Post("conversations/:conversationId/messages")
  createDirectMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param("conversationId") conversationId: string,
    @Body() dto: CreateDirectMessageDto,
  ) {
    return this.messagesService.createDirectMessage(user, conversationId, dto.body);
  }
}
