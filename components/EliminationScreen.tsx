'use client';

import { useState, useEffect, useRef } from 'react';
import { GameRoom } from '@/lib/types';

interface Props {
  room: GameRoom;
  playerId: string;
  roomCode: string;
  isSpectator: boolean;
}

export default function EliminationScreen({ room, playerId, roomCode, isSpectator }: Props) {
  const [whiteGuess, setWhiteGuess] = useState('');
  const [localResult, setLocalResult] = useState<'correct' | 'wrong' | null>(null);
  const [loading, setLoading] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isHost = room.hostId === playerId;
  const voteResult = room.voteResult;
  const eliminatedPlayer = voteResult?.eliminated
    ? room.players.find((p) => p.id === voteResult.eliminated)
    : null;

  const me = room.players.find((p) => p.id === playerId);
  const iAmEliminated = eliminatedPlayer?.id === playerId;
  const iAmMrWhite = me?.role === 'white';
  
  // Mr. White needs to guess: I was eliminated, I'm Mr. White, no guess yet
  const needsToGuess = iAmEliminated && iAmMrWhite && !room.whiteGuess;
  // Someone else was eliminated and they were Mr. White (show result to everyone)
  const whiteWasEliminated = eliminatedPlayer?.role === 'white';

  // Show input with a small delay for drama
  useEffect(() => {
    if (needsToGuess) {
      const t = setTimeout(() => {
        setShowInput(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [needsToGuess]);

  const handleGuess = async () => {
    if (!whiteGuess.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/game/white-guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, playerId, guess: whiteGuess.trim() }),
      });
      const data = await res.json();
      setLocalResult(data.isCorrect ? 'correct' : 'wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleNextRound = async () => {
    setNextLoading(true);
    try {
      await fetch('/api/game/next-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, playerId }),
      });
    } finally {
      setNextLoading(false);
    }
  };

  // Can host show "lanjut" button?
  // Yes if: not skip-win with white eliminated pending guess, or guess already done
  const whiteGuessPending = whiteWasEliminated && !room.whiteGuess;
  const showNextBtn = isHost && !voteResult?.isSkipWin
    ? whiteWasEliminated
      ? !!room.whiteGuess // wait for guess first
      : true
    : isHost && !!voteResult?.isSkipWin;

  return (
    <div className="min-h-screen bg-noir grid-bg relative overflow-hidden flex flex-col items-center justify-center px-4 py-8">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {voteResult?.isSkipWin
          ? <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold/5 rounded-full blur-3xl" />
          : <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-crimson/6 rounded-full blur-3xl" />
        }
      </div>

      <div className="max-w-md w-full space-y-5 relative z-10">

        {/* ── SKIP WIN ── */}
        {voteResult?.isSkipWin && (
          <div className="text-center animate-bounce-in space-y-4">
            <div className="text-8xl">⏭️</div>
            <h2 className="font-display text-6xl text-gold tracking-wider">SKIP!</h2>
            <p className="text-smoke">Tidak ada yang dieliminasi ronde ini</p>
            <div className="bg-gold/10 border border-gold/25 rounded-2xl px-5 py-3">
              <p className="text-gold/80 text-sm font-mono">
                {voteResult.skipCount} pemain memilih skip
              </p>
            </div>
          </div>
        )}

        {/* ── PLAYER ELIMINATED ── */}
        {!voteResult?.isSkipWin && eliminatedPlayer && (
          <div className="text-center animate-bounce-in space-y-4">
            <div className="text-8xl">💀</div>
            <div>
              <h2 className="font-display text-6xl text-crimson tracking-wider">ELIMINASI!</h2>
              <p className="text-white text-2xl font-medium mt-2">{eliminatedPlayer.name}</p>
              <p className="text-smoke text-sm mt-1">tereliminasi berdasarkan voting</p>
            </div>

            {/* Role reveal card */}
            <div className={`p-5 rounded-2xl border ${
              eliminatedPlayer.role === 'civilian'
                ? 'bg-jade/10 border-jade/35 glow-jade'
                : eliminatedPlayer.role === 'undercover'
                ? 'bg-crimson/10 border-crimson/35 glow-crimson'
                : 'bg-white/6 border-white/20'
            }`}>
              <p className="text-smoke/60 text-xs font-mono uppercase tracking-widest mb-3">Identitasnya...</p>
              <div className="flex items-center justify-center gap-4">
                <span className="text-5xl">
                  {eliminatedPlayer.role === 'civilian' ? '👤'
                    : eliminatedPlayer.role === 'undercover' ? '🎭'
                    : '👁️'}
                </span>
                <div className="text-left">
                  <p className={`font-display text-3xl tracking-widest ${
                    eliminatedPlayer.role === 'civilian' ? 'text-jade'
                      : eliminatedPlayer.role === 'undercover' ? 'text-crimson'
                      : 'text-white'
                  }`}>
                    {eliminatedPlayer.role === 'civilian' ? 'CIVILIAN'
                      : eliminatedPlayer.role === 'undercover' ? 'UNDERCOVER'
                      : 'MR. WHITE'}
                  </p>
                  {/* Only reveal word for Civilian — Undercover & White stay hidden (fairplay) */}
                  {eliminatedPlayer.role === 'civilian' && eliminatedPlayer.word && (
                    <p className="text-smoke text-sm mt-1">
                      Kata: <span className="text-jade font-mono font-bold">"{eliminatedPlayer.word}"</span>
                    </p>
                  )}
                  {eliminatedPlayer.role === 'undercover' && (
                    <p className="text-smoke/50 text-xs mt-1 font-mono italic">kata tersembunyi 🤫</p>
                  )}
                  {eliminatedPlayer.role === 'white' && (
                    <p className="text-smoke/50 text-xs mt-1 font-mono italic">tidak punya kata</p>
                  )}
                </div>
              </div>
              {eliminatedPlayer.role === 'civilian' && (
                <p className="text-jade text-sm mt-3 bg-jade/10 rounded-xl px-3 py-2">
                  😬 Oops! Kalian mengeliminasi Civilian!
                </p>
              )}
            </div>

            {/* ══ MR. WHITE GUESS FLOW ══ */}
            {whiteWasEliminated && (
              <div className="space-y-3">

                {/* — Only Mr. White sees this input (before submitting) — */}
                {needsToGuess && !room.whiteGuess && (
                  <div className={`bg-noir-2 border border-white/25 rounded-2xl p-5 space-y-4 transition-all duration-500 ${
                    showInput ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}>
                    <div className="text-center">
                      <p className="text-white font-display text-2xl tracking-wider">TEBAKAN TERAKHIR</p>
                      <p className="text-smoke/70 text-sm mt-1">
                        Tebak <span className="text-white font-medium">kata Civilian</span> untuk menang!
                      </p>
                    </div>

                    <div className="space-y-3">
                      <input
                        ref={inputRef}
                        type="text"
                        value={whiteGuess}
                        onChange={(e) => setWhiteGuess(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                        placeholder="Ketik tebakan kamu..."
                        maxLength={40}
                        disabled={loading}
                        className="w-full bg-noir-3 border border-white/20 rounded-xl px-4 py-3.5 text-white text-center text-lg font-mono placeholder-smoke/30 focus:outline-none focus:border-white/50 transition-colors"
                      />
                      <button
                        onClick={handleGuess}
                        disabled={loading || !whiteGuess.trim()}
                        className="w-full py-3.5 bg-white text-noir font-display text-xl tracking-widest rounded-xl hover:bg-white/90 transition-all disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {loading
                          ? <span className="loading loading-spinner loading-sm" />
                          : '🎯 SUBMIT TEBAKAN'}
                      </button>
                    </div>
                  </div>
                )}

                {/* — WRONG notification (only for Mr. White, local) — no word reveal! */}
                {localResult === 'wrong' && (
                  <div className="bg-crimson/15 border-2 border-crimson/60 rounded-2xl p-5 text-center animate-shake glow-crimson space-y-2">
                    <div className="text-5xl">❌</div>
                    <p className="font-display text-4xl text-crimson tracking-widest">SALAH!</p>
                    <p className="text-white/70 text-sm">
                      Tebakanmu: <span className="font-mono text-white">"{whiteGuess}"</span>
                    </p>
                    <p className="text-smoke/60 text-xs mt-2">Tebakan salah. Game berlanjut.</p>
                  </div>
                )}

                {/* — Everyone sees the guess result after submitted — no word reveal on wrong! */}
                {room.whiteGuess && (
                  <div className={`rounded-2xl border p-5 text-center animate-bounce-in space-y-2 ${
                    room.whiteGuessCorrect
                      ? 'bg-gold/15 border-gold/50 glow-gold'
                      : 'bg-crimson/10 border-crimson/30'
                  }`}>
                    <p className="text-smoke/60 text-xs font-mono uppercase tracking-widest">Tebakan Mr. White</p>
                    <p className="text-white text-2xl font-mono font-bold">"{room.whiteGuess}"</p>
                    {room.whiteGuessCorrect ? (
                      <>
                        <p className="font-display text-4xl text-gold tracking-widest animate-bounce">✓ BENAR!</p>
                        <p className="text-gold/70 text-sm">Mr. White berhasil menebak dan MENANG!</p>
                      </>
                    ) : (
                      <>
                        <p className="font-display text-4xl text-crimson tracking-widest">✗ SALAH</p>
                        <p className="text-smoke/50 text-xs">Mr. White gagal menebak. Game berlanjut.</p>
                      </>
                    )}
                  </div>
                )}

                {/* Waiting text for other players while Mr. White hasn't guessed */}
                {!needsToGuess && !room.whiteGuess && (
                  <div className="bg-noir-2 border border-white/15 rounded-2xl px-4 py-4 text-center">
                    <div className="flex justify-center gap-1 mb-2">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-2 h-2 bg-white/40 rounded-full animate-bounce"
                          style={{ animationDelay: `${i*200}ms` }} />
                      ))}
                    </div>
                    <p className="text-smoke text-sm font-mono">
                      Menunggu <span className="text-white">{eliminatedPlayer.name}</span> menebak kata...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── NO ELIMINATION (tie) ── */}
        {!voteResult?.isSkipWin && !eliminatedPlayer && (
          <div className="text-center animate-bounce-in space-y-3">
            <div className="text-7xl">🤝</div>
            <h2 className="font-display text-4xl text-smoke tracking-wider">SERI!</h2>
            <p className="text-smoke/70 text-sm">Vote seimbang, tidak ada yang dieliminasi</p>
          </div>
        )}

        {/* ── VOTE BREAKDOWN ── */}
        {voteResult && (Object.keys(voteResult.votes).length > 0 || voteResult.skipCount > 0) && (
          <div className="bg-noir-2 border border-noir-3 rounded-2xl p-4">
            <p className="text-smoke text-xs font-mono uppercase tracking-widest mb-3">Hasil Vote</p>
            <div className="space-y-2">
              {Object.entries(voteResult.votes)
                .sort(([, a], [, b]) => b - a)
                .map(([pid, count]) => {
                  const player = room.players.find((p) => p.id === pid);
                  if (!player) return null;
                  const total = room.players.filter(p => !p.isAlive ? p.eliminatedRound === room.round ? false : false : true).length + 1;
                  const pct = Math.round((count / room.players.filter(p => p.isAlive || p.eliminatedRound === room.round).length) * 100);
                  return (
                    <div key={pid} className="flex items-center gap-3">
                      <span className="text-smoke text-sm w-20 truncate">{player.name}</span>
                      <div className="flex-1 bg-noir-4 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-crimson rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-crimson font-mono text-xs w-8 text-right">{count}×</span>
                    </div>
                  );
                })}
              {voteResult.skipCount > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-smoke text-sm w-20">Skip</span>
                  <div className="flex-1 bg-noir-4 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gold rounded-full"
                      style={{ width: `${Math.round((voteResult.skipCount / room.players.filter(p => p.isAlive).length) * 100)}%` }} />
                  </div>
                  <span className="text-gold font-mono text-xs w-8 text-right">{voteResult.skipCount}×</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PLAYER STATUS ── */}
        <div className="bg-noir-2 border border-noir-3 rounded-2xl p-4">
          <p className="text-smoke text-xs font-mono uppercase tracking-widest mb-3">Status Pemain</p>
          <div className="grid grid-cols-2 gap-2">
            {room.players.map((p) => (
              <div key={p.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                p.isAlive ? 'bg-noir-3' : 'bg-noir-3/40 opacity-50'
              }`}>
                <span className="text-sm">{p.isAlive ? '🟢' : '💀'}</span>
                <span className={`text-xs truncate ${p.isAlive ? 'text-white' : 'text-smoke line-through'}`}>
                  {p.name}
                </span>
                {p.id === playerId && <span className="text-gold/50 text-xs ml-auto">★</span>}
              </div>
            ))}
          </div>
        </div>

        {/* ── NEXT ROUND BUTTON (host) ── */}
        {showNextBtn && (
          <button
            onClick={handleNextRound}
            disabled={nextLoading}
            className="w-full py-4 bg-gold text-noir font-display text-2xl tracking-widest rounded-2xl hover:bg-gold-dim transition-all disabled:opacity-50 glow-gold hover:scale-[1.02] active:scale-[0.98]"
          >
            {nextLoading ? <span className="loading loading-spinner" /> : 'LANJUT →'}
          </button>
        )}

        {/* Waiting for host */}
        {!isHost && !whiteGuessPending && (
          <p className="text-center text-smoke/60 font-mono text-sm animate-pulse">
            Menunggu host melanjutkan...
          </p>
        )}

        {/* Waiting for Mr. White to guess (non-host, non-white) */}
        {!isHost && whiteGuessPending && !needsToGuess && (
          <p className="text-center text-smoke/60 font-mono text-sm animate-pulse">
            Menunggu {eliminatedPlayer?.name} menebak...
          </p>
        )}
      </div>
    </div>
  );
}
