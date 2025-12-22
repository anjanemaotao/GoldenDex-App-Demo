
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
  const [closePrice, setClosePrice] = useState<string>(currentPrice.toFixed(2));
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
  
  const handleConfirmCloseAll = () => {
      onCloseAllPositions();
      setShowCloseAllConfirm(false);
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
       
       if (closeOrderType === 'MARKET') setClosePrice(currentPrice.toFixed(2));
    }
  }, [closingPosId, closePercent, closeOrderType, currentPrice, closeUnit]);

  const handleExecuteClose = () => {
    if (closingPosId && closingPos && closeAmount) {
       let xauAmount = parseFloat(closeAmount);
       if (closeUnit === 'USDC') {
          xauAmount = xauAmount / currentPrice;
       }
       onClosePosition(closingPosId, xauAmount, parseFloat(closePrice), closeOrderType);
       setClosingPosId(null);
    }
  };

  // Close Button Validation
  const closeNum = parseFloat(closeAmount);
  const maxInUnit = closingPos ? (closeUnit === 'XAU' ? closingPos.size : closingPos.size * currentPrice) : 0;
  const isCloseValid = !isNaN(closeNum) && closeNum > 0 && closeNum <= (maxInUnit + 0.00001); // floating point buffer

  const getPositionMetrics = () => {
      const pos = positions.find(p => p.id === editingPosId);
      if (!pos || !pos.isolatedMargin) return null;

      const inputVal = parseFloat(currentMarginInput) || 0;
      const change = marginAction === 'ADD' ? inputVal : -inputVal;
      const currentMargin = pos.isolatedMargin;
      const newMargin = Math.max(0, currentMargin + change);
      const currentLeverage = (pos.entryPrice * pos.size) / currentMargin;
      const newLeverage = newMargin > 0 ? (pos.entryPrice * pos.size) / newMargin : 0;
      let currentLiq = pos.side === Side.LONG ? pos.entryPrice - (currentMargin / pos.size) : pos.entryPrice + (currentMargin / pos.size);
      let newLiq = pos.side === Side.LONG ? pos.entryPrice - (newMargin / pos.size) : pos.entryPrice + (newMargin / pos.size);
      const maintMarginReq = (pos.entryPrice * pos.size) * 0.01; 
      const currentRatio = (maintMarginReq / currentMargin) * 100;
      const newRatio = newMargin > 0 ? (maintMarginReq / newMargin) * 100 : 0;
      const maxRemove = Math.max(0, currentMargin - maintMarginReq);

      return { currentMargin, newMargin, currentLeverage, newLeverage, currentLiq, newLiq, currentRatio, newRatio, maxRemove };
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
      {marginRatio > 80 && (
         <div className="flex items-center gap-2 mt-3 text-rose-500 text-xs bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
           <AlertTriangle size={14} /><span>{t.riskWarning}</span>
         </div>
      )}
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
          const pnlPercent = (pnl / marginUsed) * 100;
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
                  <div className={`text-xs ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>{isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-xs mb-4">
                <div className="dark:text-slate-400 text-slate-500">{t.size} (XAU)</div>
                <div className="text-right dark:text-slate-200 text-slate-800 font-mono">{pos.size.toFixed(4)}</div>
                <div className="dark:text-slate-400 text-slate-500">{t.entryPrice}</div>
                <div className="text-right dark:text-slate-200 text-slate-800 font-mono">{pos.entryPrice.toFixed(2)}</div>
                <div className="dark:text-slate-400 text-slate-500">{t.markPrice}</div>
                <div className="text-right dark:text-slate-200 text-slate-800 font-mono">{currentPrice.toFixed(2)}</div>
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
              <button onClick={() => { setClosingPosId(pos.id); setClosePercent(100); }} className="w-full py-2.5 dark:bg-slate-700 bg-slate-100 dark:hover:bg-slate-600 hover:bg-slate-200 active:bg-slate-200 rounded-lg text-sm font-medium dark:text-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-2">{t.closePos}</button>
            </div>
          );
        })}
      </div>

      {/* Close Position Modal - Redesigned to match Adjust Margin style and reuse slider UI */}
      {closingPos && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
             <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 border dark:border-slate-700 border-slate-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg dark:text-white text-slate-900">{t.closeOperation.title}</h3>
                    <button onClick={() => setClosingPosId(null)} className="dark:text-slate-400 text-slate-500 hover:text-rose-500 transition-colors"><X size={20}/></button>
                </div>
                
                <div className="flex justify-between items-start mb-6 border-b dark:border-slate-700 pb-4">
                    <div className="space-y-1">
                        <div className="text-xs text-slate-500">{t.closeOperation.tradingPair}</div>
                        <div className="font-bold flex items-center gap-2">
                            <span className="text-indigo-500 dark:text-indigo-400 uppercase">{closingPos.symbol}</span>
                            <span className="text-slate-400">/</span>
                            <span className={`${closingPos.side === Side.LONG ? 'text-emerald-500' : 'text-rose-500'}`}>{closingPos.side === Side.LONG ? t.longLabel : t.shortLabel}</span>
                        </div>
                    </div>
                    <div className="text-right space-y-1">
                        <div className="text-[10px] text-slate-500">{t.entryPrice}: <span className="dark:text-white text-slate-900">{closingPos.entryPrice.toFixed(2)}</span></div>
                        <div className="text-[10px] text-slate-500">{t.markPrice}: <span className="dark:text-white text-slate-900">{currentPrice.toFixed(2)}</span></div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">{t.price}</label>
                        <input 
                            type="text" 
                            value={closeOrderType === 'MARKET' ? t.market : closePrice} 
                            onChange={(e) => setClosePrice(e.target.value)}
                            disabled={closeOrderType === 'MARKET'}
                            className={`w-full dark:bg-slate-900 bg-slate-50 border dark:border-slate-700 border-slate-200 rounded-lg p-2.5 text-sm font-mono outline-none focus:border-indigo-500 ${closeOrderType === 'MARKET' ? 'text-slate-400' : 'dark:text-white text-slate-900'}`}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">{t.mode}</label>
                        <div 
                          className="w-full dark:bg-slate-900 bg-slate-50 border dark:border-slate-700 border-slate-200 rounded-lg p-2.5 flex items-center justify-between cursor-pointer"
                          onClick={() => setCloseOrderType(closeOrderType === 'MARKET' ? 'LIMIT' : 'MARKET')}
                        >
                            <span className="text-sm dark:text-white text-slate-900">{closeOrderType === 'MARKET' ? t.market : t.limit}</span>
                            <ArrowRightLeft size={14} className="text-slate-400" />
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5 mb-6">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">{t.size}</label>
                    <div className="relative">
                        <input 
                           type="number" 
                           value={closeAmount} 
                           onChange={(e) => {
                               setCloseAmount(e.target.value);
                               const val = parseFloat(e.target.value);
                               if (!isNaN(val)) {
                                  const totalInUnit = closeUnit === 'XAU' ? closingPos.size : closingPos.size * currentPrice;
                                  setClosePercent(Math.min(100, (val / totalInUnit) * 100));
                               }
                           }}
                           className="w-full dark:bg-slate-900 bg-slate-50 border dark:border-slate-700 border-slate-200 rounded-lg p-3 text-sm dark:text-white text-slate-900 font-mono outline-none focus:border-indigo-500 pr-16" 
                        />
                        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-2">
                           <select 
                             value={closeUnit} 
                             onChange={(e) => setCloseUnit(e.target.value as any)} 
                             className="bg-transparent border-none text-[10px] font-bold focus:ring-0 cursor-pointer dark:text-white text-slate-900"
                           >
                             <option value="XAU">XAU</option>
                             <option value="USDC">USDC</option>
                           </select>
                        </div>
                    </div>
                </div>

                {/* Percentage Slider - Mirrored from Trade interface */}
                <div className="mb-8 px-2 relative h-10 flex items-center">
                   <div className="absolute inset-x-0 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                      <div className="h-full bg-indigo-500 rounded-l-lg" style={{ width: `${closePercent}%` }} />
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
                      className="absolute h-8 w-8 bg-white dark:bg-slate-800 border-2 border-indigo-500 shadow-md rounded-full flex items-center justify-center z-10 pointer-events-none transition-transform" 
                      style={{ left: `${closePercent}%`, transform: 'translateX(-50%)' }}
                   >
                      <span className="text-[10px] font-bold text-indigo-600 font-mono">{Math.round(closePercent)}%</span>
                   </div>
                </div>

                <div className="space-y-2 mb-8 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border dark:border-slate-700 border-slate-100">
                    <div className="flex justify-between text-xs dark:text-slate-400 text-slate-500">
                        <span>{t.closeOperation.positionSize}</span>
                        <span className="font-bold dark:text-white text-slate-900">{closingPos.size} XAU</span>
                    </div>
                    <div className="flex justify-between text-xs dark:text-slate-400 text-slate-500">
                        <span>{t.closeOperation.estPnL}</span>
                        <span className={`font-bold ${((parseFloat(closePrice) - closingPos.entryPrice) * (closeUnit === 'XAU' ? parseFloat(closeAmount) : parseFloat(closeAmount)/currentPrice) * (closingPos.side === Side.LONG ? 1 : -1)) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                           {((parseFloat(closePrice) - closingPos.entryPrice) * (closeUnit === 'XAU' ? parseFloat(closeAmount) : parseFloat(closeAmount)/currentPrice) * (closingPos.side === Side.LONG ? 1 : -1)).toFixed(2)} USDC
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setClosingPosId(null)} className="py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">{t.cancel}</button>
                    <button 
                        onClick={handleExecuteClose} 
                        disabled={!isCloseValid}
                        className={`py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 ${
                            isCloseValid 
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20' 
                            : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none'
                        }`}
                    >
                        {t.confirm}
                    </button>
                </div>
             </div>
          </div>
      )}

      {/* Existing Confirm Modal */}
      {showCloseAllConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white dark:bg-slate-800 w-full max-w-xs rounded-2xl p-6 shadow-2xl text-center border dark:border-slate-700 border-slate-200">
                <AlertTriangle size={48} className="text-rose-500 mx-auto mb-4" />
                <h3 className="font-bold text-lg dark:text-white text-slate-900 mb-2">{t.confirmCloseAll}</h3>
                <p className="text-sm dark:text-slate-400 text-slate-500 mb-6">{t.confirmCloseAllMsg}</p>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowCloseAllConfirm(false)} className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-500">{t.cancel}</button>
                    <button onClick={handleConfirmCloseAll} className="py-2.5 rounded-xl bg-rose-600 text-white font-bold shadow-lg shadow-rose-500/20">{t.confirmAction}</button>
                </div>
             </div>
          </div>
      )}

      {/* Existing Margin Adjustment Modal */}
      {editingPosId && metrics && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
             <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl p-4 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar border dark:border-slate-700 border-slate-200">
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
                        <span className="text-xs text-slate-500">{marginAction === 'ADD' ? t.avail : t.maxRemove}: <span className="dark:text-slate-200 text-slate-800 ml-1 font-mono">{marginAction === 'ADD' ? balance.toFixed(2) : metrics.maxRemove.toFixed(2)}</span></span>
                    </div>
                    <div className="relative">
                        <input type="number" value={currentMarginInput} onChange={(e) => setMarginInput(e.target.value)} placeholder={t.quantity} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pr-16 font-mono text-lg outline-none focus:border-indigo-500 dark:text-white" autoFocus />
                        <button onClick={() => setMarginInput((marginAction === 'ADD' ? balance : metrics.maxRemove).toFixed(2))} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-500">{t.max}</button>
                    </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 border-slate-200 rounded-xl p-3 mb-4 space-y-3 text-xs">
                   <div className="flex items-center gap-2 mb-2"><span className="text-xs font-bold uppercase text-slate-400 flex-1 text-center">{t.before}</span><ArrowRight size={12} className="text-slate-400" /><span className="text-xs font-bold uppercase text-indigo-500 flex-1 text-center">{t.after}</span></div>
                   <div className="flex items-center"><div className="flex-1 text-center"><div className="text-slate-400 text-[10px]">{t.currentMargin}</div><div className="font-mono">{metrics.currentMargin.toFixed(2)}</div></div><div className="flex-1 text-center"><div className="text-indigo-400 text-[10px]">{t.afterMargin}</div><div className="font-mono font-bold">{metrics.newMargin.toFixed(2)}</div></div></div>
                   <div className="flex items-center"><div className="flex-1 text-center"><div className="text-slate-400 text-[10px]">{t.estLiqPrice}</div><div className="font-mono text-orange-500">{metrics.currentLiq.toFixed(2)}</div></div><div className="flex-1 text-center"><div className="text-indigo-400 text-[10px]">{t.estLiqPrice}</div><div className="font-mono font-bold text-orange-500">{metrics.newLiq.toFixed(2)}</div></div></div>
                </div>
                <div className="grid grid-cols-2 gap-3"><button onClick={() => setEditingPosId(null)} className="py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-500">{t.cancel}</button><button onClick={handleConfirmMargin} disabled={!isMarginInputValid()} className={`py-3 rounded-xl font-bold shadow-lg transition-all ${isMarginInputValid() ? 'bg-indigo-600 text-white shadow-indigo-500/20' : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'}`}>{t.confirmAction}</button></div>
             </div>
          </div>
      )}
    </div>
  );
};
