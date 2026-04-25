import { IsString, MaxLength } from "class-validator";

export class CreateDirectMessageDto {
  @IsString()
  @MaxLength(2000)
  body!: string;
}
