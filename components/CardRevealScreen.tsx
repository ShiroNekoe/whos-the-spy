'use client';

import { useState } from 'react';
import { GameRoom } from '@/lib/types';

interface Props {
  room: GameRoom;
  playerId: string;
  roomCode: string;
  isSpectator: boolean;
}

const ROLE_CONFIG = {
  civilian: {
    label: 'CIVILIAN',
    icon: '👤',
    textColor: 'text-jade',
    borderColor: 'border-jade/50',
    bgFrom: 'from-jade/25',
    bgTo: 'to-jade/5',
    glowColor: 'shadow-jade/30',
    desc: 'Deskripsikan katamu tanpa bilang langsung!',
    badge: 'bg-jade/20 text-jade',
  },
  undercover: {
    label: 'UNDERCOVER',
    icon: '🎭',
    textColor: 'text-crimson',
    borderColor: 'border-crimson/50',
    bgFrom: 'from-crimson/25',
    bgTo: 'to-crimson/5',
    glowColor: 'shadow-crimson/30',
    desc: 'Kamu spy! Katamu mirip tapi beda. Jangan ketahuan!',
    badge: 'bg-crimson/20 text-crimson',
  },
  white: {
    label: 'MR. WHITE',
    icon: '👁️',
    textColor: 'text-white',
    borderColor: 'border-white/30',
    bgFrom: 'from-white/15',
    bgTo: 'to-white/3',
    glowColor: 'shadow-white/20',
    desc: 'Kamu tidak punya kata. Tebak dari diskusi!',
    badge: 'bg-white/15 text-white',
  },
};

