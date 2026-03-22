// lib/redis.ts
import { Redis } from '@upstash/redis';

let redis: Redis;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

const ROOM_TTL = 60 * 60 * 6; // 6 hours

export async function getRoom(roomCode: string): Promise<import('./types').GameRoom | null> {
  const r = getRedis();
  const data = await r.get<import('./types').GameRoom>(`room:${roomCode}`);
  return data || null;
}

export async function setRoom(room: import('./types').GameRoom): Promise<void> {
  const r = getRedis();
  await r.setex(`room:${room.code}`, ROOM_TTL, room);
}

export async function deleteRoom(roomCode: string): Promise<void> {
  const r = getRedis();
  await r.del(`room:${roomCode}`);
}
