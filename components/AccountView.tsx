import React, { useState, useEffect } from 'react';
import { Wallet, CreditCard, ArrowRightLeft, Shield, Settings, History, ChevronLeft, Copy, CheckCircle, ExternalLink, ArrowDownLeft, ArrowUpRight, LogOut, User, Coins, Moon, Sun, Loader2, X, ChevronRight, Lock } from 'lucide-react';
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
type LoginStep = 'INITIAL' | 'SELECT_WALLET' | 'CONNECTING' | 'SIGNING' | 'VERIFYING';

const WALLETS = [
  { 
    id: 'metamask', 
    name: 'MetaMask', 
    color: '#F6851B',
    icon: (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M27.5 2.5L25.5 5.5L28.5 10.5L30.5 4.5L27.5 2.5Z" fill="#E17726" stroke="#E17726" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4.5 2.5L7.5 5.5L3.5 10.5L1.5 4.5L4.5 2.5Z" fill="#E17726" stroke="#E17726" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 23.5L9 28.5L23 28.5L16 23.5Z" fill="#E17726" stroke="#E17726" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 11.5L5 17.5L9 28.5L16 23.5L23 28.5L27 17.5L23 11.5L16 16.5L9 11.5Z" fill="#F6851B" stroke="#F6851B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    id: 'walletconnect', 
    name: 'WalletConnect', 
    color: '#3B99FC',
    icon: (
       <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
         <path d="M26 11C23 8 19 6 16 6C13 6 9 8 6 11" stroke="#3B99FC" strokeWidth="3" strokeLinecap="round"/>
         <circle cx="8" cy="18" r="3" fill="#3B99FC"/>
         <circle cx="24" cy="18" r="3" fill="#3B99FC"/>
         <path d="M16 21V26" stroke="#3B99FC" strokeWidth="3" strokeLinecap="round"/>
       </svg>
    )
  },
  { 
    id: 'okx', 
    name: 'OKX Wallet', 
    color: '#000000', 
    icon: (
        <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="6" fill="currentColor" className="text-black dark:text-white"/>
            <path d="M8 8H12V12H8V8Z" fill="currentColor" className="text-white dark:text-black"/>
            <path d="M20 8H24V12H20V8Z" fill="currentColor" className="text-white dark:text-black"/>
            <path d="M8 20H12V24H8V20Z" fill="currentColor" className="text-white dark:text-black"/>
            <path d="M20 20H24V24H20V20Z" fill="currentColor" className="text-white dark:text-black"/>
            <path d="M14 14H18V18H14V14Z" fill="currentColor" className="text-white dark:text-black"/>
        </svg>
    )
  },
  { 
    id: 'binance', 
    name: 'Binance Wallet', 
    color: '#F0B90B',
    icon: (
        <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M16 6L22 12L16 18L10 12L16 6Z" fill="#F0B90B"/>
             <path d="M10 12L4 18L10 24L16 18L10 12Z" fill="#F0B90B"/>
             <path d="M22 12L28 18L22 24L16 18L22 12Z" fill="#F0B90B"/>
             <path d="M16 18L22 24L16 30L10 24L16 18Z" fill="#F0B90B"/>
             <circle cx="16" cy="18" r="2" fill="#1e293b"/>
        </svg>
    )
  },
];

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
  const [loginStep, setLoginStep] = useState<LoginStep>('INITIAL');
  const [selectedWallet, setSelectedWallet] = useState<typeof WALLETS[0] | null>(null);

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [depositStatus, setDepositStatus] = useState<'IDLE' | 'APPROVING' | 'DEPOSITING' | 'SUCCESS'>('IDLE');
  const [withdrawStatus, setWithdrawStatus] = useState<'IDLE' | 'WITHDRAWING' | 'SUCCESS'>('IDLE');
  const t = TRANSLATIONS[language];

  // Mock Wallet Address
  const walletAddress = "0x71C7...9A23";

  // Reset login flow when disconnected
  useEffect(() => {
    if (!isConnected) {
        setLoginStep('INITIAL');
        setSelectedWallet(null);
    }
  }, [isConnected]);

  const handleCopy = () => {
    navigator.clipboard.writeText("0x71C762B34567890123456789A23"); 
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setDepositAmount(value);
    }
  };

  const handleWithdrawChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setWithdrawAmount(value);
    }
  };

  const handleWeb3Deposit = async () => {
    const val = parseFloat(depositAmount);
    if (isNaN(val) || val <= 0 || val > externalWalletBalance) return;

    setDepositStatus('APPROVING');
    await new Promise(resolve => setTimeout(resolve, 1500));
    setDepositStatus('DEPOSITING');
    await new Promise(resolve => setTimeout(resolve, 2000));
    onDeposit(val);
    setDepositStatus('SUCCESS');

    setTimeout(() => {
        setDepositStatus('IDLE');
        setDepositAmount('');
        setView('MAIN');
    }, 1500);
  };

  const handleWeb3Withdraw = async () => {
    const val = parseFloat(withdrawAmount);
    if (isNaN(val) || val <= 0 || val > balance) return;

    setWithdrawStatus('WITHDRAWING');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const success = onWithdraw(val);
    if (success) {
        setWithdrawStatus('SUCCESS');
        setTimeout(() => {
            setWithdrawStatus('IDLE');
            setWithdrawAmount('');
            setView('MAIN');
        }, 1500);
    } else {
        setWithdrawStatus('IDLE');
    }
  };

  // Login Flow Handlers
  const handleWalletSelect = (wallet: typeof WALLETS[0]) => {
      setSelectedWallet(wallet);
      setLoginStep('CONNECTING');
      // Simulate connection delay
      setTimeout(() => {
          setLoginStep('SIGNING');
      }, 1500);
  };

  const handleSignMessage = () => {
      setLoginStep('VERIFYING');
      // Simulate signing and verification delay
      setTimeout(() => {
          onConnect();
          // Reset internal state after success (though component might unmount or change view)
          setTimeout(() => {
             setLoginStep('INITIAL');
             setSelectedWallet(null);
          }, 500);
      }, 1500);
  };

  // --- Connect Wallet Screen & Login Flow ---
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 dark:bg-slate-900 bg-slate-50 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Initial Connect Screen */}
        {loginStep === 'INITIAL' && (
             <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500 z-10 w-full max-w-sm">
                <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500/20 to-amber-500/20 rounded-3xl flex items-center justify-center mb-8 border border-white/10 shadow-2xl backdrop-blur-sm relative">
                    <Wallet size={48} className="text-indigo-500 relative z-10" />
                    <div className="absolute inset-0 bg-white/5 rounded-3xl animate-pulse"></div>
                </div>
                <h1 className="text-3xl font-bold dark:text-white text-slate-900 mb-3 tracking-tight">{t.connect}</h1>
                <p className="dark:text-slate-400 text-slate-600 text-center mb-12 text-sm leading-relaxed">
                Connect your secure wallet to deposit funds, trade XAU/USDC perpetual contracts, and manage your portfolio.
                </p>
                
                <button
                    onClick={() => setLoginStep('SELECT_WALLET')}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 group"
                >
                    {t.connect}
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="mt-6 flex items-center gap-2 text-[10px] text-slate-400">
                    <Shield size={12} />
                    <span>Secure & Encrypted Connection</span>
                </div>
            </div>
        )}

        {/* Wallet Selection Modal (Bottom Sheet Style) */}
        {loginStep === 'SELECT_WALLET' && (
            <div className="absolute inset-0 z-20 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold dark:text-white text-slate-900">Select Wallet</h2>
                        <button onClick={() => setLoginStep('INITIAL')} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="space-y-3 pb-8">
                        {WALLETS.map((wallet) => (
                            <button 
                                key={wallet.id}
                                onClick={() => handleWalletSelect(wallet)}
                                className="w-full flex items-center justify-between p-4 rounded-xl border dark:border-slate-700 border-slate-100 dark:bg-slate-700/50 bg-slate-50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-sm border border-slate-100">
                                        {wallet.icon}
                                    </div>
                                    <span className="font-bold dark:text-slate-200 text-slate-800">{wallet.name}</span>
                                </div>
                                <ChevronRight size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* Connecting Loader */}
        {loginStep === 'CONNECTING' && selectedWallet && (
             <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                         <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
                         <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                         <div className="absolute inset-0 flex items-center justify-center">
                             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm p-1">
                                {selectedWallet.icon}
                             </div>
                         </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Connecting...</h3>
                    <p className="text-slate-400 text-sm">Please approve connection in {selectedWallet.name}</p>
                </div>
             </div>
        )}

        {/* Signature Request */}
        {(loginStep === 'SIGNING' || loginStep === 'VERIFYING') && selectedWallet && (
            <div className="absolute inset-0 z-30 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden border dark:border-slate-700">
                    
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6 border-b dark:border-slate-700 pb-4">
                         <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                             {selectedWallet.icon}
                         </div>
                         <div>
                             <h3 className="font-bold dark:text-white text-slate-900 text-sm">Signature Request</h3>
                             <p className="text-[10px] text-slate-500">{selectedWallet.name}</p>
                         </div>
                    </div>

                    {/* Message Content */}
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 mb-6 border dark:border-slate-700 font-mono text-xs">
                        <div className="text-slate-500 mb-2">Message to sign:</div>
                        <div className="dark:text-slate-300 text-slate-700 leading-relaxed break-words">
                            Welcome to GoldenDex. By signing this message, you agree to the Terms of Service.
                            <br/><br/>
                            Nonce: {Date.now()}
                            <br/>
                            Timestamp: {new Date().toISOString()}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                         <button 
                            onClick={() => {
                                setLoginStep('INITIAL');
                                setSelectedWallet(null);
                            }}
                            disabled={loginStep === 'VERIFYING'}
                            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-500 dark:text-slate-400 text-sm"
                         >
                            Reject
                         </button>
                         <button 
                            onClick={handleSignMessage}
                            disabled={loginStep === 'VERIFYING'}
                            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20 text-sm flex items-center justify-center gap-2"
                         >
                             {loginStep === 'VERIFYING' ? (
                                 <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Verifying
                                 </>
                             ) : (
                                 <>
                                    <Lock size={16} />
                                    Sign
                                 </>
                             )}
                         </button>
                    </div>

                    {loginStep === 'VERIFYING' && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 z-10 cursor-not-allowed"></div>
                    )}
                </div>
            </div>
        )}

      </div>
    );
  }

  // --- Main View (Logged In) ---

  const renderSettingsView = () => (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 animate-in slide-in-from-right duration-200">
      <div className="flex items-center gap-3 p-4 border-b dark:border-slate-800 border-slate-200 sticky top-0 bg-slate-50 dark:bg-slate-900 z-10">
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
      <div className="flex items-center gap-3 p-4 border-b dark:border-slate-800 border-slate-200 sticky top-0 bg-slate-50 dark:bg-slate-900 z-10">
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
      <div className="flex items-center gap-3 p-4 border-b dark:border-slate-800 border-slate-200 sticky top-0 bg-slate-50 dark:bg-slate-900 z-10">
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
      <div className="flex items-center gap-3 p-4 border-b dark:border-slate-800 border-slate-200 sticky top-0 bg-slate-50 dark:bg-slate-900 z-10">
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
                   <span className="text-[10px] text-emerald-500 font-medium">Connected to {selectedWallet?.name || 'Wallet'}</span>
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