import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateReportDto {
  @IsIn([
    "SPAM",
    "HARASSMENT",
    "IMPERSONATION",
    "POLICY_VIOLATION",
    "OTHER",
  ])
  reason!:
    | "SPAM"
    | "HARASSMENT"
    | "IMPERSONATION"
    | "POLICY_VIOLATION"
    | "OTHER";

  @IsOptional()
  @IsString()
  @MaxLength(500)
  details?: string;
}
