import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import {
  ORGANIZATION_ACCESS_MODES,
  ORGANIZATION_CATEGORIES,
} from "../organization.constants";

export class CreateOrganizationDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(800)
  description!: string;

  @IsIn(ORGANIZATION_CATEGORIES)
  category!: string;

  @IsIn(ORGANIZATION_ACCESS_MODES)
  accessMode!: "OPEN" | "INVITE_ONLY";

  @IsOptional()
  @IsString()
  bannerUrl?: string;
}
