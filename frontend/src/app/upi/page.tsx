'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const UpiPage = () => {
  const { user, linkUpiAccount } = useApp();
  const [upiId, setUpiId] = useState('');
  const [upiBank, setUpiBank] = useState('');
  const [linking, setLinking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const defaultUpiBank = user.banks[0]?.bankName || '';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!upiId.trim()) {
      setError('Please enter a valid UPI ID.');
      return;
    }

    const selectedBank = (upiBank || defaultUpiBank).trim();
    if (!selectedBank) {
      setError('Please select a bank to link with your UPI ID.');
      return;
    }

    setLinking(true);
    try {
      await linkUpiAccount(upiId.trim(), selectedBank);
      setMessage(`Dummy UPI ${upiId.trim()} linked successfully with ${selectedBank}.`);
      setUpiId('');
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
            <p className="mt-2 text-sm text-slate-500">Use the form below to add a demo UPI ID and connect it to one of your existing bank accounts.</p>
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
              <p className="mt-4 text-xs text-slate-500">The app seeds dummy UPI accounts and will accept any valid-looking UPI handle in demo mode.</p>
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
              {message && <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">{message}</div>}
              {error && <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>}
              <button
                type="submit"
                disabled={linking || user.banks.length === 0}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {linking ? 'Linking UPI...' : 'Link Dummy UPI'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpiPage;
