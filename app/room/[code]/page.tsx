'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';
import LobbyScreen from '@/components/LobbyScreen';
import CardRevealScreen from '@/components/CardRevealScreen';
import VotingScreen from '@/components/VotingScreen';
import EliminationScreen from '@/components/EliminationScreen';
import EndedScreen from '@/components/EndedScreen';
import LoadingScreen from '@/components/LoadingScreen';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params.code as string).toUpperCase();
  const [playerId, setPlayerId] = useState<string>('');
  const { room, loading, error } = useRoom(roomCode);

  useEffect(() => {
    const id = localStorage.getItem('playerId') || '';
    setPlayerId(id);
    if (!id) router.push('/');
  }, [router]);

  if (loading || !playerId) return <LoadingScreen message="Memuat room..." />;
  if (error || !room) {
    return (
      <div className="min-h-screen bg-noir flex items-center justify-center flex-col gap-4">
        <div className="text-6xl">🚫</div>
        <p className="text-crimson font-mono">{error || 'Room tidak ditemukan'}</p>
        <button onClick={() => router.push('/')} className="btn btn-outline btn-sm">Kembali</button>
      </div>
    );
  }

  const isSpectator = !room.players.find((p) => p.id === playerId);
  const commonProps = { room, playerId, roomCode, isSpectator };

  switch (room.phase) {
    case 'lobby':      return <LobbyScreen {...commonProps} />;
    case 'card-reveal': return <CardRevealScreen {...commonProps} />;
    case 'voting':     return <VotingScreen {...commonProps} />;
    case 'elimination': return <EliminationScreen {...commonProps} />;
    case 'ended':      return <EndedScreen {...commonProps} />;
    default:           return <LoadingScreen message="Memuat..." />;
  }
}
