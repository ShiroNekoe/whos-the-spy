// app/api/game/describe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRoom, setRoom } from '@/lib/store';
import { triggerRoomUpdate } from '@/lib/pusher-server';
import { getNextAlivePlayerIndex } from '@/lib/game-logic';

export async function POST(req: NextRequest) {
  try {
    const { roomCode, playerId, description } = await req.json();
    const room = await getRoom(roomCode);

    if (!room) return NextResponse.json({ error: 'Room tidak ditemukan' }, { status: 404 });
    if (room.phase !== 'description') return NextResponse.json({ error: 'Bukan fase deskripsi' }, { status: 400 });

    const alivePlayers = room.players.filter((p) => p.isAlive);
    const currentPlayer = alivePlayers[room.currentTurnIndex % alivePlayers.length];

    if (!currentPlayer || currentPlayer.id !== playerId) {
      return NextResponse.json({ error: 'Bukan giliran kamu' }, { status: 403 });
    }

    // Save description
    if (!room.descriptions[playerId]) {
      room.descriptions[playerId] = [];
    }
    room.descriptions[playerId].push(description || '...');

    // Find player and update their description
    const playerIdx = room.players.findIndex((p) => p.id === playerId);
    if (playerIdx !== -1) {
      room.players[playerIdx].description = description;
      room.players[playerIdx].descriptionRound = room.round;
    }

    // Move to next player
    const nextTurnIndex = room.currentTurnIndex + 1;

    if (nextTurnIndex >= alivePlayers.length) {
      // All players have described, move to voting
      room.phase = 'voting';
      room.currentTurnIndex = 0;
      // Reset votes
      room.players = room.players.map((p) => ({ ...p, voteFor: undefined }));
    } else {
      room.currentTurnIndex = nextTurnIndex;
    }

    await setRoom(room);
    await triggerRoomUpdate(roomCode, 'room-updated', { room });

    return NextResponse.json({ room });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal submit deskripsi' }, { status: 500 });
  }
}
