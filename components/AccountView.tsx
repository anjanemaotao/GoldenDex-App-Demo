import React, { useState } from 'react';
import { Wallet, CreditCard, ArrowRightLeft, Shield, Settings, History, ChevronLeft, Copy, CheckCircle, ExternalLink, ArrowDownLeft, ArrowUpRight, LogOut, User, Coins, Moon, Sun, Loader2 } from 'lucide-react';
import { TradeRecord, TransferRecord, Side, Language, Theme, FundingRecord } from '../types';
import { TRANSLATIONS } from '../constants';

interface AccountViewProps {
  balance: number;
  equity: number;
  totalPositionValue: number;
  externalWalletBalance: number;
  tradeHistory: TradeRecord[];
  transferHistory: TransferRecord[];
  fundingHistory: FundingRecord[];
  onDeposit: (amount: number) => void;
  onWithdraw: (amount: number) => boolean;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

type ViewState = 'MAIN' | 'DEPOSIT' | 'WITHDRAW' | 'TRADE_HISTORY' | 'TRANSFER_HISTORY' | 'SETTINGS' | 'FUNDING_HISTORY';

export const AccountView: React.FC<AccountViewProps> = ({ 
  balance, 
  equity, 
  totalPositionValue,
  externalWalletBalance,
  tradeHistory, 
  transferHistory,
  fundingHistory,
  onDeposit,
  onWithdraw,
  isConnected,
  onConnect,
  onDisconnect,
  language,
  setLanguage,
  theme,
  setTheme
}) => {
  const [view, setView] = useState<ViewState>('MAIN');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [depositStatus, setDepositStatus] = useState<'IDLE' | 'APPROVING' | 'DEPOSITING' | 'SUCCESS'>('IDLE');
  const [withdrawStatus, setWithdrawStatus] = useState<'IDLE' | 'WITHDRAWING' | 'SUCCESS'>('IDLE');
  const t = TRANSLATIONS[language];

  // Mock Wallet Address
  const walletAddress = "0x71C7...9A23";

  const handleCopy = () => {
    navigator.clipboard.writeText("0x71C762B34567890123456789A23"); 
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow digits and a single decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setDepositAmount(value);
    }
  };

