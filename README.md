# 🕵️ Who's The Spy?

Real-time multiplayer social deduction game — mirip Who's the Spy & Werewolf.

## Tech Stack
- **Next.js 14** (App Router)
- **In-memory global store** — state game, zero external DB
- **Pusher** — real-time updates via WebSocket
- **TailwindCSS + DaisyUI** — UI framework
- **Deploy ke Vercel**

> ✅ **Tidak perlu Redis, tidak perlu database apapun!** State disimpan di memori server.
> ⚠️ Data reset kalau server cold start — tapi untuk game session pendek ini lebih dari cukup.

## 🚀 Setup & Deploy

### 1. Clone & Install

```bash
git clone <repo>
cd whos-the-spy
npm install
```

### 2. Setup Pusher (satu-satunya external service)

1. Buka [pusher.com](https://pusher.com) → buat akun gratis
2. Buat app baru (Channels)
3. Pilih cluster terdekat (misal: `ap1` untuk Asia)
4. Copy App ID, Key, Secret, Cluster

### 3. Environment Variables

Copy `.env.local.example` ke `.env.local` dan isi:

```env
PUSHER_APP_ID=xxx
PUSHER_KEY=xxx
PUSHER_SECRET=xxx
PUSHER_CLUSTER=ap1

NEXT_PUBLIC_PUSHER_KEY=xxx
NEXT_PUBLIC_PUSHER_CLUSTER=ap1
```

### 4. Jalankan Lokal

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

### 5. Deploy ke Vercel

```bash
npm install -g vercel
vercel --prod
```

Atau push ke GitHub, lalu import di [vercel.com](https://vercel.com).

> **Penting:** Tambahkan env variables Pusher di Vercel dashboard (Settings → Environment Variables)

---

## 🎮 Cara Main

1. **Buat Room** — Player pertama buat room, dapat kode 6 karakter
2. **Share Kode** — Share ke teman-teman untuk join
3. **Host Start** — Minimal 4 pemain, host klik "MULAI GAME"
4. **Ambil Kartu** — Setiap pemain klik kartu untuk lihat peran & kata
5. **Deskripsi** — Bergiliran memberi deskripsi 1-3 kata
6. **Voting** — Vote siapa yang dicurigai, atau skip
7. **Eliminasi** — Yang dapat vote terbanyak dieliminasi + reveal peran
8. **Loop** — Ulangi sampai ada yang menang

## 🧠 Win Condition

| Pemenang | Kondisi |
|----------|---------|
| Civilian 👤 | Semua Undercover & White tereliminasi |
| Undercover 🎭 | Jumlah Undercover ≥ Civilian yang hidup |
| Mr. White 👁️ | Bertahan sampai akhir ATAU tebak kata Civilian saat dieliminasi |

## 📁 Struktur Project

```
spy-game/
├── app/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx
│   ├── globals.css
│   ├── room/[code]/
│   │   └── page.tsx          # Game room (router)
│   └── api/
│       ├── room/             # create, join, settings, [code]
│       ├── game/             # start, pick-card, describe, next-round, white-guess, restart
│       └── vote/             # cast
├── components/               # 7 screen components
├── hooks/useRoom.ts          # Pusher real-time hook
└── lib/
    ├── store.ts              # In-memory global store ✅
    ├── pusher-server.ts
    ├── pusher-client.ts
    ├── game-logic.ts
    ├── words.ts              # 100+ word pairs
    └── types.ts
```

## 🃏 Word Pairs

100+ pasangan kata dari 7 kategori:
- 🍔 Makanan & Minuman (25 pairs)
- 🌍 Tempat (18 pairs)
- 💼 Profesi (16 pairs)
- 📱 Teknologi (16 pairs)
- 🐾 Hewan (16 pairs)
- 🔧 Benda Sehari-hari (23 pairs)
- 🚗 Kendaraan (8 pairs)

Sistem random shuffle + anti-repeat dalam 1 sesi game.

## 🔧 Services yang Dibutuhkan

| Service | Keperluan | Harga |
|---------|-----------|-------|
| [Pusher](https://pusher.com) | Real-time WebSocket | Free (200k msg/day) |
| [Vercel](https://vercel.com) | Deploy | Free |

**Total biaya: Rp 0** 🎉
