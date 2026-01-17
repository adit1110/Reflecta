"use client";

import { useState } from "react";
import Link from "next/link";

export default function WritePage() {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FFE8D6] flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#CB997E]/20">
        <Link
          href="/"
          className="text-[#CB997E] text-sm hover:underline"
        >
          ← Home
        </Link>

        <span className="text-sm text-[#CB997E]/70">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </span>
      </header>

      {/* Writing area */}
      <main className="flex-1 flex justify-center px-6 py-10">
        <div className="w-full max-w-3xl">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write freely. No pressure. No rules."
            className="w-full min-h-[60vh] resize-none rounded-2xl border border-[#CB997E]/30 bg-[#FFF1E6] p-6 text-lg text-[#3A2D28] placeholder:text-[#CB997E]/60 focus:outline-none focus:ring-2 focus:ring-[#FF9F1C]"
          />

          {/* Footer actions */}
          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm text-[#CB997E]/60">
              {text.length} characters
            </span>

            <button
              onClick={handleSave}
              disabled={!text.trim()}
              className="px-6 py-3 rounded-full bg-[#FF9F1C] text-white font-medium hover:bg-[#FFBF69] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save entry
            </button>
          </div>

          {saved && (
            <p className="mt-4 text-sm text-[#CB997E] italic">
              Entry saved locally
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
