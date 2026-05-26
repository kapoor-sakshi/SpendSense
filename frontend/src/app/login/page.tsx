'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Mail, Lock, LogIn, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      if (success) {
        router.push('/dashboard');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch (err: any) {
      setError('Could not connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const success = await login('you@spendsense.ai', 'demo');
      if (success) {
        router.push('/dashboard');
      } else {
        setError('Demo connection failed.');
      }
    } catch (err) {
      setError('Demo login error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col justify-between items-center relative overflow-hidden">
      
      {/* Background Gradients */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-blue-200/15 rounded-full blur-[80px] pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="w-full max-w-7xl px-6 py-6 flex items-center justify-between z-20">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-bold tracking-wider text-slate-900">SPENDSENSE AI</span>
        </Link>
        <Link href="/signup" className="text-xs text-purple-600 hover:text-purple-500 font-semibold transition-colors">
          Create Account →
        </Link>
      </header>

      {/* Login Card Form */}
      <div className="flex-1 w-full max-w-md px-6 flex flex-col justify-center py-12 z-10">
        <div className="p-8 rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-2xl shadow-xl relative">
          
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2 text-slate-900">Welcome Back</h2>
            <p className="text-xs text-slate-500">Sign in to your SpendSense AI account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-purple-500 text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-purple-500/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-purple-500 text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-purple-500/30 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" className="text-[10px] text-slate-500 hover:text-slate-700 transition-colors">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 hover:opacity-95 rounded-xl py-3 text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-purple-600/10 active:scale-95 transition-all disabled:opacity-60"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In to SpendSense
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="border-t border-slate-200 w-full absolute" />
            <span className="bg-white px-3 text-[10px] uppercase tracking-wider text-slate-400 relative z-10 font-medium">or</span>
          </div>

          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full bg-purple-50 border border-purple-200 hover:bg-purple-100/50 text-purple-700 hover:text-purple-800 rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
          >
            <Zap className="w-4 h-4" />
            Try Demo Mode (No Account Needed)
          </button>

          <p className="text-center text-[10px] text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link href="/signup" className="text-purple-600 hover:underline font-semibold">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-[10px] text-slate-400 border-t border-slate-200/80">
        SpendSense AI — Secure financial analytics platform
      </footer>
    </div>
  );
}
