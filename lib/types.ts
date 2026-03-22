// lib/types.ts
export type Role = 'civilian' | 'undercover' | 'white';

export type GamePhase =
  | 'lobby'
  | 'card-reveal'
  | 'voting'
  | 'elimination'
  | 'ended';

export type Player = {
  id: string;
  name: string;
  role?: Role;
  word?: string;
  isAlive: boolean;
  hasPickedCard: boolean;
  isHost: boolean;
  voteFor?: string | 'skip';
  eliminatedRound?: number;
};

export type VoteResult = {
  eliminated: string | null;
  votes: Record<string, number>;
  skipCount: number;
  isSkipWin: boolean;
};

export type GameRoom = {
  id: string;
  code: string;
  hostId: string;
  players: Player[];
  phase: GamePhase;
  round: number;
  civilianWord: string;
  undercoverWord: string;
  wordCategory: string;
  wordPairIndex: number;
  usedWordIndices: number[];
  undercoverCount: number;
  whiteCount: number;
  maxPlayers: number;
  voteResult?: VoteResult;
  winner?: 'civilian' | 'undercover' | 'white' | null;
  winnerIds?: string[];
  createdAt: number;
  eliminationLog: EliminationEvent[];
  roleHistory: Record<string, Role[]>; // anti-streak tracking
  whiteGuess?: string;
  whiteGuessCorrect?: boolean;
};

export type EliminationEvent = {
  round: number;
  playerId: string;
  playerName: string;
  role: Role;
  word?: string;
};

// Per-player role history for anti-streak assignment
// key = playerId, value = array of roles received in order
export type RoleHistory = Record<string, Role[]>;
