import { RoomDetailClient } from "../../../../../components/room-detail-client";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <RoomDetailClient roomId={roomId} />;
}
