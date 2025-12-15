import React from 'react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Candle, ChartType } from '../types';

interface CandleChartProps {
  data: Candle[];
  type?: ChartType;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-700 p-2 rounded shadow-lg text-xs z-50">
        <p className="text-slate-400">{data.time}</p>
        <p className="text-emerald-400">H: {data.high.toFixed(2)}</p>
        <p className="text-rose-400">L: {data.low.toFixed(2)}</p>
        <p className="text-white">O: {data.open.toFixed(2)}</p>
        <p className="text-white">C: {data.close.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

// Custom shape for candlestick bar
const CandlestickShape = (props: any) => {
  const { x, y, width, height, payload } = props;
  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? '#10b981' : '#f43f5e';
  
  // Calculate y coordinates relative to the chart area
  // We need to map values to pixels. 
  // props.y is the coordinate for the max value of the bar (which we set to 'high')
  // props.height is the pixel height of the range (high - low)
  
  // Scale factor: pixels per unit
  const range = high - low;
  const scale = range === 0 ? 0 : height / range;
  
  const yHigh = y;
  const yLow = y + height;
  const yOpen = yHigh + (high - open) * scale;
  const yClose = yHigh + (high - close) * scale;
  
  const bodyTop = Math.min(yOpen, yClose);
  const bodyHeight = Math.abs(yOpen - yClose);
  
  // Ensure minimal height for visibility
  const visibleBodyHeight = Math.max(1, bodyHeight);

  return (
    <g>
      {/* Wick */}
      <line x1={x + width / 2} y1={yHigh} x2={x + width / 2} y2={yLow} stroke={color} strokeWidth={1} />
      {/* Body */}
      <rect 
        x={x} 
        y={bodyTop} 
        width={width} 
        height={visibleBodyHeight} 
        fill={color} 
      />
    </g>
  );
};

export const CandleChart: React.FC<CandleChartProps> = ({ data, type = 'line' }) => {
  const min = Math.min(...data.map(d => d.low));
  const max = Math.max(...data.map(d => d.high));
  const padding = (max - min) * 0.1;
  const domainMin = min - padding;
  const domainMax = max + padding;

  // Determine chart color based on last movement for Area Chart
  const isPositive = data.length > 1 && data[data.length - 1].close >= data[0].close;
  const strokeColor = isPositive ? '#10b981' : '#f43f5e';
  const fillColor = isPositive ? 'url(#colorUp)' : 'url(#colorDown)';
  
  // Pre-process data for BarChart (Range)
  // We use a Bar to represent the full range [low, high] and draw inside it
  const candleData = data.map(d => ({
    ...d,
    range: [d.low, d.high]
  }));

  return (
    <div className="w-full h-64 select-none touch-none">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'line' ? (
            <AreaChart data={data}>
            <defs>
                <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
            </defs>
            <XAxis dataKey="time" hide={true} axisLine={false} tickLine={false} />
            <YAxis 
                domain={[domainMin, domainMax]} 
                orientation="right" 
                tick={{fill: '#64748b', fontSize: 10}} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(value) => value.toFixed(1)}
                width={40}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '3 3' }} />
            <Area 
                type="monotone" 
                dataKey="close" 
                stroke={strokeColor} 
                fill={fillColor} 
                strokeWidth={2}
                isAnimationActive={false}
            />
            </AreaChart>
        ) : (
            <BarChart data={candleData}>
                <XAxis dataKey="time" hide={true} axisLine={false} tickLine={false} />
                <YAxis 
                    domain={[domainMin, domainMax]} 
                    orientation="right" 
                    tick={{fill: '#64748b', fontSize: 10}} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(value) => value.toFixed(1)}
                    width={40}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#64748b', strokeWidth: 1 }} />
                <Bar 
                    dataKey="range" 
                    shape={<CandlestickShape />} 
                    isAnimationActive={false}
                />
            </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};