import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class UpsertTutorProfileDto {
  @IsString()
  @MaxLength(120)
  headline!: string;

  @IsString()
  @MaxLength(1200)
  description!: string;

  @IsArray()
  subjects!: string[];

  @IsOptional()
  @IsInt()
  hourlyRateCents?: number;
}
