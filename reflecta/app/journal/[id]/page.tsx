"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
      ? "bg-[#FFBF69]/70 text-neutral-900"
      : "bg-[#CB997E]/45 text-neutral-900";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs ${styles}`}
    >
      {label}
    </span>
  );
}

function NotFoundState() {
  return (
    <main className="min-h-screen bg-[#FFE8D6]">
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-10 sm:px-6">
        <Link
          href="/reflection"
          className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
        >
          &larr; Back to Reflection
        </Link>
        <div className="rounded-2xl bg-white/70 p-6 shadow-sm ring-1 ring-black/5">
          <h1 className="text-xl font-semibold text-neutral-900">
            This entry does not exist.
          </h1>
          <p className="mt-2 text-sm text-neutral-700">
            The journal entry you are looking for is not available.
          </p>
          <Link
            href="/reflection"
            className="mt-4 inline-flex items-center rounded-full bg-[#FF9F1C] px-4 py-2 text-sm font-medium text-neutral-900 shadow-sm transition hover:bg-[#FFBF69]"
          >
            &larr; Back to Reflection
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
    <main className="min-h-screen bg-[#FFE8D6]">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
        <Link
          href="/reflection"
          className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
        >
          &larr; Back to Reflection
        </Link>

        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-neutral-900">
            {displayDate ?? "Journal Entry"}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600">
            {state.analysis?.mhf !== undefined ? (
              <span>
                Stability{" "}
                <span className="font-medium text-neutral-900">
                  {state.analysis.mhf}
                </span>
              </span>
            ) : null}
            {typeof state.analysis?.delta === "number" ? (
              <span>
                Delta{" "}
                <span className="font-medium text-neutral-900">
                  {state.analysis.delta > 0 ? "+" : ""}
                  {state.analysis.delta}
                </span>
              </span>
            ) : null}
            {state.analysis?.is_core_memory ? (
              <ShiftBadge
                kind={shiftKind}
                label={state.analysis.core_label ?? "Moment That Mattered"}
              />
            ) : null}
          </div>
        </header>

        <section className="rounded-2xl bg-white/70 p-6 shadow-sm ring-1 ring-black/5">
          <div className="mt-1 space-y-3 text-sm text-neutral-800">
            {state.entry.content.split("\n\n").map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
