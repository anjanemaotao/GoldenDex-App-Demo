
import React, { useState, useEffect } from 'react';
import { Tab, Side, Position, Order, Candle, FillRecord, TransferRecord, MarginMode, Language, Theme, CashFlowRecord, MarketTrade, Timeframe, PositionMode, MarketInfo } from './types';
import { generateInitialData, INITIAL_BALANCE, SYMBOL, TRANSLATIONS, MOCK_MARKETS } from './constants';
import { BottomNav } from './components/BottomNav';
import { TradeView } from './components/TradeView';
import { PositionsView } from './components/PositionsView';
import { OrdersView } from './components/OrdersView';
import { AccountView } from './components/AccountView';
import { CheckCircle, AlertTriangle, Bell, X } from 'lucide-react';

interface InternalNotification {
  id: string;
  title: string;
  content: string;
}

const NotificationOverlay = ({ notifications, onRemove }: { notifications: InternalNotification[], onRemove: (id: string) => void }) => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[100] space-y-3 pointer-events-none">
      {notifications.map((n) => (
        <div 
          key={n.id} 
          className="pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-top duration-300 relative group"
        >
           <button onClick={() => onRemove(n.id)} className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
             <X size={14} />
           </button>
           <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-500">
                <Bell size={16} />
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="text-sm font-bold text-white mb-1">{n.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">{n.content}</p>
              </div>
           </div>
        </div>
      ))}
    </div>
  );
};

