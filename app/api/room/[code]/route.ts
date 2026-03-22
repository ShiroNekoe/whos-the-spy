// app/api/room/[code]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRoom } from '@/lib/store';

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const room = await getRoom(params.code.toUpperCase());
    if (!room) {
      return NextResponse.json({ error: 'Room tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ room });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data room' }, { status: 500 });
  }
}
