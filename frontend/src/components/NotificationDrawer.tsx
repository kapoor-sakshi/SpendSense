'use client';

import React, { useState } from 'react';
import { Bell, Check, Info, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const NotificationDrawer: React.FC = () => {
  const { notifications, markNotificationsAsRead } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'danger': return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      markNotificationsAsRead();
    }
  };

  return (
    <div className="relative">
      {/* Trigger Icon */}
      <button 
        onClick={toggleOpen}
        className="relative w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 rounded-full bg-rose-500 text-[10px] text-white flex items-center justify-center font-bold px-1.5 animate-bounce border border-black">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl z-50 p-4 overflow-hidden backdrop-blur-2xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-sans">Notifications</h4>
              {unreadCount > 0 && (
                <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-medium">
                  <Check className="w-3 h-3" /> Marked read
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-[11px] text-zinc-500">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((not) => (
                  <div 
                    key={not.id} 
                    className={`p-2.5 rounded-xl border flex gap-2.5 text-xs transition-colors ${not.isRead ? 'bg-zinc-900/40 border-white/5 text-zinc-400' : 'bg-white/[0.02] border-white/10 text-zinc-200'}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {getIcon(not.type)}
                    </div>
                    <div>
                      <h5 className="font-semibold text-white/90 leading-tight">{not.title}</h5>
                      <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">{not.message}</p>
                      <span className="text-[9px] text-zinc-600 block mt-1 font-mono">
                        {new Date(not.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDrawer;
