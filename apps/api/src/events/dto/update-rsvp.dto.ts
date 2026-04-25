import { IsIn } from "class-validator";

export class UpdateRsvpDto {
  @IsIn(["GOING", "INTERESTED", "NOT_GOING"])
  status!: "GOING" | "INTERESTED" | "NOT_GOING";
}
