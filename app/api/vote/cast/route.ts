// app/api/vote/cast/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRoom, setRoom } from '@/lib/store';
import { triggerRoomUpdate } from '@/lib/pusher-server';
import { calculateVoteResult, checkWinCondition } from '@/lib/game-logic';

export async function POST(req: NextRequest) {
  try {
    const { roomCode, playerId, targetId } = await req.json();
    const room = await getRoom(roomCode);

    if (!room) return NextResponse.json({ error: 'Room tidak ditemukan' }, { status: 404 });
    if (room.phase !== 'voting') return NextResponse.json({ error: 'Bukan fase voting' }, { status: 400 });

    const playerIdx = room.players.findIndex((p) => p.id === playerId && p.isAlive);
    if (playerIdx === -1) return NextResponse.json({ error: 'Pemain tidak ditemukan' }, { status: 404 });

    // Validate target (must be alive and not themselves, or 'skip')
    if (targetId !== 'skip') {
      const target = room.players.find((p) => p.id === targetId && p.isAlive);
      if (!target) return NextResponse.json({ error: 'Target tidak valid' }, { status: 400 });
    }

    room.players[playerIdx].voteFor = targetId;

    // Check if all alive players have voted
    const alivePlayers = room.players.filter((p) => p.isAlive);
    const allVoted = alivePlayers.every((p) => p.voteFor !== undefined);

    if (allVoted) {
      // Calculate results
      const voteResult = calculateVoteResult(room.players);
      room.voteResult = voteResult;
      room.phase = 'elimination';

      if (!voteResult.isSkipWin && voteResult.eliminated) {
        const elimIdx = room.players.findIndex((p) => p.id === voteResult.eliminated);
        if (elimIdx !== -1) {
          room.players[elimIdx].isAlive = false;
          room.players[elimIdx].eliminatedRound = room.round;

          room.eliminationLog.push({
            round: room.round,
            playerId: voteResult.eliminated,
            playerName: room.players[elimIdx].name,
            role: room.players[elimIdx].role!,
            word: room.players[elimIdx].word,
          });
        }
      }

      // Check win condition
      const winCheck = checkWinCondition(room);
      if (winCheck) {
        room.phase = 'ended';
        room.winner = winCheck.winner;
        room.winnerIds = winCheck.winnerIds;
      }
    }

    await setRoom(room);
    await triggerRoomUpdate(roomCode, 'room-updated', { room });

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Vote cast error:', error);
    return NextResponse.json({ error: 'Gagal vote' }, { status: 500 });
  }
}
