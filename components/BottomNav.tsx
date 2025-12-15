import React from 'react';
import { Tab, Language } from '../types';
import { CandlestickChart, Briefcase, List, Wallet } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface BottomNavProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
  ordersCount: number;
  positionsCount: number;
  lang: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, ordersCount, positionsCount, lang }) => {
  const t = TRANSLATIONS[lang];

  const navItems = [
    { id: Tab.TRADE, label: t.trade, icon: CandlestickChart },
    { id: Tab.POSITIONS, label: t.positions, icon: Briefcase, count: positionsCount },
    { id: Tab.ORDERS, label: t.orders, icon: List, count: ordersCount },
    { id: Tab.ACCOUNT, label: t.assets, icon: Wallet },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 dark:bg-slate-900 bg-white border-t dark:border-slate-800 border-slate-200 safe-area-bottom z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="relative flex flex-col items-center justify-center w-full h-full space-y-1"
            >
              <item.icon 
                size={22} 
                className={`transition-colors duration-200 ${isActive ? 'text-indigo-500' : 'dark:text-slate-500 text-slate-400'}`} 
              />
              <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? 'text-indigo-500' : 'dark:text-slate-500 text-slate-400'}`}>
                {item.label}
              </span>
              {item.count ? (
                <span className="absolute top-2 right-4 min-w-[16px] h-4 flex items-center justify-center bg-rose-500 text-white text-[9px] font-bold rounded-full px-1 border dark:border-slate-900 border-white">
                  {item.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};