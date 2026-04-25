import { IsDateString, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateEventDto {
  @IsString()
  @MaxLength(140)
  title!: string;

  @IsString()
  @MaxLength(800)
  description!: string;

  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsString()
  location?: string;
}
