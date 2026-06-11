'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppProvider } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Chatbot from '../components/Chatbot';

export const ClientWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();

  // Determine if this is a full-screen layout (without sidebar)
  const isAuthOrLanding = pathname === '/' || pathname === '/login' || pathname === '/signup';

  return (
    <AppProvider>
      <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-purple-200 selection:text-purple-900">
        {/* Glowing Background Gradients */}
        <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-purple-300/10 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-200/10 rounded-full blur-[140px] pointer-events-none z-0" />
        
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className={`flex-1 min-w-0 relative z-10 ${isAuthOrLanding ? 'w-full' : 'pl-64'}`}>
          {children}
        </main>

        {/* Floating Chatbot Assistant */}
        <Chatbot />
      </div>
    </AppProvider>
  );
};

export default ClientWrapper;
