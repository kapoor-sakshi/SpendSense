import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface TickerStock {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  flash?: 'up' | 'down' | null;
}

interface LiveStockTickerProps {
  stocks: TickerStock[];
}

export const LiveStockTicker: React.FC<LiveStockTickerProps> = ({ stocks }) => {
  if (!stocks || stocks.length === 0) return null;

  // Duplicate the array to create a seamless infinite scroll loop
  const tickerItems = [...stocks, ...stocks];

  return (
    <div className="w-full max-w-full bg-slate-900 border-b border-slate-800 overflow-hidden py-2 relative flex items-center z-20">
      {/* Gradient masks for smooth fade in/out at edges */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />

      {/* Scrolling container */}
      <div className="flex whitespace-nowrap animate-ticker w-max">
        {tickerItems.map((stock, idx) => {
          const isUp = stock.change >= 0;
          return (
            <div 
              key={`${stock.symbol}-${idx}`} 
              className={`
                inline-flex items-center gap-2 px-6 border-r border-slate-800 transition-colors duration-300
                ${stock.flash === 'up' ? 'bg-emerald-900/40 text-emerald-400' : ''}
                ${stock.flash === 'down' ? 'bg-rose-900/40 text-rose-400' : ''}
                ${!stock.flash ? 'text-slate-300 hover:bg-slate-800 cursor-default' : ''}
              `}
            >
              <span className="font-bold text-xs tracking-wider">{stock.symbol}</span>
              <span className="font-mono text-xs text-white">₹{stock.price.toFixed(2)}</span>
              
              <span className={`flex items-center text-[10px] font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {isUp ? '+' : ''}{stock.changePct.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveStockTicker;
