import React, { useState, useEffect } from 'react';
import { Sparkles, Settings2, Info, X, BarChart2, TrendingUp, Layers } from 'lucide-react';
import { CandleChart } from './CandleChart';
import { OrderBook } from './OrderBook';
import { DepthChart } from './DepthChart';
import { Candle, Side, MarginMode, Language, ChartType, MarketTrade } from '../types';
import { analyzeMarket } from '../services/geminiService';
import { TRANSLATIONS } from '../constants';

interface TradeViewProps {
  candles: Candle[];
  currentPrice: number;
  balance: number;
  marketTrades?: MarketTrade[];
  onPlaceOrder: (side: Side, size: number, price: number, type: 'MARKET' | 'LIMIT', marginMode: MarginMode) => void;
  lang: Language;
}

export const TradeView: React.FC<TradeViewProps> = ({ candles, currentPrice, balance, marketTrades = [], onPlaceOrder, lang }) => {
  const t = TRANSLATIONS[lang];
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [marginMode, setMarginMode] = useState<MarginMode>(MarginMode.CROSS);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [amount, setAmount] = useState<string>('1.00');
  const [limitPrice, setLimitPrice] = useState<string>(currentPrice.toFixed(2));
  const [leverage, setLeverage] = useState<number>(20);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [activeBookTab, setActiveBookTab] = useState<'book' | 'trades'>('book');
  
  // Market Stats State
  const [countdown, setCountdown] = useState<string>('00:59:59');

  // Calculated Stats
  const open24h = 2020.50; // Mock 24h open price
  const changePercent = ((currentPrice - open24h) / open24h) * 100;
  const isPositiveChange = changePercent >= 0;
  
  const vol24h = 452938421; // Mock 24h Volume
  const openInterest = 128493021; // Mock Open Interest

  // Helper to format large numbers
  const formatCompact = (num: number) => {
    return Intl.NumberFormat('en-US', {
      notation: "compact",
      maximumFractionDigits: 1
    }).format(num);
  };

  // Update limit price default when switching to limit if empty, but usually keep it static if user typed
  useEffect(() => {
    if (orderType === 'LIMIT' && !limitPrice) {
      setLimitPrice(currentPrice.toFixed(2));
    }
  }, [currentPrice, orderType]);

  // Countdown timer simulation (1 Hour)
  useEffect(() => {
    const timer = setInterval(() => {
        const now = new Date();
        const nextHour = new Date(now);
        nextHour.setHours(now.getHours() + 1, 0, 0, 0);
        
        const diff = nextHour.getTime() - now.getTime();
        const m = Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, '0');
        const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
        setCountdown(`00:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTrade = (side: Side) => {
    const size = parseFloat(amount);
    const price = orderType === 'LIMIT' ? parseFloat(limitPrice) : currentPrice;
    
    if (isNaN(size) || size <= 0) return;
    if (orderType === 'LIMIT' && (isNaN(price) || price <= 0)) return;

    onPlaceOrder(side, size, price, orderType, marginMode);
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setAiAnalysis("Analyzing market structure...");
    try {
      const result = await analyzeMarket(candles, currentPrice);
      setAiAnalysis(result);
    } catch (e) {
      setAiAnalysis("Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const executionPrice = orderType === 'LIMIT' ? parseFloat(limitPrice) || currentPrice : currentPrice;
  const maxBuy = (balance * leverage) / executionPrice;

  // Mock Data
  const markPrice = currentPrice * 1.0001;
  const fundingRate = 0.0042; // 0.0042%

  return (
    <div className="flex flex-col h-full pb-20 overflow-y-auto no-scrollbar dark:bg-slate-900 bg-slate-50 relative">
      {/* Header */}
      <div className="dark:bg-slate-900 bg-white border-b dark:border-slate-800 border-slate-200 sticky top-0 z-10 shadow-sm">
          <div className="px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center">
                  {/* Custom Gold Icon */}
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="15" fill="url(#gold_gradient)" stroke="#EAB308" strokeWidth="2"/>
                    <path d="M16 26C21.5228 26 26 21.5228 26 16C26 10.4772 21.5228 6 16 6C10.4772 6 6 10.4772 6 16C6 21.5228 10.4772 26 16 26Z" fill="#F59E0B" fillOpacity="0.2"/>
                    <path d="M16 9V23M11 11H18C19.6569 11 21 12.3431 21 14C21 15.6569 19.6569 17 18 17H14C12.3431 17 11 18.3431 11 20C11 21.6569 12.3431 23 14 23H21" stroke="#FEF3C7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <defs>
                        <linearGradient id="gold_gradient" x1="16" y1="1" x2="16" y2="31" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#FCD34D"/>
                            <stop offset="1" stopColor="#D97706"/>
                        </linearGradient>
                    </defs>
                  </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold dark:text-white text-slate-900 leading-tight">XAU/USDC</h1>
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Perpetual</span>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-xl font-mono font-bold ${candles[candles.length-1]?.close >= candles[0]?.open ? 'text-emerald-500' : 'text-rose-500'}`}>
                {currentPrice.toFixed(2)}
              </div>
              <div className="flex items-center justify-end gap-1.5 text-[10px]">
                <span className="text-slate-400">{t.lastPrice}</span>
                <span className={`font-mono font-medium ${isPositiveChange ? 'text-emerald-500' : 'text-rose-500'}`}>
                   {isPositiveChange ? '+' : ''}{changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Ticker Info Bar */}
          <div className="px-4 py-2 flex items-center justify-between gap-6 overflow-x-auto no-scrollbar whitespace-nowrap text-[10px] dark:bg-slate-800/50 bg-slate-50 border-t dark:border-slate-800 border-slate-100">
             <div className="flex flex-col shrink-0">
                <span className="text-slate-400 mb-0.5">{t.markPrice}</span>
                <span className="font-mono dark:text-slate-200 text-slate-700">{markPrice.toFixed(2)}</span>
             </div>
             
             <div className="flex flex-col shrink-0">
                <span className="text-slate-400 mb-0.5">{t.vol24h}</span>
                <span className="font-mono dark:text-slate-200 text-slate-700">{formatCompact(vol24h)}</span>
             </div>

             <div className="flex flex-col shrink-0">
                <span className="text-slate-400 mb-0.5">{t.openInterest}</span>
                <span className="font-mono dark:text-slate-200 text-slate-700">{formatCompact(openInterest)}</span>
             </div>

             <div 
                className="flex flex-col text-center cursor-pointer group shrink-0"
                onClick={() => setShowFundingModal(true)}
             >
                <span className="text-slate-400 mb-0.5 group-hover:text-indigo-500 border-b border-dashed border-slate-400/50 group-hover:border-indigo-500 transition-colors">{t.fundingRate}</span>
                <span className="font-mono text-orange-400">{fundingRate.toFixed(4)}%</span>
             </div>
             <div className="flex flex-col text-right shrink-0">
                <span className="text-slate-400 mb-0.5">{t.countdown}</span>
                <span className="font-mono dark:text-slate-200 text-slate-700">{countdown}</span>
             </div>
          </div>
      </div>

      {/* Chart */}
      <div className="relative border-b dark:border-slate-800 border-slate-200 dark:bg-slate-900 bg-white min-h-[256px]">
        {chartType === 'depth' ? (
           <DepthChart currentPrice={currentPrice} />
        ) : (
           <CandleChart data={candles} type={chartType} />
        )}
        
        {/* Controls Overlay */}
        <div className="absolute top-2 left-2 flex gap-2">
            <button 
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/90 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg backdrop-blur transition-all border border-indigo-500/50"
            >
                <Sparkles size={10} className={isAnalyzing ? "animate-pulse" : ""} />
                {isAnalyzing ? "AI..." : "AI"}
            </button>
        </div>

        <div className="absolute top-2 right-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 flex border dark:border-slate-700 border-slate-200 shadow-sm">
            <button 
                onClick={() => setChartType('line')}
                className={`p-1.5 rounded-md transition-colors ${chartType === 'line' ? 'bg-white dark:bg-slate-600 shadow text-indigo-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
                <TrendingUp size={14} />
            </button>
            <button 
                onClick={() => setChartType('candle')}
                className={`p-1.5 rounded-md transition-colors ${chartType === 'candle' ? 'bg-white dark:bg-slate-600 shadow text-indigo-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
                <BarChart2 size={14} />
            </button>
             <button 
                onClick={() => setChartType('depth')}
                className={`p-1.5 rounded-md transition-colors ${chartType === 'depth' ? 'bg-white dark:bg-slate-600 shadow text-indigo-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
                <Layers size={14} />
            </button>
        </div>

        {aiAnalysis && (
            <div className="absolute top-12 left-2 right-12 dark:bg-slate-800/95 bg-white/95 backdrop-blur-md border dark:border-slate-700 border-slate-200 p-3 rounded-lg text-xs dark:text-slate-200 text-slate-800 shadow-xl z-20 animate-in fade-in zoom-in duration-200">
               <div className="flex justify-between items-start mb-2 border-b dark:border-slate-700 border-slate-200 pb-2">
                 <span className="font-bold text-indigo-500 flex items-center gap-1">
                   <Sparkles size={12} /> Gemini Analysis
                 </span>
                 <button onClick={() => setAiAnalysis(null)} className="text-slate-500 hover:text-slate-800 dark:hover:text-white p-1">×</button>
               </div>
               <p className="leading-relaxed opacity-90">{aiAnalysis}</p>
            </div>
        )}
      </div>

      {/* Book / Trades Tab */}
      <div className="flex border-b dark:border-slate-800 border-slate-200 dark:bg-slate-900 bg-white">
         <button 
            onClick={() => setActiveBookTab('book')}
            className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${activeBookTab === 'book' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
         >
            {t.tabOrderBook}
         </button>
         <button 
            onClick={() => setActiveBookTab('trades')}
            className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${activeBookTab === 'trades' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
         >
            {t.tabRecentTrades}
         </button>
      </div>

      {/* Book / Trades Content */}
      <div className="dark:bg-slate-900 bg-white min-h-[130px]">
        {activeBookTab === 'book' ? (
           <OrderBook currentPrice={currentPrice} />
        ) : (
           <div className="p-3 border-b dark:border-slate-800 border-slate-200">
              <div className="grid grid-cols-3 text-[10px] dark:text-slate-500 text-slate-400 mb-2 uppercase tracking-wider">
                  <span>{t.price}</span>
                  <span className="text-center">{t.qty}</span>
                  <span className="text-right">{t.time}</span>
              </div>
              <div className="space-y-1">
                  {marketTrades.slice(0, 6).map((trade) => (
                      <div key={trade.id} className="grid grid-cols-3 text-[10px] font-mono animate-in fade-in slide-in-from-top-1 duration-300">
                          <span className={trade.side === Side.LONG ? 'text-emerald-500' : 'text-rose-500'}>
                              {trade.price.toFixed(2)}
                          </span>
                          <span className="text-center dark:text-slate-300 text-slate-700">
                              {trade.size.toFixed(4)}
                          </span>
                          <span className="text-right dark:text-slate-400 text-slate-500">
                              {trade.time}
                          </span>
                      </div>
                  ))}
              </div>
           </div>
        )}
      </div>

      {/* Order Controls */}
      <div className="p-4 space-y-4 dark:bg-slate-900 bg-slate-50">
        
        {/* Margin Mode & Order Type Row */}
        <div className="flex gap-2">
            <div className="relative">
                <select 
                    value={marginMode}
                    onChange={(e) => setMarginMode(e.target.value as MarginMode)}
                    className="appearance-none dark:bg-slate-800 bg-white text-xs font-bold dark:text-white text-slate-900 py-2 pl-3 pr-8 rounded-lg border dark:border-slate-700 border-slate-200 focus:outline-none focus:border-indigo-500 h-full shadow-sm"
                >
                    <option value={MarginMode.CROSS}>{t.cross}</option>
                    <option value={MarginMode.ISOLATED}>{t.isolated}</option>
                </select>
                <Settings2 size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="flex-1 flex dark:bg-slate-800 bg-slate-200 rounded-lg p-1">
                <button 
                    onClick={() => setOrderType('MARKET')}
                    className={`flex-1 py-1 text-xs font-bold rounded transition-all ${orderType === 'MARKET' ? 'dark:bg-slate-600 bg-white dark:text-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    {t.market}
                </button>
                <button 
                    onClick={() => {
                        setOrderType('LIMIT');
                        setLimitPrice(currentPrice.toFixed(2));
                    }}
                    className={`flex-1 py-1 text-xs font-bold rounded transition-all ${orderType === 'LIMIT' ? 'dark:bg-slate-600 bg-white dark:text-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    {t.limit}
                </button>
            </div>
        </div>

        {/* Leverage Slider */}
        <div className="dark:bg-slate-800/50 bg-white p-3 rounded-xl border dark:border-slate-800 border-slate-200 shadow-sm">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>{t.leverage}</span>
            <span className="dark:text-white text-slate-900 font-mono">{leverage}x</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="100" 
            step="1" 
            value={leverage} 
            onChange={(e) => setLeverage(parseInt(e.target.value))}
            className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>1x</span>
            <span>20x</span>
            <span>50x</span>
            <span>100x</span>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* Price Input (Only for Limit) */}
          {orderType === 'LIMIT' && (
            <div className="col-span-2">
              <div className="relative group">
                  <label className="absolute -top-2 left-2 dark:bg-slate-900 bg-slate-50 px-1 text-[10px] text-slate-400 group-focus-within:text-indigo-500 transition-colors">{t.price} (USDC)</label>
                  <input 
                    type="number" 
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    className="w-full dark:bg-slate-900 bg-slate-50 border dark:border-slate-700 border-slate-200 rounded-lg py-3 px-4 dark:text-white text-slate-900 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                  />
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div className="col-span-2">
             <div className="relative group">
                <label className="absolute -top-2 left-2 dark:bg-slate-900 bg-slate-50 px-1 text-[10px] text-slate-400 group-focus-within:text-indigo-500 transition-colors">{t.size} (XAU)</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full dark:bg-slate-900 bg-slate-50 border dark:border-slate-700 border-slate-200 rounded-lg py-3 px-4 dark:text-white text-slate-900 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <span className="absolute right-4 top-3.5 text-xs text-slate-500 font-mono">
                  ≈ ${(parseFloat(amount || '0') * executionPrice).toLocaleString()}
                </span>
             </div>
             <div className="flex justify-between text-[10px] text-slate-500 mt-1 px-1">
               <span>Max: {maxBuy.toFixed(2)} XAU</span>
               <span>{t.avail}: ${balance.toFixed(2)}</span>
             </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button 
            onClick={() => handleTrade(Side.LONG)}
            className="flex flex-col items-center justify-center py-3 rounded-lg bg-emerald-600 active:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 transition-transform active:scale-95"
          >
            <span className="font-bold text-sm">{t.long}</span>
            <span className="text-[10px] opacity-80 font-mono">
               {orderType === 'LIMIT' ? `@ ${parseFloat(limitPrice).toFixed(2)}` : t.market}
            </span>
          </button>
          <button 
            onClick={() => handleTrade(Side.SHORT)}
            className="flex flex-col items-center justify-center py-3 rounded-lg bg-rose-600 active:bg-rose-700 text-white shadow-lg shadow-rose-900/20 transition-transform active:scale-95"
          >
            <span className="font-bold text-sm">{t.short}</span>
            <span className="text-[10px] opacity-80 font-mono">
               {orderType === 'LIMIT' ? `@ ${parseFloat(limitPrice).toFixed(2)}` : t.market}
            </span>
          </button>
        </div>

        {/* Info */}
        <div className="dark:bg-slate-800/30 bg-white/50 rounded-lg p-3 text-xs space-y-2 border dark:border-slate-800/50 border-slate-200">
          <div className="flex justify-between">
             <span className="text-slate-500">{t.mode}</span>
             <span className="text-indigo-500 font-mono font-bold uppercase">{marginMode}</span>
          </div>
          <div className="flex justify-between">
             <span className="text-slate-500">{t.liqPrice} (Est)</span>
             <span className="text-orange-500 font-mono">
               {amount ? (parseFloat(amount) > 0 ? (executionPrice * (1 - 1/leverage)).toFixed(2) : '--') : '--'}
             </span>
          </div>
          <div className="flex justify-between">
             <span className="text-slate-500">{t.marginRequired}</span>
             <span className="dark:text-slate-200 text-slate-800 font-mono">
                ${amount ? ((parseFloat(amount) * executionPrice) / leverage).toFixed(2) : '0.00'}
             </span>
          </div>
        </div>

      </div>

      {/* Funding Modal */}
      {showFundingModal && (
         <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
             <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-sm p-5 shadow-2xl animate-in zoom-in-95 duration-200">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-bold dark:text-white text-slate-900">{t.fundingDetails.title}</h3>
                     <button onClick={() => setShowFundingModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={20}/></button>
                 </div>
                 <div className="space-y-4">
                     <div className="flex justify-between text-sm">
                         <span className="text-slate-500">{t.fundingDetails.interval}</span>
                         <span className="font-mono dark:text-slate-200 text-slate-800">{t.fundingDetails.intervalValue}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                         <span className="text-slate-500">{t.fundingDetails.direction}</span>
                         <span className="font-mono text-emerald-500">{t.fundingDetails.directionValue}</span>
                     </div>
                     <div className="border-t dark:border-slate-700 border-slate-100 my-2"></div>
                     <div className="flex justify-between text-sm">
                         <span className="text-slate-500">{t.fundingDetails.interestRate}</span>
                         <span className="font-mono dark:text-slate-200 text-slate-800">0.0100%</span>
                     </div>
                     <div className="flex justify-between text-sm">
                         <span className="text-slate-500">{t.fundingDetails.apr}</span>
                         <span className="font-mono text-orange-400">36.5%</span>
                     </div>
                     <div className="bg-indigo-50 dark:bg-slate-700/50 p-3 rounded-lg mt-4">
                         <div className="flex gap-2">
                             <Info size={16} className="text-indigo-500 shrink-0 mt-0.5"/>
                             <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                {t.fundingDetails.description}
                             </p>
                         </div>
                     </div>
                 </div>
                 <button 
                    onClick={() => setShowFundingModal(false)}
                    className="w-full mt-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20"
                 >
                    {t.confirmAction}
                 </button>
             </div>
         </div>
      )}

    </div>
  );
};