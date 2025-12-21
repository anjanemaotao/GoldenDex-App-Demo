
import React, { useState, useEffect } from 'react';
import { Tab, Side, Position, Order, Candle, FillRecord, TransferRecord, MarginMode, Language, Theme, CashFlowRecord, MarketTrade, Timeframe, PositionMode, MarketInfo } from './types';
import { generateInitialData, INITIAL_BALANCE, SYMBOL, TRANSLATIONS, MOCK_MARKETS } from './constants';
import { BottomNav } from './components/BottomNav';
import { TradeView } from './components/TradeView';
import { PositionsView } from './components/PositionsView';
import { OrdersView } from './components/OrdersView';
import { AccountView } from './components/AccountView';
import { CheckCircle, AlertTriangle } from 'lucide-react';

const Toast = ({ message, visible, type = 'success' }: { message: string, visible: boolean, type?: 'success' | 'error' }) => (
  <div className={`fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg border z-50 transition-all duration-300 flex items-center gap-2 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'} ${type === 'error' ? 'bg-rose-900/90 border-rose-700 text-white' : 'bg-slate-800 border-slate-700 text-white'}`}>
    {type === 'error' ? <AlertTriangle size={18} className="text-white" /> : <CheckCircle size={18} className="text-emerald-500" />}
    <span className="text-sm font-medium">{message}</span>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.TRADE);
  
  // Settings State
  const [language, setLanguage] = useState<Language>('zh-CN');
  const [theme, setTheme] = useState<Theme>('dark');
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [positionMode, setPositionMode] = useState<PositionMode>(PositionMode.ONE_WAY);
  
  // Market State
  const [activeSymbol, setActiveSymbol] = useState<string>(SYMBOL);
  const currentMarket = MOCK_MARKETS.find(m => m.symbol === activeSymbol) || MOCK_MARKETS[0];

  // Auth State
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [externalWalletBalance, setExternalWalletBalance] = useState<number>(5000.00); 
  
  // Market Data State
  const [candles, setCandles] = useState<Candle[]>(generateInitialData(50, '15m'));
  const [currentPrice, setCurrentPrice] = useState<number>(currentMarket.lastPrice);
  const [marketTrades, setMarketTrades] = useState<MarketTrade[]>([]);
  
  // User Data State
  const [balance, setBalance] = useState<number>(INITIAL_BALANCE);
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // History State
  const [fillHistory, setFillHistory] = useState<FillRecord[]>([]);
  const [transferHistory, setTransferHistory] = useState<TransferRecord[]>([]);
  const [cashFlowHistory, setCashFlowHistory] = useState<CashFlowRecord[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);

  const [toast, setToast] = useState<{ message: string, visible: boolean, type?: 'success' | 'error' }>({ message: '', visible: false, type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, visible: true, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  // Populate Mock Data on Mount
  useEffect(() => {
    const now = Date.now();
    setFillHistory([
      { id: 'f1', symbol: 'XAUUSDC', side: Side.LONG, price: 2015.42, size: 0.5, value: 1007.71, fee: -0.50, realizedPnl: 12.50, timestamp: now - 3600000 * 2 },
      { id: 'f2', symbol: 'BTCUSDC', side: Side.SHORT, price: 65200.10, size: 0.01, value: 652.00, fee: -0.32, realizedPnl: -5.20, timestamp: now - 3600000 * 5 },
      { id: 'f3', symbol: 'ETHUSDC', side: Side.LONG, price: 3410.55, size: 0.1, value: 341.05, fee: -0.17, realizedPnl: 8.40, timestamp: now - 3600000 * 24 },
    ]);
    setTransferHistory([
      { id: 't1', type: 'DEPOSIT', amount: 1000.00, timestamp: now - 3600000 * 48, status: 'COMPLETED', network: 'Arbitrum One' },
      { id: 't2', type: 'WITHDRAW', amount: 200.00, timestamp: now - 3600000 * 72, status: 'COMPLETED', network: 'Arbitrum One' },
      { id: 't3', type: 'DEPOSIT', amount: 5000.00, timestamp: now - 3600000 * 120, status: 'COMPLETED', network: 'Arbitrum One' },
    ]);
    setCashFlowHistory([
      { id: 'c1', type: 'FUNDING_FEE', symbol: 'XAUUSDC', amount: -0.12, timestamp: now - 3600000 * 1 },
      { id: 'c2', type: 'TRANSACTION_FEE', symbol: 'XAUUSDC', amount: -0.50, timestamp: now - 3600000 * 2 },
      { id: 'c3', type: 'REALIZED_PNL', symbol: 'XAUUSDC', amount: 12.50, timestamp: now - 3600000 * 2 },
      { id: 'c4', type: 'FUNDING_FEE', symbol: 'XAUUSDC', amount: -0.11, timestamp: now - 3600000 * 9 },
    ]);
    setOrderHistory([
      { id: 'h1', symbol: 'XAUUSDC', side: Side.LONG, type: 'LIMIT', price: 2025.50, amount: 0.5, filled: 0.5, status: 'FILLED', timestamp: now - 3600000 * 3, marginMode: MarginMode.CROSS },
      { id: 'h2', symbol: 'BTCUSDC', side: Side.SHORT, type: 'LIMIT', price: 67000.00, amount: 0.1, filled: 0, status: 'CANCELLED', timestamp: now - 3600000 * 6, marginMode: MarginMode.ISOLATED },
    ]);
  }, []);

  const handleSymbolChange = (symbol: string) => {
    setActiveSymbol(symbol);
    const m = MOCK_MARKETS.find(mk => mk.symbol === symbol) || MOCK_MARKETS[0];
    setCurrentPrice(m.lastPrice);
    setCandles(generateInitialData(50, timeframe));
    setMarketTrades([]);
  };

  useEffect(() => {
    setCandles(generateInitialData(50, timeframe));
  }, [timeframe]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    const interval = setInterval(() => {
      let newPrice = currentPrice;
      const now = new Date();
      setCandles(prevCandles => {
        const lastCandle = prevCandles[prevCandles.length - 1];
        const volatility = 0.8; 
        const move = (Math.random() - 0.5) * volatility;
        newPrice = Math.max(0.01, lastCandle.close + move);
        return [...prevCandles.slice(0, -1), { ...lastCandle, close: newPrice, high: Math.max(lastCandle.high, newPrice), low: Math.min(lastCandle.low, newPrice) }];
      });
      setCurrentPrice(newPrice);
      
      const tradeSide = Math.random() > 0.5 ? Side.LONG : Side.SHORT;
      const tradeSize = parseFloat((Math.random() * 2).toFixed(4));
      setMarketTrades(prev => [{ id: Date.now().toString() + Math.random(), price: newPrice, size: tradeSize, side: tradeSide, time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }, ...prev].slice(0, 20));

      setOrders(prevOrders => {
        const remainingOrders: Order[] = [];
        let ordersExecuted = false;
        prevOrders.forEach(order => {
          let executed = (order.side === Side.LONG && newPrice <= order.price) || (order.side === Side.SHORT && newPrice >= order.price);
          if (executed) {
            ordersExecuted = true;
            const leverage = 20;
            const initialMargin = (order.amount * order.price) / leverage;
            setPositions(prev => [{ id: Date.now().toString() + Math.random(), symbol: activeSymbol, side: order.side, size: order.amount, entryPrice: order.price, leverage: 20, unrealizedPnL: 0, marginMode: order.marginMode, isolatedMargin: order.marginMode === MarginMode.ISOLATED ? initialMargin : undefined }, ...prev]);
            setOrderHistory(prev => [{ ...order, filled: order.amount, status: 'FILLED' }, ...prev]);
            
            // Log fill
            setFillHistory(prev => [{
               id: `f-${Date.now()}`,
               symbol: order.symbol,
               side: order.side,
               price: order.price,
               size: order.amount,
               value: order.amount * order.price,
               fee: -(order.amount * order.price * 0.0005),
               realizedPnl: 0,
               timestamp: Date.now()
            }, ...prev]);
          } else remainingOrders.push(order);
        });
        return ordersExecuted ? remainingOrders : prevOrders;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentPrice, activeSymbol]); 

  const handlePlaceOrder = (side: Side, size: number, price: number, type: 'MARKET' | 'LIMIT', marginMode: MarginMode) => {
    if (!isWalletConnected) { setActiveTab(Tab.ACCOUNT); return; }
    const leverage = 20;
    const requiredMargin = (price * size) / leverage; 
    if (requiredMargin > balance) return;
    setBalance(prev => prev - requiredMargin);
    if (type === 'MARKET') {
      const newPos: Position = { id: Date.now().toString(), symbol: activeSymbol, side, size, entryPrice: price, leverage, unrealizedPnL: 0, marginMode, isolatedMargin: marginMode === MarginMode.ISOLATED ? requiredMargin : undefined };
      setPositions(prev => [newPos, ...prev]);
      setFillHistory(prev => [{
        id: `f-${Date.now()}`,
        symbol: activeSymbol,
        side,
        price,
        size,
        value: size * price,
        fee: -(size * price * 0.0005),
        realizedPnl: 0,
        timestamp: Date.now()
      }, ...prev]);
      showToast(TRANSLATIONS[language].notifications.orderPlaced);
    } else {
      const newOrder: Order = { id: Date.now().toString(), symbol: activeSymbol, side, type: 'LIMIT', price, amount: size, filled: 0, status: 'OPEN', timestamp: Date.now(), marginMode };
      setOrders(prev => [newOrder, ...prev]);
      showToast(TRANSLATIONS[language].notifications.orderPlaced);
    }
  };

  const handleClosePosition = (id: string, amountToClose: number, executionPrice: number, type: 'MARKET' | 'LIMIT') => {
    const pos = positions.find(p => p.id === id);
    if (!pos) return;

    if (type === 'LIMIT') {
        const limitOrder: Order = {
            id: `cl-${Date.now()}`,
            symbol: pos.symbol,
            side: pos.side === Side.LONG ? Side.SHORT : Side.LONG,
            type: 'LIMIT',
            price: executionPrice,
            amount: amountToClose,
            filled: 0,
            status: 'OPEN',
            timestamp: Date.now(),
            marginMode: pos.marginMode
        };
        setOrders(prev => [limitOrder, ...prev]);
        showToast(TRANSLATIONS[language].notifications.orderPlaced);
        return;
    }

    const priceDiff = executionPrice - pos.entryPrice;
    const pnl = pos.side === Side.LONG ? priceDiff * amountToClose : -priceDiff * amountToClose;
    
    let marginToReturn = (pos.marginMode === MarginMode.ISOLATED && pos.isolatedMargin) 
      ? (pos.isolatedMargin * (amountToClose / pos.size)) 
      : (pos.entryPrice * amountToClose) / pos.leverage;
      
    setBalance(prev => prev + marginToReturn + pnl);
    
    setFillHistory(prev => [{
      id: `f-close-${Date.now()}`,
      symbol: pos.symbol,
      side: pos.side === Side.LONG ? Side.SHORT : Side.LONG,
      price: executionPrice,
      size: amountToClose,
      value: executionPrice * amountToClose,
      fee: -(executionPrice * amountToClose * 0.0005),
      realizedPnl: pnl,
      timestamp: Date.now()
    }, ...prev]);

    setCashFlowHistory(prev => [{
      id: `cf-pnl-${Date.now()}`,
      type: 'REALIZED_PNL',
      symbol: pos.symbol,
      amount: pnl,
      timestamp: Date.now()
    }, ...prev]);

    if (amountToClose >= pos.size) {
        setPositions(prev => prev.filter(p => p.id !== id));
    } else {
        setPositions(prev => prev.map(p => {
            if (p.id === id) {
                const newSize = p.size - amountToClose;
                return { 
                  ...p, 
                  size: newSize, 
                  isolatedMargin: p.isolatedMargin ? p.isolatedMargin * (newSize / p.size) : undefined 
                };
            }
            return p;
        }));
    }
    showToast(TRANSLATIONS[language].notifications.positionClosed);
  };

  const handleDeposit = (amount: number) => {
    if (amount > externalWalletBalance) return;
    setExternalWalletBalance(prev => prev - amount);
    setBalance(prev => prev + amount);
    setTransferHistory(prev => [{ id: `tx-${Date.now()}`, type: 'DEPOSIT', amount, timestamp: Date.now(), status: 'COMPLETED', network: 'Arbitrum One' }, ...prev]);
    showToast(TRANSLATIONS[language].notifications.depositSuccess);
  };

  const handleWithdraw = (amount: number) => {
    if (balance < amount) return false;
    setBalance(prev => prev - amount);
    setExternalWalletBalance(prev => prev + amount);
    setTransferHistory(prev => [{ id: `tx-${Date.now()}`, type: 'WITHDRAW', amount, timestamp: Date.now(), status: 'COMPLETED', network: 'Arbitrum One' }, ...prev]);
    showToast(TRANSLATIONS[language].notifications.withdrawSuccess);
    return true;
  };

  const totalUnrealizedPnL = positions.reduce((acc, pos) => acc + (pos.side === Side.LONG ? (currentPrice - pos.entryPrice) * pos.size : (pos.entryPrice - currentPrice) * pos.size), 0);
  const marginLocked = positions.reduce((acc, p) => acc + (p.marginMode === MarginMode.ISOLATED ? (p.isolatedMargin || 0) : (p.entryPrice * p.size / p.leverage)), 0);
  const orderMargin = orders.reduce((acc, ord) => acc + ((ord.price * ord.amount) / 20), 0);
  const equity = balance + marginLocked + orderMargin + totalUnrealizedPnL;
  const totalPosValue = positions.reduce((acc, pos) => acc + (pos.entryPrice * pos.size), 0);
  const maintenanceMargin = totalPosValue * 0.01; 
  const marginRatio = equity > 0 ? (maintenanceMargin / equity) * 100 : 0;

  return (
    <div className={`min-h-screen font-sans max-w-md mx-auto border-x shadow-2xl overflow-hidden relative ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
      <Toast message={toast.message} visible={toast.visible} type={toast.type} />
      <main className="h-screen w-full">
        {activeTab === Tab.TRADE && (
          <TradeView 
            symbol={activeSymbol} currentMarket={currentMarket} onSymbolChange={handleSymbolChange} candles={candles} currentPrice={currentPrice} balance={balance} marketTrades={marketTrades} onPlaceOrder={handlePlaceOrder} lang={language} timeframe={timeframe} onTimeframeChange={setTimeframe} 
          />
        )}
        {activeTab === Tab.POSITIONS && (
          <PositionsView positions={positions} currentPrice={currentPrice} equity={equity} balance={balance} maintenanceMargin={maintenanceMargin} marginRatio={marginRatio} onClosePosition={handleClosePosition} onUpdateMargin={() => {}} onCloseAllPositions={() => {}} lang={language} />
        )}
        {activeTab === Tab.ORDERS && (
          <OrdersView orders={orders} orderHistory={orderHistory} onCancelOrder={(id) => setOrders(o => o.filter(x => x.id !== id))} onCancelAllOrders={() => setOrders([])} lang={language} />
        )}
        {activeTab === Tab.ACCOUNT && (
          <AccountView 
            balance={balance} equity={equity} totalPositionValue={totalPosValue} externalWalletBalance={externalWalletBalance} fillHistory={fillHistory} transferHistory={transferHistory} cashFlowHistory={cashFlowHistory} onDeposit={handleDeposit} onWithdraw={handleWithdraw} isConnected={isWalletConnected} onConnect={() => setIsWalletConnected(true)} onDisconnect={() => setIsWalletConnected(false)} language={language} setLanguage={setLanguage} theme={theme} setTheme={setTheme} positionMode={positionMode} onSetPositionMode={setPositionMode} 
          />
        )}
      </main>
      <BottomNav currentTab={activeTab} onTabChange={setActiveTab} ordersCount={orders.length} positionsCount={positions.length} lang={language} />
    </div>
  );
};

export default App;
