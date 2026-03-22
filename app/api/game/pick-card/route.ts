import { NextRequest, NextResponse } from 'next/server';
import { getRoom, setRoom } from '@/lib/store';
import { triggerRoomUpdate } from '@/lib/pusher-server';

export async function POST(req: NextRequest) {
  try {
    const { roomCode, playerId } = await req.json();
    const room = await getRoom(roomCode);

    if (!room) return NextResponse.json({ error: 'Room tidak ditemukan' }, { status: 404 });
    if (room.phase !== 'card-reveal') return NextResponse.json({ error: 'Bukan fase ambil kartu' }, { status: 400 });

    const playerIdx = room.players.findIndex((p) => p.id === playerId);
    if (playerIdx === -1) return NextResponse.json({ error: 'Pemain tidak ditemukan' }, { status: 404 });

    room.players[playerIdx].hasPickedCard = true;

    // When all players picked → go straight to voting
    const allPicked = room.players.every((p) => p.hasPickedCard);
    if (allPicked) {
      room.phase = 'voting';
    }

    await setRoom(room);
    await triggerRoomUpdate(roomCode, 'room-updated', { room });

    return NextResponse.json({ room });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal ambil kartu' }, { status: 500 });
  }
}
