import { IsString, MaxLength } from "class-validator";

export class ToggleRoomMessageReactionDto {
  @IsString()
  @MaxLength(16)
  emoji!: string;
}
