
import React, { useMemo } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface OrderBookProps {
  currentPrice: number;
  lang: Language;
  onPriceSelect?: (price: string) => void;
}

export const OrderBook: React.FC<OrderBookProps> = ({ currentPrice, lang, onPriceSelect }) => {
  const t = TRANSLATIONS[lang];
  
  // Generate mock data
  const { asks, bids } = useMemo(() => {
    const asksArr = [];
    const bidsArr = [];
    // Generate 7 levels for vertical view
    for (let i = 1; i <= 7; i++) {
      // Asks
      asksArr.push({
        price: currentPrice + i * 0.15 + (Math.random() * 0.1),
        size: (Math.random() * 5 + 0.1).toFixed(3),
        total: Math.random() * 100 
      });
      // Bids
      bidsArr.push({
        price: currentPrice - i * 0.15 - (Math.random() * 0.1),
        size: (Math.random() * 5 + 0.1).toFixed(3),
        total: Math.random() * 100
      });
    }
    // Asks: Need lowest price at the bottom (closest to spread). 
    // So we sort descending: High -> Low.
    const sortedAsks = asksArr.sort((a, b) => b.price - a.price);
    
    // Bids: Need highest price at the top (closest to spread).
    // So we sort descending: High -> Low.
    const sortedBids = bidsArr.sort((a, b) => b.price - a.price);

    return { asks: sortedAsks, bids: sortedBids };
  }, [currentPrice]);

  return (
    <div className="h-full flex flex-col">
       {/* Header */}
       <div className="flex justify-between text-[10px] dark:text-slate-500 text-slate-400 mb-1 px-1 uppercase tracking-wider">
          <span>{t.price}</span>
          <span>{t.qty}</span>
       </div>

       {/* Asks (Sell Orders) - Red */}
       <div className="flex-1 flex flex-col justify-end space-y-0.5 mb-1">
          {asks.map((ask, i) => (
             <div 
                key={`ask-${i}`} 
                onClick={() => onPriceSelect && onPriceSelect(ask.price.toFixed(2))}
                className="flex justify-between items-center text-[10px] font-mono relative h-5 px-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50"
             >
                 <span className="text-rose-500 z-10">{ask.price.toFixed(2)}</span>
                 <span className="dark:text-slate-300 text-slate-700 z-10">{ask.size}</span>
                 <div className="absolute top-0 right-0 bottom-0 bg-rose-500/10 rounded-sm transition-all duration-300" style={{ width: `${ask.total}%`}}></div>
             </div>
          ))}
       </div>

       {/* Middle: Current Price */}
       <div className="py-2 my-1 border-y dark:border-slate-800 border-slate-200 flex items-center justify-center">
          <span className="text-lg font-bold font-mono dark:text-white text-slate-900">{currentPrice.toFixed(2)}</span>
       </div>

       {/* Bids (Buy Orders) - Green */}
       <div className="flex-1 space-y-0.5 mt-1">
          {bids.map((bid, i) => (
             <div 
                key={`bid-${i}`} 
                onClick={() => onPriceSelect && onPriceSelect(bid.price.toFixed(2))}
                className="flex justify-between items-center text-[10px] font-mono relative h-5 px-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50"
             >
                 <span className="text-emerald-500 z-10">{bid.price.toFixed(2)}</span>
                 <span className="dark:text-slate-300 text-slate-700 z-10">{bid.size}</span>
                 <div className="absolute top-0 right-0 bottom-0 bg-emerald-500/10 rounded-sm transition-all duration-300" style={{ width: `${bid.total}%`}}></div>
             </div>
          ))}
       </div>
    </div>
  );
}
