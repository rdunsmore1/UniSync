import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreateRoomMessageDto {
  @IsString()
  @MaxLength(2000)
  body!: string;

  @IsOptional()
  @IsString()
  replyToMessageId?: string;
}
