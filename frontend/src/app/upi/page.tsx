'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const UpiPageContent = () => {
  const { user, linkUpiAccount } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/transactions';

  const [upiId, setUpiId] = useState('');
  const [upiBank, setUpiBank] = useState('');
  const [linking, setLinking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linked, setLinked] = useState(false);
  const [redirectSeconds, setRedirectSeconds] = useState(3);
  const defaultUpiBank = user.banks[0]?.bankName || '';

  const proceed = useCallback(() => {
    router.push(nextPath);
  }, [router, nextPath]);

  useEffect(() => {
    if (!linked) return;
    if (redirectSeconds <= 0) {
      proceed();
      return;
    }
    const timer = setTimeout(() => setRedirectSeconds(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [linked, redirectSeconds, proceed]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setLinked(false);

    if (!upiId.trim()) {
      setError('Please enter a valid UPI ID.');
      return;
    }

    const selectedBank = (upiBank || defaultUpiBank).trim();
    if (!selectedBank) {
      setError('Please select a bank to link with your UPI ID.');
      return;
    }

    const trimmedUpi = upiId.trim();

    if (user.linkedUpiIds.includes(trimmedUpi)) {
      setMessage(`${trimmedUpi} is already linked. Continuing to next step...`);
      setLinked(true);
      setRedirectSeconds(2);
      return;
    }

    setLinking(true);
    try {
      await linkUpiAccount(trimmedUpi, selectedBank);
      setMessage(`UPI ${trimmedUpi} linked successfully with ${selectedBank}.`);
      setUpiId('');
      setLinked(true);
      setRedirectSeconds(3);
    } catch (err) {
      console.error(err);
      setError('Unable to link UPI ID. Please try again.');
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8 bg-slate-50">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">UPI Link</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Link a dummy UPI account</h1>
            <p className="mt-2 text-sm text-slate-500">
              Connect a demo UPI ID to your bank, then continue to record payments or import your statement.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-sm font-semibold text-slate-900">Demo UPI examples</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>demo@oksbi</li>
                <li>demo@okhdfc</li>
                <li>yourname@oksbi</li>
                <li>yourname@okhdfc</li>
              </ul>
              <p className="mt-4 text-xs text-slate-500">Any valid-looking UPI handle works in demo mode.</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-sm font-semibold text-slate-900">Current linked UPI IDs</h2>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                {user.linkedUpiIds.length > 0 ? (
                  user.linkedUpiIds.map((id) => (
                    <div key={id} className="rounded-2xl bg-white px-3 py-2 border border-slate-200">{id}</div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-white px-3 py-2 border border-slate-200 text-slate-500">No UPI IDs linked yet.</div>
                )}
              </div>
            </div>
          </div>

          {linked && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-800">UPI linked — you&apos;re all set!</p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Redirecting in {redirectSeconds}s… You can add UPI payments or import a bank statement next.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={proceed}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                    >
                      Continue now <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center rounded-xl border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
                    >
                      Back to Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="upiBank" className="block text-sm font-semibold text-slate-700">Bank</label>
                <select
                  id="upiBank"
                  value={upiBank || defaultUpiBank}
                  onChange={(e) => setUpiBank(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-purple-500"
                >
                  {user.banks.length > 0 ? user.banks.map((bank) => (
                    <option key={bank.bankName} value={bank.bankName}>{bank.bankName}</option>
                  )) : <option value="">No bank accounts available</option>}
                </select>
              </div>

              <div>
                <label htmlFor="upiId" className="block text-sm font-semibold text-slate-700">UPI ID</label>
                <input
                  id="upiId"
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. demo@oksbi"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-purple-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              {message && !linked && (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">{message}</div>
              )}
              {error && (
                <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>
              )}
              <button
                type="submit"
                disabled={linking || user.banks.length === 0}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {linking ? 'Linking UPI...' : 'Link Dummy UPI'}
              </button>

              {user.linkedUpiIds.length > 0 && !linked && (
                <button
                  type="button"
                  onClick={proceed}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl border border-purple-200 bg-white px-5 py-3 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
                >
                  Skip — Continue to Transactions <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const UpiPage = () => (
  <Suspense fallback={
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
      Loading UPI setup...
    </div>
  }>
    <UpiPageContent />
  </Suspense>
);

export default UpiPage;
