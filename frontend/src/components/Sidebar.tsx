'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ReceiptText, 
  Scan, 
  TrendingUp, 
  ShieldCheck, 
  DollarSign, 
  Tv, 
  ShieldAlert, 
  Settings, 
  LogOut,
  Sparkles,
  BarChart3,
  History
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useApp();

  // Hide sidebar on landing and login/signup pages
  const isAuthOrLanding = pathname === '/' || pathname === '/login' || pathname === '/signup';
  if (isAuthOrLanding) return null;

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Transactions', icon: ReceiptText, path: '/transactions' },
    { name: 'OCR Bill Scanner', icon: Scan, path: '/scanner' },
    { name: 'AI Reports & Predictions', icon: BarChart3, path: '/reports' },
    { name: 'Report History', icon: History, path: '/reports/history' },
    { name: 'Groww Investments', icon: TrendingUp, path: '/investments' },
    { name: 'Loans & EMIs', icon: DollarSign, path: '/loans' },
    { name: 'Insurance policies', icon: ShieldCheck, path: '/insurance' },
    { name: 'OTT Subscriptions', icon: Tv, path: '/subscriptions' },
    { name: 'Admin dashboard', icon: ShieldAlert, path: '/admin' },
    { name: 'Profile & Settings', icon: Settings, path: '/settings' }
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Get initials from user name
  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-white/80 backdrop-blur-xl border-r border-slate-200/80 p-5 flex flex-col justify-between z-30">
      {/* Top Brand Logo */}
      <div>
        <Link href="/dashboard" className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/10">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-wider font-sans">SPENDSENSE</h1>
            <span className="text-[10px] text-purple-600 font-mono tracking-widest uppercase">AI platform</span>
          </div>
        </Link>

        {/* Menu list */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group
                  ${isActive 
                    ? 'bg-purple-50/70 border-l-4 border-purple-600 text-purple-700' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
                `}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-purple-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile footer */}
      <div className="border-t border-slate-200/80 pt-4 flex flex-col gap-3">
        {user?.name && (
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 via-blue-500 to-emerald-400 p-[1.5px]">
              <div className="w-full h-full rounded-full bg-slate-50 flex items-center justify-center text-slate-800 font-extrabold text-sm">
                {getInitials(user.name)}
              </div>
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-slate-800 truncate">{user.name}</h4>
              {user.email && <p className="text-xs text-slate-500 truncate">{user.email}</p>}
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-500/5 transition-colors w-full text-left cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
