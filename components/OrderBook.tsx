import React, { useMemo } from 'react';

interface OrderBookProps {
  currentPrice: number;
}

export const OrderBook: React.FC<OrderBookProps> = ({ currentPrice }) => {
  // Generate mock data for asks (sellers) and bids (buyers)
  const { asks, bids } = useMemo(() => {
    const asksArr = [];
    const bidsArr = [];
    // Generate 6 levels
    for (let i = 1; i <= 6; i++) {
      // Asks are higher than current price
      asksArr.push({
        price: currentPrice + i * 0.15 + (Math.random() * 0.1),
        size: (Math.random() * 5 + 0.1).toFixed(3),
        total: Math.random() * 100 // Visual bar width %
      });
      // Bids are lower than current price
      bidsArr.push({
        price: currentPrice - i * 0.15 - (Math.random() * 0.1),
        size: (Math.random() * 5 + 0.1).toFixed(3),
        total: Math.random() * 100
      });
    }
    // Standard Vertical Order Book: Asks (High -> Low) on top, Bids (High -> Low) on bottom
    return { asks: asksArr.reverse(), bids: bidsArr };
  }, [currentPrice]); // Re-generate when price changes for "live" feel

  return (
    <div className="dark:bg-slate-900 bg-white border-b dark:border-slate-800 border-slate-200 p-3">
      <div className="grid grid-cols-2 gap-4">
        {/* Asks */}
        <div>
           <div className="flex justify-between text-[10px] dark:text-slate-500 text-slate-400 mb-1 uppercase tracking-wider">
             <span>Price</span>
             <span>Qty</span>
          </div>
          <div className="flex flex-col-reverse space-y-reverse space-y-0.5">
            {asks.map((ask, i) => (
                <div key={`ask-${i}`} className="flex justify-between items-center text-[10px] font-mono relative h-4">
                    <span className="text-rose-500 z-10">{ask.price.toFixed(2)}</span>
                    <span className="dark:text-slate-300 text-slate-700 z-10">{ask.size}</span>
                     <div className="absolute top-0 right-0 bottom-0 bg-rose-500/10 rounded-sm transition-all duration-300" style={{ width: `${ask.total}%`}}></div>
                </div>
            ))}
          </div>
        </div>

        {/* Bids */}
        <div>
           <div className="flex justify-between text-[10px] dark:text-slate-500 text-slate-400 mb-1 uppercase tracking-wider">
             <span>Price</span>
             <span>Qty</span>
          </div>
          <div className="space-y-0.5">
            {bids.map((bid, i) => (
                <div key={`bid-${i}`} className="flex justify-between items-center text-[10px] font-mono relative h-4">
                    <span className="text-emerald-500 z-10">{bid.price.toFixed(2)}</span>
                    <span className="dark:text-slate-300 text-slate-700 z-10">{bid.size}</span>
                    <div className="absolute top-0 right-0 bottom-0 bg-emerald-500/10 rounded-sm transition-all duration-300" style={{ width: `${bid.total}%`}}></div>
                </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}