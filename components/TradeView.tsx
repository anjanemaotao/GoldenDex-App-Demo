
import React, { useState, useEffect, useMemo } from 'react';
import { Settings2, Info, X, BarChart2, TrendingUp, Layers, ChevronDown, Edit2, Search } from 'lucide-react';
import { CandleChart } from './CandleChart';
import { OrderBook } from './OrderBook';
import { DepthChart } from './DepthChart';
import { Candle, Side, MarginMode, Language, ChartType, MarketTrade, Timeframe, MarketInfo } from '../types';
import { TRANSLATIONS, MOCK_MARKETS } from '../constants';

interface TradeViewProps {
  symbol: string;
  currentMarket: MarketInfo;
  onSymbolChange: (symbol: string) => void;
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
  symbol,
  currentMarket,
  onSymbolChange,
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
  const [showMarketSelector, setShowMarketSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tempLeverage, setTempLeverage] = useState(20);
  const [activeBookTab, setActiveBookTab] = useState<'book' | 'trades'>('book');
  const [sizeSliderValue, setSizeSliderValue] = useState<number>(0);
  
  const [countdown, setCountdown] = useState<string>('00:59:59');

  const changePercent = ((currentPrice - currentMarket.lastPrice * 0.98) / (currentMarket.lastPrice * 0.98)) * 100;
  const isPositiveChange = changePercent >= 0;

