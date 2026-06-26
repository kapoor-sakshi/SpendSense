'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, User, Mail, Lock, ShieldAlert, ArrowRight, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useApp();
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Form, Step 2: OTP
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['1', '2', '3', '4']); // default verification code hint
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    
    // Simulate sending OTP SMS/Email and open verification
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1000);
  };

  const handleOtpChange = (index: number, val: string) => {
    if (isNaN(Number(val))) return;
    const newOtp = [...otp];
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);

    // Auto-focus next field
    if (val && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length < 4) {
      setError('Please enter the full 4-digit code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await signup(name, email, password);
      if (success) {
        router.push('/dashboard');
      } else {
        setError('Registration failed. Email address may already be registered.');
      }
    } catch (err: any) {
      setError('Could not connect to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col justify-between items-center relative overflow-hidden">
      
      {/* Background Gradients */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse" />

      {/* Top Navbar */}
      <header className="w-full max-w-7xl px-6 py-6 flex items-center justify-between border-b border-slate-200 z-20">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-bold tracking-wider text-slate-900">SPENDSENSE AI</span>
        </Link>
        <Link href="/login" className="text-xs text-purple-600 hover:text-purple-500 font-semibold transition-colors">
          Already registered? Log In
        </Link>
      </header>

      {/* Auth Card */}
      <div className="flex-1 w-full max-w-md px-6 flex flex-col justify-center py-12 z-10">
        <div className="p-8 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-2xl shadow-xl relative">
          
          {/* Progress Indicators */}
          <div className="flex gap-2 mb-6">
            <span className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-purple-600' : 'bg-slate-200'}`} />
            <span className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-purple-600' : 'bg-slate-200'}`} />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs text-center font-medium">
              {error}
            </div>
          )}

          {step === 1 ? (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold tracking-tight mb-2 text-slate-900">Create Account</h2>
                <p className="text-xs text-slate-500">Sign up in seconds to link accounts and scan receipts</p>
              </div>

              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-purple-500 text-slate-800 placeholder-slate-450 focus:ring-1 focus:ring-purple-500/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-purple-500 text-slate-800 placeholder-slate-450 focus:ring-1 focus:ring-purple-500/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">Secure Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-purple-500 text-slate-800 placeholder-slate-450 focus:ring-1 focus:ring-purple-500/30"
                    />
                  </div>
                </div>

                <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl flex gap-2 text-[10px] text-purple-700 font-semibold">
                  <ShieldAlert className="w-4 h-4 text-purple-650 shrink-0" />
                  We securely hash your credentials. We never store raw banking credentials.
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 hover:opacity-95 rounded-xl py-3 text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-purple-600/10 active:scale-95"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Register & Request OTP
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold tracking-tight mb-2 text-slate-900">Verification</h2>
                <p className="text-xs text-slate-500">We sent a 4-digit code to {email || 'your email'}</p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="flex justify-center gap-3">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      className="w-12 h-14 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-xl text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                  ))}
                </div>

                <div className="text-center">
                  <p className="text-[10px] text-slate-500">
                    Didn't receive verification?{' '}
                    <button 
                      type="button" 
                      onClick={() => setOtp(['1', '2', '3', '4'])}
                      className="text-purple-650 hover:underline cursor-pointer font-bold"
                    >
                      Resend SMS Code
                    </button>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-cyan-500 hover:opacity-95 rounded-xl py-3 text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-emerald-600/10 active:scale-95"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Verify OTP Code
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-[10px] text-slate-500 bg-slate-100/50 border-t border-slate-200">
        By continuing, you agree to SpendSense AI simulated terms of use.
      </footer>
    </div>
  );
}
