import { INestApplication, Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

type PrismaBeforeExitClient = PrismaClient & {
  $on(event: "beforeExit", callback: () => Promise<void> | void): void;
};

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    (this as PrismaBeforeExitClient).$on("beforeExit", async () => {
      await app.close();
    });
  }
}
