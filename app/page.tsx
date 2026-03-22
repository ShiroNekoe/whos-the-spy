'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [undercoverCount, setUndercoverCount] = useState(1);
  const [whiteCount, setWhiteCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!playerName.trim()) return setError('Masukkan nama dulu!');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, maxPlayers, undercoverCount, whiteCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem('playerId', data.playerId);
      localStorage.setItem('playerName', playerName);
      router.push(`/room/${data.roomCode}`);
    } catch (e: any) {
      setError(e.message || 'Gagal membuat room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!playerName.trim()) return setError('Masukkan nama dulu!');
    if (!roomCode.trim()) return setError('Masukkan kode room!');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, roomCode: roomCode.toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem('playerId', data.playerId);
      localStorage.setItem('playerName', playerName);
      router.push(`/room/${roomCode.toUpperCase()}`);
    } catch (e: any) {
      setError(e.message || 'Gagal join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-noir grid-bg relative overflow-hidden flex flex-col items-center justify-center px-4">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-lavender/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-jade/3 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-2xl">
            🕵️
          </div>
          <span className="font-mono text-smoke text-sm tracking-widest uppercase">Social Deduction</span>
        </div>
        <h1 className="font-display text-6xl md:text-8xl text-white tracking-wide leading-none">
          WHO'S THE
        </h1>
        <h1 className="font-display text-6xl md:text-8xl text-gold tracking-wide leading-none -mt-2">
          SPY?
        </h1>
        <p className="text-smoke mt-4 max-w-sm mx-auto text-sm leading-relaxed">
          Game deduksi sosial real-time. Temukan siapa penyusup di antara kalian.
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md animate-slide-up">
        {mode === 'home' && (
          <div className="space-y-3">
            <button
              onClick={() => setMode('create')}
              className="w-full py-4 bg-gold text-noir font-display text-xl tracking-wider rounded-xl hover:bg-gold-dim transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] glow-gold"
            >
              BUAT ROOM
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full py-4 bg-noir-3 border border-noir-4 text-white font-display text-xl tracking-wider rounded-xl hover:border-gold/40 hover:bg-noir-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              JOIN ROOM
            </button>

            {/* Role legend */}
            <div className="mt-8 p-4 bg-noir-2 rounded-xl border border-noir-3">
              <p className="text-smoke text-xs font-mono uppercase tracking-widest mb-3">Role dalam game</p>
              <div className="space-y-2">
                {[
                  { role: 'Civilian', color: 'text-jade', bg: 'bg-jade/10 border-jade/20', desc: 'Mendapat kata utama. Temukan penyusup!', icon: '👤' },
                  { role: 'Undercover', color: 'text-crimson', bg: 'bg-crimson/10 border-crimson/20', desc: 'Kata mirip tapi beda. Jangan ketahuan!', icon: '🎭' },
                  { role: 'Mr. White', color: 'text-white', bg: 'bg-white/5 border-white/10', desc: 'Tanpa kata. Tebak dan bertahan hidup!', icon: '👁️' },
                ].map(({ role, color, bg, desc, icon }) => (
                  <div key={role} className={`flex items-center gap-3 p-2 rounded-lg border ${bg}`}>
                    <span className="text-lg">{icon}</span>
                    <div>
                      <span className={`font-mono text-xs font-bold ${color}`}>{role}</span>
                      <p className="text-smoke text-xs">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {(mode === 'create' || mode === 'join') && (
          <div className="bg-noir-2 border border-noir-3 rounded-2xl p-6 space-y-5">
            <button
              onClick={() => { setMode('home'); setError(''); }}
              className="text-smoke hover:text-white transition-colors text-sm flex items-center gap-2"
            >
              ← Kembali
            </button>

            <h2 className="font-display text-2xl text-white tracking-wide">
              {mode === 'create' ? 'BUAT ROOM BARU' : 'JOIN ROOM'}
            </h2>

            {error && (
              <div className="bg-crimson/15 border border-crimson/30 rounded-lg px-4 py-2 text-crimson text-sm animate-shake">
                ⚠️ {error}
              </div>
            )}

            <div>
              <label className="text-smoke text-xs font-mono uppercase tracking-wider mb-1 block">Nama Kamu</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Masukkan nama..."
                maxLength={20}
                className="w-full bg-noir-3 border border-noir-4 rounded-xl px-4 py-3 text-white placeholder-smoke/40 focus:outline-none focus:border-gold/50 transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && (mode === 'join' ? handleJoin() : handleCreate())}
              />
            </div>

            {mode === 'join' && (
              <div>
                <label className="text-smoke text-xs font-mono uppercase tracking-wider mb-1 block">Kode Room</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: ABC123"
                  maxLength={6}
                  className="w-full bg-noir-3 border border-noir-4 rounded-xl px-4 py-3 text-white font-mono text-lg text-center placeholder-smoke/40 focus:outline-none focus:border-gold/50 tracking-widest transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
              </div>
            )}

            {mode === 'create' && (
              <div className="space-y-4 pt-2 border-t border-noir-3">
                <p className="text-smoke text-xs font-mono uppercase tracking-wider">Pengaturan Room</p>

                <div>
                  <label className="text-white text-sm mb-2 flex justify-between">
                    <span>Maks Pemain</span>
                    <span className="text-gold font-mono">{maxPlayers}</span>
                  </label>
                  <input
                    type="range" min={4} max={12} value={maxPlayers}
                    onChange={(e) => setMaxPlayers(+e.target.value)}
                    className="range range-xs range-warning w-full"
                  />
                  <div className="flex justify-between text-smoke text-xs mt-1">
                    <span>4</span><span>12</span>
                  </div>
                </div>

                <div>
                  <label className="text-white text-sm mb-2 flex justify-between">
                    <span>🎭 Undercover</span>
                    <span className="text-crimson font-mono">{undercoverCount}</span>
                  </label>
                  <input
                    type="range" min={1} max={Math.max(1, Math.floor(maxPlayers / 3))} value={undercoverCount}
                    onChange={(e) => setUndercoverCount(+e.target.value)}
                    className="range range-xs range-error w-full"
                  />
                </div>

                <div>
                  <label className="text-white text-sm mb-2 flex justify-between">
                    <span>👁️ Mr. White</span>
                    <span className="text-white font-mono">{whiteCount}</span>
                  </label>
                  <input
                    type="range" min={0} max={Math.max(0, Math.floor(maxPlayers / 4))} value={whiteCount}
                    onChange={(e) => setWhiteCount(+e.target.value)}
                    className="range range-xs w-full"
                  />
                </div>

                <div className="text-smoke text-xs bg-noir-3 rounded-lg p-3 font-mono">
                  👥 Civilian: <span className="text-jade">{maxPlayers - undercoverCount - whiteCount}</span>
                  {' · '}🎭 Undercover: <span className="text-crimson">{undercoverCount}</span>
                  {' · '}👁️ White: <span className="text-white">{whiteCount}</span>
                </div>
              </div>
            )}

            <button
              onClick={mode === 'create' ? handleCreate : handleJoin}
              disabled={loading}
              className="w-full py-4 bg-gold text-noir font-display text-xl tracking-wider rounded-xl hover:bg-gold-dim transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] glow-gold"
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : mode === 'create' ? 'BUAT ROOM' : 'MASUK ROOM'}
            </button>
          </div>
        )}
      </div>

      <p className="mt-8 text-smoke/40 text-xs font-mono">min. 4 pemain • tanpa login • multiplayer real-time</p>
    </main>
  );
}
