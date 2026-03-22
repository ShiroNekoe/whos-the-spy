// lib/pusher-server.ts
import Pusher from 'pusher';

let pusherServer: Pusher;

export function getPusherServer(): Pusher {
  if (!pusherServer) {
    pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    });
  }
  return pusherServer;
}

export async function triggerRoomUpdate(roomCode: string, event: string, data: unknown) {
  const pusher = getPusherServer();
  await pusher.trigger(`room-${roomCode}`, event, data);
}
