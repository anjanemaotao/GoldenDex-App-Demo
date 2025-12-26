
import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, CreditCard, ArrowRightLeft, Shield, Settings, History, ChevronLeft, Copy, CheckCircle, ExternalLink, ArrowDownLeft, ArrowUpRight, LogOut, User, Coins, Moon, Sun, Loader2, X, ChevronRight, Lock, Info, Filter, ArrowRight, ChevronDown } from 'lucide-react';
import { FillRecord, TransferRecord, Side, Language, Theme, CashFlowRecord, CashFlowType, PositionMode } from '../types';
import { TRANSLATIONS } from '../constants';

interface AccountViewProps {
  balance: number;
  equity: number;
  unrealizedPnL: number;
  totalPositionValue: number;
  externalWalletBalance: number;
  fillHistory: FillRecord[];
  transferHistory: TransferRecord[];
  cashFlowHistory: CashFlowRecord[];
  onDeposit: (amount: number) => void;
  onWithdraw: (amount: number) => boolean;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  positionMode: PositionMode;
  onSetPositionMode: (mode: PositionMode) => void;
}

type ViewState = 'MAIN' | 'DEPOSIT' | 'WITHDRAW' | 'FILL_HISTORY' | 'TRANSFER_HISTORY' | 'SETTINGS' | 'CASH_FLOW_HISTORY';
type LoginStep = 'INITIAL' | 'SELECT_WALLET' | 'CONNECTING' | 'SIGNING' | 'VERIFYING';

const WITHDRAW_FEE = 0.5;

const WALLETS = [
  { 
    id: 'metamask', 
    name: 'MetaMask', 
    color: '#F6851B', 
    icon: <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" className="w-full h-full object-contain" alt="MetaMask" /> 
  },
  { 
    id: 'okx', 
    name: 'OKX Wallet', 
    color: '#000000', 
    icon: <img src="https://s2.coinmarketcap.com/static/img/exchanges/64x64/294.png" className="w-full h-full object-contain rounded-lg" alt="OKX Wallet" /> 
  },
  { 
    id: 'binance', 
    name: 'Binance Wallet', 
    color: '#F0B90B', 
    icon: <img src="https://cryptologos.cc/logos/binance-coin-bnb-logo.svg?v=024" className="w-full h-full object-contain" alt="Binance Wallet" /> 
  },
  { 
    id: 'walletconnect', 
    name: 'WalletConnect', 
    color: '#3B99FC', 
    icon: <img src="https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Logo/Blue%20(Default)/Logo.svg" className="w-full h-full object-contain" alt="WalletConnect" /> 
  }
];

const CURRENCIES = [
  { id: 'USDC', name: 'USDC', color: 'indigo', icon: <Coins size={16} /> },
  { id: 'USDT', name: 'USDT', color: 'emerald', icon: <Coins size={16} /> },
  { id: 'ETH', name: 'ETH', color: 'blue', icon: <Coins size={16} /> },
  { id: 'ARB', name: 'ARB', color: 'sky', icon: <Coins size={16} /> },
];

const EXCHANGE_RATES: Record<string, number> = {
  'USDC': 1.0,
  'USDT': 1.0,
  'ETH': 2500.0,
  'ARB': 0.85
};

