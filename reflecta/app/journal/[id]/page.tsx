"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Home, ArrowLeft } from "lucide-react";
import { supabase } from "../../../lib/supabase-browser";
import { formatFullDate } from "../../../lib/reflection/date-utils";

type JournalEntry = {
  id: string;
  entry_date: string;
  content: string;
};

type JournalAnalysis = {
  mhf: number;
  delta: number | null;
  is_core_memory: boolean;
  core_label: string | null;
};

type JournalState = {
  entry: JournalEntry | null;
  analysis: JournalAnalysis | null;
};

function ShiftBadge({
  kind,
  label,
}: {
  kind?: "positive" | "negative";
  label?: string;
}) {
  if (!kind || !label) return null;

  const styles =
    kind === "positive"
      ? "bg-[#FFBF69]/70 text-[#CB997E]"
      : "bg-[#CB997E]/45 text-white";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${styles}`}
    >
      {label}
    </span>
  );
}

function NotFoundState() {
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
          <Home className="w-4 h-4 transition-colors" />
          Home
        </Link>
      </header>

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
        <Link
          href="/reflection"
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-[#CB997E] border border-[#CB997E]/40 rounded-full hover:bg-[#CB997E] hover:text-[#FFE8D6] transition-all duration-300 w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reflection
        </Link>
        <div className="rounded-3xl bg-white/70 backdrop-blur-md p-8 shadow-xl border border-[#CB997E]/20">
          <h1 className="text-2xl font-light text-[#CB997E]">
            Entry Not Found
          </h1>
          <p className="mt-4 text-base font-light text-[#CB997E]/80 leading-relaxed">
            The journal entry you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/reflection"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FF9F1C] text-white font-medium hover:bg-[#FFBF69] transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reflection
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function JournalDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const [state, setState] = useState<JournalState>({
    entry: null,
    analysis: null,
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadEntry = async () => {
      if (!supabase) {
        setIsReady(true);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user || !isMounted) {
        setIsReady(true);
        return;
      }

      const journalId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
      if (!journalId) {
        setIsReady(true);
        return;
      }

      const { data: entry } = await supabase
        .from("journals")
        .select("id, entry_date, content")
        .eq("id", journalId)
        .maybeSingle();

      const { data: analysis } = await supabase
        .from("journal_analysis")
        .select("mhf, delta, is_core_memory, core_label")
        .eq("journal_id", journalId)
        .maybeSingle();

      if (!isMounted) return;
      setState({
        entry: entry ?? null,
        analysis: analysis ?? null,
      });
      setIsReady(true);
    };

    loadEntry();
    return () => {
      isMounted = false;
    };
  }, [params?.id]);

  const displayDate = useMemo(() => {
    if (!state.entry?.entry_date) return null;
    return formatFullDate(state.entry.entry_date);
  }, [state.entry?.entry_date]);

  const shiftKind =
    state.analysis?.delta !== null && state.analysis?.delta !== undefined
      ? state.analysis.delta >= 0
        ? "positive"
        : "negative"
      : undefined;

  if (!isReady) {
    return null;
  }

  if (!state.entry) {
    return <NotFoundState />;
  }

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
          <Home className="w-4 h-4 transition-colors" />
          Home
        </Link>
      </header>

      {/* Main content */}
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col gap-6 px-6 py-12 md:py-16">
        <Link
          href="/reflection"
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-[#CB997E] border border-[#CB997E]/40 rounded-full hover:bg-[#CB997E] hover:text-[#FFE8D6] transition-all duration-300 w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reflection
        </Link>

        {/* Date banner */}
        <div className="text-center">
          <div className="inline-block px-6 py-3 bg-white/50 backdrop-blur-sm rounded-full border border-[#CB997E]/20">
            <p className="text-base md:text-lg text-[#CB997E] font-bold tracking-wide">
              {displayDate ?? "Journal Entry"}
            </p>
          </div>
        </div>

        {/* Stats badges */}
        {(state.analysis?.mhf !== undefined || 
          typeof state.analysis?.delta === "number" || 
          state.analysis?.is_core_memory) && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {state.analysis?.mhf !== undefined && (
              <span className="inline-flex items-center rounded-full px-4 py-2 text-sm font-light bg-white/50 backdrop-blur-sm border border-[#CB997E]/20 text-[#CB997E]">
                Stability{" "}
                <span className="ml-1 font-medium">
                  {state.analysis.mhf}
                </span>
              </span>
            )}
            {typeof state.analysis?.delta === "number" && (
              <span className="inline-flex items-center rounded-full px-4 py-2 text-sm font-light bg-white/50 backdrop-blur-sm border border-[#CB997E]/20 text-[#CB997E]">
                Delta{" "}
                <span className="ml-1 font-medium">
                  {state.analysis.delta > 0 ? "+" : ""}
                  {state.analysis.delta}
                </span>
              </span>
            )}
            {state.analysis?.is_core_memory && (
              <ShiftBadge
                kind={shiftKind}
                label={state.analysis.core_label ?? "Moment That Mattered"}
              />
            )}
          </div>
        )}

        {/* Notebook card with spiral binding */}
        <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Spiral binding holes */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#FFE8D6] to-transparent flex flex-col justify-start gap-8 pt-8 items-center z-10">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="relative">
                {/* Hole shadow */}
                <div className="w-6 h-6 rounded-full bg-[#CB997E]/30 blur-sm absolute inset-0"></div>
                {/* Hole */}
                <div className="w-6 h-6 rounded-full border-2 border-[#CB997E]/40 bg-[#FFE8D6] relative"></div>
                {/* Inner shadow */}
                <div className="w-3 h-3 rounded-full bg-[#CB997E]/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
              </div>
            ))}
          </div>

          {/* Notebook paper with lines */}
          <div className="relative pl-16 pr-8">
            {/* Red margin line */}
            <div className="absolute left-20 top-0 bottom-0 w-[2px] bg-[#FF9F1C]/30"></div>

            <div
              className="w-full min-h-[50vh] p-8 md:p-12 pl-8 text-lg md:text-xl text-[#CB997E] leading-[2.5rem] relative z-20 font-light"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  transparent,
                  transparent 2.4rem,
                  #CB997E15 2.4rem,
                  #CB997E15 2.5rem
                )`,
                backgroundAttachment: 'local',
              }}
            >
              {state.entry.content.split("\n\n").map((paragraph, idx) => (
                <p key={idx} className="mb-6 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}