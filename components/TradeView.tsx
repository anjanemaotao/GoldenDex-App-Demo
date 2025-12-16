import React, { useState, useEffect } from 'react';
import { Settings2, Info, X, BarChart2, TrendingUp, Layers, ChevronDown, Edit2 } from 'lucide-react';
import { CandleChart } from './CandleChart';
import { OrderBook } from './OrderBook';
import { DepthChart } from './DepthChart';
import { Candle, Side, MarginMode, Language, ChartType, MarketTrade, Timeframe } from '../types';
import { TRANSLATIONS } from '../constants';

interface TradeViewProps {
  candles: Candle[];
  currentPrice: number;
  balance: number;
  marketTrades?: MarketTrade[];
  onPlaceOrder: (side: Side, size: number, price: number, type: 'MARKET' | 'LIMIT', marginMode: MarginMode) => void;
  lang: Language;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
}

const TIMEFRAMES: Timeframe[] = ['1m', '3m', '5m', '15m', '30m', '1H', '2H', '4H', '8H', '12H', '1D', '3D', '1W', '1M'];

export const TradeView: React.FC<TradeViewProps> = ({ 
  candles, 
  currentPrice, 
  balance, 
  marketTrades = [], 
  onPlaceOrder, 
  lang,
  timeframe,
  onTimeframeChange
}) => {
  const t = TRANSLATIONS[lang];
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [marginMode, setMarginMode] = useState<MarginMode>(MarginMode.CROSS);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [amount, setAmount] = useState<string>('');
  const [sizeUnit, setSizeUnit] = useState<'XAU' | 'USDC'>('XAU');
  const [limitPrice, setLimitPrice] = useState<string>(currentPrice.toFixed(2));
  const [leverage, setLeverage] = useState<number>(20);
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [showLeverageModal, setShowLeverageModal] = useState(false);
  const [tempLeverage, setTempLeverage] = useState(20);
  const [activeBookTab, setActiveBookTab] = useState<'book' | 'trades'>('book');
  const [sizeSliderValue, setSizeSliderValue] = useState<number>(0);
  
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

  // Update limit price default when switching to limit if empty
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

  const executionPrice = orderType === 'LIMIT' ? (parseFloat(limitPrice) || currentPrice) : currentPrice;
  
  // Calculate Max Buy based on Unit
  const maxBuyXAU = executionPrice > 0 ? (balance * leverage) / executionPrice : 0;
  const maxBuyUSDC = balance * leverage; // Approx Notional Value

  const handleTrade = (side: Side) => {
    let size = parseFloat(amount);
    const price = orderType === 'LIMIT' ? parseFloat(limitPrice) : currentPrice;
    
    if (isNaN(size) || size <= 0) return;
    if (orderType === 'LIMIT' && (isNaN(price) || price <= 0)) return;

    // Convert USDC Amount to XAU Size if necessary
    if (sizeUnit === 'USDC') {
        size = size / price;
    }

    onPlaceOrder(side, size, price, orderType, marginMode);
    setAmount('');
    setSizeSliderValue(0);
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newUnit = e.target.value as 'XAU' | 'USDC';
      
      // Auto-convert existing amount
      if (amount && !isNaN(parseFloat(amount))) {
          const val = parseFloat(amount);
          if (newUnit === 'USDC' && sizeUnit === 'XAU') {
              setAmount((val * executionPrice).toFixed(2));
          } else if (newUnit === 'XAU' && sizeUnit === 'USDC') {
              setAmount((val / executionPrice).toFixed(4));
          }
      }
      
      setSizeUnit(newUnit);
  };

  const handleSizeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setSizeSliderValue(val);
    if (val === 0) {
        setAmount('');
    } else {
        if (sizeUnit === 'XAU') {
            const calculatedAmount = (maxBuyXAU * val) / 100;
            setAmount(calculatedAmount.toFixed(4));
        } else {
            const calculatedAmount = (maxBuyUSDC * val) / 100;
            setAmount(calculatedAmount.toFixed(2));
        }
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setAmount(val);
      const num = parseFloat(val);
      if (!isNaN(num)) {
          if (sizeUnit === 'XAU') {
              if (maxBuyXAU > 0) setSizeSliderValue(Math.min(100, (num / maxBuyXAU) * 100));
          } else {
              if (maxBuyUSDC > 0) setSizeSliderValue(Math.min(100, (num / maxBuyUSDC) * 100));
          }
      } else {
          setSizeSliderValue(0);
      }
  };

  // Calculations for Display
  const currentSizeXAU = sizeUnit === 'XAU' ? parseFloat(amount) : (parseFloat(amount) / executionPrice);
  const marginRequired = amount ? (currentSizeXAU * executionPrice / leverage) : 0;
  
  // Est. Liq Price Formulas (Simplified)
  // Long: Entry * (1 - 1/Lev)
  // Short: Entry * (1 + 1/Lev)
  const longLiqPrice = executionPrice * (1 - 1/leverage);
  const shortLiqPrice = executionPrice * (1 + 1/leverage);

  // Mock Data
  const markPrice = currentPrice * 1.0001;
  const fundingRate = 0.0042; // 0.0042%
  const estimatedAPR = (fundingRate * 365).toFixed(2);

  return (
    <div className="flex flex-col h-full pb-20 overflow-y-auto no-scrollbar dark:bg-slate-900 bg-slate-50 relative">
      {/* Header */}
      <div className="dark:bg-slate-900 bg-white border-b dark:border-slate-800 border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center">
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
      <div className="relative border-b dark:border-slate-800 border-slate-200 dark:bg-slate-900 bg-white min-h-[290px]">
        {/* Timeframe Selector (Scrollable) */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-2 py-2 border-b dark:border-slate-800 border-slate-100 touch-pan-x">
           {TIMEFRAMES.map((tf) => (
               <button
                  key={tf}
                  onClick={() => onTimeframeChange(tf)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap transition-colors flex-shrink-0 ${timeframe === tf ? 'bg-indigo-500/10 text-indigo-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
               >
                   {tf}
               </button>
           ))}
        </div>

        {chartType === 'depth' ? (
           <DepthChart currentPrice={currentPrice} />
        ) : (
           <CandleChart data={candles} type={chartType} />
        )}

        <div className="absolute top-10 right-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 flex border dark:border-slate-700 border-slate-200 shadow-sm z-10">
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
      </div>

      {/* Main Trade Area: Split View (OrderBook Left, Form Right) */}
      <div className="flex flex-1 min-h-[420px] dark:bg-slate-900 bg-white">
          
          {/* Left Column: Order Book & Recent Trades Tab */}
          <div className="w-[42%] border-r dark:border-slate-800 border-slate-200 flex flex-col">
             {/* Book / Trades Tabs */}
             <div className="flex border-b dark:border-slate-800 border-slate-200">
                <button 
                    onClick={() => setActiveBookTab('book')}
                    className={`flex-1 py-2 text-[10px] font-bold transition-colors border-b-2 ${activeBookTab === 'book' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-400'}`}
                >
                    {t.tabOrderBook}
                </button>
                <button 
                    onClick={() => setActiveBookTab('trades')}
                    className={`flex-1 py-2 text-[10px] font-bold transition-colors border-b-2 ${activeBookTab === 'trades' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-400'}`}
                >
                    {t.tabRecentTrades}
                </button>
             </div>

             {/* Content */}
             <div className="flex-1 overflow-hidden p-1">
                {activeBookTab === 'book' ? (
                   <OrderBook 
                        currentPrice={currentPrice} 
                        onPriceSelect={(p) => {
                            setOrderType('LIMIT');
                            setLimitPrice(p);
                        }}
                   />
                ) : (
                   <div className="h-full overflow-y-auto no-scrollbar">
                      <div className="grid grid-cols-2 text-[9px] dark:text-slate-500 text-slate-400 mb-1 px-1">
                          <span>{t.price}</span>
                          <span className="text-right">{t.qty}</span>
                      </div>
                      <div className="space-y-0.5">
                          {marketTrades.map((trade) => (
                              <div key={trade.id} className="grid grid-cols-2 text-[9px] font-mono animate-in fade-in slide-in-from-top-1 duration-300 px-1 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                                  <span className={trade.side === Side.LONG ? 'text-emerald-500' : 'text-rose-500'}>
                                      {trade.price.toFixed(2)}
                                  </span>
                                  <span className="text-right dark:text-slate-300 text-slate-700">
                                      {trade.size.toFixed(4)}
                                  </span>
                              </div>
                          ))}
                      </div>
                   </div>
                )}
             </div>
          </div>

          {/* Right Column: Order Form */}
          <div className="w-[58%] p-3 flex flex-col">
              
              {/* Top Controls: Margin & Leverage */}
              <div className="flex gap-2 mb-3">
                 {/* Margin Mode Switch */}
                 <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-md p-0.5 flex">
                    <button 
                        onClick={() => setMarginMode(MarginMode.CROSS)}
                        className={`flex-1 text-[10px] font-bold rounded py-1.5 transition-all ${marginMode === MarginMode.CROSS ? 'bg-white dark:bg-slate-600 shadow text-indigo-500' : 'text-slate-400'}`}
                    >
                        {t.cross}
                    </button>
                    <button 
                        onClick={() => setMarginMode(MarginMode.ISOLATED)}
                        className={`flex-1 text-[10px] font-bold rounded py-1.5 transition-all ${marginMode === MarginMode.ISOLATED ? 'bg-white dark:bg-slate-600 shadow text-indigo-500' : 'text-slate-400'}`}
                    >
                        {t.isolated}
                    </button>
                 </div>
                 
                 <div className="relative flex-1">
                     <button 
                        onClick={() => {
                            setTempLeverage(leverage);
                            setShowLeverageModal(true);
                        }}
                        className="w-full bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 border-slate-200 rounded-md py-2 px-2 text-[10px] font-bold text-center dark:text-white text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1"
                     >
                         {leverage}x
                         <Edit2 size={8} className="opacity-50" />
                     </button>
                 </div>
              </div>

              {/* Order Type Toggle (Market First) */}
              <div className="flex dark:bg-slate-800 bg-slate-100 rounded-lg p-0.5 mb-3">
                 <button 
                    onClick={() => setOrderType('MARKET')}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${orderType === 'MARKET' ? 'dark:bg-slate-600 bg-white dark:text-white text-slate-900 shadow' : 'text-slate-500'}`}
                 >
                    {t.market}
                 </button>
                 <button 
                    onClick={() => setOrderType('LIMIT')}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${orderType === 'LIMIT' ? 'dark:bg-slate-600 bg-white dark:text-white text-slate-900 shadow' : 'text-slate-500'}`}
                 >
                    {t.limit}
                 </button>
              </div>

              {/* Price Input */}
              <div className="mb-3">
                 <div className="flex justify-between mb-1">
                    <label className="text-[10px] text-slate-500">{t.price}</label>
                 </div>
                 <div className="relative">
                     <input 
                       type="text"
                       value={orderType === 'MARKET' ? `${t.market} ${t.price}` : limitPrice}
                       onChange={(e) => setLimitPrice(e.target.value)}
                       disabled={orderType === 'MARKET'}
                       placeholder={orderType === 'MARKET' ? `${t.market} ${t.price}` : '0.00'}
                       className={`w-full dark:bg-slate-800 bg-slate-50 border dark:border-slate-700 border-slate-200 rounded-lg py-2.5 px-3 text-sm font-mono focus:outline-none focus:border-indigo-500 ${orderType === 'MARKET' ? 'text-slate-400 italic cursor-not-allowed' : 'dark:text-white text-slate-900'}`}
                     />
                     {orderType === 'LIMIT' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">USDC</span>}
                 </div>
              </div>

              {/* Size Input with Unit Selector */}
              <div className="mb-6">
                 <div className="flex justify-between mb-1">
                    <label className="text-[10px] text-slate-500">{t.size}</label>
                    <span className="text-[10px] text-slate-500">{t.avail}: <span className="dark:text-white text-slate-900 font-mono">{balance.toFixed(2)}</span> USDC</span>
                 </div>
                 <div className="relative">
                     <input 
                       type="number"
                       value={amount}
                       onChange={handleAmountChange}
                       placeholder="Amount"
                       className="w-full dark:bg-slate-800 bg-slate-50 border dark:border-slate-700 border-slate-200 rounded-lg py-2.5 pl-3 pr-20 text-sm font-mono dark:text-white text-slate-900 focus:outline-none focus:border-indigo-500"
                     />
                     <div className="absolute right-0 top-0 bottom-0 flex items-center pr-2">
                         <div className="relative bg-slate-100 dark:bg-slate-700 rounded-md">
                            <select 
                                value={sizeUnit}
                                onChange={handleUnitChange}
                                className="appearance-none bg-transparent border-none text-[10px] font-bold py-1.5 pl-2 pr-6 rounded-md focus:ring-0 cursor-pointer dark:text-white text-slate-900"
                            >
                                <option value="XAU">XAU</option>
                                <option value="USDC">USDC</option>
                            </select>
                            <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                         </div>
                     </div>
                 </div>
              </div>

              {/* Circular Percentage Slider */}
              <div className="mb-4 px-2 relative h-10 flex items-center">
                 {/* Track */}
                 <div className="absolute inset-x-0 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                    <div 
                        className="h-full bg-indigo-500 rounded-l-lg" 
                        style={{ width: `${sizeSliderValue}%` }}
                    />
                 </div>
                 
                 {/* Input Range (Invisible but clickable) */}
                 <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="1" 
                    value={sizeSliderValue}
                    onChange={handleSizeSliderChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                 />
                 
                 {/* Custom Circular Thumb */}
                 <div 
                    className="absolute h-8 w-8 bg-white dark:bg-slate-800 border-2 border-indigo-500 shadow-md rounded-full flex items-center justify-center z-10 pointer-events-none transition-transform"
                    style={{ left: `${sizeSliderValue}%`, transform: 'translateX(-50%)' }}
                 >
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">{Math.round(sizeSliderValue)}%</span>
                 </div>
              </div>
              
              <div className="flex justify-between text-[9px] text-slate-400 mb-4 font-mono px-1">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                  <button 
                    onClick={() => handleTrade(Side.LONG)}
                    className="flex-1 py-3 rounded-lg bg-emerald-600 active:bg-emerald-700 text-white shadow-lg shadow-emerald-900/10 transition-transform active:scale-95 flex flex-col items-center justify-center"
                  >
                    <span className="font-bold text-sm">{t.long.split('/')[1] || 'Long'}</span>
                  </button>
                  <button 
                    onClick={() => handleTrade(Side.SHORT)}
                    className="flex-1 py-3 rounded-lg bg-rose-600 active:bg-rose-700 text-white shadow-lg shadow-rose-900/10 transition-transform active:scale-95 flex flex-col items-center justify-center"
                  >
                    <span className="font-bold text-sm">{t.short.split('/')[1] || 'Short'}</span>
                  </button>
              </div>

              {/* Detailed Stats below buttons */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                  {/* Long Stats */}
                  <div className="space-y-1.5">
                     <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">{t.estLiqPrice}</span>
                        <span className="font-mono text-orange-500">{longLiqPrice.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">{t.margin}</span>
                        <span className="font-mono dark:text-slate-300 text-slate-700">{marginRequired.toFixed(1)}</span>
                     </div>
                     <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">{t.max}</span>
                        <span className="font-mono dark:text-slate-300 text-slate-700">{maxBuyXAU.toFixed(2)}</span>
                     </div>
                  </div>

                  {/* Short Stats */}
                  <div className="space-y-1.5 border-l dark:border-slate-800 pl-3">
                     <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">{t.estLiqPrice}</span>
                        <span className="font-mono text-orange-500">{shortLiqPrice.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">{t.margin}</span>
                        <span className="font-mono dark:text-slate-300 text-slate-700">{marginRequired.toFixed(1)}</span>
                     </div>
                     <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">{t.max}</span>
                        <span className="font-mono dark:text-slate-300 text-slate-700">{maxBuyXAU.toFixed(2)}</span>
                     </div>
                  </div>
              </div>

          </div>
      </div>

      {/* Leverage Adjustment Modal */}
      {showLeverageModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
             <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="text-lg font-bold dark:text-white text-slate-900">{t.leverage}</h3>
                     <button onClick={() => setShowLeverageModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={20}/></button>
                 </div>
                 
                 <div className="mb-8 text-center">
                    <div className="text-4xl font-mono font-bold text-indigo-500 mb-2">{tempLeverage}x</div>
                    <div className="text-xs text-slate-500">Max Position: ${(balance * tempLeverage).toLocaleString()}</div>
                 </div>

                 <div className="mb-6 px-2">
                    <input 
                        type="range" 
                        min="1" 
                        max="100" 
                        step="1" 
                        value={tempLeverage} 
                        onChange={(e) => setTempLeverage(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
                        <span>1x</span>
                        <span>25x</span>
                        <span>50x</span>
                        <span>75x</span>
                        <span>100x</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowLeverageModal(false)} className="py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">
                        {t.cancel}
                    </button>
                    <button 
                        onClick={() => {
                            setLeverage(tempLeverage);
                            setShowLeverageModal(false);
                            // Recalculate slider based on new leverage if amount exists
                            // Or just reset amount to avoid issues
                            // For UX, often better to keep amount but it might exceed limits. 
                            // Let's keep amount but update slider visual
                            if (amount && parseFloat(amount) > 0) {
                                const newMax = (balance * tempLeverage) / executionPrice;
                                const newPct = Math.min(100, (parseFloat(amount) / newMax) * 100);
                                setSizeSliderValue(newPct);
                            }
                        }}
                        className="py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-500"
                    >
                        {t.confirmAction}
                    </button>
                </div>
             </div>
        </div>
      )}

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
                         <span className="font-mono text-orange-400">{estimatedAPR}%</span>
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