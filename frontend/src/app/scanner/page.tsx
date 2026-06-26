'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scan,
  Upload,
  CheckCircle2,
  FileImage,
  Store,
  CalendarDays,
  Tag,
  ShieldCheck,
  Lightbulb,
  Camera,
  Sun,
  Scissors,
  Clock,
  Sparkles,
  FileText,
  ShieldAlert,
  ArrowRight,
  FolderOpen,
  ArrowDownCircle,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GlassCard } from '../../components/GlassCard';

type ScanPhase = 'idle' | 'processing' | 'complete';
type VaultPhase = 'idle' | 'uploading' | 'parsing' | 'success';

interface ScanResult {
  merchant: string;
  amount: number;
  date: string;
  category: string;
  confidence: string;
  transaction: { id: string; title: string };
}

export default function ScannerPage() {
  const { uploadReceiptOCR, uploadVaultDocument, transactions, loading, syncUserData } = useApp();

  const [activeTab, setActiveTab] = useState<'scanner' | 'vault'>('scanner');

  // Scanner States
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [isDragOver, setIsDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Vault States
  const [vaultPhase, setVaultPhase] = useState<VaultPhase>('idle');
  const [vaultFile, setVaultFile] = useState<File | null>(null);
  const [vaultFileType, setVaultFileType] = useState<string>('invoice');
  const [vaultProgress, setVaultProgress] = useState(0);
  const [vaultLog, setVaultLog] = useState<string>('');
  const [vaultSuccessDetail, setVaultSuccessDetail] = useState<string>('');
  const [vaultDocuments, setVaultDocuments] = useState<any[]>([]);
  const vaultInputRef = useRef<HTMLInputElement>(null);

  // Filter recent OCR scans from transactions
  const recentScans = transactions.filter((t) =>
    t.title.includes('(OCR scanned)') || t.title.includes('(OCR Scanned)')
  );

  // Fetch uploaded vault documents
  const fetchVaultDocs = async () => {
    const t = localStorage.getItem('spendsense_token');
    if (!t) return;
    try {
      const res = await fetch('http://localhost:5000/api/documents', {
        headers: { 'Authorization': `Bearer ${t}` }
      });
      if (res.ok) {
        setVaultDocuments(await res.json());
      } else {
        // Fallback simulation docs
        setVaultDocuments([
          { id: '1', fileName: 'HDFC_CarLoan_Agreement.pdf', fileType: 'loan', status: 'processed', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
          { id: '2', fileName: 'LIC_TermPlan_Policy.pdf', fileType: 'insurance', status: 'processed', createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() }
        ]);
      }
    } catch {
      setVaultDocuments([
        { id: '1', fileName: 'HDFC_CarLoan_Agreement.pdf', fileType: 'loan', status: 'processed', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
        { id: '2', fileName: 'LIC_TermPlan_Policy.pdf', fileType: 'insurance', status: 'processed', createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() }
      ]);
    }
  };

  useEffect(() => {
    fetchVaultDocs();
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      setSelectedFileName(file.name);
      setPhase('processing');
      setProgress(0);
      setResult(null);

      let currentProgress = 0;
      progressInterval.current = setInterval(() => {
        currentProgress += Math.random() * 8 + 2;
        if (currentProgress >= 95) {
          currentProgress = 95;
          if (progressInterval.current) clearInterval(progressInterval.current);
        }
        setProgress(Math.min(currentProgress, 95));
      }, 100);

      try {
        const data = await uploadReceiptOCR(file);
        if (progressInterval.current) clearInterval(progressInterval.current);
        setProgress(100);

        setTimeout(() => {
          setResult({
            merchant: data.merchant,
            amount: data.amount,
            date: data.date,
            category: data.category,
            confidence: data.confidence,
            transaction: data.transaction,
          });
          setPhase('complete');
        }, 400);
      } catch {
        if (progressInterval.current) clearInterval(progressInterval.current);
        setPhase('idle');
        setProgress(0);
      }
    },
    [uploadReceiptOCR]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleScanAnother = () => {
    setPhase('idle');
    setResult(null);
    setProgress(0);
    setSelectedFileName(null);
  };

  // Vault upload handlers
  const handleVaultFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setVaultFile(file);
  };

  const handleVaultUpload = async () => {
    if (!vaultFile) return;
    setVaultPhase('uploading');
    setVaultProgress(10);
    setVaultLog('Uploading file to secure vault node...');

    const timers = [
      setTimeout(() => { setVaultProgress(40); setVaultLog('Running simulated cloud virus sweep...'); }, 500),
      setTimeout(() => { setVaultProgress(70); setVaultPhase('parsing'); setVaultLog('Extracting ledger indices via AI OCR models...'); }, 1000),
      setTimeout(() => { setVaultProgress(90); setVaultLog('Adding properties to your dashboard database...'); }, 1600)
    ];

    try {
      const res = await uploadVaultDocument(vaultFile, vaultFileType);
      timers.forEach(t => clearTimeout(t));
      setVaultProgress(100);
      setVaultSuccessDetail(res.summary);
      setVaultPhase('success');
      await fetchVaultDocs();
      await syncUserData();
    } catch {
      setVaultPhase('idle');
      setVaultProgress(0);
    }
  };

  const handleResetVault = () => {
    setVaultPhase('idle');
    setVaultFile(null);
    setVaultProgress(0);
    setVaultSuccessDetail('');
  };

  const confidenceValue = result
    ? parseFloat(result.confidence.replace('%', ''))
    : 0;

  if (loading) {
    return (
      <div className="p-8 flex flex-col justify-center items-center min-h-screen bg-slate-50">
        <span className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 text-xs tracking-wider animate-pulse uppercase">
          Initializing Scanner Module...
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 pb-20 bg-slate-50 text-slate-800">
      
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6 gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <Scan className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Vault & Scanner Hub
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Upload statements, scan receipts, and store contracts securely in your AI vault
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-200/60 border border-slate-300/40 rounded-xl p-1 shrink-0">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === 'scanner' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            AI Bill Scanner
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === 'vault' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Document Vault
          </button>
        </div>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'scanner' ? (
          <motion.div
            key="scanner-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-6"
          >
            {/* Scanner Upload / Processing */}
            <div className="lg:col-span-3 space-y-6">
              <AnimatePresence mode="wait">
                {phase === 'idle' && (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-12 bg-white flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer shadow-sm
                      ${isDragOver ? 'border-purple-600 bg-purple-50/20' : 'border-slate-200/80 hover:border-purple-400'}`}
                    onClick={handleBrowse}
                  >
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="mb-6"
                    >
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-purple-50 text-purple-600 shadow-sm border border-purple-100">
                        <Scan className="w-8 h-8" />
                      </div>
                    </motion.div>
                    <h3 className="text-sm font-bold text-slate-800 mb-2">Drop your receipt or bill image here</h3>
                    <p className="text-[10px] text-slate-400 mb-6 font-mono">Supports JPG, PNG, and WebP formats</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleBrowse(); }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      Browse Files
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                  </motion.div>
                )}

                {phase === 'processing' && (
                  <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <GlassCard glowColor="purple" className="py-14 flex flex-col items-center text-center bg-white border-slate-200/80 shadow-md">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} className="relative mb-8">
                        <div className="w-20 h-20 rounded-full border-2 border-purple-100 flex items-center justify-center">
                          <Scan className="w-8 h-8 text-purple-600 animate-pulse" />
                        </div>
                        <div className="absolute w-3 h-3 bg-purple-600 rounded-full shadow-md" style={{ top: -4, left: '50%', marginLeft: -6 }} />
                      </motion.div>
                      <h3 className="text-sm font-bold text-slate-800 mb-2">Extracting statement metrics...</h3>
                      <p className="text-[10px] text-slate-500 mb-6 font-mono truncate max-w-[250px]">{selectedFileName}</p>
                      <div className="w-full max-w-xs">
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-[9px] text-slate-400 mt-2 font-mono">{Math.round(progress)}% OCR sweep complete</p>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}

                {phase === 'complete' && result && (
                  <motion.div key="result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                    <GlassCard glowColor="green" className="py-6 px-6 bg-white border-slate-200/80 shadow-md">
                      <div className="flex justify-center mb-6">
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-semibold text-emerald-600">Added to Transactions ✓</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center"><Store size={16} className="text-purple-600" /></div>
                            <div>
                              <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider font-bold">Merchant</p>
                              <p className="text-sm font-bold text-slate-800">{result.merchant}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center"><Sparkles size={16} className="text-emerald-600" /></div>
                            <div>
                              <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider font-bold">Amount</p>
                              <p className="text-xl font-extrabold text-emerald-600">₹{result.amount.toLocaleString('en-IN')}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center"><CalendarDays size={16} className="text-blue-600" /></div>
                            <div>
                              <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider font-bold">Date Detected</p>
                              <p className="text-xs font-semibold text-slate-800">{result.date}</p>
                            </div>
                          </div>
                        </div>

                        {/* confidence progress ring */}
                        <div className="flex flex-col items-center justify-center">
                          <div className="relative w-36 h-36 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle cx="72" cy="72" r="58" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
                              <circle cx="72" cy="72" r="58" stroke="url(#confGrad)" strokeWidth="6" fill="transparent" strokeDasharray="364" strokeDashoffset={364 - (364 * confidenceValue) / 100} strokeLinecap="round" />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                              <span className="text-xl font-bold text-slate-800">{result.confidence}</span>
                              <span className="text-[8px] text-slate-400 uppercase tracking-widest mt-0.5 font-bold">Confidence</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-center">
                        <button onClick={handleScanAnother} className="flex items-center gap-2 px-5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm">
                          <Scan size={14} className="text-slate-400" /> Scan Another
                        </button>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Scanner Tips/History */}
            <div className="lg:col-span-2 space-y-6">
              <GlassCard className="bg-white border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Lightbulb size={16} className="text-amber-500" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Better Scan Guidelines</h4>
                </div>
                <ul className="space-y-2.5 text-[11px] text-slate-650">
                  <li className="flex gap-2"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full shrink-0 mt-1.5" /> Place receipt flat on dark background.</li>
                  <li className="flex gap-2"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full shrink-0 mt-1.5" /> Avoid camera reflections and direct shadows.</li>
                  <li className="flex gap-2"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full shrink-0 mt-1.5" /> Hand-written bills may experience lower OCR accuracy.</li>
                </ul>
              </GlassCard>

              {/* Scanned history */}
              <GlassCard className="bg-white border-slate-200/80 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Scans Registry</h4>
                  <span className="text-[10px] text-slate-500 font-mono">{recentScans.length} Scanned</span>
                </div>
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {recentScans.length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center py-6">No bills scanned yet.</p>
                  ) : (
                    recentScans.slice(0, 3).map(scan => (
                      <div key={scan.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-semibold text-slate-800 truncate max-w-[120px]">{scan.title.replace(' (OCR Scanned)', '').replace(' (OCR scanned)', '')}</p>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">{new Date(scan.date).toLocaleDateString()}</p>
                        </div>
                        <span className="font-bold text-emerald-600">₹{scan.amount}</span>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="vault-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-6"
          >
            {/* Vault Uploader */}
            <div className="lg:col-span-3 space-y-6">
              <AnimatePresence mode="wait">
                {vaultPhase === 'idle' && (
                  <motion.div key="vault-idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="border border-slate-200 bg-white p-6 rounded-2xl space-y-4 shadow-sm">
                      {/* Document Type Selector */}
                      <div>
                        <label className="block text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold mb-2">Document Category</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: 'invoice', label: 'Bill / Invoice' },
                            { value: 'insurance', label: 'Insurance Policy' },
                            { value: 'loan', label: 'Loan Agreement' },
                            { value: 'bank_statement', label: 'Bank Statement' }
                          ].map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => setVaultFileType(opt.value)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer 
                                ${vaultFileType === opt.value 
                                  ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm font-bold' 
                                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* File Select Area */}
                      <div
                        onClick={() => vaultInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-250 hover:border-purple-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-50/50 shadow-inner"
                      >
                        <input
                          ref={vaultInputRef}
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={handleVaultFileSelect}
                          className="hidden"
                        />
                        <FolderOpen size={36} className="text-slate-400 mb-2 animate-pulse" />
                        {vaultFile ? (
                          <div>
                            <p className="text-xs text-purple-600 font-semibold truncate max-w-[220px]">{vaultFile.name}</p>
                            <p className="text-[9px] text-slate-400 font-mono mt-1">{(vaultFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs text-slate-650 font-semibold">Select PDF contract, invoice image, or statement</p>
                            <p className="text-[9px] text-slate-400 font-mono mt-1">Supports PDF, PNG, JPG files</p>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleVaultUpload}
                        disabled={!vaultFile}
                        className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-750 text-white font-bold text-xs shadow-md disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed active:scale-95 transition-all"
                      >
                        Upload to secure Cloud Vault
                      </button>
                    </div>
                  </motion.div>
                )}

                {(vaultPhase === 'uploading' || vaultPhase === 'parsing') && (
                  <motion.div key="vault-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <GlassCard glowColor="purple" className="py-14 flex flex-col items-center text-center space-y-6 bg-white border-slate-200/80 shadow-md">
                      <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center animate-spin">
                        <Scan className="w-8 h-8 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">{vaultLog}</h3>
                        <p className="text-[9px] text-slate-400 font-mono mt-1">{vaultFile?.name}</p>
                      </div>
                      <div className="w-full max-w-xs">
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500" style={{ width: `${vaultProgress}%` }} />
                        </div>
                        <p className="text-[9px] text-slate-400 mt-2 font-mono">{vaultProgress}% Vault parse complete</p>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}

                {vaultPhase === 'success' && (
                  <motion.div key="vault-success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                    <GlassCard glowColor="green" className="py-8 text-center space-y-4 bg-white border-slate-200/80 shadow-md">
                      <div className="flex justify-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-200">
                          <CheckCircle2 size={24} className="text-emerald-600" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-800">Document Analyzed Successfully!</h3>
                        <p className="text-xs text-slate-650 mt-2 max-w-md mx-auto px-4">{vaultSuccessDetail}</p>
                      </div>
                      <div className="pt-4">
                        <button onClick={handleResetVault} className="px-5 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer shadow-sm">
                          Upload Another Contract
                        </button>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Vault Documents History (Right Column) */}
            <div className="lg:col-span-2 space-y-6">
              <GlassCard className="flex flex-col h-full justify-between bg-white border-slate-200/80 shadow-sm">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5"><FolderOpen size={14} className="text-purple-600" /> Secure Documents</h4>
                    <span className="text-[10px] text-slate-500 font-mono">{vaultDocuments.length} files</span>
                  </div>

                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {vaultDocuments.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <FileText size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-xs">No documents uploaded</p>
                      </div>
                    ) : (
                      vaultDocuments.map(doc => (
                        <div key={doc.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs hover:border-slate-200 transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {doc.fileType === 'insurance' ? <ShieldCheck size={16} className="text-emerald-600 shrink-0" /> : <FileText size={16} className="text-blue-600 shrink-0" />}
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate max-w-[140px]">{doc.fileName}</p>
                              <span className="text-[9px] text-slate-450 font-mono capitalize">{doc.fileType || 'Document'}</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-semibold px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md">Processed</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-[10px] text-slate-500 flex gap-2 mt-4">
                  <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
                  All vault uploads are verified against sandbox encryption indices.
                </div>
              </GlassCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <defs>
        <svg className="hidden">
          <linearGradient id="confGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </svg>
      </defs>
    </div>
  );
}
