
import React, { useState } from 'react';
import { Order, Side, Language } from '../types';
import { Clock, X, Trash2, History as HistoryIcon } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface OrdersViewProps {
  orders: Order[];
  orderHistory: Order[];
  onCancelOrder: (id: string) => void;
  onCancelAllOrders: () => void;
  lang: Language;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ orders, orderHistory, onCancelOrder, onCancelAllOrders, lang }) => {
   const t = TRANSLATIONS[lang];
   const [activeTab, setActiveTab] = useState<'OPEN' | 'HISTORY'>('OPEN');

   const getStatusInfo = (status: Order['status']) => {
      switch (status) {
         case 'FILLED':
            return { label: t.statusFilled, color: 'bg-emerald-500/20 text-emerald-500' };
         case 'PARTIAL_FILLED':
            return { label: t.statusPartialFilled, color: 'bg-orange-500/20 text-orange-500' };
         case 'EXPIRED':
            return { label: t.statusExpired, color: 'bg-slate-200 dark:bg-slate-800 text-slate-500' };
         case 'CANCELLED':
            return { label: t.statusCancelled, color: 'bg-slate-200 dark:bg-slate-700 text-slate-500' };
         default:
            return { label: status, color: 'bg-slate-200 dark:bg-slate-700 text-slate-500' };
      }
   };

   const renderOpenOrders = () => {
     if (orders.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center h-full dark:text-slate-500 text-slate-400 mt-20">
            <div className="dark:bg-slate-800 bg-white p-4 rounded-full mb-4 shadow-sm border dark:border-slate-700 border-slate-200">
               <Clock size={32} className="opacity-50" />
            </div>
            <p>{t.noOrders}</p>
          </div>
        );
     }

     return (
       <div className="space-y-3">
         <div className="flex justify-between items-center mb-2 px-1">
             <h2 className="dark:text-slate-400 text-slate-500 text-xs uppercase font-bold tracking-wider">{t.openOrders} ({orders.length})</h2>
             <button 
               onClick={onCancelAllOrders}
               className="text-xs bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 flex items-center gap-1 transition-colors"
             >
               <Trash2 size={12} />
               {t.cancelAll}
             </button>
         </div>
         {orders.map((order) => {
           const percentFilled = (order.filled / order.amount) * 100;
           return (
            <div key={order.id} className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 rounded-xl p-4 flex justify-between items-center shadow-sm">
              <div className="flex-1 mr-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-sm font-bold ${order.side === Side.LONG ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {order.side === Side.LONG ? t.long.split('/')[0] : t.short.split('/')[0]} {order.symbol}
                  </span>
                  <span className="text-[10px] dark:bg-slate-700 bg-slate-200 dark:text-slate-300 text-slate-600 px-1.5 py-0.5 rounded">{t.limit.toUpperCase()}</span>
                </div>
                
                <div className="flex justify-between text-xs dark:text-slate-400 text-slate-500 mb-2">
                   <span>{t.price}</span>
                   <span className="dark:text-white text-slate-900 font-mono">{order.price.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-xs dark:text-slate-400 text-slate-500">
                   <span>{t.filled} / {t.size}</span>
                   <span className="dark:text-white text-slate-900 font-mono">
                      {order.filled.toFixed(2)} / {order.amount.toFixed(2)}
                   </span>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${percentFilled}%` }}></div>
                    </div>
                    <span className="text-[10px] font-mono dark:text-slate-400 text-slate-500 w-8 text-right">{percentFilled.toFixed(0)}%</span>
                </div>

                <div className="text-[10px] dark:text-slate-600 text-slate-400 mt-2">
                  {new Date(order.timestamp).toLocaleString()}
                </div>
              </div>
              <button 
                onClick={() => onCancelOrder(order.id)}
                className="p-2 text-slate-400 hover:text-rose-500 dark:hover:text-white dark:bg-slate-700/50 bg-slate-100 rounded-lg self-start"
              >
                <X size={16} />
              </button>
            </div>
           );
         })}
       </div>
     );
   };

   const renderOrderHistory = () => {
      if (orderHistory.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center h-full dark:text-slate-500 text-slate-400 mt-20">
             <div className="dark:bg-slate-800 bg-white p-4 rounded-full mb-4 shadow-sm border dark:border-slate-700 border-slate-200">
                <HistoryIcon size={32} className="opacity-50" />
             </div>
             <p>No history</p>
          </div>
        );
      }

      return (
         <div className="space-y-3">
            <h2 className="dark:text-slate-400 text-slate-500 text-xs uppercase font-bold tracking-wider px-1 mb-2">{t.orderHistory}</h2>
            {orderHistory.map((order) => {
               const statusInfo = getStatusInfo(order.status);
               return (
                  <div key={order.id} className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 rounded-xl p-4 shadow-sm opacity-80">
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                           <span className={`text-sm font-bold ${order.side === Side.LONG ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {order.side === Side.LONG ? t.long.split('/')[0] : t.short.split('/')[0]} {order.symbol}
                           </span>
                           <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${statusInfo.color}`}>
                              {statusInfo.label}
                           </span>
                        </div>
                        <div className="text-right text-[10px] dark:text-slate-500 text-slate-400 font-mono">
                           {new Date(order.timestamp).toLocaleString()}
                        </div>
                     </div>
                     <div className="space-y-2.5">
                        <div className="flex justify-between items-center text-xs">
                           <span className="dark:text-slate-500 text-slate-400">{lang === 'en' ? 'Filled Price' : '成交价格'}</span>
                           <span className="dark:text-slate-200 text-slate-800 font-mono font-bold">{order.price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                           <span className="dark:text-slate-500 text-slate-400">{lang === 'en' ? 'Filled Amount' : '成交数量'}</span>
                           <span className="dark:text-slate-200 text-slate-800 font-mono font-bold">{order.filled.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                           <span className="dark:text-slate-500 text-slate-400">{lang === 'en' ? 'Total Order Amount' : '委托总量'}</span>
                           <span className="dark:text-slate-200 text-slate-800 font-mono font-bold">{order.amount.toFixed(2)}</span>
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>
      );
   };

  return (
    <div className="h-full flex flex-col dark:bg-slate-900 bg-slate-50">
      <div className="flex border-b dark:border-slate-800 border-slate-200 bg-white dark:bg-slate-900 sticky top-0 z-10">
         <button 
            onClick={() => setActiveTab('OPEN')}
            className={`flex-1 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'OPEN' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
         >
            {t.openOrders}
         </button>
         <button 
            onClick={() => setActiveTab('HISTORY')}
            className={`flex-1 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'HISTORY' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
         >
            {t.orderHistory}
         </button>
      </div>

      <div className="p-4 pb-24 overflow-y-auto no-scrollbar flex-1">
         {activeTab === 'OPEN' ? renderOpenOrders() : renderOrderHistory()}
      </div>
    </div>
  );
};
