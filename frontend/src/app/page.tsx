'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  TrendingUp, 
  Scan, 
  ShieldCheck, 
  MessageSquare, 
  ArrowRight, 
  Cpu, 
  Activity, 
  Zap 
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#F8FAFC] text-slate-800 flex flex-col justify-between">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-purple-200/20 via-transparent to-transparent blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-blue-200/10 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse" />
      
      {/* Top Navbar */}
      <header className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-200 z-20">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-md font-bold tracking-wider font-sans text-slate-900">SPENDSENSE AI</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="text-xs text-slate-500 hover:text-slate-900 transition-colors px-4 py-2 font-semibold"
          >
            Sign In
          </Link>
          <Link 
            href="/signup" 
            className="text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-all px-5 py-2 rounded-lg"
          >
            Launch Platform
          </Link>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-20 flex flex-col items-center justify-center text-center z-10">
        

        {/* Hero Title */}
        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight mb-6 text-slate-900">
          The Future of <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-indigo-655 to-blue-600">Intelligent Wealth</span> is Here.
        </h1>

        {/* Hero Description */}
        <p className="text-slate-500 text-sm md:text-lg max-w-2xl leading-relaxed mb-10 font-medium">
          SpendSense AI is a premium, automated, and secure personal finance ecosystem. 
          Scan receipts, track portfolios, analyze insurance coverage, and let our 
          Gemini LLM model build your future wealth trajectory.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link 
            href="/signup" 
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 text-white font-semibold px-8 py-4 rounded-xl shadow-md shadow-purple-600/10 hover:shadow-purple-600/20 hover:scale-105 active:scale-97 transition-all text-sm cursor-pointer"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center bg-slate-50 border border-slate-200 hover:bg-slate-100/80 text-slate-700 hover:text-slate-900 font-semibold px-8 py-4 rounded-xl transition-all text-sm cursor-pointer shadow-sm"
          >
            Sign In with Demo Account
          </Link>
        </div>

        {/* Platform Stat Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl p-6 rounded-2xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur-xl">
          {[
            { label: 'Total Volume Tracked', val: '₹4.8Cr+' },
            { label: 'OCR Read Confidence', val: '98.4%' },
            { label: 'Active Subscriptions Sync', val: '24/7' },
            { label: 'Credit Score Boost Avg', val: '+45 Pts' }
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <h4 className="text-xl md:text-2xl font-extrabold text-slate-800">{stat.val}</h4>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 font-semibold">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Grid Features Details */}
        <div className="mt-32 w-full max-w-6xl">
          <h2 className="text-2xl md:text-4xl font-extrabold mb-4 text-slate-900">Master Your Financial Universe</h2>
          <p className="text-slate-500 text-xs md:text-sm mb-16 max-w-xl mx-auto font-medium">One unified dashboard integrating bank feeds, investments, OCR, and AI insights.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              {
                title: 'Automated Receipt Scanning',
                desc: 'Upload JPEG, PNG or PDF receipts. Our client-side OCR parses merchant details, amounts, dates, and suggests classifications instantly.',
                icon: Scan,
                color: 'text-purple-650 bg-purple-50'
              },
              {
                title: 'Simulated UPI timeline',
                desc: 'Link multiple banks (HDFC, SBI, Axis) and mock UPI IDs. Analyze combined transaction statements and heatmap graphs.',
                icon: Activity,
                color: 'text-blue-650 bg-blue-50'
              },
              {
                title: 'Groww stock portfolio integration',
                desc: 'Sync stocks, track daily profit/loss yields, and query market behavior insights driven by live generative models.',
                icon: TrendingUp,
                color: 'text-emerald-650 bg-emerald-50'
              },
              {
                title: 'Subscriptions Waste Alert',
                desc: 'Audit recurring streaming (Netflix, Spotify) and broadband renewals. Flag low-use services to stop money waste.',
                icon: Zap,
                color: 'text-amber-650 bg-amber-50'
              },
              {
                title: 'Loans & EMI trackers',
                desc: 'Track Car, Education, or Home loans. Run interest calculations and get custom debt-reduction options.',
                icon: ShieldCheck,
                color: 'text-rose-650 bg-rose-50'
              },
              {
                title: 'Generative AI Advisor Chatbot',
                desc: 'Talk directly to an integrated financial bot. Query details like: "Which EMI is affecting me most?" or "How can I save ₹10K?"',
                icon: MessageSquare,
                color: 'text-indigo-655 bg-indigo-50'
              }
            ].map((feat, index) => {
              const Icon = feat.icon;
              return (
                <div key={index} className="p-6 rounded-2xl border border-slate-200 bg-white/70 shadow-sm hover:border-slate-300 transition-all">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${feat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-md font-bold text-slate-800 mb-2">{feat.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed font-medium">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer banner */}
      <footer className="w-full border-t border-slate-200 py-8 text-center text-xs text-slate-500 bg-slate-100/50">
        <p>© 2026 SpendSense AI. Built for college project presentations and premium investor demonstrations. All rights reserved.</p>
      </footer>
    </div>
  );
}
