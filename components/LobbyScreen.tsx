'use client';

import { useState } from 'react';
import { GameRoom } from '@/lib/types';

interface Props {
  room: GameRoom;
  playerId: string;
  roomCode: string;
  isSpectator: boolean;
}

export default function LobbyScreen({ room, playerId, roomCode }: Props) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [undercoverCount, setUndercoverCount] = useState(room.undercoverCount);
  const [whiteCount, setWhiteCount] = useState(room.whiteCount);
  const [maxPlayers, setMaxPlayers] = useState(room.maxPlayers);

  const isHost = room.hostId === playerId;
  const me = room.players.find((p) => p.id === playerId);
  const canStart = room.players.length >= 4 && isHost;

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateSettings = async (field: string, value: number) => {
    const updates: Record<string, number> = {};
    updates[field] = value;
    if (field === 'undercoverCount') setUndercoverCount(value);
    if (field === 'whiteCount') setWhiteCount(value);
    if (field === 'maxPlayers') setMaxPlayers(value);

    await fetch('/api/room/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, playerId, ...updates }),
    });
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, playerId }),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-noir grid-bg relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-lavender/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-smoke text-xs font-mono uppercase tracking-widest">Room</p>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="font-display text-4xl text-white tracking-wide">{roomCode}</h1>
              <button
                onClick={copyCode}
                className="px-3 py-1 bg-noir-3 border border-noir-4 rounded-lg text-smoke text-xs hover:border-gold/40 hover:text-gold transition-all font-mono"
              >
                {copied ? '✓ DISALIN!' : '📋 SALIN'}
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-smoke text-xs font-mono">Pemain</p>
            <p className="font-display text-3xl text-white">
              {room.players.length}
              <span className="text-smoke text-xl">/{room.maxPlayers}</span>
            </p>
          </div>
        </div>

        {/* Share hint */}
        <div className="bg-gold/5 border border-gold/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">📱</span>
          <p className="text-gold/80 text-sm">
            Share kode <span className="font-mono font-bold">{roomCode}</span> ke teman-temanmu untuk join!
          </p>
        </div>

        {/* Players list */}
        <div className="bg-noir-2 border border-noir-3 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-smoke text-xs font-mono uppercase tracking-widest">Pemain</p>
            <div className="flex gap-1">
              {Array.from({ length: room.maxPlayers }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i < room.players.length ? 'bg-jade' : 'bg-noir-4'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {room.players.map((player, i) => (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all animate-bounce-in ${
                  player.id === playerId
                    ? 'bg-gold/10 border-gold/30'
                    : 'bg-noir-3 border-noir-4'
                }`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-display ${
                  player.isHost ? 'bg-gold/20 text-gold' : 'bg-noir-4 text-smoke'
                }`}>
                  {player.isHost ? '👑' : player.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${player.id === playerId ? 'text-gold' : 'text-white'}`}>
                    {player.name}
                    {player.id === playerId && <span className="text-smoke text-xs ml-1">(kamu)</span>}
                  </p>
                  {player.isHost && <p className="text-smoke text-xs">Host</p>}
                </div>
              </div>
            ))}
            {/* Empty slots */}
            {Array.from({ length: Math.max(0, room.maxPlayers - room.players.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-noir-4">
                <div className="w-8 h-8 rounded-lg bg-noir-3 flex items-center justify-center text-smoke text-xs">
                  ?
                </div>
                <p className="text-smoke/40 text-sm">Menunggu...</p>
              </div>
            ))}
          </div>
        </div>

        {/* Settings (host only) */}
        {isHost && (
          <div className="bg-noir-2 border border-noir-3 rounded-2xl p-5 space-y-4">
            <p className="text-smoke text-xs font-mono uppercase tracking-widest">Pengaturan Game (Host)</p>

            <div>
              <label className="text-white text-sm mb-2 flex justify-between">
                <span>Maks Pemain</span>
                <span className="text-gold font-mono">{maxPlayers}</span>
              </label>
              <input type="range" min={4} max={12} value={maxPlayers}
                onChange={(e) => updateSettings('maxPlayers', +e.target.value)}
                className="range range-xs range-warning w-full" />
            </div>

            <div>
              <label className="text-white text-sm mb-2 flex justify-between">
                <span>🎭 Undercover</span>
                <span className="text-crimson font-mono">{undercoverCount}</span>
              </label>
              <input type="range" min={1} max={Math.max(1, Math.floor(room.players.length / 3))} value={undercoverCount}
                onChange={(e) => updateSettings('undercoverCount', +e.target.value)}
                className="range range-xs range-error w-full" />
            </div>

            <div>
              <label className="text-white text-sm mb-2 flex justify-between">
                <span>👁️ Mr. White</span>
                <span className="text-white font-mono">{whiteCount}</span>
              </label>
              <input type="range" min={0} max={Math.max(0, Math.floor(room.players.length / 4))} value={whiteCount}
                onChange={(e) => updateSettings('whiteCount', +e.target.value)}
                className="range range-xs w-full" />
            </div>

            <div className="text-smoke text-xs bg-noir-3 rounded-lg p-3 font-mono">
              👤 Civilian: <span className="text-jade">{room.players.length - undercoverCount - whiteCount}</span>
              {' · '}🎭 Undercover: <span className="text-crimson">{undercoverCount}</span>
              {' · '}👁️ White: <span className="text-white">{whiteCount}</span>
            </div>
          </div>
        )}

        {/* Start button */}
        {isHost ? (
          <div className="space-y-2">
            {room.players.length < 4 && (
              <p className="text-smoke text-center text-sm font-mono">
                Butuh minimal {4 - room.players.length} pemain lagi
              </p>
            )}
            <button
              onClick={handleStart}
              disabled={!canStart || loading}
              className="w-full py-4 bg-gold text-noir font-display text-2xl tracking-widest rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gold-dim transition-all hover:scale-[1.02] active:scale-[0.98] glow-gold"
            >
              {loading ? <span className="loading loading-spinner" /> : 'MULAI GAME'}
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="flex justify-center gap-1 mb-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: `${i * 200}ms` }} />
              ))}
            </div>
            <p className="text-smoke font-mono text-sm">Menunggu host memulai game...</p>
          </div>
        )}
      </div>
    </div>
  );
}
