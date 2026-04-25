import { Module } from "@nestjs/common";
import { OrganizationsModule } from "../organizations/organizations.module";
import { RoomsController } from "./rooms.controller";
import { RoomsService } from "./rooms.service";

@Module({
  imports: [OrganizationsModule],
  controllers: [RoomsController],
  providers: [RoomsService],
})
export class RoomsModule {}
