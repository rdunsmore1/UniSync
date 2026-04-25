-- CreateIndex
CREATE INDEX "EventRsvp_eventId_status_idx" ON "EventRsvp"("eventId", "status");

-- CreateIndex
CREATE INDEX "EventRsvp_userId_status_idx" ON "EventRsvp"("userId", "status");
