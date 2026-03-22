// components/LoadingScreen.tsx
export default function LoadingScreen({ message = 'Memuat...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-noir grid-bg flex items-center justify-center flex-col gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🕵️</div>
      </div>
      <p className="text-smoke font-mono text-sm tracking-widest animate-pulse">{message}</p>
    </div>
  );
}
