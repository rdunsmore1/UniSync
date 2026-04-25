import { IsIn } from "class-validator";

export class UpdateMemberRoleDto {
  @IsIn(["OWNER", "ADMIN", "VIEWER", "MEMBER"])
  role!: "OWNER" | "ADMIN" | "VIEWER" | "MEMBER";
}
