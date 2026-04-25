import {
  ArrayMaxSize,
  IsArray,
  IsString,
  MaxLength,
} from "class-validator";

export class UpdateOrganizationTagsDto {
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(32, { each: true })
  tags!: string[];
}
