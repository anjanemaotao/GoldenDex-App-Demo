import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface DepthChartProps {
  currentPrice: number;
}

export const DepthChart: React.FC<DepthChartProps> = ({ currentPrice }) => {
  const data = useMemo(() => {
    // Generate Bids (Left side, Price increasing towards current)
    // We render bids sorted by price ASC for the X-axis to work linearly
    
    let cumBid = 0;
    const bids = [];
    // Start from lowest price to current price
    for (let i = 20; i > 0; i--) {
        const p = currentPrice * (1 - 0.001 * i);
        // Random volume
        const vol = Math.random() * 8 + 2;
        // Cumulative volume usually increases as we move away from market price
        // But for visual area chart from left to right:
        // Far left (lowest price) has high cumulative bids? 
        // No, usually Depth Chart Y is "Cumulative Volume".
        // At market price (best bid), volume is low. As price drops, more bids are available (accumulated).
        // So at Lowest Price (far left), Total Bids is MAX.
        // At Market Price (center), Total Bids is MIN.
        // Let's simulate this "Mountain" shape for Bids.
        
        // However, Recharts renders X from left to right.
        // So we need to calculate total first?
        bids.push({ price: p, vol });
    }
    
    // Calculate cumulative for bids in reverse (from best price down to lowest price)
    // But we need to map it to the array order (lowest to highest)
    // Let's just mock a "Mountain" slope.
    // Low Price -> High Cumulative Volume
    // High Price (near market) -> Low Cumulative Volume
    
    const processedBids = bids.map((b, idx) => ({
        price: b.price,
        bid: (20 - idx) * 10 + Math.random() * 10, // Decreasing as it approaches center
        ask: null
    }));

    // Generate Asks (Right side, Price increasing from current)
    // Market Price -> Low Cumulative Volume
    // High Price -> High Cumulative Volume
    const asks = [];
    for (let i = 0; i < 20; i++) {
        const p = currentPrice * (1 + 0.001 * (i + 1));
        const vol = (i + 1) * 10 + Math.random() * 10; // Increasing as it moves away from center
        asks.push({ price: p, bid: null, ask: vol });
    }

    return [...processedBids, ...asks];
  }, [currentPrice]);

  return (
    <div className="w-full h-64 select-none touch-none dark:bg-slate-900 bg-white">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="fillBid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
            </linearGradient>
            <linearGradient id="fillAsk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="price" 
            type="number" 
            domain={['auto', 'auto']} 
            tickFormatter={(val) => val.toFixed(1)}
            hide={true} 
          />
          <YAxis orientation="right" tick={false} width={0} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
            itemStyle={{ color: '#f8fafc' }}
            formatter={(value: any, name: string) => [Math.round(value), name === 'bid' ? 'Buy Vol' : 'Sell Vol']}
            labelFormatter={(label: any) => `Price: ${label.toFixed(2)}`}
          />
          <Area 
            type="step" 
            dataKey="bid" 
            stroke="#10b981" 
            fill="url(#fillBid)" 
            strokeWidth={2} 
            isAnimationActive={false}
          />
          <Area 
            type="step" 
            dataKey="ask" 
            stroke="#f43f5e" 
            fill="url(#fillAsk)" 
            strokeWidth={2} 
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
