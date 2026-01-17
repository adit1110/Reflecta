"use client";

import { useState } from "react";
import Link from "next/link";
import { Volume2, VolumeX, Save, Home } from "lucide-react";

export default function WritePage() {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        // Stop speaking
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        // Start speaking
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
    } else {
      alert('Text-to-speech is not supported in your browser.');
    }
  };

  const currentDate = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFE8D6] via-[#FFF1E6] to-[#FFE8D6]">
      {/* Decorative background elements */}
      <div className="fixed top-40 right-20 w-72 h-72 bg-[#FFBF69]/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="fixed bottom-40 left-20 w-96 h-96 bg-[#FF9F1C]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6 border-b border-[#CB997E]/10 bg-white/30 backdrop-blur-sm">
        <Link
          href="/"
          className="flex items-center gap-2 text-[#CB997E] text-sm font-medium hover:text-[#FF9F1C] transition-colors group"
        >
          <Home className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Home
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-sm text-[#CB997E]/70 font-light">
            {text.length} characters
          </span>
        </div>
      </header>

      {/* Writing area */}
      <main className="relative z-10 flex justify-center px-6 py-12 md:py-16">
        <div className="w-full max-w-4xl">
          {/* Date banner */}
          <div className="mb-8 text-center">
            <div className="inline-block px-6 py-3 bg-white/50 backdrop-blur-sm rounded-full border border-[#CB997E]/20">
              <p className="text-base md:text-lg text-[#CB997E] font-light tracking-wide">
                {currentDate}
              </p>
            </div>
          </div>

          {/* Writing card */}
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-[#CB997E]/20 shadow-2xl overflow-hidden">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write freely. No pressure. No rules. Just your thoughts..."
              className="w-full min-h-[65vh] resize-none p-8 md:p-12 text-lg md:text-xl text-[#3A2D28] placeholder:text-[#CB997E]/50 bg-transparent focus:outline-none leading-relaxed"
              style={{ fontFamily: 'inherit' }}
            />

            {/* Action bar */}
            <div className="px-8 md:px-12 py-6 bg-gradient-to-r from-[#FFF5EC] to-[#FFE8D6] border-t border-[#CB997E]/10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  onClick={handleTextToSpeech}
                  disabled={!text.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#CB997E]/40 text-[#CB997E] font-medium hover:bg-[#CB997E]/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Stop Reading
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Read Aloud
                    </>
                  )}
                </button>

                <button
                  onClick={handleSave}
                  disabled={!text.trim()}
                  className="flex items-center gap-2 px-8 py-3 rounded-full bg-[#FF9F1C] text-white font-medium hover:bg-[#FFBF69] transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 group"
                >
                  <Save className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Save Entry
                </button>
              </div>

              {saved && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-[#CB997E] italic animate-pulse">
                    ✓ Entry saved successfully
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Helper text */}
          <div className="mt-8 text-center">
            <p className="text-sm text-[#CB997E]/60 font-light italic">
              Your words are private and secure. Write what's on your mind.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}