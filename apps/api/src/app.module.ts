import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { EventsModule } from "./events/events.module";
import { MessagesModule } from "./messages/messages.module";
import { OrganizationsModule } from "./organizations/organizations.module";
import { RoomsModule } from "./rooms/rooms.module";
import { TutorsModule } from "./tutors/tutors.module";
import { UniversitiesModule } from "./universities/universities.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    UniversitiesModule,
    UsersModule,
    OrganizationsModule,
    RoomsModule,
    MessagesModule,
    EventsModule,
    TutorsModule,
  ],
})
export class AppModule {}
