'use client';

import { useState } from 'react';
import { GameRoom } from '@/lib/types';

interface Props {
  room: GameRoom;
  playerId: string;
  roomCode: string;
  isSpectator: boolean;
}

const WINNER_CONFIG = {
  civilian: {
    title: 'CIVILIAN MENANG!',
    subtitle: 'Para penyusup berhasil ditemukan!',
    icon: '🏆',
    color: 'text-jade',
    bg: 'from-jade/20 via-jade/5 to-transparent',
    border: 'border-jade/30',
    glow: 'glow-jade',
  },
  undercover: {
    title: 'UNDERCOVER MENANG!',
    subtitle: 'Para spy berhasil menyamar!',
    icon: '🎭',
    color: 'text-crimson',
    bg: 'from-crimson/20 via-crimson/5 to-transparent',
    border: 'border-crimson/30',
    glow: 'glow-crimson',
  },
  white: {
    title: 'MR. WHITE MENANG!',
    subtitle: 'Si misterius berhasil bertahan!',
    icon: '👁️',
    color: 'text-white',
    bg: 'from-white/10 via-white/3 to-transparent',
    border: 'border-white/20',
    glow: '',
  },
};

export default function EndedScreen({ room, playerId, roomCode }: Props) {
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const isHost = room.hostId === playerId;
  const winner = room.winner;
  const config = winner ? WINNER_CONFIG[winner] : null;
  const me = room.players.find((p) => p.id === playerId);
  const iWon = room.winnerIds?.includes(playerId);

  const handleRestart = async () => {
    setLoading(true);
    try {
      await fetch('/api/game/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, playerId }),
      });
    } finally {
      setLoading(false);
    }
  };

  if (!config || !winner) return null;

  return (
    <div className="min-h-screen bg-noir relative overflow-hidden flex flex-col items-center justify-center px-4 py-8">
      {/* Background glow */}
      <div className={`absolute inset-0 bg-gradient-to-b ${config.bg} pointer-events-none`} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-30 pointer-events-none"
        style={{
          background: winner === 'civilian'
            ? 'radial-gradient(ellipse, rgba(46,196,182,0.3) 0%, transparent 70%)'
            : winner === 'undercover'
            ? 'radial-gradient(ellipse, rgba(230,57,70,0.3) 0%, transparent 70%)'
            : 'radial-gradient(ellipse, rgba(200,200,220,0.2) 0%, transparent 70%)',
        }}
      />

      {/* Confetti-like particles */}
      {iWon && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#F5C842', '#2EC4B6', '#E63946', '#9B72CF'][i % 4],
                animation: `float ${2 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 max-w-md w-full space-y-6 text-center">
        {/* Winner announcement */}
        <div className={`animate-bounce-in`}>
          <div className="text-8xl mb-4 inline-block animate-bounce">{config.icon}</div>
          <h2 className={`font-display text-5xl md:text-6xl tracking-wider ${config.color}`}>
            {config.title}
          </h2>
          <p className="text-smoke mt-3 text-lg">{config.subtitle}</p>

          {/* Personal result */}
          <div className={`mt-5 inline-block px-6 py-3 rounded-full border ${
            iWon ? 'bg-gold/20 border-gold/40 text-gold' : 'bg-noir-3 border-noir-4 text-smoke'
          }`}>
            <p className="font-display text-xl tracking-wider">
              {iWon ? '🏆 KAMU MENANG!' : '💀 KAMU KALAH'}
            </p>
          </div>
        </div>

        {/* Word reveal */}
        <div className={`bg-noir-2 border ${config.border} rounded-2xl p-5 animate-slide-up`}>
          <p className="text-smoke text-xs font-mono uppercase tracking-widest mb-3">Kata Rahasia</p>
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-jade text-xs font-mono mb-1">CIVILIAN</p>
              <p className="font-display text-3xl text-white tracking-wide">{room.civilianWord}</p>
            </div>
            <div className="text-smoke text-2xl">↔</div>
            <div className="text-center">
              <p className="text-crimson text-xs font-mono mb-1">UNDERCOVER</p>
              <p className="font-display text-3xl text-white tracking-wide">{room.undercoverWord}</p>
            </div>
          </div>
          <p className="text-smoke/50 text-xs mt-2 font-mono">Kategori: {room.wordCategory}</p>
        </div>

        {/* Player roles reveal */}
        <div className="bg-noir-2 border border-noir-3 rounded-2xl p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <p className="text-smoke text-xs font-mono uppercase tracking-widest">Identitas Pemain</p>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-gold text-xs font-mono hover:underline"
            >
              {showDetails ? 'SEMBUNYIKAN' : 'TAMPILKAN'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {room.players.map((player) => {
              const isWinner = room.winnerIds?.includes(player.id);
              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    isWinner
                      ? winner === 'civilian' ? 'bg-jade/10 border-jade/20' :
                        winner === 'undercover' ? 'bg-crimson/10 border-crimson/20' :
                        'bg-white/5 border-white/10'
                      : 'bg-noir-3 border-noir-4'
                  }`}
                >
                  <div className="text-xl">
                    {player.role === 'civilian' ? '👤' :
                     player.role === 'undercover' ? '🎭' : '👁️'}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white text-sm font-medium">
                      {player.name}
                      {player.id === playerId && <span className="text-smoke text-xs ml-1">(kamu)</span>}
                    </p>
                    {showDetails && (
                      <p className={`text-xs font-mono ${
                        player.role === 'civilian' ? 'text-jade' :
                        player.role === 'undercover' ? 'text-crimson' : 'text-white/60'
                      }`}>
                        {player.role?.toUpperCase()}
                        {player.word && <span className="text-smoke ml-2">"{player.word}"</span>}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {isWinner && <span className="text-gold text-sm">🏆</span>}
                    {!player.isAlive && <span className="text-crimson text-xs">💀</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Elimination log */}
        {room.eliminationLog.length > 0 && (
          <div className="bg-noir-2 border border-noir-3 rounded-2xl p-5 text-left animate-slide-up">
            <p className="text-smoke text-xs font-mono uppercase tracking-widest mb-3">Log Eliminasi</p>
            <div className="space-y-2">
              {room.eliminationLog.map((event, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-smoke font-mono text-xs w-16">R{event.round}</span>
                  <span className="text-white">{event.playerName}</span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                    event.role === 'civilian' ? 'bg-jade/20 text-jade' :
                    event.role === 'undercover' ? 'bg-crimson/20 text-crimson' :
                    'bg-white/10 text-white/60'
                  }`}>
                    {event.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {isHost ? (
          <button
            onClick={handleRestart}
            disabled={loading}
            className="w-full py-4 bg-gold text-noir font-display text-2xl tracking-wider rounded-xl hover:bg-gold-dim transition-all disabled:opacity-50 glow-gold"
          >
            {loading ? <span className="loading loading-spinner" /> : '🔄 MAIN LAGI'}
          </button>
        ) : (
          <p className="text-smoke font-mono text-sm animate-pulse">
            Menunggu host untuk main lagi...
          </p>
        )}
      </div>
    </div>
  );
}
