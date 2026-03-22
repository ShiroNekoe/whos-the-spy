'use client';

import { useState } from 'react';
import { GameRoom } from '@/lib/types';

interface Props {
  room: GameRoom;
  playerId: string;
  roomCode: string;
  isSpectator: boolean;
}

export default function VotingScreen({ room, playerId, roomCode, isSpectator }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const alivePlayers = room.players.filter((p) => p.isAlive);
  const me = room.players.find((p) => p.id === playerId);
  const myVote = me?.voteFor;
  const hasVoted = myVote !== undefined;
  const votedCount = alivePlayers.filter((p) => p.voteFor !== undefined).length;
  const totalVoters = alivePlayers.length;

  // Tally live votes
  const voteCounts: Record<string, number> = {};
  let skipCount = 0;
  for (const p of alivePlayers) {
    if (!p.voteFor) continue;
    if (p.voteFor === 'skip') skipCount++;
    else voteCounts[p.voteFor] = (voteCounts[p.voteFor] || 0) + 1;
  }
  const maxVotes = Math.max(0, ...Object.values(voteCounts), skipCount);

  const castVote = async (targetId: string | 'skip') => {
    if (hasVoted || loading || isSpectator || !me?.isAlive) return;
    setLoading(targetId);
    try {
      await fetch('/api/vote/cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, playerId, targetId }),
      });
    } finally {
      setLoading(null);
    }
  };

  const candidates = alivePlayers.filter((p) => p.id !== playerId);
  const canVote = me?.isAlive && !isSpectator;

  return (
    <div className="min-h-screen bg-noir grid-bg relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-crimson/5 to-transparent pointer-events-none" />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="text-center pt-2">
          <p className="text-smoke text-xs font-mono uppercase tracking-widest">Ronde {room.round}</p>
          <h2 className="font-display text-6xl text-white tracking-wider mt-1">VOTING</h2>
          <p className="text-smoke/70 text-sm mt-1">Setelah diskusi — siapa yang kamu curigai?</p>

          {/* Vote progress bar */}
          <div className="mt-5">
            <div className="flex justify-between text-xs font-mono text-smoke mb-1.5">
              <span>Sudah vote: <span className="text-white">{votedCount}</span></span>
              <span>Total: <span className="text-white">{totalVoters}</span></span>
            </div>
            <div className="w-full bg-noir-4 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-crimson to-crimson/60 rounded-full transition-all duration-500"
                style={{ width: `${totalVoters > 0 ? (votedCount / totalVoters) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Role reminder */}
        {me?.isAlive && me.role && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${
            me.role === 'civilian' ? 'bg-jade/8 border-jade/20' :
            me.role === 'undercover' ? 'bg-crimson/8 border-crimson/20' :
            'bg-white/5 border-white/10'
          }`}>
            <span className="text-2xl">
              {me.role === 'civilian' ? '👤' : me.role === 'undercover' ? '🎭' : '👁️'}
            </span>
            <div>
              <p className={`text-xs font-mono font-bold ${
                me.role === 'civilian' ? 'text-jade' :
                me.role === 'undercover' ? 'text-crimson' : 'text-white'
              }`}>{me.role.toUpperCase()}</p>
              {me.word ? (
                <p className="text-white text-sm font-medium">Katamu: <span className="font-mono">{me.word}</span></p>
              ) : (
                <p className="text-smoke text-sm">Tidak ada kata — ikuti diskusi</p>
              )}
            </div>
          </div>
        )}

        {/* Already voted notice */}
        {hasVoted && (
          <div className="bg-jade/10 border border-jade/30 rounded-2xl px-4 py-3 text-center animate-bounce-in">
            <p className="text-jade font-mono text-sm">
              ✓ Kamu sudah vote
              {myVote === 'skip'
                ? ' — Skip'
                : ` — ${room.players.find(p => p.id === myVote)?.name}`}
            </p>
            <p className="text-smoke/60 text-xs mt-1">Menunggu {totalVoters - votedCount} pemain lagi...</p>
          </div>
        )}

        {/* Player cards grid */}
        <div className="space-y-2">
          <p className="text-smoke text-xs font-mono uppercase tracking-widest px-1">
            Pilih tersangka
          </p>

          {candidates.map((player) => {
            const voteCount = voteCounts[player.id] || 0;
            const pct = totalVoters > 0 ? (voteCount / totalVoters) * 100 : 0;
            const isLeading = voteCount > 0 && voteCount === maxVotes && maxVotes > skipCount;
            const myVoteIsThis = myVote === player.id;
            const whoVoted = alivePlayers.filter((p) => p.voteFor === player.id);

            return (
              <button
                key={player.id}
                onClick={() => castVote(player.id)}
                disabled={hasVoted || !!loading || !canVote}
                className={`w-full rounded-2xl border text-left transition-all duration-200 overflow-hidden
                  ${myVoteIsThis
                    ? 'border-crimson/60 bg-crimson/15 shadow-lg shadow-crimson/20'
                    : isLeading
                    ? 'border-crimson/35 bg-crimson/8'
                    : 'border-noir-4 bg-noir-2 hover:border-crimson/30 hover:bg-noir-3'
                  }
                  ${!hasVoted && canVote ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}
                  disabled:opacity-100
                `}
              >
                {/* Vote bar background */}
                {voteCount > 0 && (
                  <div
                    className="absolute inset-y-0 left-0 bg-crimson/10 transition-all duration-700 rounded-2xl"
                    style={{ width: `${pct}%` }}
                  />
                )}

                <div className="relative p-4 flex items-center gap-4">
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-display text-xl flex-shrink-0 ${
                    myVoteIsThis ? 'bg-crimson/30 text-white' :
                    isLeading ? 'bg-crimson/20 text-crimson/80' :
                    'bg-noir-3 text-smoke'
                  }`}>
                    {player.name[0].toUpperCase()}
                  </div>

                  {/* Name + voters */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-base truncate ${
                      myVoteIsThis ? 'text-crimson' : 'text-white'
                    }`}>
                      {player.name}
                    </p>
                    {whoVoted.length > 0 && (
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {whoVoted.map((voter) => (
                          <span
                            key={voter.id}
                            className={`text-xs px-1.5 py-0.5 rounded-md font-mono ${
                              voter.id === playerId
                                ? 'bg-crimson/30 text-crimson'
                                : 'bg-noir-4 text-smoke'
                            }`}
                          >
                            {voter.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Vote count badge */}
                  <div className="flex-shrink-0 text-right">
                    {loading === player.id ? (
                      <span className="loading loading-spinner loading-xs text-crimson" />
                    ) : voteCount > 0 ? (
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-display text-lg ${
                        isLeading ? 'bg-crimson/25 text-crimson' : 'bg-noir-3 text-smoke'
                      }`}>
                        {voteCount}
                      </div>
                    ) : !hasVoted && canVote ? (
                      <div className="w-9 h-9 rounded-full border border-dashed border-noir-4 flex items-center justify-center text-smoke/30">
                        +
                      </div>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Skip button */}
          {(() => {
            const skipIsLeading = skipCount > 0 && skipCount === maxVotes;
            const myVoteIsSkip = myVote === 'skip';
            const whoSkipped = alivePlayers.filter((p) => p.voteFor === 'skip');
            return (
              <button
                onClick={() => castVote('skip')}
                disabled={hasVoted || !!loading || !canVote}
                className={`w-full rounded-2xl border text-left p-4 transition-all duration-200
                  ${myVoteIsSkip
                    ? 'border-gold/60 bg-gold/15 shadow-lg shadow-gold/20'
                    : skipIsLeading
                    ? 'border-gold/35 bg-gold/8'
                    : 'border-dashed border-noir-4 bg-noir-2 hover:border-gold/30 hover:bg-noir-3'
                  }
                  ${!hasVoted && canVote ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}
                  disabled:opacity-100
                `}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                    myVoteIsSkip ? 'bg-gold/30' : 'bg-noir-3'
                  }`}>
                    ⏭️
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-base ${myVoteIsSkip ? 'text-gold' : 'text-smoke'}`}>
                      Skip — Tidak ada yang dieliminasi
                    </p>
                    {whoSkipped.length > 0 && (
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {whoSkipped.map((voter) => (
                          <span
                            key={voter.id}
                            className={`text-xs px-1.5 py-0.5 rounded-md font-mono ${
                              voter.id === playerId
                                ? 'bg-gold/30 text-gold'
                                : 'bg-noir-4 text-smoke'
                            }`}
                          >
                            {voter.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {loading === 'skip' ? (
                    <span className="loading loading-spinner loading-xs text-gold" />
                  ) : skipCount > 0 ? (
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-display text-lg ${
                      skipIsLeading ? 'bg-gold/25 text-gold' : 'bg-noir-3 text-smoke'
                    }`}>
                      {skipCount}
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })()}
        </div>

        {/* Spectator / eliminated notice */}
        {(!me?.isAlive || isSpectator) && (
          <div className="bg-noir-3 border border-noir-4 rounded-2xl p-4 text-center">
            <p className="text-smoke text-sm">
              {isSpectator ? '👁️ Kamu menonton sebagai spectator' : '💀 Kamu sudah dieliminasi — spectator mode'}
            </p>
          </div>
        )}

        {/* Eliminated players list */}
        {room.players.some(p => !p.isAlive) && (
          <div className="bg-noir-2 border border-noir-3 rounded-2xl p-4">
            <p className="text-smoke text-xs font-mono uppercase tracking-widest mb-3">Sudah Eliminasi</p>
            <div className="flex flex-wrap gap-2">
              {room.players.filter(p => !p.isAlive).map(p => (
                <div key={p.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-crimson/10 border border-crimson/20">
                  <span className="text-sm">💀</span>
                  <span className="text-crimson/80 text-xs font-medium">{p.name}</span>
                  <span className={`text-xs font-mono px-1 rounded ${
                    p.role === 'civilian' ? 'text-jade' :
                    p.role === 'undercover' ? 'text-crimson' : 'text-white/50'
                  }`}>
                    {p.role === 'civilian' ? 'C' : p.role === 'undercover' ? 'U' : 'W'}
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
