'use client';

import { useState, useEffect } from 'react';
import { PenLine, TrendingUp, Lock, ArrowRight, Sparkles } from 'lucide-react';
import Link from "next/link";
import { supabase } from "../lib/supabase-browser";

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [currentYear, setCurrentYear] = useState(2026);
  const [isVisible, setIsVisible] = useState(false);
  const [userLabel, setUserLabel] = useState<string | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    setIsVisible(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!isMounted) return;
      if (user) {
        const fallback = user.email ? user.email.split("@")[0] : "Account";
        const label =
          (user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          fallback;
        setUserLabel(label);
      } else {
        setUserLabel(null);
      }
    };
    loadUser();
    const { data: authListener } = supabase?.auth.onAuthStateChange(() => {
      loadUser();
    }) ?? { data: { subscription: null } };
    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUserLabel(null);
  };

  return (
    <div className="min-h-screen bg-[#FFE8D6] overflow-hidden">
      {/* Animated background gradient */}
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${50 + scrollY * 0.05}% ${50 - scrollY * 0.03}%, #FF9F1C 0%, transparent 50%)`,
          transition: 'background 0.3s ease-out'
        }}
      />

      {/* Decorative circles */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-[#FFBF69]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-20 left-20 w-80 h-80 bg-[#FF9F1C]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation */}
      <nav className={`relative z-10 flex items-center justify-between px-6 md:px-12 py-8 max-w-7xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#FF9F1C]" strokeWidth={1.5} />
          <span className="text-2xl font-light tracking-tight text-[#CB997E]">
            Reflecta
          </span>
        </div>
        {userLabel ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[#CB997E]">
              {userLabel}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-[#CB997E]/70 hover:text-[#CB997E]"
            >
              Log out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-6 py-2.5 text-sm font-medium text-[#CB997E] border border-[#CB997E]/40 rounded-full hover:bg-[#CB997E] hover:text-[#FFE8D6] transition-all duration-300 hover:border-[#CB997E]"
          >
            Sign In
          </Link>
        )}
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 pt-16 md:pt-32 pb-32">
        {/* Main headline */}
        <div className="space-y-10 mb-24">
          {/* Badge - Animated from left */}
          <div className={`inline-block transition-all duration-1000 delay-100 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-sm rounded-full border border-[#FF9F1C]/30 mb-8">
              <div className="w-2 h-2 bg-[#FF9F1C] rounded-full animate-pulse" />
              <span className="text-sm font-medium text-[#CB997E]">AI-Powered Mental Health Timeline</span>
            </div>
          </div>
          
          {/* Main Headline - Animated from left */}
          <h1 className={`text-6xl md:text-8xl lg:text-9xl font-light leading-[0.95] tracking-tight text-[#CB997E] max-w-5xl transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            Your emotional
            <br />
            <span className="italic font-light text-[#FF9F1C] relative">
              identity
              <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 400 12" fill="none">
                <path d="M2 10C80 3 320 3 398 10" stroke="#FF9F1C" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
              </svg>
            </span>
            <br />
            evolves daily
          </h1>
          
          {/* Subheadline - Animated from left */}
          <p className={`text-xl md:text-2xl font-light text-[#CB997E]/80 max-w-2xl leading-relaxed transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            Turn private journaling into an intelligent timeline that reveals 
            patterns in how you feel, think, and grow.
          </p>
        </div>

        {/* CTA - Animated from left */}
        <div className={`flex justify-start mb-40 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
          <Link href="/write" className="group px-8 py-5 bg-[#FF9F1C] text-white rounded-full text-lg font-medium hover:bg-[#FFBF69] transition-all duration-300 hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-2">
            Start Writing Today
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" strokeWidth={2} />
          </Link>
        </div>

        {/* Key Features - Cards with NO hover effects */}
        <div className="grid md:grid-cols-3 gap-6 mb-40">
          {/* Card 1 - No hover */}
          <div className={`relative p-10 bg-white/50 backdrop-blur-md rounded-3xl border border-[#CB997E]/20 shadow-xl transition-all duration-1000 delay-[900ms] ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <div className="relative">
              <div className="w-14 h-14 mb-8 rounded-2xl bg-gradient-to-br from-[#FF9F1C]/20 to-[#FFBF69]/20 flex items-center justify-center">
                <PenLine className="w-7 h-7 text-[#FF9F1C]" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-light text-[#CB997E] mb-4">
                Write Freely
              </h3>
              <p className="text-[#CB997E]/70 font-light leading-relaxed">
                One daily entry. No pressure. Just you and your thoughts in a calm, private space.
              </p>
            </div>
          </div>

          {/* Card 2 - No hover */}
          <div className={`relative p-10 bg-white/50 backdrop-blur-md rounded-3xl border border-[#CB997E]/20 shadow-xl transition-all duration-1000 delay-[1050ms] ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <div className="relative">
              <div className="w-14 h-14 mb-8 rounded-2xl bg-gradient-to-br from-[#FFBF69]/20 to-[#FF9F1C]/20 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-[#FFBF69]" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-light text-[#CB997E] mb-4">
                See Patterns
              </h3>
              <p className="text-[#CB997E]/70 font-light leading-relaxed">
                AI extracts emotional signals and creates your personal mental health timeline.
              </p>
            </div>
          </div>

          {/* Card 3 - No hover */}
          <div className={`relative p-10 bg-white/50 backdrop-blur-md rounded-3xl border border-[#CB997E]/20 shadow-xl transition-all duration-1000 delay-[1200ms] ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <div className="relative">
              <div className="w-14 h-14 mb-8 rounded-2xl bg-gradient-to-br from-[#CB997E]/20 to-[#FF9F1C]/20 flex items-center justify-center">
                <Lock className="w-7 h-7 text-[#CB997E]" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-light text-[#CB997E] mb-4">
                Stay Private
              </h3>
              <p className="text-[#CB997E]/70 font-light leading-relaxed">
                Your data stays yours. Delete anytime. No diagnosis, just awareness.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA - Animated from left */}
        <div className={`text-center transition-all duration-1000 delay-[1400ms] ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
          <div className="inline-block mb-8 px-6 py-3 bg-white/40 backdrop-blur-sm rounded-full border border-[#CB997E]/20">
            <p className="text-lg text-[#CB997E]/80 font-light italic">
              People may not talk — but they will write.
            </p>
          </div>
          <div>
            <Link href="/write" className="group px-12 py-6 bg-[#FF9F1C] text-white rounded-full text-lg font-medium hover:bg-[#FFBF69] transition-all duration-300 hover:shadow-2xl hover:scale-105 inline-flex items-center gap-3">
              Begin Your Journey
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#CB997E]/20 bg-white/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm text-[#CB997E]/60 font-light">
              © {currentYear} Reflecta. Your data, your control.
            </div>
            <div className="flex gap-8 text-sm text-[#CB997E]/60 font-light">
              <a href="#" className="hover:text-[#FF9F1C] transition-colors duration-300">Privacy</a>
              <a href="#" className="hover:text-[#FF9F1C] transition-colors duration-300">Ethics</a>
              <a href="#" className="hover:text-[#FF9F1C] transition-colors duration-300">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}