// app/api/room/join/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getRoom, setRoom } from '@/lib/store';
import { triggerRoomUpdate } from '@/lib/pusher-server';
import { Player } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { playerName, roomCode } = await req.json();

    if (!playerName || !roomCode) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const room = await getRoom(roomCode.toUpperCase());
    if (!room) {
      return NextResponse.json({ error: 'Room tidak ditemukan' }, { status: 404 });
    }

    if (room.phase !== 'lobby') {
      return NextResponse.json({ error: 'Game sudah dimulai' }, { status: 400 });
    }

    if (room.players.length >= room.maxPlayers) {
      return NextResponse.json({ error: 'Room penuh' }, { status: 400 });
    }

    const playerId = uuidv4();
    const newPlayer: Player = {
      id: playerId,
      name: playerName.trim(),
      isAlive: true,
      hasPickedCard: false,
      isHost: false,
    };

    room.players.push(newPlayer);
    await setRoom(room);
    await triggerRoomUpdate(roomCode, 'room-updated', { room });

    return NextResponse.json({ playerId, room });
  } catch (error) {
    console.error('Join room error:', error);
    return NextResponse.json({ error: 'Gagal join room' }, { status: 500 });
  }
}
