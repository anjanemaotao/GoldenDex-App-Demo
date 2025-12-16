import React, { useState } from 'react';
import { Position, Side, MarginMode, Language } from '../types';
import { TrendingUp, TrendingDown, AlertTriangle, Plus, Minus, X, Trash2, ArrowRight } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface PositionsViewProps {
  positions: Position[];
  currentPrice: number;
  equity: number;
  balance: number;
  maintenanceMargin: number;
  marginRatio: number;
  onClosePosition: (id: string) => void;
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
  
  // Independent states for Add and Remove inputs
  const [addMarginInput, setAddMarginInput] = useState<string>('');
  const [removeMarginInput, setRemoveMarginInput] = useState<string>('');
  
  const [showCloseAllConfirm, setShowCloseAllConfirm] = useState(false);

  // Helper to get correct input state
  const currentMarginInput = marginAction === 'ADD' ? addMarginInput : removeMarginInput;
  const setMarginInput = (val: string) => {
      if (marginAction === 'ADD') {
          setAddMarginInput(val);
      } else {
          setRemoveMarginInput(val);
      }
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

  // Helper to calculate potential position changes
  const getPositionMetrics = () => {
      const pos = positions.find(p => p.id === editingPosId);
      if (!pos || !pos.isolatedMargin) return null;

      const inputVal = parseFloat(currentMarginInput) || 0;
      const change = marginAction === 'ADD' ? inputVal : -inputVal;
      const currentMargin = pos.isolatedMargin;
      const newMargin = Math.max(0, currentMargin + change);
      
      const currentLeverage = (pos.entryPrice * pos.size) / currentMargin;
      const newLeverage = newMargin > 0 ? (pos.entryPrice * pos.size) / newMargin : 0;
      
      let currentLiq = 0;
      let newLiq = 0;
      
      if (pos.side === Side.LONG) {
          currentLiq = pos.entryPrice - (currentMargin / pos.size);
          newLiq = pos.entryPrice - (newMargin / pos.size);
      } else {
          currentLiq = pos.entryPrice + (currentMargin / pos.size);
          newLiq = pos.entryPrice + (newMargin / pos.size);
      }
      
      // Calculate isolated margin ratio (Risk)
      // Isolated Ratio = (Maint Margin / Margin Balance) * 100
      // Maint Margin for gold is typically 0.5% - 1%. App uses 1%.
      const positionValue = pos.entryPrice * pos.size;
      const maintMarginReq = positionValue * 0.01; 
      
      const currentRatio = (maintMarginReq / currentMargin) * 100;
      const newRatio = newMargin > 0 ? (maintMarginReq / newMargin) * 100 : 0;
      
      const maxRemove = Math.max(0, currentMargin - maintMarginReq);

      return {
          currentMargin,
          newMargin,
          currentLeverage,
          newLeverage,
          currentLiq,
          newLiq,
          currentRatio,
          newRatio,
          maxRemove
      };
  };

  const metrics = editingPosId ? getPositionMetrics() : null;

  // Validate Input for Button State
  const isMarginInputValid = () => {
      const val = parseFloat(currentMarginInput);
      if (isNaN(val) || val <= 0) return false;
      
      if (marginAction === 'ADD') {
          return val <= balance;
      } else {
          return val <= (metrics?.maxRemove || 0);
      }
  };

  // Risk Dashboard
  const renderRiskHeader = () => (
    <div className="dark:bg-slate-800/50 bg-white/80 border-b dark:border-slate-800 border-slate-200 p-4 sticky top-0 backdrop-blur-md z-10">
      <div className="grid grid-cols-3 gap-2">
        <div className="dark:bg-slate-800 bg-white rounded-lg p-2 border dark:border-slate-700 border-slate-200 shadow-sm">
           <div className="text-[10px] dark:text-slate-500 text-slate-400 mb-1">{t.marginRatio}</div>
           <div className={`font-mono font-bold text-sm ${marginRatio > 80 ? 'text-rose-500' : 'text-emerald-500'}`}>
             {marginRatio.toFixed(2)}%
           </div>
        </div>
        <div className="dark:bg-slate-800 bg-white rounded-lg p-2 border dark:border-slate-700 border-slate-200 shadow-sm">
           <div className="text-[10px] dark:text-slate-500 text-slate-400 mb-1">{t.maintMargin}</div>
           <div className="font-mono font-bold text-sm dark:text-slate-200 text-slate-800">
             ${maintenanceMargin.toFixed(2)}
           </div>
        </div>
        <div className="dark:bg-slate-800 bg-white rounded-lg p-2 border dark:border-slate-700 border-slate-200 shadow-sm">
           <div className="text-[10px] dark:text-slate-500 text-slate-400 mb-1">{t.marginBal}</div>
           <div className="font-mono font-bold text-sm dark:text-slate-200 text-slate-800">
             ${equity.toFixed(2)}
           </div>
        </div>
      </div>
      {marginRatio > 80 && (
         <div className="flex items-center gap-2 mt-3 text-rose-500 text-xs bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
           <AlertTriangle size={14} />
           <span>{t.riskWarning}</span>
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
           <button 
             onClick={() => setShowCloseAllConfirm(true)}
             className="text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 px-2 py-1 rounded border border-rose-500/20 flex items-center gap-1"
           >
             <Trash2 size={12} />
             {t.closeAll}
           </button>
        </div>
        
        {positions.map((pos) => {
          // Calculate dynamic PnL for display
          const priceDiff = currentPrice - pos.entryPrice;
          const pnl = pos.side === Side.LONG ? priceDiff * pos.size : -priceDiff * pos.size;
          
          let marginUsed = 0;
          let liquidationPrice = 0;

          if (pos.marginMode === MarginMode.ISOLATED && pos.isolatedMargin) {
             marginUsed = pos.isolatedMargin;
             // Liq Price logic for Isolated:
             // Long: Entry - (Margin / Size)
             // Short: Entry + (Margin / Size)
             if (pos.side === Side.LONG) {
                liquidationPrice = pos.entryPrice - (marginUsed / pos.size);
             } else {
                liquidationPrice = pos.entryPrice + (marginUsed / pos.size);
             }
          } else {
             marginUsed = (pos.entryPrice * pos.size) / pos.leverage;
             // Standard approximate cross liq (simplified)
             if (pos.side === Side.LONG) liquidationPrice = pos.entryPrice * (1 - 1/pos.leverage);
             else liquidationPrice = pos.entryPrice * (1 + 1/pos.leverage);
          }
          
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
                      {pos.leverage}x {pos.side === Side.LONG ? t.long.split('/')[1] : t.short.split('/')[1]}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-mono font-bold ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isProfit ? '+' : ''}{pnl.toFixed(2)}
                  </div>
                  <div className={`text-xs ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%
                  </div>
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
                        <button 
                            onClick={() => { 
                                setEditingPosId(pos.id); 
                                setMarginAction('ADD'); 
                                setAddMarginInput('');
                                setRemoveMarginInput('');
                            }}
                            className="bg-indigo-500/20 text-indigo-500 p-0.5 rounded hover:bg-indigo-500/30"
                        >
                            <Plus size={10} />
                        </button>
                    )}
                </div>
              </div>

              <button 
                onClick={() => onClosePosition(pos.id)}
                className="w-full py-2.5 dark:bg-slate-700 bg-slate-100 dark:hover:bg-slate-600 hover:bg-slate-200 active:bg-slate-200 rounded-lg text-sm font-medium dark:text-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                {t.closePos}
              </button>
            </div>
          );
        })}
      </div>

      {/* Close All Confirmation Modal */}
      {showCloseAllConfirm && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
             <div className="bg-white dark:bg-slate-800 w-full max-w-xs rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
                <AlertTriangle size={48} className="text-rose-500 mx-auto mb-4" />
                <h3 className="font-bold text-lg dark:text-white text-slate-900 mb-2">{t.confirmCloseAll}</h3>
                <p className="text-sm dark:text-slate-400 text-slate-500 mb-6">{t.confirmCloseAllMsg}</p>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowCloseAllConfirm(false)} className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-500">
                        {t.cancel}
                    </button>
                    <button onClick={handleConfirmCloseAll} className="py-2.5 rounded-xl bg-rose-600 text-white font-bold shadow-lg shadow-rose-500/20">
                        {t.confirmAction}
                    </button>
                </div>
             </div>
          </div>
      )}

      {/* Margin Modal */}
      {editingPosId && metrics && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
             <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg dark:text-white text-slate-900">{t.addMargin}</h3>
                    <button onClick={() => setEditingPosId(null)} className="dark:text-slate-400 text-slate-500"><X size={20}/></button>
                </div>
                
                <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1 mb-4">
                    <button 
                        onClick={() => setMarginAction('ADD')}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${marginAction === 'ADD' ? 'bg-white dark:bg-slate-600 shadow text-indigo-500' : 'text-slate-500'}`}
                    >
                        {t.add}
                    </button>
                    <button 
                        onClick={() => setMarginAction('REMOVE')}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${marginAction === 'REMOVE' ? 'bg-white dark:bg-slate-600 shadow text-indigo-500' : 'text-slate-500'}`}
                    >
                        {t.remove}
                    </button>
                </div>

                <div className="mb-4">
                    <div className="flex justify-between mb-1">
                        <label className="text-xs text-slate-500 block">{t.amount} (USDC)</label>
                        <span className="text-xs text-slate-500">
                            {marginAction === 'ADD' ? t.avail : t.maxRemove}: 
                            <span className="dark:text-slate-200 text-slate-800 ml-1 font-mono">
                                {marginAction === 'ADD' ? balance.toFixed(2) : metrics.maxRemove.toFixed(2)}
                            </span>
                        </span>
                    </div>
                    <input 
                        type="number" 
                        value={currentMarginInput}
                        onChange={(e) => setMarginInput(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-mono text-lg outline-none focus:border-indigo-500"
                        autoFocus
                    />
                </div>
                
                {/* Metrics Comparision */}
                <div className="bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 border-slate-200 rounded-xl p-3 mb-4 space-y-3">
                   <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold uppercase text-slate-400 flex-1 text-center">{t.before}</span>
                      <ArrowRight size={12} className="text-slate-400" />
                      <span className="text-xs font-bold uppercase text-indigo-500 flex-1 text-center">{t.after}</span>
                   </div>
                   
                   {/* Margin Amount */}
                   <div className="flex items-center text-xs">
                      <div className="flex-1 text-center">
                         <div className="text-slate-400 text-[10px] mb-0.5">{t.currentMargin}</div>
                         <div className="font-mono dark:text-slate-200 text-slate-700">{metrics.currentMargin.toFixed(2)}</div>
                      </div>
                      <div className="flex-1 text-center">
                         <div className="text-indigo-400 text-[10px] mb-0.5">{t.afterMargin}</div>
                         <div className="font-mono font-bold dark:text-white text-slate-900">{metrics.newMargin.toFixed(2)}</div>
                      </div>
                   </div>

                   {/* Liquidation Price */}
                   <div className="flex items-center text-xs">
                      <div className="flex-1 text-center">
                         <div className="text-slate-400 text-[10px] mb-0.5">{t.estLiqPrice}</div>
                         <div className="font-mono text-orange-500">{metrics.currentLiq.toFixed(2)}</div>
                      </div>
                      <div className="flex-1 text-center">
                         <div className="text-indigo-400 text-[10px] mb-0.5">{t.estLiqPrice}</div>
                         <div className="font-mono font-bold text-orange-500">{metrics.newLiq.toFixed(2)}</div>
                      </div>
                   </div>
                   
                   {/* Leverage */}
                   <div className="flex items-center text-xs">
                      <div className="flex-1 text-center">
                         <div className="text-slate-400 text-[10px] mb-0.5">{t.leverage}</div>
                         <div className="font-mono dark:text-slate-200 text-slate-700">{metrics.currentLeverage.toFixed(1)}x</div>
                      </div>
                      <div className="flex-1 text-center">
                         <div className="text-indigo-400 text-[10px] mb-0.5">{t.leverage}</div>
                         <div className="font-mono font-bold dark:text-white text-slate-900">{metrics.newLeverage.toFixed(1)}x</div>
                      </div>
                   </div>

                   {/* Margin Ratio */}
                   <div className="flex items-center text-xs">
                      <div className="flex-1 text-center">
                         <div className="text-slate-400 text-[10px] mb-0.5">{t.marginRatio}</div>
                         <div className="font-mono dark:text-slate-200 text-slate-700">{metrics.currentRatio.toFixed(2)}%</div>
                      </div>
                      <div className="flex-1 text-center">
                         <div className="text-indigo-400 text-[10px] mb-0.5">{t.marginRatio}</div>
                         <div className="font-mono font-bold dark:text-white text-slate-900">{metrics.newRatio.toFixed(2)}%</div>
                      </div>
                   </div>

                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setEditingPosId(null)} className="py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-500">
                        {t.cancel}
                    </button>
                    <button 
                        onClick={handleConfirmMargin} 
                        disabled={!isMarginInputValid()}
                        className={`py-3 rounded-xl font-bold shadow-lg transition-all ${
                            isMarginInputValid() 
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20' 
                            : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none'
                        }`}
                    >
                        {t.confirmAction}
                    </button>
                </div>
             </div>
          </div>
      )}

    </div>
  );
};