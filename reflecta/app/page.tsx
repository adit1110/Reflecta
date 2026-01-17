'use client';

import { useState, useEffect } from 'react';
import { PenLine, TrendingUp, Lock, ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [currentYear, setCurrentYear] = useState(2026);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#FF9F1C]" strokeWidth={1.5} />
          <span className="text-2xl font-light tracking-tight text-[#CB997E]">
            Reflecta
          </span>
        </div>
        <button className="px-6 py-2.5 text-sm font-medium text-[#CB997E] border border-[#CB997E]/40 rounded-full hover:bg-[#CB997E] hover:text-[#FFE8D6] transition-all duration-300 hover:border-[#CB997E]">
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 pt-16 md:pt-32 pb-32">
        {/* Main headline */}
        <div className="space-y-10 mb-24">
          <div className="inline-block">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-sm rounded-full border border-[#FF9F1C]/30 mb-8">
              <div className="w-2 h-2 bg-[#FF9F1C] rounded-full animate-pulse" />
              <span className="text-sm font-medium text-[#CB997E]">AI-Powered Mental Health Timeline</span>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-light leading-[0.95] tracking-tight text-[#CB997E] max-w-5xl">
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
          
          <p className="text-xl md:text-2xl font-light text-[#CB997E]/80 max-w-2xl leading-relaxed">
            Turn private journaling into an intelligent timeline that reveals 
            patterns in how you feel, think, and grow.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 mb-40">
          <button className="group px-8 py-5 bg-[#FF9F1C] text-white rounded-full text-lg font-medium hover:bg-[#FFBF69] transition-all duration-300 hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-2">
            Start Writing Today
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" strokeWidth={2} />
          </button>
          <button className="px-8 py-5 text-[#CB997E] border border-[#CB997E]/40 rounded-full text-lg font-medium hover:bg-[#CB997E]/10 hover:border-[#CB997E] transition-all duration-300">
            How It Works
          </button>
        </div>

        {/* Key Features - Enhanced Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-40">
          <div className="group relative p-10 bg-white/50 backdrop-blur-md rounded-3xl border border-[#CB997E]/20 hover:border-[#FF9F1C]/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FF9F1C]/10 to-transparent rounded-full blur-2xl group-hover:opacity-100 opacity-0 transition-opacity duration-500" />
            <div className="relative">
              <div className="w-14 h-14 mb-8 rounded-2xl bg-gradient-to-br from-[#FF9F1C]/20 to-[#FFBF69]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
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

          <div className="group relative p-10 bg-white/50 backdrop-blur-md rounded-3xl border border-[#CB997E]/20 hover:border-[#FF9F1C]/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FFBF69]/10 to-transparent rounded-full blur-2xl group-hover:opacity-100 opacity-0 transition-opacity duration-500" />
            <div className="relative">
              <div className="w-14 h-14 mb-8 rounded-2xl bg-gradient-to-br from-[#FFBF69]/20 to-[#FF9F1C]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
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

          <div className="group relative p-10 bg-white/50 backdrop-blur-md rounded-3xl border border-[#CB997E]/20 hover:border-[#FF9F1C]/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#CB997E]/10 to-transparent rounded-full blur-2xl group-hover:opacity-100 opacity-0 transition-opacity duration-500" />
            <div className="relative">
              <div className="w-14 h-14 mb-8 rounded-2xl bg-gradient-to-br from-[#CB997E]/20 to-[#FF9F1C]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
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

        {/* Visual Timeline Concept */}
        <div className="relative mb-40">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-light text-[#CB997E] mb-6">
              Identity over time
            </h2>
            <p className="text-xl text-[#CB997E]/70 font-light">
              Not a static snapshot. A living story.
            </p>
          </div>

          {/* Enhanced Timeline visualization */}
          <div className="relative h-80 bg-white/40 backdrop-blur-md rounded-3xl border border-[#CB997E]/20 p-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-[#FFE8D6]/50 to-transparent" />
            <div className="relative h-full flex items-end justify-center gap-3">
              {[45, 52, 48, 65, 58, 72, 68, 75, 70, 82, 78, 85, 80, 72, 68].map((height, i) => (
                <div
                  key={i}
                  className="group relative w-10 bg-gradient-to-t from-[#FF9F1C] to-[#FFBF69] rounded-t-xl transition-all duration-500 hover:from-[#FFBF69] hover:to-[#FF9F1C] cursor-pointer"
                  style={{
                    height: `${height}%`,
                    opacity: 0.6 + (i * 0.027),
                    animationDelay: `${i * 0.05}s`,
                    boxShadow: '0 -4px 12px rgba(255, 159, 28, 0.2)'
                  }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[#CB997E] text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    Day {i + 1}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Timeline axis */}
            <div className="absolute bottom-8 left-12 right-12 h-px bg-[#CB997E]/20" />
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="inline-block mb-8 px-6 py-3 bg-white/40 backdrop-blur-sm rounded-full border border-[#CB997E]/20">
            <p className="text-lg text-[#CB997E]/80 font-light italic">
              People may not talk — but they will write.
            </p>
          </div>
          <div>
            <button className="group px-12 py-6 bg-[#CB997E] text-white rounded-full text-lg font-medium hover:bg-[#FF9F1C] transition-all duration-300 hover:shadow-2xl hover:scale-105 inline-flex items-center gap-3">
              Begin Your Journey
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" strokeWidth={2} />
            </button>
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