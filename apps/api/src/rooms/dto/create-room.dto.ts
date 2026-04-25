import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateRoomDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsOptional()
  @IsString()
  parentRoomId?: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
