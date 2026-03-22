// lib/store.ts — In-memory global store (no external DB needed)
// Data persists as long as the server process is alive.
// For Vercel: works great for game sessions (rooms are short-lived anyway).

import { GameRoom } from './types';

// Use a global variable so the store survives Next.js hot-reloads in dev
// and is shared across requests in the same server instance.
const globalStore = global as typeof global & {
  __gameRooms?: Map<string, { room: GameRoom; expiresAt: number }>;
};

const ROOM_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours in ms

function getStore(): Map<string, { room: GameRoom; expiresAt: number }> {
  if (!globalStore.__gameRooms) {
    globalStore.__gameRooms = new Map();
  }
  return globalStore.__gameRooms;
}

function evictExpired() {
  const store = getStore();
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.expiresAt < now) {
      store.delete(key);
    }
  }
}

export async function getRoom(roomCode: string): Promise<GameRoom | null> {
  evictExpired();
  const store = getStore();
  const entry = store.get(roomCode.toUpperCase());
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    store.delete(roomCode.toUpperCase());
    return null;
  }
  return entry.room;
}

export async function setRoom(room: GameRoom): Promise<void> {
  const store = getStore();
  store.set(room.code.toUpperCase(), {
    room,
    expiresAt: Date.now() + ROOM_TTL_MS,
  });
}

export async function deleteRoom(roomCode: string): Promise<void> {
  const store = getStore();
  store.delete(roomCode.toUpperCase());
}

// Keep backward-compat export name
export { getRoom as getRedis };
