import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { setRoom } from '@/lib/store';
import { generateRoomCode } from '@/lib/game-logic';
import { GameRoom, Player } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { playerName, maxPlayers, undercoverCount, whiteCount } = await req.json();

    if (!playerName || playerName.trim().length < 1) {
      return NextResponse.json({ error: 'Nama pemain tidak valid' }, { status: 400 });
    }

    const playerId = uuidv4();
    const roomCode = generateRoomCode();

    const host: Player = {
      id: playerId,
      name: playerName.trim(),
      isAlive: true,
      hasPickedCard: false,
      isHost: true,
    };

    const room: GameRoom = {
      id: uuidv4(),
      code: roomCode,
      hostId: playerId,
      players: [host],
      phase: 'lobby',
      round: 0,
      civilianWord: '',
      undercoverWord: '',
      wordCategory: '',
      wordPairIndex: -1,
      usedWordIndices: [],
      undercoverCount: undercoverCount || 1,
      whiteCount: whiteCount || 0,
      maxPlayers: maxPlayers || 6,
      eliminationLog: [],
      roleHistory: {}, // tracks per-player role history for anti-streak
      createdAt: Date.now(),
    };

    await setRoom(room);

    return NextResponse.json({ roomCode, playerId, room });
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json({ error: 'Gagal membuat room' }, { status: 500 });
  }
}
