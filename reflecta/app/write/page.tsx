"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Mic, MicOff, Save, Home } from "lucide-react";

export default function WritePage() {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true);
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setText((prev) => prev + finalTranscript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
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

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleRecording = () => {
    if (!isSupported) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
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
          <Home className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Home
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-sm text-[#CB997E] font-bold">
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
              <p className="text-base md:text-lg text-[#CB997E] font-bold tracking-wide">
                {currentDate}
              </p>
            </div>
          </div>

          {/* Writing card */}
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-[#CB997E]/20 shadow-2xl overflow-hidden">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write freely or click the microphone to speak your thoughts..."
              className="w-full min-h-[65vh] resize-none p-8 md:p-12 text-lg md:text-xl text-[#CB997E] placeholder:text-[#CB997E]/50 bg-transparent focus:outline-none leading-relaxed"
              style={{ fontFamily: 'inherit' }}
            />

            {/* Action bar */}
            <div className="px-8 md:px-12 py-6 bg-gradient-to-r from-[#FFF5EC] to-[#FFE8D6] border-t border-[#CB997E]/10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  onClick={toggleRecording}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all group ${
                    isRecording
                      ? 'bg-red-500 text-white shadow-lg animate-pulse'
                      : 'border border-[#CB997E]/40 text-[#CB997E] hover:bg-[#CB997E]/10'
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