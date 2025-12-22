
import React, { useState, useEffect } from 'react';
import { Position, Side, MarginMode, Language } from '../types';
import { TrendingUp, TrendingDown, AlertTriangle, Plus, Minus, X, Trash2, ArrowRight, ArrowRightLeft, ChevronDown } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface PositionsViewProps {
  positions: Position[];
  currentPrice: number;
  equity: number;
  balance: number;
  maintenanceMargin: number;
  marginRatio: number;
  onClosePosition: (id: string, amount: number, price: number, type: 'MARKET' | 'LIMIT') => void;
  onUpdateMargin: (id: string, amount: number, type: 'ADD' | 'REMOVE') => void;
  onCloseAllPositions: () => void;
  lang: Language;
}

export const PositionsView: React.FC<PositionsViewProps> = ({ 
  positions, 
  currentPrice, 
  equity,
  balance,
  maintenanceMargin,
  marginRatio,
  onClosePosition,
  onUpdateMargin,
  onCloseAllPositions,
  lang
}) => {
  const t = TRANSLATIONS[lang];
  const [editingPosId, setEditingPosId] = useState<string | null>(null);
  const [marginAction, setMarginAction] = useState<'ADD' | 'REMOVE'>('ADD');
  
  // Close Position Modal State
  const [closingPosId, setClosingPosId] = useState<string | null>(null);
  const [closeOrderType, setCloseOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [closePrice, setClosePrice] = useState<string>('');
  const [closeAmount, setCloseAmount] = useState<string>('');
  const [closePercent, setClosePercent] = useState<number>(100);
  const [closeUnit, setCloseUnit] = useState<'XAU' | 'USDC'>('XAU');

  // Independent states for Add and Remove inputs
  const [addMarginInput, setAddMarginInput] = useState<string>('');
  const [removeMarginInput, setRemoveMarginInput] = useState<string>('');
  
  const [showCloseAllConfirm, setShowCloseAllConfirm] = useState(false);

  // Helper to get correct input state
  const currentMarginInput = marginAction === 'ADD' ? addMarginInput : removeMarginInput;
  const setMarginInput = (val: string) => {
      if (marginAction === 'ADD') setAddMarginInput(val);
      else setRemoveMarginInput(val);
  };

  const handleConfirmMargin = () => {
    if (editingPosId && currentMarginInput) {
        onUpdateMargin(editingPosId, parseFloat(currentMarginInput), marginAction);
        setEditingPosId(null);
        setAddMarginInput('');
        setRemoveMarginInput('');
    }
  };
  
  const closingPos = positions.find(p => p.id === closingPosId);

  // Handle Close Modal Price/Amount logic
  useEffect(() => {
    if (closingPos) {
       const maxInXAU = closingPos.size;
       const targetXAU = maxInXAU * closePercent / 100;
       
       if (closeUnit === 'XAU') {
          setCloseAmount(targetXAU.toFixed(4));
       } else {
          setCloseAmount((targetXAU * currentPrice).toFixed(2));
       }
       
       if (closeOrderType === 'MARKET') {
          setClosePrice('');
       } else if (!closePrice) {
          setClosePrice(currentPrice.toFixed(2));
       }
    }
  }, [closingPosId, closePercent, closeOrderType, currentPrice, closeUnit]);

  const handleExecuteClose = () => {
    if (closingPosId && closingPos && closeAmount) {
       let xauAmount = parseFloat(closeAmount);
       if (closeUnit === 'USDC') {
          xauAmount = xauAmount / currentPrice;
       }
       const executionPrice = closeOrderType === 'MARKET' ? currentPrice : (parseFloat(closePrice) || currentPrice);
       onClosePosition(closingPosId, xauAmount, executionPrice, closeOrderType);
       setClosingPosId(null);
    }
  };

  // Close Button Validation
  const closeNum = parseFloat(closeAmount);
  const maxInUnit = closingPos ? (closeUnit === 'XAU' ? closingPos.size : closingPos.size * currentPrice) : 0;
  const isCloseValid = !isNaN(closeNum) && closeNum > 0 && closeNum <= (maxInUnit + 0.0001);

  const getPositionMetrics = () => {
      const pos = positions.find(p => p.id === editingPosId);
      if (!pos || !pos.isolatedMargin) return null;

      const inputVal = parseFloat(currentMarginInput) || 0;
      const change = marginAction === 'ADD' ? inputVal : -inputVal;
      const currentMarginValue = pos.isolatedMargin;
      const newMarginValue = Math.max(0, currentMarginValue + change);
      
      const posValue = pos.entryPrice * pos.size;
      const currentLeverage = posValue / currentMarginValue;
      const newLeverage = newMarginValue > 0 ? posValue / newMarginValue : 0;
      
      const maintMarginReq = posValue * 0.01; 
      const currentRatio = (maintMarginReq / currentMarginValue) * 100;
      const newRatio = newMarginValue > 0 ? (maintMarginReq / newMarginValue) * 100 : 0;

      let currentLiq = pos.side === Side.LONG ? pos.entryPrice - (currentMarginValue / pos.size) : pos.entryPrice + (currentMarginValue / pos.size);
      let newLiq = pos.side === Side.LONG ? pos.entryPrice - (newMarginValue / pos.size) : pos.entryPrice + (newMarginValue / pos.size);
      
      const maxRemove = Math.max(0, currentMarginValue - maintMarginReq);

      return { currentMarginValue, newMarginValue, currentLeverage, newLeverage, currentLiq, newLiq, currentRatio, newRatio, maxRemove };
  };

  const metrics = editingPosId ? getPositionMetrics() : null;

  const isMarginInputValid = () => {
      const val = parseFloat(currentMarginInput);
      if (isNaN(val) || val <= 0) return false;
      return marginAction === 'ADD' ? val <= balance : val <= (metrics?.maxRemove || 0);
  };

  const renderRiskHeader = () => (
    <div className="dark:bg-slate-800/50 bg-white/80 border-b dark:border-slate-800 border-slate-200 p-4 sticky top-0 backdrop-blur-md z-10">
      <div className="grid grid-cols-3 gap-2">
        <div className="dark:bg-slate-800 bg-white rounded-lg p-2 border dark:border-slate-700 border-slate-200 shadow-sm">
           <div className="text-[10px] dark:text-slate-500 text-slate-400 mb-1">{t.marginRatio}</div>
           <div className={`font-mono font-bold text-sm ${marginRatio > 80 ? 'text-rose-500' : 'text-emerald-500'}`}>{marginRatio.toFixed(2)}%</div>
        </div>
        <div className="dark:bg-slate-800 bg-white rounded-lg p-2 border dark:border-slate-700 border-slate-200 shadow-sm">
           <div className="text-[10px] dark:text-slate-500 text-slate-400 mb-1">{t.maintMargin}</div>
           <div className="font-mono font-bold text-sm dark:text-slate-200 text-slate-800">${maintenanceMargin.toFixed(2)}</div>
        </div>
        <div className="dark:bg-slate-800 bg-white rounded-lg p-2 border dark:border-slate-700 border-slate-200 shadow-sm">
           <div className="text-[10px] dark:text-slate-500 text-slate-400 mb-1">{t.marginBal}</div>
           <div className="font-mono font-bold text-sm dark:text-slate-200 text-slate-800">${equity.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );

  if (positions.length === 0) {
    return (
      <div className="h-full flex flex-col">
        {renderRiskHeader()}
        <div className="flex-1 flex flex-col items-center justify-center dark:text-slate-500 text-slate-400">
          <div className="dark:bg-slate-800 bg-white p-4 rounded-full mb-4 shadow-sm border dark:border-slate-700 border-slate-200">
             <TrendingUp size={32} className="opacity-50" />
          </div>
          <p>{t.noPositions}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col dark:bg-slate-900 bg-slate-50 relative">
      {renderRiskHeader()}
      <div className="flex-1 p-4 space-y-3 pb-24 overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-2">
           <h2 className="dark:text-slate-400 text-slate-500 text-xs uppercase font-bold tracking-wider">{t.openPositions} ({positions.length})</h2>
           <button onClick={() => setShowCloseAllConfirm(true)} className="text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 px-2 py-1 rounded border border-rose-500/20 flex items-center gap-1"><Trash2 size={12} />{t.closeAll}</button>
        </div>
        
        {positions.map((pos) => {
          const priceDiff = currentPrice - pos.entryPrice;
          const pnl = pos.side === Side.LONG ? priceDiff * pos.size : -priceDiff * pos.size;
          const marginUsed = pos.marginMode === MarginMode.ISOLATED && pos.isolatedMargin ? pos.isolatedMargin : (pos.entryPrice * pos.size) / pos.leverage;
          const liquidationPrice = pos.side === Side.LONG ? pos.entryPrice - (marginUsed / pos.size) : pos.entryPrice + (marginUsed / pos.size);
          const isProfit = pnl >= 0;

          return (
            <div key={pos.id} className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${pos.side === Side.LONG ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                    {pos.side === Side.LONG ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </div>
                  <div>
                    <h3 className="font-bold dark:text-white text-slate-900 flex items-center gap-2">
                      {pos.symbol}
                      <span className="text-[9px] dark:bg-slate-700 bg-slate-200 dark:text-slate-300 text-slate-600 px-1.5 py-0.5 rounded uppercase font-normal tracking-wide border dark:border-slate-600 border-slate-300">
                        {pos.marginMode === MarginMode.ISOLATED ? t.isolated : t.cross}
                      </span>
                    </h3>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded mt-1 inline-block ${pos.side === Side.LONG ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {pos.leverage}x {pos.side === Side.LONG ? t.longLabel : t.shortLabel}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-mono font-bold ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>{isProfit ? '+' : ''}{pnl.toFixed(2)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-xs mb-4">
                <div className="dark:text-slate-400 text-slate-500">{t.size} (XAU)</div>
                <div className="text-right dark:text-slate-200 text-slate-800 font-mono">{pos.size.toFixed(4)}</div>
                <div className="dark:text-slate-400 text-slate-500">{t.liqPrice}</div>
                <div className="text-right text-orange-500 font-mono font-bold">{liquidationPrice > 0 ? liquidationPrice.toFixed(2) : '0.00'}</div>
                <div className="dark:text-slate-400 text-slate-500">{t.margin}</div>
                <div className="text-right dark:text-slate-200 text-slate-800 font-mono flex items-center justify-end gap-2">
                    {marginUsed.toFixed(2)}
                    {pos.marginMode === MarginMode.ISOLATED && (
                        <button onClick={() => { setEditingPosId(pos.id); setMarginAction('ADD'); }} className="bg-indigo-500/20 text-indigo-500 p-0.5 rounded hover:bg-indigo-500/30"><Plus size={10} /></button>
                    )}
                </div>
              </div>
              <button onClick={() => { setClosingPosId(pos.id); setClosePercent(100); }} className="w-full py-2.5 dark:bg-slate-700 bg-slate-100 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">{t.closePos}</button>
            </div>
          );
        })}
      </div>

      {/* Redesigned Close Position Modal to match screenshot */}
      {closingPos && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
             <div className="bg-[#1b2331] w-full max-w-sm rounded-[24px] p-6 shadow-2xl border border-slate-700/50">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-white">{t.closePos}</h3>
                    <button onClick={() => setClosingPosId(null)} className="text-slate-400 hover:text-white transition-colors">
                      <X size={24}/>
                    </button>
                </div>
                
                <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{t.tradeHistoryFields.pair}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-indigo-400 uppercase tracking-tight">{closingPos.symbol}</span>
                        <span className="text-xl font-bold text-slate-500">/</span>
                        <span className={`text-xl font-bold ${closingPos.side === Side.LONG ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {closingPos.side === Side.LONG ? t.longLabel : t.shortLabel}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 font-medium mb-1">
                        {t.entryPrice}: <span className="text-slate-200 font-mono ml-1">{closingPos.entryPrice.toFixed(2)}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {t.markPrice}: <span className="text-slate-200 font-mono ml-1">{currentPrice.toFixed(2)}</span>
                      </div>
                    </div>
                </div>

                <div className="w-full h-px bg-slate-700/50 mb-6"></div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t.price}</label>
                        <div className="w-full bg-[#131a26] border border-slate-700/80 rounded-xl px-4 py-3 text-sm font-mono text-white flex items-center justify-center h-14">
                           {closeOrderType === 'MARKET' ? t.market : (
                             <input 
                                type="text" 
                                value={closePrice} 
                                onChange={(e) => setClosePrice(e.target.value)} 
                                className="bg-transparent border-none outline-none w-full text-center" 
                             />
                           )}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t.mode}</label>
                        {/* Fix: changed undefined setOrderType to setCloseOrderType */}
                        <div className="w-full bg-[#131a26] border border-slate-700/80 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer h-14" onClick={() => setCloseOrderType(closeOrderType === 'MARKET' ? 'LIMIT' : 'MARKET')}>
                            <span className="text-sm text-white font-medium">{closeOrderType === 'MARKET' ? t.market : t.limit}</span>
                            <ArrowRightLeft size={16} className="text-slate-500" />
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5 mb-8">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t.size}</label>
                    <div className="relative group">
                        <input 
                           type="number" 
                           value={closeAmount} 
                           onChange={(e) => setCloseAmount(e.target.value)} 
                           className="w-full bg-[#131a26] border border-slate-700/80 group-focus-within:border-indigo-500/50 rounded-xl px-4 py-4 text-lg font-mono text-white outline-none h-14" 
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                           <span className="text-[10px] font-bold text-slate-200 mr-1 uppercase">XAU</span>
                           <ChevronDown size={14} className="text-slate-500" />
                        </div>
                    </div>
                </div>

                {/* Percentage Slider to match screenshot */}
                <div className="mb-10 px-1 relative h-6 flex items-center group">
                   <div className="absolute inset-x-0 h-1 bg-slate-700/50 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 transition-all" style={{ width: `${closePercent}%` }} />
                   </div>
                   <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="1" 
                      value={closePercent} 
                      onChange={(e) => setClosePercent(parseInt(e.target.value))} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                   />
                   <div 
                      className="absolute h-6 w-6 bg-indigo-500 border-2 border-[#1b2331] shadow-[0_0_10px_rgba(99,102,241,0.5)] rounded-full flex items-center justify-center z-10 pointer-events-none transition-transform group-active:scale-110" 
                      style={{ left: `${closePercent}%`, transform: 'translateX(-50%)' }}
                   >
                     <div className="absolute bottom-[30px] bg-indigo-600 text-white text-[9px] font-bold py-1 px-1.5 rounded-md shadow-lg after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-indigo-600">
                        {closePercent}%
                     </div>
                   </div>
                </div>

                {/* Summary Info Area to match screenshot */}
                <div className="bg-[#131a26]/50 border border-slate-700/30 rounded-2xl p-5 mb-8">
                   <div className="flex justify-between items-center mb-3">
                      <span className="text-xs text-slate-500 font-medium">{t.closeOperation.positionSize}</span>
                      <span className="text-sm font-bold text-white font-mono">{closingPos.size.toFixed(4)} XAU</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-medium">{t.closeOperation.estPnL}</span>
                      <span className={`text-sm font-bold font-mono ${((currentPrice - closingPos.entryPrice) * (parseFloat(closeAmount) || 0) * (closingPos.side === Side.LONG ? 1 : -1)) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                         {((currentPrice - closingPos.entryPrice) * (parseFloat(closeAmount) || 0) * (closingPos.side === Side.LONG ? 1 : -1)).toFixed(2)} USDC
                      </span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button 
                       onClick={() => setClosingPosId(null)} 
                       className="py-4 rounded-xl border border-slate-700 font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-all active:scale-95"
                    >
                      {t.cancel}
                    </button>
                    <button 
                       onClick={handleExecuteClose} 
                       disabled={!isCloseValid} 
                       className={`py-4 rounded-xl font-bold text-white shadow-[0_4px_20px_rgba(79,70,229,0.3)] transition-all active:scale-95 ${isCloseValid ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                    >
                      {t.confirm}
                    </button>
                </div>
             </div>
          </div>
      )}

      {editingPosId && metrics && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl border dark:border-slate-700 border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg dark:text-white text-slate-900">{t.addMargin}</h3>
                    <button onClick={() => setEditingPosId(null)} className="dark:text-slate-400 text-slate-500"><X size={20}/></button>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1 mb-4">
                    <button onClick={() => setMarginAction('ADD')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${marginAction === 'ADD' ? 'bg-white dark:bg-slate-600 shadow text-indigo-500' : 'text-slate-500'}`}>{t.add}</button>
                    <button onClick={() => setMarginAction('REMOVE')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${marginAction === 'REMOVE' ? 'bg-white dark:bg-slate-600 shadow text-indigo-500' : 'text-slate-500'}`}>{t.remove}</button>
                </div>
                <div className="mb-4">
                    <div className="flex justify-between mb-1">
                        <label className="text-xs text-slate-500 block">{t.amount} (USDC)</label>
                        <span className="text-xs text-slate-500">{marginAction === 'ADD' ? t.avail : t.maxRemove}: <span className="font-mono">{marginAction === 'ADD' ? balance.toFixed(2) : metrics.maxRemove.toFixed(2)}</span></span>
                    </div>
                    <div className="relative">
                        <input type="number" value={currentMarginInput} onChange={(e) => setMarginInput(e.target.value)} placeholder={t.quantity} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pr-16 font-mono text-lg outline-none focus:border-indigo-500 dark:text-white" />
                        <button onClick={() => setMarginInput((marginAction === 'ADD' ? balance : metrics.maxRemove).toFixed(2))} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-500">{t.max}</button>
                    </div>
                </div>
                {/* 4 Comparison Metrics */}
                <div className="bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 border-slate-200 rounded-xl p-3 mb-6 space-y-3 text-[11px]">
                   <div className="flex items-center gap-2 mb-2"><span className="font-bold text-slate-400 flex-1 text-center">{t.before}</span><ArrowRight size={12} className="text-slate-400" /><span className="font-bold text-indigo-500 flex-1 text-center">{t.after}</span></div>
                   
                   <div className="flex items-center"><div className="flex-1 text-center text-slate-400">{t.margin}</div><div className="flex-1 text-center font-mono">{metrics.currentMarginValue.toFixed(2)}</div><div className="flex-1 text-center font-mono font-bold text-indigo-500">{metrics.newMarginValue.toFixed(2)}</div></div>
                   
                   <div className="flex items-center"><div className="flex-1 text-center text-slate-400">{t.leverage}</div><div className="flex-1 text-center font-mono">{metrics.currentLeverage.toFixed(1)}x</div><div className="flex-1 text-center font-mono font-bold text-indigo-500">{metrics.newLeverage.toFixed(1)}x</div></div>
                   
                   <div className="flex items-center"><div className="flex-1 text-center text-slate-400">{t.marginRatio}</div><div className="flex-1 text-center font-mono">{metrics.currentRatio.toFixed(2)}%</div><div className="flex-1 text-center font-mono font-bold text-indigo-500">{metrics.newRatio.toFixed(2)}%</div></div>
                   
                   <div className="flex items-center"><div className="flex-1 text-center text-slate-400">{t.estLiqPrice}</div><div className="flex-1 text-center font-mono text-orange-500">{metrics.currentLiq.toFixed(2)}</div><div className="flex-1 text-center font-mono font-bold text-orange-500">{metrics.newLiq.toFixed(2)}</div></div>
                </div>
                <div className="grid grid-cols-2 gap-3"><button onClick={() => setEditingPosId(null)} className="py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-500">{t.cancel}</button><button onClick={handleConfirmMargin} disabled={!isMarginInputValid()} className={`py-3 rounded-xl font-bold shadow-lg transition-all ${isMarginInputValid() ? 'bg-indigo-600 text-white shadow-indigo-500/20' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}>{t.confirmAction}</button></div>
             </div>
          </div>
      )}
      
      {/* Redesigned Market Close All Confirmation Modal to match screenshot */}
      {showCloseAllConfirm && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
             <div className="bg-[#1b2331] w-full max-w-[320px] rounded-[24px] p-8 shadow-2xl border border-slate-700/50 text-center">
                <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                   <AlertTriangle size={32} className="text-rose-500" />
                </div>
                <h3 className="text-white text-xl font-bold mb-3">{t.confirmCloseAll}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-10">{t.confirmCloseAllMsg}</p>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                       onClick={() => setShowCloseAllConfirm(false)} 
                       className="py-4 rounded-2xl border border-slate-700 font-bold text-slate-400 hover:bg-slate-800 transition-all active:scale-95"
                    >
                      {t.cancel}
                    </button>
                    <button 
                       onClick={() => { onCloseAllPositions(); setShowCloseAllConfirm(false); }} 
                       className="py-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-[0_4px_15px_rgba(244,63,94,0.3)] transition-all active:scale-95"
                    >
                      {t.confirm}
                    </button>
                </div>
             </div>
          </div>
      )}
    </div>
  );
};
