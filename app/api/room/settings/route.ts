// app/api/room/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRoom, setRoom } from '@/lib/store';
import { triggerRoomUpdate } from '@/lib/pusher-server';

export async function POST(req: NextRequest) {
  try {
    const { roomCode, playerId, maxPlayers, undercoverCount, whiteCount } = await req.json();
    const room = await getRoom(roomCode);

    if (!room) return NextResponse.json({ error: 'Room tidak ditemukan' }, { status: 404 });
    if (room.hostId !== playerId) return NextResponse.json({ error: 'Bukan host' }, { status: 403 });
    if (room.phase !== 'lobby') return NextResponse.json({ error: 'Game sudah dimulai' }, { status: 400 });

    if (maxPlayers) room.maxPlayers = Math.max(4, Math.min(12, maxPlayers));
    if (undercoverCount !== undefined) room.undercoverCount = Math.max(1, undercoverCount);
    if (whiteCount !== undefined) room.whiteCount = Math.max(0, whiteCount);

    await setRoom(room);
    await triggerRoomUpdate(roomCode, 'room-updated', { room });

    return NextResponse.json({ room });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal update settings' }, { status: 500 });
  }
}
