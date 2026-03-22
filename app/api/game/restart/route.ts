import { NextRequest, NextResponse } from 'next/server';
import { getRoom, setRoom } from '@/lib/store';
import { triggerRoomUpdate } from '@/lib/pusher-server';

export async function POST(req: NextRequest) {
  try {
    const { roomCode, playerId } = await req.json();
    const room = await getRoom(roomCode);

    if (!room) return NextResponse.json({ error: 'Room tidak ditemukan' }, { status: 404 });
    if (room.hostId !== playerId) return NextResponse.json({ error: 'Bukan host' }, { status: 403 });

    room.phase = 'lobby';
    room.round = 0;
    room.civilianWord = '';
    room.undercoverWord = '';
    room.wordCategory = '';
    room.voteResult = undefined;
    room.winner = undefined;
    room.winnerIds = undefined;
    room.whiteGuess = undefined;
    room.whiteGuessCorrect = undefined;
    room.eliminationLog = [];
    // NOTE: roleHistory intentionally preserved across restarts for anti-streak
    room.players = room.players.map((p) => ({
      ...p,
      role: undefined,
      word: undefined,
      isAlive: true,
      hasPickedCard: false,
      voteFor: undefined,
      eliminatedRound: undefined,
    }));

    await setRoom(room);
    await triggerRoomUpdate(roomCode, 'room-updated', { room });

    return NextResponse.json({ room });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal restart game' }, { status: 500 });
  }
}
