import { NextRequest, NextResponse } from 'next/server';
import { getRoom, setRoom } from '@/lib/store';
import { triggerRoomUpdate } from '@/lib/pusher-server';
import { checkWinCondition } from '@/lib/game-logic';

export async function POST(req: NextRequest) {
  try {
    const { roomCode, playerId } = await req.json();
    const room = await getRoom(roomCode);

    if (!room) return NextResponse.json({ error: 'Room tidak ditemukan' }, { status: 404 });
    if (room.hostId !== playerId) return NextResponse.json({ error: 'Bukan host' }, { status: 403 });
    if (room.phase !== 'elimination') return NextResponse.json({ error: 'Bukan fase eliminasi' }, { status: 400 });

    const winCheck = checkWinCondition(room);
    if (winCheck) {
      room.phase = 'ended';
      room.winner = winCheck.winner;
      room.winnerIds = winCheck.winnerIds;
    } else {
      // Go straight to voting next round (no description phase)
      room.round += 1;
      room.phase = 'voting';
      room.voteResult = undefined;
      room.players = room.players.map((p) => ({ ...p, voteFor: undefined }));
    }

    await setRoom(room);
    await triggerRoomUpdate(roomCode, 'room-updated', { room });

    return NextResponse.json({ room });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal lanjut ronde' }, { status: 500 });
  }
}
