'use client';

import { useState, useEffect, useRef } from 'react';
import { GameRoom } from '@/lib/types';

interface Props {
  room: GameRoom;
  playerId: string;
  roomCode: string;
  isSpectator: boolean;
}

export default function DescriptionScreen({ room, playerId, roomCode, isSpectator }: Props) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const alivePlayers = room.players.filter((p) => p.isAlive);
  const currentPlayer = alivePlayers[room.currentTurnIndex % alivePlayers.length];
  const isMyTurn = currentPlayer?.id === playerId;
  const me = room.players.find((p) => p.id === playerId);

  useEffect(() => {
    setSubmitted(false);
    setDescription('');
    if (isMyTurn && inputRef.current) {
      inputRef.current.focus();
    }
  }, [room.currentTurnIndex, isMyTurn]);

  const handleSubmit = async () => {
    if (!description.trim() && !submitted) {
      // Allow empty (pass)
    }
    setLoading(true);
    try {
      await fetch('/api/game/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, playerId, description: description.trim() || '...' }),
      });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  // Detect suspiciously different descriptions (fake hint detection)
  const allDescriptions = alivePlayers
    .map((p) => ({ player: p, desc: room.descriptions[p.id]?.[room.round - 1] }))
    .filter((d) => d.desc);

  return (
    <div className="min-h-screen bg-noir grid-bg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-72 h-72 bg-jade/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-smoke text-xs font-mono uppercase tracking-widest">Ronde {room.round} • Fase Deskripsi</p>
            <h2 className="font-display text-3xl text-white tracking-wide mt-1">BERIKAN PETUNJUK</h2>
          </div>
          <div className="text-right bg-noir-2 border border-noir-3 rounded-xl p-3">
            <p className="text-smoke text-xs font-mono">Giliran</p>
            <p className="text-gold font-display text-xl truncate max-w-24">{currentPlayer?.name || '-'}</p>
          </div>
        </div>

        {/* My word reminder */}
        {me && me.isAlive && (
          <div className={`p-4 rounded-xl border flex items-center gap-4 ${
            me.role === 'civilian' ? 'bg-jade/10 border-jade/30' :
            me.role === 'undercover' ? 'bg-crimson/10 border-crimson/30' :
            'bg-white/5 border-white/10'
          }`}>
            <div className="text-2xl">
              {me.role === 'civilian' ? '👤' : me.role === 'undercover' ? '🎭' : '👁️'}
            </div>
            <div>
              <p className="text-smoke text-xs font-mono uppercase tracking-wider">
                {me.role === 'civilian' ? 'Civilian' : me.role === 'undercover' ? 'Undercover' : 'Mr. White'}
              </p>
              {me.word ? (
                <p className={`font-display text-2xl ${me.role === 'civilian' ? 'text-jade' : 'text-crimson'}`}>
                  {me.word}
                </p>
              ) : (
                <p className="text-white/50 text-sm">Tidak ada kata</p>
              )}
            </div>
          </div>
        )}

        {/* Turn order */}
        <div className="bg-noir-2 border border-noir-3 rounded-2xl p-4">
          <p className="text-smoke text-xs font-mono uppercase tracking-widest mb-3">Urutan Giliran</p>
          <div className="space-y-2">
            {alivePlayers.map((player, idx) => {
              const isCurrent = idx === room.currentTurnIndex % alivePlayers.length;
              const hasDone = (room.descriptions[player.id]?.length || 0) >= room.round;
              const playerDesc = room.descriptions[player.id]?.[room.round - 1];

              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-gold/10 border-gold/40 glow-gold'
                      : hasDone
                      ? 'bg-jade/5 border-jade/10'
                      : 'bg-noir-3 border-transparent'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                    isCurrent ? 'bg-gold text-noir' : hasDone ? 'bg-jade/20 text-jade' : 'bg-noir-4 text-smoke'
                  }`}>
                    {isCurrent ? '▶' : hasDone ? '✓' : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      isCurrent ? 'text-gold' : hasDone ? 'text-white' : 'text-smoke'
                    }`}>
                      {player.name}
                      {player.id === playerId && <span className="text-smoke text-xs ml-1">(kamu)</span>}
                    </p>
                    {playerDesc && (
                      <p className="text-smoke text-xs truncate mt-0.5">"{playerDesc}"</p>
                    )}
                  </div>
                  {isCurrent && (
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Input area */}
        {isMyTurn && !isSpectator && (
          <div className="bg-noir-2 border border-gold/30 rounded-2xl p-5 glow-gold animate-slide-up">
            <p className="text-gold font-mono text-sm mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
              Giliran kamu! Deskripsikan katamu dalam 1-3 kata
            </p>
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kata deskripsi kamu..."
                maxLength={50}
                className="flex-1 bg-noir-3 border border-noir-4 rounded-xl px-4 py-3 text-white placeholder-smoke/40 focus:outline-none focus:border-gold/50 transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmit()}
                disabled={loading}
              />
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-3 bg-gold text-noir font-display text-lg tracking-wider rounded-xl hover:bg-gold-dim transition-all disabled:opacity-50"
              >
                {loading ? <span className="loading loading-spinner loading-sm" /> : 'KIRIM'}
              </button>
            </div>
            <p className="text-smoke text-xs mt-2 font-mono">
              Tip: Jangan terlalu spesifik, jangan terlalu ambigu
            </p>
          </div>
        )}

        {isMyTurn && submitted && (
          <div className="bg-jade/10 border border-jade/30 rounded-2xl p-4 text-center animate-bounce-in">
            <p className="text-jade font-display text-xl tracking-wider">TERKIRIM ✓</p>
            <p className="text-smoke text-sm mt-1">Menunggu pemain lain...</p>
          </div>
        )}

        {!isMyTurn && me?.isAlive && (
          <div className="bg-noir-2 border border-noir-3 rounded-2xl p-4 text-center">
            <p className="text-smoke text-sm">
              Menunggu <span className="text-white font-medium">{currentPlayer?.name}</span> memberi deskripsi...
            </p>
          </div>
        )}

        {/* Eliminated players (spectators) */}
        {room.players.filter((p) => !p.isAlive).length > 0 && (
          <div className="bg-noir-2 border border-noir-3 rounded-2xl p-4">
            <p className="text-smoke text-xs font-mono uppercase tracking-widest mb-2">Sudah Eliminasi</p>
            <div className="flex flex-wrap gap-2">
              {room.players.filter((p) => !p.isAlive).map((p) => (
                <div key={p.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-crimson/10 border border-crimson/20">
                  <span className="text-xs">💀</span>
                  <span className="text-crimson/80 text-xs">{p.name}</span>
                  <span className="text-smoke/50 text-xs font-mono">
                    {p.role === 'civilian' ? '(C)' : p.role === 'undercover' ? '(U)' : '(W)'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