export default function CardRevealScreen({ room, playerId, roomCode }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);

  const me = room.players.find((p) => p.id === playerId);
  const myRole = me?.role;
  const cfg = myRole ? ROLE_CONFIG[myRole] : null;
  const pickedCount = room.players.filter((p) => p.hasPickedCard).length;
  const hasPicked = me?.hasPickedCard;

  const handleFlip = () => {
    if (revealed || hasPicked) return;
    setFlipped(true);
    setTimeout(() => setRevealed(true), 380);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await fetch('/api/game/pick-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, playerId }),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-noir grid-bg flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-lavender/4 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-10 animate-fade-in">
        <p className="text-smoke text-xs font-mono uppercase tracking-widest mb-1">Ronde {room.round} · Ambil Kartu</p>
        <h2 className="font-display text-5xl text-white tracking-wide">LIHAT PERANMU</h2>
        <p className="text-smoke/70 text-sm mt-2">Jangan tunjukkan HP ke orang lain!</p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mt-5">
          {room.players.map((p) => (
            <div
              key={p.id}
              title={p.name}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                p.hasPickedCard ? 'bg-jade scale-110' : 'bg-noir-4'
              }`}
            />
          ))}
          <span className="text-smoke text-xs font-mono ml-3">
            {pickedCount}/{room.players.length}
          </span>
        </div>
      </div>

      {/* Card area */}
      {!hasPicked ? (
        <div className="flex flex-col items-center gap-6">
          {/* The flip card */}
          <div
            className="perspective w-72 h-[420px] cursor-pointer select-none"
            onClick={handleFlip}
          >
            <div className={`card-flip w-full h-full ${flipped ? 'flipped' : ''}`}>

              {/* FRONT — mystery back */}
              <div className="card-face w-full h-full bg-noir-2 border border-noir-3 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden">
                {/* diamond grid pattern */}
                <div className="absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #F5C842 0, #F5C842 1px, transparent 0, transparent 50%)',
                    backgroundSize: '20px 20px',
                  }}
                />
                <div className="absolute inset-3 border border-gold/10 rounded-2xl" />
                <div className="absolute inset-5 border border-gold/5 rounded-xl" />
                <div className="relative z-10 text-center px-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold/20 to-lavender/20 border border-gold/20 flex items-center justify-center text-5xl mx-auto mb-5"
                    style={{ animation: 'pulseGlow 3s ease-in-out infinite' }}>
                    🃏
                  </div>
                  <p className="font-display text-3xl text-gold tracking-widest">TAP</p>
                  <p className="font-display text-3xl text-gold/60 tracking-widest">UNTUK BUKA</p>
                  <p className="text-smoke/50 text-xs mt-3 font-mono">Pastikan privasi sebelum tap!</p>
                </div>
                {/* corner ornaments */}
                {['top-3 left-4', 'top-3 right-4', 'bottom-3 left-4', 'bottom-3 right-4'].map((pos) => (
                  <span key={pos} className={`absolute ${pos} text-gold/20 font-mono text-xs`}>◆</span>
                ))}
              </div>

              {/* BACK — role reveal */}
              {revealed && cfg && (
                <div className={`card-back w-full h-full bg-gradient-to-b ${cfg.bgFrom} ${cfg.bgTo} border ${cfg.borderColor} rounded-3xl flex flex-col items-center justify-center p-6 relative overflow-hidden`}
                  style={{ boxShadow: `0 0 40px var(--tw-shadow-color)` }}>

                  <div className="absolute inset-0 opacity-[0.03]"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)',
                      backgroundSize: '16px 16px',
                    }}
                  />

                  <div className="relative z-10 text-center space-y-5 animate-bounce-in">
                    <div className="text-7xl">{cfg.icon}</div>

                    <div>
                      <p className="text-smoke/60 text-xs font-mono uppercase tracking-widest mb-1">Peranmu</p>
                      <p className={`font-display text-4xl tracking-widest ${cfg.textColor}`}>
                        {cfg.label}
                      </p>
                    </div>

                    {/* Word display */}
                    {myRole !== 'white' && me?.word ? (
                      <div className="bg-noir-2/80 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                        <p className="text-smoke/60 text-xs font-mono uppercase tracking-wider mb-2">Katamu adalah</p>
                        <p className="font-display text-4xl text-white tracking-wide">{me.word}</p>
                        <p className="text-smoke/50 text-xs mt-2 font-mono">Kategori: {room.wordCategory}</p>
                      </div>
                    ) : myRole === 'white' ? (
                      <div className="bg-noir-2/80 rounded-2xl p-5 border border-white/10">
                        <p className="text-5xl mb-2">❓</p>
                        <p className="text-white/50 text-sm">Kamu tidak dapat kata</p>
                        <p className="text-white/30 text-xs mt-1">Tebak dari diskusi orang lain!</p>
                      </div>
                    ) : null}

                    <p className={`text-xs ${cfg.textColor} opacity-60 text-center leading-relaxed max-w-[220px]`}>
                      {cfg.desc}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Confirm button */}
          {revealed && (
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-10 py-4 bg-gold text-noir font-display text-xl tracking-widest rounded-2xl hover:bg-gold-dim transition-all glow-gold hover:scale-105 active:scale-95 animate-slide-up"
            >
              {loading
                ? <span className="loading loading-spinner loading-sm" />
                : '✓ SUDAH LIHAT'}
            </button>
          )}
        </div>
      ) : (
        /* Already picked */
        <div className="flex flex-col items-center gap-4 animate-bounce-in">
          <div className="w-72 h-[420px] bg-jade/10 border border-jade/30 rounded-3xl flex flex-col items-center justify-center gap-4 glow-jade">
            <div className="text-7xl">✅</div>
            <p className="font-display text-3xl text-jade tracking-wider">SUDAH LIHAT</p>
            <p className="text-smoke text-sm">Menunggu pemain lain...</p>
          </div>
        </div>
      )}

      {/* Player list below */}
      <div className="mt-8 max-w-sm w-full grid grid-cols-2 gap-2">
        {room.players.map((p) => (
          <div
            key={p.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
              p.hasPickedCard
                ? 'bg-jade/10 border-jade/25 text-jade'
                : 'bg-noir-3 border-noir-4 text-smoke'
            }`}
          >
            <span className="text-base">{p.hasPickedCard ? '✓' : '·'}</span>
            <span className="truncate">{p.name}</span>
            {p.id === playerId && <span className="text-xs opacity-50 ml-auto">(kamu)</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
