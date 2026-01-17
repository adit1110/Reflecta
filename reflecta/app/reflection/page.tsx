// src/app/reflection/page.tsx
import ReflectionView from "./_components/reflection-view";
import Link from "next/link";
import { Home } from "lucide-react";

export default function ReflectionPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FFE8D6] via-[#FFF1E6] to-[#FFE8D6]">
      {/* Decorative background elements */}
      <div className="fixed top-40 right-20 w-72 h-72 bg-[#FFBF69]/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="fixed bottom-40 left-20 w-96 h-96 bg-[#FF9F1C]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6 border-b border-[#CB997E]/10 bg-white/30 backdrop-blur-sm">
        <Link
          href="/"
          className="flex items-center gap-2 text-[#CB997E] text-sm font-bold hover:text-[#FF9F1C] transition-colors group"
        >
          <Home className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Home
        </Link>
      </header>

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-8">
          <h1 className="text-3xl font-light text-[#CB997E] tracking-tight">
            Reflection
          </h1>
          <p className="mt-2 text-base text-[#CB997E]/80 font-light">
            A calm view of movement over time - not good or bad, just change.
          </p>
        </header>

        <ReflectionView />
      </div>
    </main>
  );
}