  const handleWithdrawChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow digits and a single decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setWithdrawAmount(value);
    }
  };

  // Mock Web3 Interaction for Deposit
  const handleWeb3Deposit = async () => {
    const val = parseFloat(depositAmount);
    // Validation is now handled by the button state, but keeping safety check
    if (isNaN(val) || val <= 0 || val > externalWalletBalance) return;

    setDepositStatus('APPROVING');
    
    // Simulate approval delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setDepositStatus('DEPOSITING');

    // Simulate deposit interaction delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onDeposit(val);
    setDepositStatus('SUCCESS');

    // Reset after success
    setTimeout(() => {
        setDepositStatus('IDLE');
        setDepositAmount('');
        setView('MAIN');
    }, 1500);
  };

  // Mock Web3 Interaction for Withdraw
  const handleWeb3Withdraw = async () => {
    const val = parseFloat(withdrawAmount);
    // Validation is now handled by the button state, but keeping safety check
    if (isNaN(val) || val <= 0 || val > balance) return;

    setWithdrawStatus('WITHDRAWING');

    // Simulate withdraw interaction delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const success = onWithdraw(val);
    if (success) {
        setWithdrawStatus('SUCCESS');
        // Reset after success
        setTimeout(() => {
            setWithdrawStatus('IDLE');
            setWithdrawAmount('');
            setView('MAIN');
        }, 1500);
    } else {
        setWithdrawStatus('IDLE');
    }
  };

  // --- Connect Wallet Screen ---
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 dark:bg-slate-900 bg-slate-50 animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mb-8 border border-indigo-500/20 shadow-2xl shadow-indigo-500/10">
           <Wallet size={48} className="text-indigo-500" />
        </div>
        <h1 className="text-3xl font-bold dark:text-white text-slate-900 mb-3 tracking-tight">{t.connect}</h1>
        <p className="dark:text-slate-400 text-slate-600 text-center mb-10 text-sm leading-relaxed max-w-xs">
          Connect your secure wallet to deposit funds, trade XAU/USDC perpetual contracts, and manage your portfolio.
        </p>
        
        <div className="w-full space-y-4 max-w-xs">
          <button
            onClick={onConnect}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {t.connect}
          </button>
          <div className="text-center">
            <span className="text-xs text-slate-500">Powered by Simulated Web3</span>
          </div>
        </div>
      </div>
    );
  }

  // Define render functions instead of Components to prevent focus loss during re-render
  const renderSettingsView = () => (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 animate-in slide-in-from-right duration-200">
      <div className="flex items-center gap-3 p-4 border-b dark:border-slate-800 border-slate-200 sticky top-0 bg-slate-50 dark:bg-slate-900">
        <button onClick={() => setView('MAIN')} className="p-2 -ml-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full dark:text-white">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-lg font-bold dark:text-white text-slate-900">{t.settings}</h2>
      </div>
      <div className="p-4 space-y-6">
         {/* Language */}
         <div>
            <label className="text-xs dark:text-slate-400 text-slate-500 block mb-2 font-bold uppercase tracking-wider">{t.language}</label>
            <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border dark:border-slate-700 border-slate-200">
               <div onClick={() => setLanguage('en')} className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 border-b dark:border-slate-700 border-slate-100">
                  <div className="flex items-center gap-3">
                     <span className="text-xl">🇺🇸</span>
                     <span className="dark:text-white text-slate-900">English</span>
                  </div>
                  {language === 'en' && <CheckCircle size={18} className="text-emerald-500" />}
               </div>
               <div onClick={() => setLanguage('zh-CN')} className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 border-b dark:border-slate-700 border-slate-100">
                  <div className="flex items-center gap-3">
                     <span className="text-xl">🇨🇳</span>
                     <span className="dark:text-white text-slate-900">简体中文</span>
                  </div>
                  {language === 'zh-CN' && <CheckCircle size={18} className="text-emerald-500" />}
               </div>
               <div onClick={() => setLanguage('zh-TW')} className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                  <div className="flex items-center gap-3">
                     <span className="text-xl">🇭🇰</span>
                     <span className="dark:text-white text-slate-900">繁體中文</span>
                  </div>
                  {language === 'zh-TW' && <CheckCircle size={18} className="text-emerald-500" />}
               </div>
            </div>
         </div>

         {/* Theme */}
         <div>
            <label className="text-xs dark:text-slate-400 text-slate-500 block mb-2 font-bold uppercase tracking-wider">{t.theme}</label>
            <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border dark:border-slate-700 border-slate-200">
               <div onClick={() => setTheme('dark')} className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 border-b dark:border-slate-700 border-slate-100">
                  <div className="flex items-center gap-3">
                     <Moon size={18} className="dark:text-indigo-400 text-slate-500" />
                     <span className="dark:text-white text-slate-900">{t.dark}</span>
                  </div>
                  {theme === 'dark' && <CheckCircle size={18} className="text-emerald-500" />}
               </div>
               <div onClick={() => setTheme('light')} className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                  <div className="flex items-center gap-3">
                     <Sun size={18} className="text-amber-500" />
                     <span className="dark:text-white text-slate-900">{t.light}</span>
                  </div>
                  {theme === 'light' && <CheckCircle size={18} className="text-emerald-500" />}
               </div>
            </div>
         </div>
      </div>
    </div>
  );

  const renderFundingHistoryView = () => (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 animate-in slide-in-from-right duration-200">
      <div className="flex items-center gap-3 p-4 border-b dark:border-slate-800 border-slate-200 sticky top-0 bg-slate-50 dark:bg-slate-900">
        <button onClick={() => setView('MAIN')} className="p-2 -ml-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full dark:text-white">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-lg font-bold dark:text-white text-slate-900">{t.funding}</h2>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 pb-24">
        {fundingHistory.length === 0 ? (
           <div className="text-center dark:text-slate-500 text-slate-400 mt-10">No records yet</div>
        ) : (
           fundingHistory.map((item) => (
             <div key={item.id} className="bg-white dark:bg-slate-800 border dark:border-slate-700 border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <div className="font-bold dark:text-white text-slate-900 text-sm">
                    Funding Fee
                  </div>
                  <div className="text-xs dark:text-slate-500 text-slate-400 mt-0.5">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                   <div className={`font-mono font-bold ${item.amount >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                     {item.amount >= 0 ? '+' : ''}{item.amount.toFixed(4)}
                   </div>
                   <div className="text-[10px] dark:text-slate-400 text-slate-500">
                     Rate: {(item.rate * 100).toFixed(4)}%
                   </div>
                </div>
             </div>
           ))
        )}
      </div>
    </div>
  );

  const renderDepositView = () => {
    const depVal = parseFloat(depositAmount);
    const isDepositValid = !isNaN(depVal) && depVal > 0 && depVal <= externalWalletBalance;

    return (
      <div className="h-full flex flex-col p-4 bg-slate-50 dark:bg-slate-900 animate-in slide-in-from-right duration-200">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setView('MAIN')} className="p-2 -ml-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full dark:text-white">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-bold dark:text-white text-slate-900">{t.depositVaultTitle}</h2>
        </div>

        <div className="space-y-6">
           {/* Network Selector */}
           <div>
             <label className="text-xs dark:text-slate-400 text-slate-500 block mb-2 font-bold uppercase">{t.network}</label>
             <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-[#2D374B] flex items-center justify-center">
                   <div className="w-3 h-3 bg-[#12AAFF] rounded-full"></div>
                </div>
                <div className="flex-1 font-bold dark:text-white text-slate-900">Arbitrum One</div>
                <CheckCircle size={18} className="text-emerald-500" />
             </div>
           </div>

           {/* Amount Input */}
           <div>
              <div className="flex justify-between mb-2">
                  <label className="text-xs dark:text-slate-400 text-slate-500 font-bold uppercase">{t.amount}</label>
                  <span className="text-xs dark:text-slate-400 text-slate-500">{t.walletBalance}: <span className="dark:text-white text-slate-900 font-mono">{externalWalletBalance.toFixed(2)}</span></span>
              </div>
              <div className="relative">
                  <input 
                      type="text" 
                      inputMode="decimal"
                      value={depositAmount}
                      onChange={handleDepositChange}
                      placeholder="0.00"
                      disabled={depositStatus !== 'IDLE'}
                      className="w-full bg-white dark:bg-slate-800 border dark:border-slate-700 border-slate-200 rounded-xl p-4 dark:text-white text-slate-900 font-mono focus:border-indigo-500 outline-none pr-16 text-lg"
                  />
                  <button 
                    onClick={() => setDepositAmount(externalWalletBalance.toString())}
                    className="absolute right-16 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-500 mr-2"
                    disabled={depositStatus !== 'IDLE'}
                  >
                    {t.max}
                  </button>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">USDC</span>
              </div>
           </div>

           {/* Info Card */}
           <div className="bg-indigo-50 dark:bg-slate-800/50 p-4 rounded-xl border border-indigo-100 dark:border-slate-700">
              <div className="flex gap-2">
                  <Shield size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                     You are interacting directly with the Vault Smart Contract on Arbitrum. Ensure you have sufficient ETH for gas fees.
                  </p>
              </div>
           </div>

           {/* Action Button */}
           <button 
              onClick={handleWeb3Deposit}
              disabled={!isDepositValid || depositStatus !== 'IDLE'}
              className={`w-full py-4 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg
                  ${isDepositValid && depositStatus === 'IDLE' 
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20' 
                    : depositStatus === 'SUCCESS' ? 'bg-emerald-500 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none'}
              `}
           >
              {depositStatus === 'IDLE' && (
                  <>
                     <Wallet size={18} />
                     {t.confirmAction}
                  </>
              )}
              {depositStatus === 'APPROVING' && (
                  <>
                     <Loader2 size={18} className="animate-spin" />
                     {t.approving}
                  </>
              )}
              {depositStatus === 'DEPOSITING' && (
                  <>
                     <Loader2 size={18} className="animate-spin" />
                     {t.depositing}
                  </>
              )}
              {depositStatus === 'SUCCESS' && (
                  <>
                     <CheckCircle size={18} />
                     {t.depositSuccess}
                  </>
              )}
           </button>
        </div>
      </div>
    );
  };

  const renderWithdrawView = () => {
    const withVal = parseFloat(withdrawAmount);
    const isWithdrawValid = !isNaN(withVal) && withVal > 0 && withVal <= balance;

    return (
      <div className="h-full flex flex-col p-4 bg-slate-50 dark:bg-slate-900 animate-in slide-in-from-right duration-200">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setView('MAIN')} className="p-2 -ml-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full dark:text-white">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-bold dark:text-white text-slate-900">{t.withdrawVaultTitle}</h2>
        </div>

        <div className="space-y-6">
          <div>
             <label className="text-xs dark:text-slate-400 text-slate-500 block mb-2 font-bold uppercase">{t.network}</label>
             <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 border-slate-200 rounded-xl p-4 flex justify-between items-center dark:text-white text-slate-900 shadow-sm">
               <div className="flex items-center gap-3">
                   <div className="w-6 h-6 rounded-full bg-[#2D374B] flex items-center justify-center">
                      <div className="w-3 h-3 bg-[#12AAFF] rounded-full"></div>
                   </div>
                   <span className="font-bold">Arbitrum One</span>
               </div>
               <CheckCircle size={18} className="text-emerald-500" />
             </div>
          </div>

          <div>
             <div className="flex justify-between mb-2">
               <label className="text-xs dark:text-slate-400 text-slate-500 font-bold uppercase">{t.amount}</label>
               <span className="text-xs dark:text-slate-400 text-slate-500">{t.avail}: <span className="dark:text-white text-slate-900 font-mono">{balance.toFixed(2)}</span></span>
             </div>
             <div className="relative">
               <input 
                 type="text" 
                 inputMode="decimal"
                 value={withdrawAmount}
                 onChange={handleWithdrawChange}
                 disabled={withdrawStatus !== 'IDLE'}
                 className="w-full bg-white dark:bg-slate-800 border dark:border-slate-700 border-slate-200 rounded-xl p-4 dark:text-white text-slate-900 font-mono focus:border-indigo-500 outline-none pr-16 text-lg"
               />
               <button 
                 onClick={() => setWithdrawAmount(balance.toString())}
                 className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-500"
                 disabled={withdrawStatus !== 'IDLE'}
               >
                 {t.max}
               </button>
             </div>
          </div>

           {/* Info Card */}
           <div className="bg-indigo-50 dark:bg-slate-800/50 p-4 rounded-xl border border-indigo-100 dark:border-slate-700">
              <div className="flex gap-2">
                  <Shield size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                     Withdrawals interact directly with the Vault contract. Funds will be returned to your connected wallet address: <span className="font-mono">{walletAddress}</span>
                  </p>
              </div>
           </div>

          <button 
            onClick={handleWeb3Withdraw}
            disabled={!isWithdrawValid || withdrawStatus !== 'IDLE'}
            className={`w-full py-4 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg
              ${isWithdrawValid && withdrawStatus === 'IDLE' 
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20' 
                : withdrawStatus === 'SUCCESS' ? 'bg-emerald-500 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none'}
            `}
          >
               {withdrawStatus === 'IDLE' && (
                  <>
                     <ArrowRightLeft size={18} />
                     {t.confirmAction}
                  </>
              )}
              {withdrawStatus === 'WITHDRAWING' && (
                  <>
                     <Loader2 size={18} className="animate-spin" />
                     {t.withdrawing}
                  </>
              )}
              {withdrawStatus === 'SUCCESS' && (
                  <>
                     <CheckCircle size={18} />
                     {t.withdrawSuccess}
                  </>
              )}
          </button>
        </div>
      </div>
    );
  };

  const renderTradeHistoryView = () => (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 animate-in slide-in-from-right duration-200">
      <div className="flex items-center gap-3 p-4 border-b dark:border-slate-800 border-slate-200 sticky top-0 bg-slate-50 dark:bg-slate-900">
        <button onClick={() => setView('MAIN')} className="p-2 -ml-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full dark:text-white">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-lg font-bold dark:text-white text-slate-900">{t.history}</h2>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 pb-24">
        {tradeHistory.length === 0 ? (
           <div className="text-center dark:text-slate-500 text-slate-400 mt-10">No transactions yet</div>
        ) : (
           tradeHistory.map((trade) => (
             <div key={trade.id} className="bg-white dark:bg-slate-800 border dark:border-slate-700 border-slate-200 p-4 rounded-xl shadow-sm">
               <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold dark:text-white text-slate-900 flex items-center gap-2">
                      {trade.symbol} 
                      <span className={`text-[10px] px-1.5 rounded ${trade.side === Side.LONG ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                         {trade.side}
                      </span>
                    </div>
                    <div className="text-xs dark:text-slate-400 text-slate-500 mt-1">
                      {new Date(trade.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono font-bold ${trade.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)} USD
                    </div>
                    <div className="text-xs dark:text-slate-500 text-slate-400 mt-1">Realized PnL</div>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-2 text-xs dark:text-slate-400 text-slate-500 pt-2 border-t dark:border-slate-700/50 border-slate-100 mt-2">
                 <div>Size: <span className="dark:text-slate-200 text-slate-700">{trade.size}</span></div>
                 <div className="text-right">Entry: <span className="dark:text-slate-200 text-slate-700">{trade.entryPrice.toFixed(2)}</span></div>
                 <div>Close: <span className="dark:text-slate-200 text-slate-700">{trade.closePrice.toFixed(2)}</span></div>
               </div>
             </div>
           ))
        )}
      </div>
    </div>
  );

  const renderTransferHistoryView = () => (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 animate-in slide-in-from-right duration-200">
      <div className="flex items-center gap-3 p-4 border-b dark:border-slate-800 border-slate-200 sticky top-0 bg-slate-50 dark:bg-slate-900">
        <button onClick={() => setView('MAIN')} className="p-2 -ml-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full dark:text-white">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-lg font-bold dark:text-white text-slate-900">{t.transfers}</h2>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 pb-24">
        {transferHistory.length === 0 ? (
           <div className="text-center dark:text-slate-500 text-slate-400 mt-10">No records yet</div>
        ) : (
           transferHistory.map((item) => (
             <div key={item.id} className="bg-white dark:bg-slate-800 border dark:border-slate-700 border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${item.type === 'DEPOSIT' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                    {item.type === 'DEPOSIT' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div>
                    <div className="font-bold dark:text-white text-slate-900 text-sm">
                      {item.type === 'DEPOSIT' ? 'Deposit' : 'Withdraw'} USDC
                    </div>
                    <div className="text-xs dark:text-slate-500 text-slate-400">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                   <div className="font-mono font-bold dark:text-white text-slate-900">
                     {item.type === 'DEPOSIT' ? '+' : '-'}{item.amount.toFixed(2)}
                   </div>
                   <div className="text-[10px] text-emerald-500 font-bold tracking-wider mt-0.5">
                     {item.status}
                   </div>
                </div>
             </div>
           ))
        )}
      </div>
    </div>
  );

  // --- Main View ---

  if (view === 'DEPOSIT') return renderDepositView();
  if (view === 'WITHDRAW') return renderWithdrawView();
  if (view === 'TRADE_HISTORY') return renderTradeHistoryView();
  if (view === 'TRANSFER_HISTORY') return renderTransferHistoryView();
  if (view === 'SETTINGS') return renderSettingsView();
  if (view === 'FUNDING_HISTORY') return renderFundingHistoryView();

  return (
    <div className="p-4 h-full pb-24 overflow-y-auto no-scrollbar animate-in fade-in duration-200 bg-slate-50 dark:bg-slate-900">
      
      {/* Profile Header */}
      <div className="flex items-center justify-between mb-6 pt-2">
         <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full dark:bg-slate-700 bg-slate-200 border dark:border-slate-600 border-slate-300 flex items-center justify-center dark:text-slate-300 text-slate-500">
                <User size={20} />
             </div>
             <div>
                <div className="flex items-center gap-2">
                   <span className="font-bold dark:text-white text-slate-900">{walletAddress}</span>
                   <button onClick={handleCopy} className="text-slate-400 hover:text-indigo-500 transition-colors">
                      {copied ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
                   </button>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-[10px] text-emerald-500 font-medium">Connected</span>
                </div>
             </div>
         </div>
      </div>

      {/* Total Asset Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 shadow-xl mb-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Shield size={100} />
        </div>
        <div className="relative z-10">
          <p className="text-indigo-200 text-sm mb-1">{t.totalEquity} (USD)</p>
          <h1 className="text-3xl font-mono font-bold tracking-tight mb-4">${equity.toFixed(2)}</h1>
          
          <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
             <div>
                <p className="text-indigo-200 text-xs whitespace-nowrap">{t.avail}</p>
                <p className="font-mono font-medium text-sm mt-0.5">${balance.toFixed(2)}</p>
             </div>
             <div>
                <p className="text-indigo-200 text-xs whitespace-nowrap">{t.unrealizedPnL}</p>
                <p className={`font-mono font-medium text-sm mt-0.5 ${(equity - balance) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {(equity - balance) >= 0 ? '+' : ''}{(equity - balance).toFixed(2)}
                </p>
             </div>
             <div>
                <p className="text-indigo-200 text-xs whitespace-nowrap">{t.totalPerpValue}</p>
                <p className="font-mono font-medium text-sm mt-0.5 text-slate-100">${totalPositionValue.toFixed(2)}</p>
             </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button 
          onClick={() => setView('DEPOSIT')}
          className="flex items-center justify-center gap-2 dark:bg-slate-800 bg-white hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 py-4 rounded-xl text-sm font-bold border dark:border-slate-700 border-slate-200 transition-all shadow-sm"
        >
          <div className="bg-emerald-500/20 p-1.5 rounded-full text-emerald-500">
             <CreditCard size={18} />
          </div>
          {t.deposit}
        </button>
        <button 
          onClick={() => setView('WITHDRAW')}
          className="flex items-center justify-center gap-2 dark:bg-slate-800 bg-white hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 py-4 rounded-xl text-sm font-bold border dark:border-slate-700 border-slate-200 transition-all shadow-sm"
        >
           <div className="bg-rose-500/20 p-1.5 rounded-full text-rose-500">
             <ArrowRightLeft size={18} />
          </div>
          {t.withdraw}
        </button>
      </div>

      {/* Menu List */}
      <div className="dark:bg-slate-800 bg-white rounded-xl overflow-hidden border dark:border-slate-700 border-slate-200 shadow-sm">
        <div 
          onClick={() => setView('TRADE_HISTORY')}
          className="flex items-center justify-between p-4 dark:hover:bg-slate-700/50 hover:bg-slate-50 cursor-pointer border-b dark:border-slate-700 border-slate-100"
        >
           <div className="flex items-center gap-3">
             <History size={18} className="dark:text-slate-400 text-slate-500" />
             <span className="text-sm font-medium dark:text-slate-200 text-slate-800">{t.history}</span>
           </div>
           <div className="text-slate-400">›</div>
        </div>

        <div 
          onClick={() => setView('TRANSFER_HISTORY')}
          className="flex items-center justify-between p-4 dark:hover:bg-slate-700/50 hover:bg-slate-50 cursor-pointer border-b dark:border-slate-700 border-slate-100"
        >
           <div className="flex items-center gap-3">
             <ArrowRightLeft size={18} className="dark:text-slate-400 text-slate-500" />
             <span className="text-sm font-medium dark:text-slate-200 text-slate-800">{t.transfers}</span>
           </div>
           <div className="text-slate-400">›</div>
        </div>
        
        <div 
          onClick={() => setView('FUNDING_HISTORY')}
          className="flex items-center justify-between p-4 dark:hover:bg-slate-700/50 hover:bg-slate-50 cursor-pointer border-b dark:border-slate-700 border-slate-100"
        >
           <div className="flex items-center gap-3">
             <Coins size={18} className="dark:text-slate-400 text-slate-500" />
             <span className="text-sm font-medium dark:text-slate-200 text-slate-800">{t.funding}</span>
           </div>
           <div className="text-slate-400">›</div>
        </div>
        
        <div 
          onClick={() => setView('SETTINGS')}
          className="flex items-center justify-between p-4 dark:hover:bg-slate-700/50 hover:bg-slate-50 cursor-pointer"
        >
           <div className="flex items-center gap-3">
             <Settings size={18} className="dark:text-slate-400 text-slate-500" />
             <span className="text-sm font-medium dark:text-slate-200 text-slate-800">{t.settings}</span>
           </div>
           <div className="text-slate-400">›</div>
        </div>
      </div>
      
      {/* Logout Button */}
      <div 
         onClick={onDisconnect}
         className="flex items-center justify-center p-4 mt-6 text-rose-500 font-bold cursor-pointer bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl transition-all"
      >
         <LogOut size={18} className="mr-2" />
         {t.disconnect}
      </div>
      
      <div className="mt-8 text-center">
         <p className="text-xs text-slate-500">GoldenDex Perp v1.0.0</p>
      </div>

    </div>
  );
};