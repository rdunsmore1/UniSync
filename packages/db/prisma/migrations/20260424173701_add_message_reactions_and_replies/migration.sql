-- AlterTable
ALTER TABLE "RoomMessage" ADD COLUMN     "replyToMessageId" TEXT;

-- CreateTable
CREATE TABLE "RoomMessageReaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomMessageReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomMessageReaction_messageId_emoji_idx" ON "RoomMessageReaction"("messageId", "emoji");

-- CreateIndex
CREATE UNIQUE INDEX "RoomMessageReaction_messageId_userId_emoji_key" ON "RoomMessageReaction"("messageId", "userId", "emoji");

-- AddForeignKey
ALTER TABLE "RoomMessage" ADD CONSTRAINT "RoomMessage_replyToMessageId_fkey" FOREIGN KEY ("replyToMessageId") REFERENCES "RoomMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMessageReaction" ADD CONSTRAINT "RoomMessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "RoomMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMessageReaction" ADD CONSTRAINT "RoomMessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
