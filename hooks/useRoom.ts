// hooks/useRoom.ts
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getPusherClient } from '@/lib/pusher-client';
import { GameRoom } from '@/lib/types';

export function useRoom(roomCode: string) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof getPusherClient>['subscribe'] extends (...args: any) => infer R ? R : never | null>(null as any);

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/room/${roomCode}`);
      if (!res.ok) throw new Error('Room tidak ditemukan');
      const data = await res.json();
      setRoom(data.room);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    if (!roomCode) return;
    fetchRoom();

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`room-${roomCode}`);
    channelRef.current = channel;

    channel.bind('room-updated', (data: { room: GameRoom }) => {
      setRoom(data.room);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`room-${roomCode}`);
    };
  }, [roomCode, fetchRoom]);

  const refetch = useCallback(() => {
    fetchRoom();
  }, [fetchRoom]);

  return { room, loading, error, refetch, setRoom };
}
