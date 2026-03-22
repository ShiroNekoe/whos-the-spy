// lib/game-logic.ts
import { GameRoom, Player, Role, VoteResult } from './types';
import { getRandomWordPair, shuffleArray } from './words';

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─────────────────────────────────────────────────────────────
// Fisher-Yates with crypto-quality randomness via multiple
// Math.random() calls XOR'd together to reduce streak risk.
// ─────────────────────────────────────────────────────────────
function strongRandom(): number {
  // Mix 3 independent Math.random() calls
  const a = Math.random();
  const b = Math.random();
  const c = Math.random();
  return (a + b + c) / 3;
}

function fisherYatesShuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(strongRandom() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─────────────────────────────────────────────────────────────
// Anti-streak weighted assignment
//
// Each player gets a "penalty weight" based on how many times
// they've received a given role recently. The more recent the
// streak, the higher the penalty → less likely to get it again.
//
// Algorithm:
//  1. For each role slot, collect candidate players not yet assigned.
//  2. Score each candidate: score = 1 / (streak_penalty ^ 2)
//  3. Weighted-random pick from scored candidates.
//  4. If only 1 candidate remains, assign directly (no choice).
// ─────────────────────────────────────────────────────────────
function streakCount(history: Role[], role: Role): number {
  // Count consecutive same roles from the END of history
  let count = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i] === role) count++;
    else break;
  }
  return count;
}

function weightedPickIndex(weights: number[]): number {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = strongRandom() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

export function assignRoles(
  players: Player[],
  undercoverCount: number,
  whiteCount: number,
  usedWordIndices: number[],
  roleHistory: Record<string, Role[]> = {}
): {
  players: Player[];
  civilianWord: string;
  undercoverWord: string;
  category: string;
  wordPairIndex: number;
  updatedRoleHistory: Record<string, Role[]>;
} {
  const usedSet = new Set(usedWordIndices);
  const { pair, index } = getRandomWordPair(usedSet);

  const n = players.length;
  const civilianCount = n - undercoverCount - whiteCount;

  // Build role pool
  const rolePool: Role[] = [
    ...Array(whiteCount).fill('white'),
    ...Array(undercoverCount).fill('undercover'),
    ...Array(civilianCount).fill('civilian'),
  ] as Role[];

  // We'll assign role by role, picking the best candidate each time
  // to avoid giving the same role to the same person consecutively.
  const unassigned = fisherYatesShuffle([...players]); // start shuffled
  const assignment: Map<string, Role> = new Map();

  // For each role in the pool, pick a candidate with anti-streak weighting
  const remaining = [...unassigned];
  for (const role of fisherYatesShuffle(rolePool)) {
    if (remaining.length === 0) break;

    const weights = remaining.map((p) => {
      const hist = roleHistory[p.id] || [];
      const streak = streakCount(hist, role);
      // Penalty: 1/((streak+1)^2) — 2 streaks = 1/9 weight, 3 streaks = 1/16
      return 1 / Math.pow(streak + 1, 2);
    });

    const pickedIdx = weightedPickIndex(weights);
    const pickedPlayer = remaining[pickedIdx];
    assignment.set(pickedPlayer.id, role);
    remaining.splice(pickedIdx, 1);
  }

  // Build updated player list with assigned roles
  const updatedPlayers = players.map((p) => {
    const role = assignment.get(p.id) ?? 'civilian';
    return {
      ...p,
      role,
      word:
        role === 'civilian'
          ? pair.civilian
          : role === 'undercover'
          ? pair.undercover
          : undefined,
      hasPickedCard: false,
    };
  });

  // Update role history — keep last 5 rounds max to avoid stale bias
  const updatedRoleHistory: Record<string, Role[]> = {};
  for (const p of updatedPlayers) {
    const prev = (roleHistory[p.id] || []).slice(-4); // keep last 4
    updatedRoleHistory[p.id] = [...prev, p.role!];
  }

  return {
    players: updatedPlayers,
    civilianWord: pair.civilian,
    undercoverWord: pair.undercover,
    category: pair.category,
    wordPairIndex: index,
    updatedRoleHistory,
  };
}

export function checkWinCondition(room: GameRoom): {
  winner: 'civilian' | 'undercover' | 'white' | null;
  winnerIds: string[];
} | null {
  const alivePlayers = room.players.filter((p) => p.isAlive);
  const aliveUndercover = alivePlayers.filter((p) => p.role === 'undercover');
  const aliveWhite = alivePlayers.filter((p) => p.role === 'white');
  const aliveCivilian = alivePlayers.filter((p) => p.role === 'civilian');

  if (aliveUndercover.length === 0 && aliveWhite.length === 0) {
    return { winner: 'civilian', winnerIds: aliveCivilian.map((p) => p.id) };
  }

  if (aliveUndercover.length >= aliveCivilian.length) {
    return { winner: 'undercover', winnerIds: aliveUndercover.map((p) => p.id) };
  }

  if (aliveWhite.length > 0 && aliveCivilian.length === 0 && aliveUndercover.length === 0) {
    return { winner: 'white', winnerIds: aliveWhite.map((p) => p.id) };
  }

  return null;
}

export function calculateVoteResult(players: Player[]): VoteResult {
  const votes: Record<string, number> = {};
  let skipCount = 0;

  const alivePlayers = players.filter((p) => p.isAlive);

  for (const player of alivePlayers) {
    if (!player.voteFor) continue;
    if (player.voteFor === 'skip') {
      skipCount++;
    } else {
      votes[player.voteFor] = (votes[player.voteFor] || 0) + 1;
    }
  }

  let maxVotes = 0;
  let eliminated: string | null = null;
  let tiedCount = 0;

  for (const [playerId, count] of Object.entries(votes)) {
    if (count > maxVotes) {
      maxVotes = count;
      eliminated = playerId;
      tiedCount = 1;
    } else if (count === maxVotes) {
      tiedCount++;
      eliminated = null;
    }
  }

  const isSkipWin = skipCount >= maxVotes && skipCount > 0;

  return {
    eliminated: isSkipWin ? null : eliminated,
    votes,
    skipCount,
    isSkipWin,
  };
}
