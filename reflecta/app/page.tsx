'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
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

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-light tracking-tight text-[#CB997E]">
          Reflecta
        </div>
        <button className="px-6 py-2 text-sm font-medium text-[#CB997E] border border-[#CB997E] rounded-full hover:bg-[#CB997E] hover:text-[#FFE8D6] transition-all duration-300">
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto px-8 pt-24 pb-32">
        {/* Main headline */}
        <div className="space-y-8 mb-20">
          <h1 className="text-7xl md:text-8xl font-light leading-[0.95] tracking-tight text-[#CB997E] max-w-4xl">
            Your emotional
            <br />
            <span className="italic font-light text-[#FF9F1C]">identity</span>
            <br />
            evolves daily
          </h1>
          
          <p className="text-xl md:text-2xl font-light text-[#CB997E]/80 max-w-2xl leading-relaxed">
            Turn private journaling into an intelligent timeline that reveals 
            patterns in how you feel, think, and grow.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 mb-32">
          <button className="group px-8 py-4 bg-[#FF9F1C] text-white rounded-full text-lg font-medium hover:bg-[#FFBF69] transition-all duration-300 hover:shadow-xl hover:scale-105">
            Start Writing Today
            <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
          </button>
          <button className="px-8 py-4 text-[#CB997E] border border-[#CB997E] rounded-full text-lg font-medium hover:bg-[#CB997E]/10 transition-all duration-300">
            How It Works
          </button>
        </div>

        {/* Key Features - Minimalist Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-32">
          <div className="group p-8 bg-white/40 backdrop-blur-sm rounded-3xl border border-[#CB997E]/20 hover:border-[#FF9F1C]/40 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
            <div className="w-12 h-12 mb-6 rounded-full bg-[#FF9F1C]/20 flex items-center justify-center text-2xl">
              ✍️
            </div>
            <h3 className="text-2xl font-light text-[#CB997E] mb-3">
              Write Freely
            </h3>
            <p className="text-[#CB997E]/70 font-light leading-relaxed">
              One daily entry. No pressure. Just you and your thoughts in a calm, private space.
            </p>
          </div>

          <div className="group p-8 bg-white/40 backdrop-blur-sm rounded-3xl border border-[#CB997E]/20 hover:border-[#FF9F1C]/40 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
            <div className="w-12 h-12 mb-6 rounded-full bg-[#FFBF69]/20 flex items-center justify-center text-2xl">
              📊
            </div>
            <h3 className="text-2xl font-light text-[#CB997E] mb-3">
              See Patterns
            </h3>
            <p className="text-[#CB997E]/70 font-light leading-relaxed">
              AI extracts emotional signals and creates your personal mental health timeline.
            </p>
          </div>

          <div className="group p-8 bg-white/40 backdrop-blur-sm rounded-3xl border border-[#CB997E]/20 hover:border-[#FF9F1C]/40 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
            <div className="w-12 h-12 mb-6 rounded-full bg-[#CB997E]/20 flex items-center justify-center text-2xl">
              🔒
            </div>
            <h3 className="text-2xl font-light text-[#CB997E] mb-3">
              Stay Private
            </h3>
            <p className="text-[#CB997E]/70 font-light leading-relaxed">
              Your data stays yours. Delete anytime. No diagnosis, just awareness.
            </p>
          </div>
        </div>

        {/* Visual Timeline Concept */}
        <div className="relative">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-light text-[#CB997E] mb-4">
              Identity over time
            </h2>
            <p className="text-xl text-[#CB997E]/70 font-light">
              Not a static snapshot. A living story.
            </p>
          </div>

          {/* Timeline visualization */}
          <div className="relative h-64 bg-white/30 backdrop-blur-sm rounded-3xl border border-[#CB997E]/20 p-8 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-end gap-2 h-32">
                {[45, 52, 48, 65, 58, 72, 68, 75, 70, 82, 78, 85, 80, 72, 68].map((height, i) => (
                  <div
                    key={i}
                    className="w-8 bg-gradient-to-t from-[#FF9F1C] to-[#FFBF69] rounded-t-lg transition-all duration-500 hover:scale-110"
                    style={{
                      height: `${height}%`,
                      opacity: 0.7 + (i * 0.02),
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-32 text-center">
          <p className="text-lg text-[#CB997E]/60 font-light mb-6 italic">
            People may not talk — but they will write.
          </p>
          <button className="px-10 py-5 bg-[#CB997E] text-white rounded-full text-lg font-medium hover:bg-[#FF9F1C] transition-all duration-300 hover:shadow-xl hover:scale-105">
            Begin Your Journey
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#CB997E]/20 mt-32">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm text-[#CB997E]/60 font-light">
              © 2025 Reflecta. Your data, your control.
            </div>
            <div className="flex gap-8 text-sm text-[#CB997E]/60 font-light">
              <a href="#" className="hover:text-[#FF9F1C] transition-colors">Privacy</a>
              <a href="#" className="hover:text-[#FF9F1C] transition-colors">Ethics</a>
              <a href="#" className="hover:text-[#FF9F1C] transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}