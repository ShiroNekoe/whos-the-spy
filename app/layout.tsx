// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Who's The Spy? 🕵️",
  description: 'Real-time multiplayer social deduction game',
  themeColor: '#0A0A0F',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-theme="spy">
      <body className="min-h-screen bg-noir font-body antialiased">
        {children}
      </body>
    </html>
  );
}
