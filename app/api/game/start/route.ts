import { NextRequest, NextResponse } from 'next/server';
import { getRoom, setRoom } from '@/lib/store';
import { triggerRoomUpdate } from '@/lib/pusher-server';
import { assignRoles } from '@/lib/game-logic';

export async function POST(req: NextRequest) {
  try {
    const { roomCode, playerId } = await req.json();
    const room = await getRoom(roomCode);

    if (!room) return NextResponse.json({ error: 'Room tidak ditemukan' }, { status: 404 });
    if (room.hostId !== playerId) return NextResponse.json({ error: 'Bukan host' }, { status: 403 });
    if (room.players.length < 4) return NextResponse.json({ error: 'Minimal 4 pemain' }, { status: 400 });

    const totalSpecial = room.undercoverCount + room.whiteCount;
    if (totalSpecial >= room.players.length) {
      return NextResponse.json({ error: 'Terlalu banyak special roles' }, { status: 400 });
    }

    // Pass existing roleHistory so anti-streak logic can work across sessions
    const { players, civilianWord, undercoverWord, category, wordPairIndex, updatedRoleHistory } =
      assignRoles(
        room.players,
        room.undercoverCount,
        room.whiteCount,
        room.usedWordIndices,
        room.roleHistory ?? {}
      );

    room.players = players.map((p) => ({
      ...p,
      hasPickedCard: false,
      voteFor: undefined,
      eliminatedRound: undefined,
    }));
    room.civilianWord = civilianWord;
    room.undercoverWord = undercoverWord;
    room.wordCategory = category;
    room.wordPairIndex = wordPairIndex;
    room.usedWordIndices = [...room.usedWordIndices, wordPairIndex];
    room.roleHistory = updatedRoleHistory; // ← persist for next round
    room.phase = 'card-reveal';
    room.round = 1;
    room.eliminationLog = [];
    room.voteResult = undefined;
    room.winner = undefined;
    room.winnerIds = undefined;
    room.whiteGuess = undefined;
    room.whiteGuessCorrect = undefined;

    await setRoom(room);
    await triggerRoomUpdate(roomCode, 'room-updated', { room });

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Start game error:', error);
    return NextResponse.json({ error: 'Gagal memulai game' }, { status: 500 });
  }
}
