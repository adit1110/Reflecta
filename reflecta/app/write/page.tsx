"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Mic, MicOff, Save, Home, Sparkles } from "lucide-react";
import { supabase } from "../../lib/supabase-browser";

export default function WritePage() {
  const [text, setText] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasJustSaved, setHasJustSaved] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true);
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + " ";
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setText((prev) => prev + finalTranscript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const getLocalISODate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const loadTodayEntry = async (currentUserId: string) => {
    const today = getLocalISODate();
    const { data, error } = await supabase!
      .from("journals")
      .select("id, content")
      .eq("user_id", currentUserId)
      .eq("entry_date", today)
      .maybeSingle();

    if (error) {
      console.error("Failed to load journal entry:", error);
      return;
    }

    if (data?.content) {
      setEntryId(data.id);
      setText(data.content);
      setIsSubmitted(true);
      setStatusMessage("Submitted. This entry is read-only.");
    }
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      if (!supabase) {
        setStatusMessage("App misconfigured. Missing Supabase keys.");
        return;
      }
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      const user = data.user;
      if (!user) {
        setUserId(null);
        setStatusMessage("Please log in to save your journal.");
        return;
      }
      setUserId(user.id);
      setStatusMessage(null);
      await loadTodayEntry(user.id);
    };
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    if (!supabase) {
      setStatusMessage("App misconfigured. Missing Supabase keys.");
      return;
    }
    if (!userId) {
      setStatusMessage("Please log in to save your journal.");
      return;
    }
    if (isSubmitted || entryId) {
      setStatusMessage("Submitted. This entry is read-only.");
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) {
      setStatusMessage("Write something before saving.");
      return;
    }
    setIsSaving(true);
    setStatusMessage(null);
    const today = getLocalISODate();
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        setStatusMessage("Please log in to save your journal.");
        return;
      }

      const response = await fetch("/api/journals/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ content: trimmed, entry_date: today }),
      });

      if (response.status === 409) {
        setStatusMessage("You've already written today's entry.");
        return;
      }

      if (!response.ok) {
        setStatusMessage("Something went wrong. Please try again.");
        return;
      }

      const payload = (await response.json()) as { journal_id?: string };
      setEntryId(payload.journal_id ?? null);
      setText(trimmed);
      setIsSubmitted(true);
      setStatusMessage("Submitted.");
    } catch {
      setStatusMessage("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRecording = () => {
    if (isSubmitted) {
      setStatusMessage("Submitted. This entry is read-only.");
      return;
    }
    if (!isSupported) {
      setStatusMessage(
        "Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari.",
      );
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
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
          className="flex items-center gap-2 text-[#CB997E] text-sm font-bold hover:text-[#FF9F1C] transition-colors group"
        >
          <Home className="w-4 h-4 transition-colors" />
          Home
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-sm text-[#CB997E] font-bold">
            {text.length} characters
          </span>
          <Link
            href="/reflection"
            className="px-6 py-2.5 text-sm font-medium text-[#FF9F1C] border border-[#FF9F1C]/40 rounded-full hover:bg-[#FF9F1C] hover:text-white transition-all duration-300 hover:border-[#FF9F1C]"
          >
            Reflection
          </Link>
        </div>
      </header>

      {/* Writing area */}
      <main className="relative z-10 flex justify-center px-6 py-12 md:py-16">
        <div className="w-full max-w-4xl">
          {/* Date banner */}
          <div className="mb-8 text-center">
            <div className="inline-block px-6 py-3 bg-white/50 backdrop-blur-sm rounded-full border border-[#CB997E]/20">
              <p className="text-base md:text-lg text-[#CB997E] font-bold tracking-wide">
                {currentDate}
              </p>
            </div>
          </div>

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

              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (hasJustSaved) setHasJustSaved(false);
                }}
                placeholder="Write freely or click the microphone to speak your thoughts..."
                className="w-full min-h-[65vh] resize-none p-8 md:p-12 pl-8 text-lg md:text-xl text-[#CB997E] placeholder:text-[#CB997E]/40 bg-transparent focus:outline-none leading-[2.5rem] relative z-20"
                style={{
                  fontFamily: 'inherit',
                  backgroundImage: `repeating-linear-gradient(
                    transparent,
                    transparent 2.4rem,
                    #CB997E15 2.4rem,
                    #CB997E15 2.5rem
                  )`,
                  backgroundAttachment: 'local',
                }}
              />
            </div>

            {/* Action bar */}
            <div className="px-8 md:px-12 py-6 bg-gradient-to-r from-[#FFF5EC] to-[#FFE8D6] border-t border-[#CB997E]/10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  onClick={toggleRecording}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all group ${
                    isRecording
                      ? "bg-red-500 text-white shadow-lg animate-pulse"
                      : "border border-[#CB997E]/40 text-[#CB997E] hover:bg-[#CB997E]/10"
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Voice Input
                    </>
                  )}
                </button>

                <button
                  onClick={handleSave}
                  disabled={!text.trim() || isSaving || !userId || isSubmitted}
                  className="flex items-center gap-2 px-8 py-3 rounded-full bg-[#FF9F1C] text-white font-medium hover:bg-[#FFBF69] transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 group"
                >
                  <Save className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  {isSubmitted ? "Submitted" : isSaving ? "Submitting..." : "Submit"}
                </button>
              </div>

              {statusMessage && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-[#CB997E] italic">
                    {statusMessage}
                  </p>
                </div>
              )}

              {hasJustSaved && (
                <div className="mt-4 text-center">
                  <Link
                    href="/reflection"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#CB997E] text-white font-medium hover:bg-[#FF9F1C] transition-all shadow-lg hover:shadow-xl hover:scale-105 group"
                  >
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    View Your Reflection
                  </Link>
                </div>
              )}

              {isRecording && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-red-500 italic flex items-center justify-center gap-2">
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                    Listening... Speak now
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Helper text */}
          <div className="mt-8 text-center">
            <p className="text-sm text-[#CB997E]/60 font-light italic">
              {isSupported
                ? "Your words are private and secure. Write or speak what's on your mind."
                : "Your words are private and secure. Write what's on your mind."}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}