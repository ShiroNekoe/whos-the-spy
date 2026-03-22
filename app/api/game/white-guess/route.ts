import { NextRequest, NextResponse } from 'next/server';
import { getRoom, setRoom } from '@/lib/store';
import { triggerRoomUpdate } from '@/lib/pusher-server';
import { checkWinCondition } from '@/lib/game-logic';

export async function POST(req: NextRequest) {
  try {
    const { roomCode, playerId, guess } = await req.json();
    const room = await getRoom(roomCode);

    if (!room) return NextResponse.json({ error: 'Room tidak ditemukan' }, { status: 404 });

    const player = room.players.find((p) => p.id === playerId);
    if (!player || player.role !== 'white') {
      return NextResponse.json({ error: 'Bukan Mr. White' }, { status: 403 });
    }

    // Strict exact match only — case insensitive, trim whitespace
    // "rumah" != "rumah sakit", "kopi" != "kopi susu", etc.
    const normalizedGuess = guess.trim().toLowerCase().replace(/\s+/g, ' ');
    const normalizedAnswer = room.civilianWord.trim().toLowerCase().replace(/\s+/g, ' ');
    const isCorrect = normalizedGuess === normalizedAnswer;

    room.whiteGuess = guess.trim();
    room.whiteGuessCorrect = isCorrect;

    if (isCorrect) {
      // Mr. White wins immediately!
      room.phase = 'ended';
      room.winner = 'white';
      room.winnerIds = [playerId];
    } else {
      // Wrong guess — Mr. White stays eliminated, game stays in 'elimination' phase.
      // Host will see "LANJUT" button now that whiteGuess is set.
      // Check if game ends by regular win condition (Mr. White is already dead)
      const winCheck = checkWinCondition(room);
      if (winCheck) {
        room.phase = 'ended';
        room.winner = winCheck.winner;
        room.winnerIds = winCheck.winnerIds;
      }
      // else stay in 'elimination' — host presses LANJUT
    }

    await setRoom(room);
    await triggerRoomUpdate(roomCode, 'room-updated', { room });

    return NextResponse.json({ room, isCorrect });
  } catch (error) {
    console.error('white-guess error:', error);
    return NextResponse.json({ error: 'Gagal submit tebakan' }, { status: 500 });
  }
}