  const filteredMarkets = useMemo(() => {
    return MOCK_MARKETS.filter(m => 
      m.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const formatVolume = (num: number) => {
    return Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 2 }).format(num);
  };

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
  const maxBuyXAU = executionPrice > 0 ? (balance * leverage) / executionPrice : 0;
  const maxBuyUSDC = balance * leverage;

  const handleTrade = (side: Side) => {
    let size = parseFloat(amount);
    if (isNaN(size) || size <= 0) return;
    if (sizeUnit === 'USDC') size = size / executionPrice;
    onPlaceOrder(side, size, executionPrice, orderType, marginMode);
    setAmount('');
    setSizeSliderValue(0);
  };

  const longLiqPrice = executionPrice * (1 - 1/leverage);
  const shortLiqPrice = executionPrice * (1 + 1/leverage);
  const marginRequired = amount ? ((sizeUnit === 'XAU' ? parseFloat(amount) : parseFloat(amount)/executionPrice) * executionPrice / leverage) : 0;

  return (
    <div className="flex flex-col h-full pb-20 overflow-y-auto no-scrollbar dark:bg-slate-900 bg-slate-50 relative">
      {/* Dynamic Header */}
      <div className="dark:bg-slate-900 bg-white border-b dark:border-slate-800 border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="px-4 py-3 flex justify-between items-center">
            <div 
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => setShowMarketSelector(true)}
            >
              <div className="w-8 h-8 rounded-full border dark:border-slate-700 border-slate-200 flex items-center justify-center bg-slate-50 dark:bg-slate-800 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center font-bold text-indigo-500 bg-indigo-500/10">
                    {symbol.charAt(0)}
                  </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-lg font-bold dark:text-white text-slate-900 leading-tight uppercase">{symbol}</h1>
                  <ChevronDown size={14} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </div>
                <span className="text-[10px] text-slate-400 font-medium tracking-wider">Perp</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-xl font-mono font-bold ${isPositiveChange ? 'text-emerald-500' : 'text-rose-500'}`}>
                {currentPrice.toFixed(2)}
              </div>
              <div className="flex items-center justify-end gap-1.5 text-[10px]">
                <span className={`font-mono font-medium ${isPositiveChange ? 'text-emerald-500' : 'text-rose-500'}`}>
                   {isPositiveChange ? '+' : ''}{changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="px-4 py-2 flex items-center justify-between gap-6 overflow-x-auto no-scrollbar whitespace-nowrap text-[10px] dark:bg-slate-800/50 bg-slate-50 border-t dark:border-slate-800 border-slate-100">
             <div className="flex flex-col shrink-0">
                <span className="text-slate-400 mb-0.5">{t.markPrice}</span>
                <span className="font-mono dark:text-slate-200 text-slate-700">{currentPrice.toFixed(2)}</span>
             </div>
             <div className="flex flex-col shrink-0">
                <span className="text-slate-400 mb-0.5">{t.vol24h}</span>
                <span className="font-mono dark:text-slate-200 text-slate-700">{formatVolume(currentMarket.volume24h)}</span>
             </div>
             <div 
                className="flex flex-col text-center cursor-pointer group shrink-0"
                onClick={() => setShowFundingModal(true)}
             >
                <span className="text-slate-400 mb-0.5 group-hover:text-indigo-500 border-b border-dashed border-slate-400/50 group-hover:border-indigo-500 transition-colors">{t.fundingRate}</span>
                <span className={`font-mono ${currentMarket.fundingRate >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{currentMarket.fundingRate.toFixed(4)}%</span>
             </div>
             <div className="flex flex-col text-right shrink-0">
                <span className="text-slate-400 mb-0.5">{t.countdown}</span>
                <span className="font-mono dark:text-slate-200 text-slate-700">{countdown}</span>
             </div>
          </div>
      </div>

      {/* Contract Switcher Modal - Centered and constrained to App width */}
      {showMarketSelector && (
          <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 flex flex-col bg-white dark:bg-slate-900 animate-in fade-in slide-in-from-top duration-300 shadow-2xl border-x dark:border-slate-800 border-slate-200">
              <div className="p-4 flex items-center gap-3 border-b dark:border-slate-800 border-slate-100">
                  <div className="flex-1 relative">
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.searchPlaceholder}
                      className="w-full bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 border-slate-200 rounded-lg py-2 pl-4 pr-10 text-sm outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                      autoFocus
                    />
                    <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  <button onClick={() => setShowMarketSelector(false)} className="text-slate-500 font-medium text-sm">{t.cancel}</button>
              </div>

              <div className="px-4 py-3 grid grid-cols-5 text-[10px] dark:text-slate-500 text-slate-400 font-bold uppercase tracking-wider border-b dark:border-slate-800/50 border-slate-50">
                  <span className="col-span-1">{t.marketList.contract}</span>
                  <span className="text-right">{t.marketList.lastPrice}</span>
                  <span className="text-right">{t.marketList.change}</span>
                  <span className="text-right">{t.marketList.volume}</span>
                  <span className="text-right">{t.marketList.funding}</span>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar">
                  {filteredMarkets.map((m) => (
                      <div 
                        key={m.symbol}
                        onClick={() => {
                            onSymbolChange(m.symbol);
                            setShowMarketSelector(false);
                        }}
                        className={`px-4 py-4 grid grid-cols-5 items-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b dark:border-slate-800/30 border-slate-50 ${m.symbol === symbol ? 'bg-slate-100 dark:bg-slate-800/50' : ''}`}
                      >
                          <div className="col-span-1 flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] bg-indigo-500/10 text-indigo-500">
                                {m.symbol.charAt(0)}
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                  <span className="font-bold dark:text-white text-slate-900 text-xs truncate uppercase">{m.symbol}</span>
                                  <span className="text-[9px] bg-slate-200 dark:bg-slate-700 dark:text-slate-400 text-slate-600 rounded px-1 w-fit mt-0.5">{m.leverage}x</span>
                              </div>
                          </div>
                          <div className="text-right text-xs font-mono font-bold dark:text-slate-200 text-slate-700">
                              {m.lastPrice.toFixed(2)}
                          </div>
                          <div className={`text-right text-xs font-mono font-bold ${m.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {m.change24h >= 0 ? '+' : ''}{m.change24h.toFixed(2)}%
                          </div>
                          <div className="text-right text-[10px] font-mono dark:text-slate-400 text-slate-500">
                              {formatVolume(m.volume24h)}
                          </div>
                          <div className={`text-right text-[10px] font-mono ${m.fundingRate >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {m.fundingRate >= 0 ? '+' : ''}{m.fundingRate.toFixed(4)}%
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Existing Chart and Panels */}
      <div className="relative border-b dark:border-slate-800 border-slate-200 dark:bg-slate-900 bg-white min-h-[290px]">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-2 py-2 border-b dark:border-slate-800 border-slate-100 touch-pan-x">
           {TIMEFRAMES.map((tf) => (
               <button key={tf} onClick={() => onTimeframeChange(tf)} className={`text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap transition-colors flex-shrink-0 ${timeframe === tf ? 'bg-indigo-500/10 text-indigo-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>{tf}</button>
           ))}
        </div>
        {chartType === 'depth' ? <DepthChart currentPrice={currentPrice} /> : <CandleChart data={candles} type={chartType} />}
        <div className="absolute top-10 right-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 flex border dark:border-slate-700 border-slate-200 shadow-sm z-10">
            <button onClick={() => setChartType('line')} className={`p-1.5 rounded-md ${chartType === 'line' ? 'bg-white dark:bg-slate-600 shadow text-indigo-500' : 'text-slate-400'}`}><TrendingUp size={14} /></button>
            <button onClick={() => setChartType('candle')} className={`p-1.5 rounded-md ${chartType === 'candle' ? 'bg-white dark:bg-slate-600 shadow text-indigo-500' : 'text-slate-400'}`}><BarChart2 size={14} /></button>
            <button onClick={() => setChartType('depth')} className={`p-1.5 rounded-md ${chartType === 'depth' ? 'bg-white dark:bg-slate-600 shadow text-indigo-500' : 'text-slate-400'}`}><Layers size={14} /></button>
        </div>
      </div>

      <div className="flex flex-1 min-h-[420px] dark:bg-slate-900 bg-white">
          <div className="w-[42%] border-r dark:border-slate-800 border-slate-200 flex flex-col">
             <div className="flex border-b dark:border-slate-800 border-slate-200">
                <button onClick={() => setActiveBookTab('book')} className={`flex-1 py-2 text-[10px] font-bold transition-colors border-b-2 ${activeBookTab === 'book' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-400'}`}>{t.tabOrderBook}</button>
                <button onClick={() => setActiveBookTab('trades')} className={`flex-1 py-2 text-[10px] font-bold transition-colors border-b-2 ${activeBookTab === 'trades' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-400'}`}>{t.tabRecentTrades}</button>
             </div>
             <div className="flex-1 overflow-hidden p-1">
                {activeBookTab === 'book' ? <OrderBook currentPrice={currentPrice} lang={lang} onPriceSelect={(p) => setLimitPrice(p)} /> : (
                   <div className="h-full overflow-y-auto no-scrollbar px-1">
                      <div className="grid grid-cols-2 text-[9px] dark:text-slate-500 text-slate-400 mb-1"><span>{t.price}</span><span className="text-right">{t.qty}</span></div>
                      {marketTrades.map((trade) => (
                          <div key={trade.id} className="grid grid-cols-2 text-[9px] font-mono py-0.5"><span className={trade.side === Side.LONG ? 'text-emerald-500' : 'text-rose-500'}>{trade.price.toFixed(2)}</span><span className="text-right dark:text-slate-300 text-slate-700">{trade.size.toFixed(4)}</span></div>
                      ))}
                   </div>
                )}
             </div>
          </div>

          <div className="w-[58%] p-3 flex flex-col">
              <div className="flex gap-2 mb-3">
                 <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-md p-0.5 flex">
                    <button onClick={() => setMarginMode(MarginMode.CROSS)} className={`flex-1 text-[10px] font-bold rounded py-1.5 transition-all ${marginMode === MarginMode.CROSS ? 'bg-white dark:bg-slate-600 shadow text-indigo-500' : 'text-slate-400'}`}>{t.cross}</button>
                    <button onClick={() => setMarginMode(MarginMode.ISOLATED)} className={`flex-1 text-[10px] font-bold rounded py-1.5 transition-all ${marginMode === MarginMode.ISOLATED ? 'bg-white dark:bg-slate-600 shadow text-indigo-500' : 'text-slate-400'}`}>{t.isolated}</button>
                 </div>
                 <button onClick={() => { setTempLeverage(leverage); setShowLeverageModal(true); }} className="flex-1 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 border-slate-200 rounded-md py-2 text-[10px] font-bold dark:text-white text-slate-900 flex items-center justify-center gap-1">{leverage}x <Edit2 size={8} /></button>
              </div>

              <div className="flex dark:bg-slate-800 bg-slate-100 rounded-lg p-0.5 mb-3">
                 <button onClick={() => setOrderType('MARKET')} className={`flex-1 py-1 text-[10px] font-bold rounded-md ${orderType === 'MARKET' ? 'dark:bg-slate-600 bg-white dark:text-white text-slate-900 shadow' : 'text-slate-500'}`}>{t.market}</button>
                 <button onClick={() => setOrderType('LIMIT')} className={`flex-1 py-1 text-[10px] font-bold rounded-md ${orderType === 'LIMIT' ? 'dark:bg-slate-600 bg-white dark:text-white text-slate-900 shadow' : 'text-slate-500'}`}>{t.limit}</button>
              </div>

              <div className="mb-3">
                 <label className="text-[10px] text-slate-500 block mb-1">{t.price}</label>
                 <div className="relative">
                     <input type="text" value={orderType === 'MARKET' ? `${t.market}` : limitPrice} onChange={(e) => setLimitPrice(e.target.value)} disabled={orderType === 'MARKET'} className={`w-full dark:bg-slate-800 bg-slate-50 border dark:border-slate-700 border-slate-200 rounded-lg py-2.5 px-3 text-sm font-mono focus:border-indigo-500 outline-none ${orderType === 'MARKET' ? 'text-slate-400' : 'dark:text-white text-slate-900'}`} />
                     {orderType === 'LIMIT' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">USDC</span>}
                 </div>
              </div>

              <div className="mb-6">
                 <div className="flex justify-between mb-1"><label className="text-[10px] text-slate-500">{t.size}</label><span className="text-[10px] text-slate-500">{t.avail}: <span className="dark:text-white text-slate-900 font-mono">{balance.toFixed(2)}</span> USDC</span></div>
                 <div className="relative">
                     <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t.quantity} className="w-full dark:bg-slate-800 bg-slate-50 border dark:border-slate-700 border-slate-200 rounded-lg py-2.5 pl-3 pr-16 text-sm font-mono dark:text-white text-slate-900 outline-none focus:border-indigo-500" />
                     <div className="absolute right-0 top-0 bottom-0 flex items-center pr-2">
                        <select value={sizeUnit} onChange={(e) => setSizeUnit(e.target.value as any)} className="bg-transparent border-none text-[10px] font-bold focus:ring-0 cursor-pointer dark:text-white text-slate-900"><option value="XAU">XAU</option><option value="USDC">USDC</option></select>
                     </div>
                 </div>
              </div>

              <div className="mb-4 px-2 relative h-10 flex items-center">
                 <div className="absolute inset-x-0 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg"><div className="h-full bg-indigo-500 rounded-l-lg" style={{ width: `${sizeSliderValue}%` }} /></div>
                 <input type="range" min="0" max="100" step="1" value={sizeSliderValue} onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setSizeSliderValue(val);
                    if (val === 0) setAmount('');
                    else setAmount(((sizeUnit === 'XAU' ? maxBuyXAU : maxBuyUSDC) * val / 100).toFixed(4));
                 }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                 <div className="absolute h-8 w-8 bg-white dark:bg-slate-800 border-2 border-indigo-500 shadow-md rounded-full flex items-center justify-center z-10 pointer-events-none transition-transform" style={{ left: `${sizeSliderValue}%`, transform: 'translateX(-50%)' }}><span className="text-[10px] font-bold text-indigo-600 font-mono">{Math.round(sizeSliderValue)}%</span></div>
              </div>
              
              <div className="flex gap-2">
                  <button onClick={() => handleTrade(Side.LONG)} className="flex-1 py-3 rounded-lg bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-900/10 active:scale-95 transition-transform">{t.long.split('/')[1]}</button>
                  <button onClick={() => handleTrade(Side.SHORT)} className="flex-1 py-3 rounded-lg bg-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-900/10 active:scale-95 transition-transform">{t.short.split('/')[1]}</button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <div className="flex justify-between text-[10px]"><span className="text-slate-500">{t.estLiqPrice}</span><span className="font-mono text-orange-500">{longLiqPrice.toFixed(2)}</span></div>
                     <div className="flex justify-between text-[10px]"><span className="text-slate-500">{t.margin}</span><span className="font-mono dark:text-slate-300 text-slate-700">{marginRequired.toFixed(1)}</span></div>
                     <div className="flex justify-between text-[10px]"><span className="text-slate-500">{t.max}</span><span className="font-mono dark:text-slate-300 text-slate-700">{maxBuyXAU.toFixed(2)}</span></div>
                  </div>
                  <div className="space-y-1.5 border-l dark:border-slate-800 pl-3">
                     <div className="flex justify-between text-[10px]"><span className="text-slate-500">{t.estLiqPrice}</span><span className="font-mono text-orange-500">{shortLiqPrice.toFixed(2)}</span></div>
                     <div className="flex justify-between text-[10px]"><span className="text-slate-500">{t.margin}</span><span className="font-mono dark:text-slate-300 text-slate-700">{marginRequired.toFixed(1)}</span></div>
                     <div className="flex justify-between text-[10px]"><span className="text-slate-500">{t.max}</span><span className="font-mono dark:text-slate-300 text-slate-700">{maxBuyXAU.toFixed(2)}</span></div>
                  </div>
              </div>
          </div>
      </div>
      
      {showLeverageModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
             <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                 <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold dark:text-white text-slate-900">{t.leverage}</h3><button onClick={() => setShowLeverageModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={20}/></button></div>
                 <div className="mb-8 text-center"><div className="text-4xl font-mono font-bold text-indigo-500 mb-2">{tempLeverage}x</div><div className="text-xs text-slate-500">Max Position: ${(balance * tempLeverage).toLocaleString()}</div></div>
                 <div className="mb-6 px-2"><input type="range" min="1" max="100" step="1" value={tempLeverage} onChange={(e) => setTempLeverage(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" /><div className="flex justify-between text-xs text-slate-400 mt-2 font-mono"><span>1x</span><span>25x</span><span>50x</span><span>75x</span><span>100x</span></div></div>
                 <div className="grid grid-cols-2 gap-3"><button onClick={() => setShowLeverageModal(false)} className="py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">{t.cancel}</button><button onClick={() => { setLeverage(tempLeverage); setShowLeverageModal(false); if (amount && parseFloat(amount) > 0) { const newMax = (balance * tempLeverage) / executionPrice; const newPct = Math.min(100, (parseFloat(amount) / newMax) * 100); setSizeSliderValue(newPct); } }} className="py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-500">{t.confirmAction}</button></div>
             </div>
        </div>
      )}

      {showFundingModal && (
         <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
             <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-sm p-5 shadow-2xl animate-in zoom-in-95 duration-200">
                 <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold dark:text-white text-slate-900">{t.fundingDetails.title}</h3><button onClick={() => setShowFundingModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={20}/></button></div>
                 <div className="space-y-4">
                     <div className="flex justify-between text-sm"><span className="text-slate-500">{t.fundingDetails.interval}</span><span className="font-mono dark:text-slate-200 text-slate-800">{t.fundingDetails.intervalValue}</span></div>
                     <div className="flex justify-between text-sm"><span className="text-slate-500">{t.fundingDetails.direction}</span><span className="font-mono text-emerald-500">{t.fundingDetails.directionValue}</span></div>
                     <div className="border-t dark:border-slate-700 border-slate-100 my-2"></div>
                     <div className="flex justify-between text-sm"><span className="text-slate-500">{t.fundingDetails.interestRate}</span><span className="font-mono dark:text-slate-200 text-slate-800">0.0100%</span></div>
                     <div className="flex justify-between text-sm"><span className="text-slate-500">Estimated APR</span><span className="font-mono text-orange-400">1.53%</span></div>
                     <div className="bg-indigo-50 dark:bg-slate-700/50 p-3 rounded-lg mt-4"><div className="flex gap-2"><Info size={16} className="text-indigo-500 shrink-0 mt-0.5"/><p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t.fundingDetails.description}</p></div></div>
                 </div>
                 <button onClick={() => setShowFundingModal(false)} className="w-full mt-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20">{t.confirmAction}</button>
             </div>
         </div>
      )}
    </div>
  );
};