const Toast = ({ message, visible, type = 'success' }: { message: string, visible: boolean, type?: 'success' | 'error' }) => (
  <div className={`fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg border z-50 transition-all duration-300 flex items-center gap-2 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'} ${type === 'error' ? 'bg-rose-900/90 border-rose-700 text-white' : 'bg-slate-800 border-slate-700 text-white'}`}>
    {type === 'error' ? <AlertTriangle size={18} className="text-white" /> : <CheckCircle size={18} className="text-emerald-500" />}
    <span className="text-sm font-medium">{message}</span>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.TRADE);
  const [language, setLanguage] = useState<Language>('zh-CN');
  const [theme, setTheme] = useState<Theme>('dark');
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [positionMode, setPositionMode] = useState<PositionMode>(PositionMode.ONE_WAY);
  const [activeSymbol, setActiveSymbol] = useState<string>(SYMBOL);
  const currentMarket = MOCK_MARKETS.find(m => m.symbol === activeSymbol) || MOCK_MARKETS[0];
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [externalWalletBalance, setExternalWalletBalance] = useState<number>(5000.00); 
  const [candles, setCandles] = useState<Candle[]>(generateInitialData(50, '15m'));
  const [currentPrice, setCurrentPrice] = useState<number>(currentMarket.lastPrice);
  const [marketTrades, setMarketTrades] = useState<MarketTrade[]>([]);
  const [balance, setBalance] = useState<number>(INITIAL_BALANCE);
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [orderHistory, setOrderHistory] = useState<Order[]>([
    { id: 'oh1', symbol: 'XAUUSDC', side: Side.LONG, type: 'LIMIT', price: 2010.50, amount: 2.0, filled: 0.8, status: 'PARTIAL_FILLED', timestamp: Date.now() - 3600000, marginMode: MarginMode.CROSS },
    { id: 'oh2', symbol: 'BTCUSDC', side: Side.SHORT, type: 'LIMIT', price: 68500.00, amount: 0.1, filled: 0.1, status: 'FILLED', timestamp: Date.now() - 7200000, marginMode: MarginMode.ISOLATED },
    { id: 'oh3', symbol: 'ETHUSDC', side: Side.LONG, type: 'LIMIT', price: 3200.00, amount: 5.0, filled: 0, status: 'CANCELLED', timestamp: Date.now() - 10800000, marginMode: MarginMode.CROSS },
    { id: 'oh4', symbol: 'XAUUSDC', side: Side.SHORT, type: 'LIMIT', price: 2050.25, amount: 1.5, filled: 1.5, status: 'FILLED', timestamp: Date.now() - 14400000, marginMode: MarginMode.CROSS }
  ]);

  const [fillHistory] = useState<FillRecord[]>([
    { id: 'f1', symbol: 'XAUUSDC', side: Side.LONG, price: 2015.42, size: 0.5, value: 1007.71, fee: -0.50, realizedPnl: 12.50, timestamp: new Date('2025/12/22 07:36:43').getTime() },
    { id: 'f2', symbol: 'BTCUSDC', side: Side.SHORT, price: 65200.10, size: 0.01, value: 652.00, fee: -0.32, realizedPnl: -5.20, timestamp: new Date('2025/12/22 04:36:43').getTime() }
  ]);

  const [transferHistory, setTransferHistory] = useState<TransferRecord[]>([
    { id: 't1', type: 'DEPOSIT', amount: 1000.00, timestamp: new Date('2025/12/20 09:36:43').getTime(), status: 'COMPLETED', network: 'Arbitrum One' },
    { id: 't2', type: 'WITHDRAW', amount: 200.00, timestamp: new Date('2025/12/19 09:36:43').getTime(), status: 'COMPLETED', network: 'Arbitrum One' },
  ]);

  const [cashFlowHistory] = useState<CashFlowRecord[]>([
    { id: 'cf1', type: 'FUNDING_FEE', symbol: 'XAUUSDC', amount: -0.1200, timestamp: new Date('2025/12/22 08:36:43').getTime() },
    { id: 'cf2', type: 'TRANSACTION_FEE', symbol: 'XAUUSDC', amount: -0.5000, timestamp: new Date('2025/12/22 07:36:43').getTime() },
    { id: 'cf3', type: 'REALIZED_PNL', symbol: 'XAUUSDC', amount: 12.5000, timestamp: new Date('2025/12/22 07:36:43').getTime() },
    { id: 'cf4', type: 'FUNDING_FEE', symbol: 'XAUUSDC', amount: -0.1100, timestamp: new Date('2025/12/22 00:36:43').getTime() },
    { id: 'cf5', type: 'LIQUIDATION_FEE', symbol: 'SOLUSDC', amount: -4.2000, timestamp: new Date('2025/12/21 21:36:43').getTime() },
    { id: 'cf6', type: 'REALIZED_PNL', symbol: 'ETHUSDC', amount: -8.4500, timestamp: new Date('2025/12/21 18:12:43').getTime() },
    { id: 'cf7', type: 'TRANSACTION_FEE', symbol: 'BTCUSDC', amount: -0.3200, timestamp: new Date('2025/12/21 14:05:43').getTime() }
  ]);

  const [toast, setToast] = useState<{ message: string, visible: boolean, type?: 'success' | 'error' }>({ message: '', visible: false, type: 'success' });
  const [notifications, setNotifications] = useState<InternalNotification[]>([]);

  const t = TRANSLATIONS[language];

  const triggerNotification = (title: string, content: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [{ id, title, content }, ...prev].slice(0, 3));
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 6000);
  };

  const handleSymbolChange = (symbol: string) => {
    setActiveSymbol(symbol);
    const newMarket = MOCK_MARKETS.find(m => m.symbol === symbol) || MOCK_MARKETS[0];
    setCurrentPrice(newMarket.lastPrice);
    setCandles(generateInitialData(50, timeframe));
    setMarketTrades([]); 
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    const interval = setInterval(() => {
      let newPrice = currentPrice;
      
      setCandles(prevCandles => {
        const lastCandle = prevCandles[prevCandles.length - 1];
        const move = (Math.random() - 0.5) * 0.8;
        newPrice = Math.max(0.01, lastCandle.close + move);
        return [...prevCandles.slice(0, -1), { ...lastCandle, close: newPrice, high: Math.max(lastCandle.high, newPrice), low: Math.min(lastCandle.low, newPrice) }];
      });
      setCurrentPrice(newPrice);
      
      if (Math.random() > 0.6) {
        setMarketTrades(prev => [
          {
            id: Date.now().toString(),
            price: newPrice + (Math.random() - 0.5) * 0.2,
            size: Math.random() * 2 + 0.01,
            side: Math.random() > 0.5 ? Side.LONG : Side.SHORT,
            time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
          },
          ...prev.slice(0, 19)
        ]);
      }

      setOrders(prevOrders => {
        const remainingOrders: Order[] = [];
        let ordersExecuted = false;
        prevOrders.forEach(order => {
          let executed = (order.side === Side.LONG && newPrice <= order.price) || (order.side === Side.SHORT && newPrice >= order.price);
          if (executed) {
            ordersExecuted = true;
            const initialMargin = (order.amount * order.price) / 20;
            setPositions(prev => [{ id: Date.now().toString() + Math.random(), symbol: activeSymbol, side: order.side, size: order.amount, entryPrice: order.price, leverage: 20, unrealizedPnL: 0, marginMode: order.marginMode, isolatedMargin: order.marginMode === MarginMode.ISOLATED ? initialMargin : undefined }, ...prev]);
            setOrderHistory(prev => [{ ...order, filled: order.amount, status: 'FILLED' }, ...prev]);
            
            const fee = (order.amount * order.price * 0.0005);
            triggerNotification(
                t.appNotifications.limitFilled.title,
                t.appNotifications.limitFilled.content
                    .replace('{side}', order.side === Side.LONG ? (language === 'en' ? 'Buy' : '买入') : (language === 'en' ? 'Sell' : '卖出'))
                    .replace('{size}', order.amount.toString())
                    .replace('{price}', order.price.toFixed(2))
                    .replace('{fee}', `$${fee.toFixed(2)}`)
            );
          } else remainingOrders.push(order);
        });
        return ordersExecuted ? remainingOrders : prevOrders;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentPrice, activeSymbol, language, t]); 

  const handlePlaceOrder = (side: Side, size: number, price: number, type: 'MARKET' | 'LIMIT', marginMode: MarginMode) => {
    if (!isWalletConnected) { setActiveTab(Tab.ACCOUNT); return; }
    const leverage = 20;
    const requiredMargin = (price * size) / leverage; 
    if (requiredMargin > balance) return;
    setBalance(prev => prev - requiredMargin);
    
    if (type === 'MARKET') {
      const newPos: Position = { id: Date.now().toString(), symbol: activeSymbol, side, size, entryPrice: price, leverage, unrealizedPnL: 0, marginMode, isolatedMargin: marginMode === MarginMode.ISOLATED ? requiredMargin : undefined };
      setPositions(prev => [newPos, ...prev]);
      const fee = (size * price * 0.0005);
      triggerNotification(
        t.appNotifications.marketFilled.title,
        t.appNotifications.marketFilled.content
            .replace('{side}', side === Side.LONG ? (language === 'en' ? 'Buy' : '买入') : (language === 'en' ? 'Sell' : '卖出'))
            .replace('{size}', size.toString())
            .replace('{price}', price.toFixed(2))
            .replace('{fee}', `$${fee.toFixed(2)}`)
      );
    } else {
      const newOrder: Order = { id: Date.now().toString(), symbol: activeSymbol, side, type: 'LIMIT', price, amount: size, filled: 0, status: 'OPEN', timestamp: Date.now(), marginMode };
      setOrders(prev => [newOrder, ...prev]);
      triggerNotification(
        t.appNotifications.orderSuccess.title,
        t.appNotifications.orderSuccess.content
            .replace('{symbol}', activeSymbol)
            .replace('{side}', side === Side.LONG ? t.longLabel : t.shortLabel)
            .replace('{type}', t.limit)
            .replace('{price}', price.toFixed(2))
            .replace('{size}', size.toString())
            .replace('{leverage}', leverage.toString())
      );
    }
  };

  const handleClosePosition = (id: string, amountToClose: number, executionPrice: number, type: 'MARKET' | 'LIMIT') => {
    const pos = positions.find(p => p.id === id);
    if (!pos) return;

    if (type === 'LIMIT') {
        const limitOrder: Order = { id: `cl-${Date.now()}`, symbol: pos.symbol, side: pos.side === Side.LONG ? Side.SHORT : Side.LONG, type: 'LIMIT', price: executionPrice, amount: amountToClose, filled: 0, status: 'OPEN', timestamp: Date.now(), marginMode: pos.marginMode };
        setOrders(prev => [limitOrder, ...prev]);
        triggerNotification(
            t.appNotifications.orderSuccess.title,
            t.appNotifications.orderSuccess.content
                .replace('{symbol}', pos.symbol)
                .replace('{side}', pos.side === Side.LONG ? t.shortLabel : t.longLabel)
                .replace('{type}', t.limit)
                .replace('{price}', executionPrice.toFixed(2))
                .replace('{size}', amountToClose.toString())
                .replace('{leverage}', pos.leverage.toString())
        );
        return;
    }

    const priceDiff = executionPrice - pos.entryPrice;
    const pnl = pos.side === Side.LONG ? priceDiff * amountToClose : -priceDiff * amountToClose;
    let marginToReturn = (pos.marginMode === MarginMode.ISOLATED && pos.isolatedMargin) ? (pos.isolatedMargin * (amountToClose / pos.size)) : (pos.entryPrice * amountToClose) / pos.leverage;
    setBalance(prev => prev + marginToReturn + pnl);
    
    if (amountToClose >= pos.size) {
        setPositions(prev => prev.filter(p => p.id !== id));
        triggerNotification(
            t.appNotifications.posClosed.title,
            t.appNotifications.posClosed.content
                .replace('{symbol}', pos.symbol)
                .replace('{side}', pos.side === Side.LONG ? t.longLabel : t.shortLabel)
                .replace('{size}', amountToClose.toFixed(2))
                .replace('{pnl}', pnl.toFixed(2))
        );
    } else {
        setPositions(prev => prev.map(p => p.id === id ? { ...p, size: p.size - amountToClose, isolatedMargin: p.isolatedMargin ? p.isolatedMargin * ((p.size - amountToClose) / p.size) : undefined } : p));
        triggerNotification(
            t.appNotifications.posReduced.title,
            t.appNotifications.posReduced.content
                .replace('{symbol}', pos.symbol)
                .replace('{side}', pos.side === Side.LONG ? t.longLabel : t.shortLabel)
                .replace('{size}', amountToClose.toFixed(2))
                .replace('{remaining}', (pos.size - amountToClose).toFixed(2))
                .replace('{pnl}', pnl.toFixed(2))
        );
    }
  };

  const handleUpdateMargin = (id: string, amount: number, type: 'ADD' | 'REMOVE') => {
      const pos = positions.find(p => p.id === id);
      if (!pos || !pos.isolatedMargin) return;

      if (type === 'ADD') {
          if (amount > balance) return;
          setBalance(prev => prev - amount);
          setPositions(prev => prev.map(p => p.id === id ? { ...p, isolatedMargin: (p.isolatedMargin || 0) + amount } : p));
      } else {
          const maintMargin = (pos.entryPrice * pos.size) * 0.01;
          const maxRemovable = pos.isolatedMargin - maintMargin;
          if (amount > maxRemovable) return;
          setBalance(prev => prev + amount);
          setPositions(prev => prev.map(p => p.id === id ? { ...p, isolatedMargin: (p.isolatedMargin || 0) - amount } : p));
      }

      triggerNotification(
          t.appNotifications.marginUpdated.title,
          t.appNotifications.marginUpdated.content
              .replace('{symbol}', pos.symbol)
              .replace('{amount}', (type === 'ADD' ? '+' : '-') + amount.toFixed(2))
      );
  };

  const handleDeposit = (amount: number) => {
    if (amount > externalWalletBalance) return;
    setExternalWalletBalance(prev => prev - amount);
    setBalance(prev => prev + amount);
    setTransferHistory(prev => [{ id: `tx-${Date.now()}`, type: 'DEPOSIT', amount, timestamp: Date.now(), status: 'COMPLETED', network: 'Arbitrum One' }, ...prev]);
    triggerNotification(
        t.appNotifications.deposit.title,
        t.appNotifications.deposit.content.replace('{amount}', amount.toLocaleString())
    );
  };

  const handleWithdraw = (amount: number) => {
    if (balance < amount) return false;
    setBalance(prev => prev - amount);
    setExternalWalletBalance(prev => prev + amount);
    setTransferHistory(prev => [{ id: `tx-${Date.now()}`, type: 'WITHDRAW', amount, timestamp: Date.now(), status: 'COMPLETED', network: 'Arbitrum One' }, ...prev]);
    triggerNotification(
        t.appNotifications.withdraw.title,
        t.appNotifications.withdraw.content.replace('{amount}', amount.toLocaleString()).replace('{address}', '0x71C7...9A23')
    );
    return true;
  };

  const handleCancelOrder = (id: string) => {
    setOrders(prev => {
        const order = prev.find(o => o.id === id);
        if (order) {
            triggerNotification(
                language === 'en' ? 'Order Cancelled' : '订单已取消',
                language === 'en' 
                  ? `Successfully cancelled ${order.symbol} ${order.side} order.` 
                  : `已成功撤销 ${order.symbol} ${order.side === Side.LONG ? '买入' : '卖出'} 挂单。`
            );
        }
        return prev.filter(o => o.id !== id);
    });
  };

  const handleCancelAllOrders = () => {
    if (orders.length > 0) {
        setOrders([]);
        triggerNotification(
            language === 'en' ? 'All Orders Cancelled' : '全部订单已取消',
            language === 'en' ? 'Successfully cancelled all open orders.' : '已成功撤销所有当前挂单。'
        );
    }
  };

  const handleCloseAllPositions = () => {
    const count = positions.length;
    if (count === 0) return;
    setPositions([]);
    triggerNotification(
        language === 'en' ? 'All Positions Closed' : '全部持仓已平',
        language === 'en' 
          ? `Successfully closed all ${count} positions at market price.` 
          : `已成功以市价平掉所有当前持仓（共 ${count} 个）。`
    );
  };

  const totalUnrealizedPnL = positions.reduce((acc, pos) => acc + (pos.side === Side.LONG ? (currentPrice - pos.entryPrice) * pos.size : (pos.entryPrice - currentPrice) * pos.size), 0);
  const marginLocked = positions.reduce((acc, p) => acc + (p.marginMode === MarginMode.ISOLATED ? (p.isolatedMargin || 0) : (p.entryPrice * p.size / p.leverage)), 0);
  
  // Update Equity calculation to strictly include: available balance, unrealized PnL, and position margin.
  const equity = balance + marginLocked + totalUnrealizedPnL;
  
  const totalPosValue = positions.reduce((acc, pos) => acc + (pos.entryPrice * pos.size), 0);
  const maintenanceMargin = totalPosValue * 0.01; 
  const marginRatio = equity > 0 ? (maintenanceMargin / equity) * 100 : 0;

  return (
    <div className={`min-h-screen font-sans max-w-md mx-auto border-x shadow-2xl overflow-hidden relative ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
      <NotificationOverlay notifications={notifications} onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
      <Toast message={toast.message} visible={toast.visible} type={toast.type} />
      <main className="h-screen w-full">
        {activeTab === Tab.TRADE && (
          <TradeView symbol={activeSymbol} currentMarket={currentMarket} onSymbolChange={handleSymbolChange} candles={candles} currentPrice={currentPrice} balance={balance} marketTrades={marketTrades} onPlaceOrder={handlePlaceOrder} lang={language} timeframe={timeframe} onTimeframeChange={setTimeframe} positions={positions} />
        )}
        {activeTab === Tab.POSITIONS && (
          <PositionsView positions={positions} currentPrice={currentPrice} equity={equity} balance={balance} maintenanceMargin={maintenanceMargin} marginRatio={marginRatio} onClosePosition={handleClosePosition} onUpdateMargin={handleUpdateMargin} onCloseAllPositions={handleCloseAllPositions} lang={language} />
        )}
        {activeTab === Tab.ORDERS && (
          <OrdersView orders={orders} orderHistory={orderHistory} onCancelOrder={handleCancelOrder} onCancelAllOrders={handleCancelAllOrders} lang={language} />
        )}
        {activeTab === Tab.ACCOUNT && (
          <AccountView balance={balance} equity={equity} unrealizedPnL={totalUnrealizedPnL} totalPositionValue={totalPosValue} externalWalletBalance={externalWalletBalance} fillHistory={fillHistory} transferHistory={transferHistory} cashFlowHistory={cashFlowHistory} onDeposit={handleDeposit} onWithdraw={handleWithdraw} isConnected={isWalletConnected} onConnect={() => setIsWalletConnected(true)} onDisconnect={() => setIsWalletConnected(false)} language={language} setLanguage={setLanguage} theme={theme} setTheme={setTheme} positionMode={positionMode} onSetPositionMode={setPositionMode} />
        )}
      </main>
      <BottomNav currentTab={activeTab} onTabChange={setActiveTab} ordersCount={orders.length} positionsCount={positions.length} lang={language} />
    </div>
  );
};

export default App;