export const AccountView: React.FC<AccountViewProps> = ({ 
  balance, equity, unrealizedPnL, totalPositionValue, externalWalletBalance, fillHistory, transferHistory, cashFlowHistory, onDeposit, onWithdraw, isConnected, onConnect, onDisconnect, language, setLanguage, theme, setTheme, positionMode, onSetPositionMode
}) => {
  const [view, setView] = useState<ViewState>('MAIN');
  const [loginStep, setLoginStep] = useState<LoginStep>('INITIAL');
  const [selectedWallet, setSelectedWallet] = useState<typeof WALLETS[0] | null>(null);

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [depositStatus, setDepositStatus] = useState<'IDLE' | 'APPROVING' | 'DEPOSITING' | 'SWAPPING' | 'SUCCESS'>('IDLE');
  const [withdrawStatus, setWithdrawStatus] = useState<'IDLE' | 'WITHDRAWING' | 'SUCCESS'>('IDLE');
  
  const [cashFlowFilter, setCashFlowFilter] = useState<CashFlowType | 'ALL'>('ALL');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const [depositCurrency, setDepositCurrency] = useState(CURRENCIES[0]);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [slippage, setSlippage] = useState('0.5');

  const t = TRANSLATIONS[language];
  const walletAddress = "0x71C7...9A23";

  // Professional deep indigo color from screenshot
  const BRAND_COLOR = "#4338ca"; 

  // Mock currency balances based on the prop for USDC
  const mockBalances = useMemo(() => ({
    'USDC': externalWalletBalance,
    'USDT': 2450.50,
    'ETH': 1.258,
    'ARB': 850.00
  }), [externalWalletBalance]);

  const currentDepositBalance = mockBalances[depositCurrency.id as keyof typeof mockBalances] || 0;

  // Reactively calculate estimated USDC for Deposit
  const estimatedUsdc = useMemo(() => {
    const val = parseFloat(depositAmount);
    if (isNaN(val) || val <= 0) return 0;
    const rate = EXCHANGE_RATES[depositCurrency.id] || 1.0;
    return val * rate;
  }, [depositAmount, depositCurrency]);

  // Calculate estimated received for Withdraw
  const estWithdrawReceived = useMemo(() => {
    const val = parseFloat(withdrawAmount);
    if (isNaN(val) || val <= WITHDRAW_FEE) return 0;
    return val - WITHDRAW_FEE;
  }, [withdrawAmount]);

  useEffect(() => {
    if (!isConnected) { setLoginStep('INITIAL'); setSelectedWallet(null); }
  }, [isConnected]);

  const handleCopy = () => {
    navigator.clipboard.writeText("0x71C762B34567890123456789A23"); 
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) setDepositAmount(value);
  };

  const handleWithdrawChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) setWithdrawAmount(value);
  };

  const handleWeb3Deposit = async () => {
    const val = parseFloat(depositAmount);
    if (isNaN(val) || val <= 0 || val > currentDepositBalance) return;
    
    // ETH doesn't require approval
    if (depositCurrency.id !== 'ETH' && depositCurrency.id !== 'USDC') {
        setDepositStatus('APPROVING');
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    if (depositCurrency.id !== 'USDC') {
        setDepositStatus('SWAPPING');
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    setDepositStatus('DEPOSITING');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onDeposit(estimatedUsdc);
    
    setDepositStatus('SUCCESS');
    setTimeout(() => { setDepositStatus('IDLE'); setDepositAmount(''); setView('MAIN'); }, 1500);
  };

  const handleWeb3Withdraw = async () => {
    const val = parseFloat(withdrawAmount);
    if (isNaN(val) || val <= WITHDRAW_FEE || val > balance) return;
    setWithdrawStatus('WITHDRAWING');
    await new Promise(resolve => setTimeout(resolve, 2000));
    const success = onWithdraw(val);
    if (success) {
        setWithdrawStatus('SUCCESS');
        setTimeout(() => { setWithdrawStatus('IDLE'); setWithdrawAmount(''); setView('MAIN'); }, 1500);
    } else setWithdrawStatus('IDLE');
  };

  const isDepositValid = !isNaN(parseFloat(depositAmount)) && parseFloat(depositAmount) > 0 && parseFloat(depositAmount) <= currentDepositBalance;
  const isWithdrawValid = !isNaN(parseFloat(withdrawAmount)) && parseFloat(withdrawAmount) > WITHDRAW_FEE && parseFloat(withdrawAmount) <= balance;

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full dark:bg-slate-900 bg-slate-50 overflow-hidden relative">
        {loginStep === 'INITIAL' && (
             <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500 w-full max-w-sm p-6">
                <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-8 border border-indigo-500/20"><Wallet size={40} className="text-indigo-500" /></div>
                <h1 className="text-2xl font-bold dark:text-white text-slate-900 mb-2">{t.connect}</h1>
                <p className="dark:text-slate-400 text-slate-500 text-center mb-10 text-sm leading-relaxed">{t.connection.desc}</p>
                <button onClick={() => setLoginStep('SELECT_WALLET')} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">{t.connect}</button>
            </div>
        )}

        {loginStep === 'SELECT_WALLET' && (
            <div className="absolute inset-0 z-20 flex items-end justify-center bg-slate-900/40 backdrop-blur-[6px] transition-all">
                <div 
                  className="bg-white dark:bg-slate-900 w-full rounded-t-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 border-t dark:border-slate-800"
                  style={{ maxHeight: '70vh' }}
                >
                    <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
                    <div className="flex justify-between items-center mb-8 px-2">
                        <h2 className="text-xl font-bold dark:text-white text-slate-900">{t.connection.selectWallet}</h2>
                        <button onClick={() => setLoginStep('INITIAL')} className="p-2 dark:bg-slate-800 bg-slate-100 rounded-full dark:text-slate-400 transition-transform active:scale-90"><X size={18}/></button>
                    </div>
                    <div className="space-y-4 pb-12 overflow-y-auto no-scrollbar">
                        {WALLETS.map((w) => (
                            <button 
                              key={w.id} 
                              onClick={() => { setSelectedWallet(w); setLoginStep('CONNECTING'); setTimeout(() => setLoginStep('SIGNING'), 2500); }} 
                              className="w-full flex items-center justify-between p-5 rounded-2xl border dark:border-slate-800 border-slate-100 dark:bg-slate-800/40 bg-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-md border dark:border-slate-700 p-2 overflow-hidden">{w.icon}</div>
                                    <span className="text-lg font-bold dark:text-slate-200 text-slate-800">{w.name}</span>
                                </div>
                                <ChevronRight size={20} className="text-slate-400" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {loginStep === 'CONNECTING' && selectedWallet && (
            <div className="flex flex-col items-center animate-in fade-in duration-500">
                <div className="relative mb-10">
                    <div className="w-32 h-32 rounded-full border-4 border-slate-800 border-b-indigo-500 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg p-3 overflow-hidden">
                            {selectedWallet.icon}
                        </div>
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{t.connection.connecting}...</h2>
                <p className="text-slate-400 text-sm">{t.connection.approveIn} {selectedWallet.name}</p>
            </div>
        )}

        {(loginStep === 'SIGNING' || loginStep === 'VERIFYING') && selectedWallet && (
            <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                <div className="bg-white dark:bg-[#1b2331] w-full max-w-sm rounded-[28px] p-7 shadow-2xl border dark:border-slate-700/50 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b dark:border-slate-800">
                        <div className="w-12 h-12 rounded-2xl border dark:border-slate-700 p-2.5 bg-white flex items-center justify-center shadow-sm">{selectedWallet.icon}</div>
                        <div>
                           <h3 className="font-bold dark:text-white text-lg leading-tight">{t.connection.sigRequest}</h3>
                           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{selectedWallet.name}</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-[#131a26] border dark:border-slate-800/50 rounded-2xl p-5 mb-8 font-mono text-xs leading-relaxed dark:text-slate-400">
                        <span className="text-indigo-500 font-bold mb-2 block">{t.connection.msgToSign}:</span>
                        Welcome to GoldenDex.<br/><br/>By signing this message, you agree to the Terms of Service.
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => setLoginStep('INITIAL')} 
                            className="py-4 rounded-xl border dark:border-slate-700 border-slate-200 text-slate-500 dark:text-slate-400 font-bold transition-all active:scale-95"
                        >
                            {t.cancel}
                        </button>
                        <button 
                            onClick={() => { setLoginStep('VERIFYING'); setTimeout(() => { onConnect(); setLoginStep('INITIAL'); setSelectedWallet(null); }, 2000); }} 
                            style={{ backgroundColor: BRAND_COLOR }}
                            className="py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                        >
                            {loginStep === 'VERIFYING' ? <><Loader2 size={18} className="animate-spin" /> {t.connection.verifying}</> : t.connection.sign}
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  const renderHeader = (title: string) => (
    <div className="px-4 py-4 flex items-center gap-3 sticky top-0 bg-white dark:bg-slate-900 z-10 border-b dark:border-slate-800 border-slate-200">
      <button onClick={() => setView('MAIN')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><ChevronLeft size={24} className="dark:text-white" /></button>
      <h2 className="text-lg font-bold dark:text-white text-slate-900">{title}</h2>
    </div>
  );

  if (view === 'DEPOSIT') return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 animate-in fade-in">
      {renderHeader(t.depositVaultTitle)}
      <div className="p-4 space-y-6 pb-24">
        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 flex gap-3">
          <Info size={18} className="text-indigo-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {t.depositWarning}
          </p>
        </div>
        <div className="space-y-3"><label className="text-xs font-bold text-slate-500 uppercase">{t.network}</label><div className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 rounded-2xl p-4 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-5 h-5 rounded-full bg-blue-500 border-4 border-slate-800"></div><span className="font-bold dark:text-white text-slate-900">Arbitrum One</span></div><CheckCircle size={16} className="text-emerald-500" /></div></div>
        
        <div className="space-y-3 relative">
          <label className="text-xs font-bold text-slate-500 uppercase">{t.currency}</label>
          <div 
            onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
            className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 rounded-2xl p-4 flex items-center justify-between cursor-pointer active:bg-slate-100 dark:active:bg-slate-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-${depositCurrency.color}-500 bg-${depositCurrency.color}-500/10`}>
                {depositCurrency.icon}
              </div>
              <span className="font-bold dark:text-white text-slate-900">{depositCurrency.name}</span>
            </div>
            <ChevronDown size={18} className={`text-slate-400 transition-transform ${showCurrencyDropdown ? 'rotate-180' : ''}`} />
          </div>

          {showCurrencyDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border dark:border-slate-700 border-slate-200 rounded-xl shadow-xl overflow-hidden z-20 animate-in slide-in-from-top-2 duration-200">
              {CURRENCIES.map(curr => (
                <div 
                  key={curr.id}
                  onClick={() => {
                    setDepositCurrency(curr);
                    setShowCurrencyDropdown(false);
                    setDepositAmount('');
                  }}
                  className={`p-4 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer ${depositCurrency.id === curr.id ? 'bg-slate-50 dark:bg-slate-700/50' : ''}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-${curr.color}-500 bg-${curr.color}-500/10`}>
                    {curr.icon}
                  </div>
                  <span className={`text-sm font-bold ${depositCurrency.id === curr.id ? 'text-indigo-500' : 'dark:text-white text-slate-900'}`}>{curr.name}</span>
                  {depositCurrency.id === curr.id && <CheckCircle size={16} className="ml-auto text-indigo-500" />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-500 uppercase">{t.amount}</label>
            <span className="text-[11px] text-slate-500">{t.walletBalance}: <span className="dark:text-white text-slate-900 font-mono font-bold">{currentDepositBalance.toFixed(depositCurrency.id === 'ETH' ? 4 : 2)}</span></span>
          </div>
          <div className="relative">
            <input 
              type="text" 
              value={depositAmount} 
              onChange={handleDepositChange} 
              placeholder={t.quantity} 
              className="w-full bg-white dark:bg-slate-800 border dark:border-slate-700 border-slate-200 rounded-2xl p-4 pr-24 text-sm font-mono outline-none focus:border-indigo-500 dark:text-white" 
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
              <button onClick={() => setDepositAmount(currentDepositBalance.toString())} className="text-xs font-bold text-indigo-500">{t.max}</button>
              <span className="text-xs font-bold text-slate-500 uppercase">{depositCurrency.name}</span>
            </div>
          </div>
          
          {depositCurrency.id !== 'USDC' && estimatedUsdc > 0 && (
            <div className="px-1 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1 duration-300">
               <span className="text-slate-500 font-medium">{t.estReceived}</span>
               <span className="text-indigo-500 font-bold font-mono">{estimatedUsdc.toFixed(2)} USDC</span>
            </div>
          )}
        </div>

        {depositCurrency.id !== 'USDC' && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-400 space-y-4">
             <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-3 flex gap-3">
                <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                  <ArrowRightLeft size={12} />
                </div>
                <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                  闪兑功能将通过聚合Dex自动将您的充值转换为USDC
                </p>
             </div>
             
             <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">滑点设置</label>
                  <span className="text-[11px] text-slate-400 font-mono">{slippage}%</span>
                </div>
                <div className="flex gap-2">
                  {['0.1', '0.5', '1.0'].map(val => (
                    <button 
                      key={val}
                      onClick={() => setSlippage(val)}
                      style={{ backgroundColor: slippage === val ? BRAND_COLOR : undefined, color: slippage === val ? 'white' : undefined }}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${slippage === val ? 'border-transparent shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}
                    >
                      {val}%
                    </button>
                  ))}
                  <div className="flex-[1.5] relative">
                    <input 
                      type="text" 
                      placeholder="Custom"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d*\.?\d*$/.test(val)) setSlippage(val);
                      }}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs outline-none focus:border-indigo-500 dark:text-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">%</span>
                  </div>
                </div>
             </div>
          </div>
        )}
        
        <button 
          onClick={handleWeb3Deposit} 
          disabled={!isDepositValid || depositStatus !== 'IDLE'} 
          style={{ backgroundColor: isDepositValid && depositStatus === 'IDLE' ? BRAND_COLOR : undefined }}
          className={`w-full py-4 mt-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-3 ${isDepositValid && depositStatus === 'IDLE' ? 'text-white active:scale-95 shadow-indigo-600/20' : 'bg-slate-200 dark:bg-slate-700/30 text-slate-400 cursor-not-allowed shadow-none'}`}
        >
          {depositStatus === 'IDLE' ? (
            <>{depositCurrency.id === 'USDC' ? t.confirm : t.quickSwap}</>
          ) : (
            <div className="flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-xs uppercase tracking-widest text-white">
                {depositStatus === 'APPROVING' ? t.approving.replace('{currency}', depositCurrency.name).split('...')[0] : 
                 depositStatus === 'SWAPPING' ? t.quickSwap : 
                 t.depositing.split('...')[0]}
              </span>
            </div>
          )}
        </button>
      </div>
    </div>
  );

  if (view === 'WITHDRAW') return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 animate-in fade-in">
      {renderHeader(t.withdrawVaultTitle)}
      <div className="p-4 space-y-6 pb-24">
        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 flex gap-3">
          <Info size={18} className="text-indigo-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {t.withdrawWarning.replace('{address}', walletAddress)}
          </p>
        </div>
        <div className="space-y-3"><label className="text-xs font-bold text-slate-500 uppercase">{t.network}</label><div className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 rounded-2xl p-4 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-5 h-5 rounded-full bg-blue-500 border-4 border-slate-800"></div><span className="font-bold dark:text-white text-slate-900">Arbitrum One</span></div><CheckCircle size={16} className="text-emerald-500" /></div></div>
        <div className="space-y-3"><label className="text-xs font-bold text-slate-500 uppercase">{t.currency}</label><div className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 rounded-2xl p-4 flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500"><Coins size={16} /></div><span className="font-bold dark:text-white text-slate-900">USDC</span></div></div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center"><label className="text-xs font-bold text-slate-500 uppercase">{t.amount}</label><span className="text-[11px] text-slate-500">{t.avail}: <span className="dark:text-white text-slate-900 font-mono font-bold">{balance.toFixed(2)}</span></span></div>
          <div className="relative">
            <input type="text" value={withdrawAmount} onChange={handleWithdrawChange} placeholder={t.quantity} className="w-full bg-white dark:bg-slate-800 border dark:border-slate-700 border-slate-200 rounded-2xl p-4 pr-16 text-sm font-mono outline-none focus:border-indigo-500 dark:text-white" />
            <button onClick={() => setWithdrawAmount(balance.toString())} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-500">{t.max}</button>
          </div>
          
          {parseFloat(withdrawAmount) > 0 && (
             <div className="space-y-2 p-1 animate-in fade-in slide-in-from-top-1 duration-300">
               <div className="flex justify-between text-xs">
                 <span className="text-slate-500">{t.withdrawFee}</span>
                 <span className="text-slate-600 dark:text-slate-400 font-mono">{WITHDRAW_FEE.toFixed(1)} USDC</span>
               </div>
               <div className="flex justify-between text-xs font-bold">
                 <span className="text-slate-500">{t.estReceived}</span>
                 <span className="text-indigo-500 font-mono">{estWithdrawReceived.toFixed(2)} USDC</span>
               </div>
             </div>
          )}
        </div>

        <button 
          onClick={handleWeb3Withdraw} 
          disabled={!isWithdrawValid || withdrawStatus !== 'IDLE'} 
          style={{ backgroundColor: isWithdrawValid && withdrawStatus === 'IDLE' ? BRAND_COLOR : undefined }}
          className={`w-full py-4 mt-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-3 ${isWithdrawValid && withdrawStatus === 'IDLE' ? 'text-white active:scale-95 shadow-indigo-600/20' : 'bg-slate-200 dark:bg-slate-700/30 text-slate-400 cursor-not-allowed shadow-none'}`}
        >
          {withdrawStatus === 'IDLE' ? <><ArrowRightLeft size={18} /> {t.confirm}</> : <Loader2 size={18} className="animate-spin text-white" />}
        </button>
      </div>
    </div>
  );

  if (view === 'TRANSFER_HISTORY') return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 animate-in fade-in">
      {renderHeader(t.transfers)}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-24">
        {transferHistory.map(tx => {
          const isDeposit = tx.type === 'DEPOSIT';
          return (
            <div key={tx.id} className="dark:bg-slate-800/40 bg-white border dark:border-slate-700 border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDeposit ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                       {isDeposit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div>
                       <div className="font-bold dark:text-white text-slate-900 text-sm">
                          {isDeposit ? t.deposit : t.withdraw} USDC
                       </div>
                       <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {new Date(tx.timestamp).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/-/g, '/')}
                       </div>
                    </div>
                 </div>
                 <div className="text-right">
                    <div className={`font-mono font-bold text-sm ${isDeposit ? 'text-white dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                       {isDeposit ? '+' : '-'}{tx.amount.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-emerald-500 font-medium mt-0.5">已完成</div>
                 </div>
              </div>
              <div className="flex justify-between items-center border-t dark:border-slate-700/50 pt-3">
                 <div className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-500 dark:text-slate-400 font-bold">Arbitrum One</div>
                 <button className="flex items-center gap-1 text-[10px] text-indigo-500 font-bold hover:underline">
                    Explorer <ExternalLink size={10} />
                 </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (view === 'CASH_FLOW_HISTORY') return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 animate-in fade-in">
      {renderHeader(t.funding)}
      <div className="p-4 relative">
        <div 
          className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 rounded-2xl p-4 flex items-center justify-between mb-4 shadow-sm cursor-pointer relative z-20 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
          onClick={() => setShowFilterDropdown(!showFilterDropdown)}
        >
           <div className="flex items-center gap-3">
              <Filter size={18} className="text-slate-400" />
              <span className="text-sm font-bold dark:text-white text-slate-900">
                {cashFlowFilter === 'ALL' ? t.all : t.cashFlowTypes[cashFlowFilter as CashFlowType]}
              </span>
           </div>
           <ChevronDown size={18} className={`text-slate-400 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
           
           {showFilterDropdown && (
              <div className="absolute top-[calc(100%+8px)] left-0 right-0 dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-30">
                  <div 
                    className={`p-4 text-sm font-medium hover:bg-indigo-500/10 transition-colors border-b dark:border-slate-700/50 ${cashFlowFilter === 'ALL' ? 'text-indigo-500' : 'dark:text-slate-300 text-slate-700'}`}
                    onClick={(e) => { e.stopPropagation(); setCashFlowFilter('ALL'); setShowFilterDropdown(false); }}
                  >
                    {t.all}
                  </div>
                  {(Object.keys(t.cashFlowTypes) as CashFlowType[]).map((type) => (
                    <div 
                      key={type}
                      className={`p-4 text-sm font-medium hover:bg-indigo-500/10 transition-colors border-b last:border-0 dark:border-slate-700/50 ${cashFlowFilter === type ? 'text-indigo-500' : 'dark:text-slate-300 text-slate-700'}`}
                      onClick={(e) => { e.stopPropagation(); setCashFlowFilter(type); setShowFilterDropdown(false); }}
                    >
                      {t.cashFlowTypes[type]}
                    </div>
                  ))}
              </div>
           )}
        </div>

        <div className="space-y-3 overflow-y-auto no-scrollbar pb-24 h-[calc(100vh-180px)]">
          {cashFlowHistory.filter(cf => cashFlowFilter === 'ALL' || cf.type === cashFlowFilter).map(cf => (
            <div key={cf.id} className="dark:bg-slate-800/40 bg-white border dark:border-slate-700 border-slate-200 rounded-2xl p-5 shadow-sm flex justify-between items-center">
              <div>
                 <div className="text-sm font-bold dark:text-white text-slate-900 mb-1">{t.cashFlowTypes[cf.type]}</div>
                 <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                    {new Date(cf.timestamp).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/-/g, '/')}
                    <span className="opacity-40">•</span>
                    <span className="uppercase">{cf.symbol}</span>
                 </div>
              </div>
              <div className="text-right">
                 <div className={`font-mono font-bold text-lg ${cf.amount >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {cf.amount >= 0 ? '+' : ''}{cf.amount.toFixed(4)}
                 </div>
                 <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">USDC</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (view === 'SETTINGS') return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 animate-in fade-in">
      {renderHeader(t.settings)}
      <div className="p-4 space-y-6 pb-24">
        <section>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-2 px-1">{t.positionMode}</h3>
          <div className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
             <button 
                onClick={() => onSetPositionMode(PositionMode.ONE_WAY)}
                className="w-full p-4 flex items-center justify-between border-b dark:border-slate-700/50 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/50"
             >
                <div className="flex items-center gap-3">
                   <ArrowRight size={18} className="text-slate-400" />
                   <span className="text-sm font-bold dark:text-white text-slate-900">{t.oneWayMode}</span>
                </div>
                {positionMode === PositionMode.ONE_WAY && <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20"><CheckCircle size={14} /></div>}
             </button>
             <button 
                onClick={() => onSetPositionMode(PositionMode.HEDGE)}
                className="w-full p-4 flex items-center justify-between transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/50"
             >
                <div className="flex items-center gap-3">
                   <ArrowRightLeft size={18} className="text-slate-400" />
                   <span className="text-sm font-bold dark:text-white text-slate-900">{t.hedgeMode}</span>
                </div>
                {positionMode === PositionMode.HEDGE && <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20"><CheckCircle size={14} /></div>}
             </button>
          </div>
        </section>

        <section>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-2 px-1">{t.language}</h3>
          <div className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
             {[
               { id: 'en', label: 'English', icon: '🇺🇸' },
               { id: 'zh-CN', label: '简体中文', icon: '🇨🇳' },
               { id: 'zh-TW', label: '繁體中文', icon: '🇭🇰' }
             ].map((l, idx, arr) => (
                <button 
                  key={l.id} 
                  onClick={() => setLanguage(l.id as Language)}
                  className={`w-full p-4 flex items-center justify-between transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/50 ${idx !== arr.length - 1 ? 'border-b dark:border-slate-700/50' : ''}`}
                >
                   <div className="flex items-center gap-3">
                      <span className="text-lg leading-none">{l.icon}</span>
                      <span className="text-sm font-bold dark:text-white text-slate-900">{l.label}</span>
                   </div>
                   {language === l.id && <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20"><CheckCircle size={14} /></div>}
                </button>
             ))}
          </div>
        </section>

        <section>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-2 px-1">{t.theme}</h3>
          <div className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
             <button 
                onClick={() => setTheme('dark')}
                className="w-full p-4 flex items-center justify-between border-b dark:border-slate-700/50 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/50"
             >
                <div className="flex items-center gap-3">
                   <Moon size={18} className="text-indigo-500" />
                   <span className="text-sm font-bold dark:text-white text-slate-900">深色</span>
                </div>
                {theme === 'dark' && <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20"><CheckCircle size={14} /></div>}
             </button>
             <button 
                onClick={() => setTheme('light')}
                className="w-full p-4 flex items-center justify-between transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/50"
             >
                <div className="flex items-center gap-3">
                   <Sun size={18} className="text-orange-500" />
                   <span className="text-sm font-bold dark:text-white text-slate-900">浅色</span>
                </div>
                {theme === 'light' && <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20"><CheckCircle size={14} /></div>}
             </button>
          </div>
        </section>
      </div>
    </div>
  );

  if (view === 'FILL_HISTORY') return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 animate-in fade-in">
      {renderHeader(t.history)}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar pb-24">
        {fillHistory.map(f => (
          <div key={f.id} className="dark:bg-slate-800/40 bg-white border dark:border-slate-700 border-slate-200 rounded-xl p-3 shadow-sm">
            <div className="flex justify-between items-center mb-0.5"><div className="flex items-center gap-2"><span className="font-bold dark:text-white text-slate-900 text-sm uppercase tracking-tight">{f.symbol}</span><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${f.side === Side.LONG ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{f.side === Side.LONG ? '买入' : '卖出'}</span></div></div>
            <div className="text-[10px] text-slate-500 mb-2 font-mono">{new Date(f.timestamp).toLocaleString()}</div>
            <div className="grid grid-cols-2 gap-y-1.5">
              <div className="flex justify-between pr-3 items-center"><span className="text-[10px] text-slate-500">{t.price}</span><span className="font-mono font-bold dark:text-slate-200 text-slate-800 text-xs">{f.price.toFixed(2)}</span></div>
              <div className="flex justify-between pl-3 items-center border-l dark:border-slate-700/50"><span className="text-[10px] text-slate-500">{t.qty}</span><span className="font-mono font-bold dark:text-slate-200 text-slate-800 text-xs">{f.size}</span></div>
              <div className="flex justify-between pr-3 items-center"><span className="text-[10px] text-slate-500">{t.tradeHistoryFields.value}</span><span className="font-mono font-bold dark:text-slate-200 text-slate-800 text-xs">{f.value.toFixed(2)}</span></div>
              <div className="flex justify-between pl-3 items-center border-l dark:border-slate-700/50"><span className="text-[10px] text-slate-500">{t.tradeHistoryFields.fee}</span><span className="font-mono font-bold dark:text-slate-400 text-slate-600 text-xs">{f.fee.toFixed(2)}</span></div>
              <div className="flex justify-between pr-3 items-center"><span className="text-[10px] text-slate-500">{t.tradeHistoryFields.realizedPnl}</span><span className={`font-mono font-bold text-xs ${f.realizedPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{f.realizedPnl >= 0 ? '+' : ''}{f.realizedPnl.toFixed(2)}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-4 h-full pb-24 overflow-y-auto no-scrollbar bg-slate-50 dark:bg-slate-900 animate-in fade-in">
      <div className="flex items-center gap-3 mb-6 pt-2">
         <div className="w-10 h-10 rounded-full dark:bg-slate-800 bg-slate-200 flex items-center justify-center text-slate-500"><User size={20} /></div>
         <div className="flex-1 overflow-hidden"><div className="flex items-center gap-2 font-bold dark:text-white text-slate-900 truncate">{walletAddress}<button onClick={handleCopy} className="text-slate-400 hover:text-indigo-500">{copied ? <CheckCircle size={14}/> : <Copy size={14}/>}</button></div><div className="text-[10px] text-emerald-500 font-medium">Connected</div></div>
      </div>
      <div 
        className="rounded-2xl p-6 shadow-xl mb-6 text-white"
        style={{ background: BRAND_COLOR }}
      >
        <p className="text-indigo-100 text-xs mb-1 uppercase tracking-wider">{t.totalEquity} (USD)</p>
        <h1 className="text-3xl font-mono font-bold tracking-tight mb-4">${equity.toFixed(2)}</h1>
        <div className="grid grid-cols-3 gap-2 border-t border-white/20 pt-4">
           <div><p className="text-indigo-100 text-[9px] uppercase">{t.avail}</p><p className="font-mono font-bold text-xs">${balance.toFixed(2)}</p></div>
           <div className="text-center"><p className="text-indigo-100 text-[9px] uppercase">{t.unrealizedPnL}</p><p className={`font-mono font-bold text-xs ${unrealizedPnL >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{unrealizedPnL.toFixed(2)}</p></div>
           <div className="text-right"><p className="text-indigo-100 text-[9px] uppercase">{t.totalPerpValue}</p><p className="font-mono font-bold text-xs">${totalPositionValue.toFixed(2)}</p></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6"><button onClick={() => setView('DEPOSIT')} className="flex items-center justify-center gap-2 dark:bg-slate-800 bg-white py-4 rounded-xl text-sm font-bold border dark:border-slate-700 shadow-sm transition-transform active:scale-95"><CreditCard size={18} className="text-indigo-500"/>{t.deposit}</button><button onClick={() => setView('WITHDRAW')} className="flex items-center justify-center gap-2 dark:bg-slate-800 bg-white py-4 rounded-xl text-sm font-bold border dark:border-slate-700 shadow-sm transition-transform active:scale-95"><ArrowRightLeft size={18} className="text-indigo-500"/>{t.withdraw}</button></div>
      <div className="dark:bg-slate-800 bg-white rounded-xl overflow-hidden border dark:border-slate-700 shadow-sm">
        <button onClick={() => setView('FILL_HISTORY')} className="w-full flex items-center justify-between p-4 border-b dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"><div className="flex items-center gap-3"><History size={18} className="text-slate-400"/><span className="text-sm font-medium dark:text-slate-200">{t.history}</span></div><ChevronRight size={16} className="text-slate-500"/></button>
        <button onClick={() => setView('TRANSFER_HISTORY')} className="w-full flex items-center justify-between p-4 border-b dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"><div className="flex items-center gap-3"><ArrowRightLeft size={18} className="text-slate-400"/><span className="text-sm font-medium dark:text-slate-200">{t.transfers}</span></div><ChevronRight size={16} className="text-slate-500"/></button>
        <button onClick={() => setView('CASH_FLOW_HISTORY')} className="w-full flex items-center justify-between p-4 border-b dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"><div className="flex items-center gap-3"><Coins size={18} className="text-slate-400"/><span className="text-sm font-medium dark:text-slate-200">{t.funding}</span></div><ChevronRight size={16} className="text-slate-500"/></button>
        <button onClick={() => setView('SETTINGS')} className="w-full flex items-center justify-between p-4 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"><div className="flex items-center gap-3"><Settings size={18} className="text-slate-400"/><span className="text-sm font-medium dark:text-slate-200">{t.settings}</span></div><ChevronRight size={16} className="text-slate-500"/></button>
      </div>
      <button onClick={onDisconnect} className="w-full py-4 mt-6 text-rose-500 font-bold bg-rose-500/5 rounded-xl border border-rose-500/10 transition-all active:scale-95 flex items-center justify-center gap-2"><LogOut size={18}/>{t.disconnect}</button>
    </div>
  );
};
