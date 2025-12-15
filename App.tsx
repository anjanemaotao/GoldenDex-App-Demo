import React, { useState, useEffect } from 'react';
import { Tab, Side, Position, Order, Candle, TradeRecord, TransferRecord, MarginMode, Language, Theme, FundingRecord, MarketTrade } from './types';
import { generateInitialData, INITIAL_BALANCE, SYMBOL, TRANSLATIONS } from './constants';
import { BottomNav } from './components/BottomNav';
import { TradeView } from './components/TradeView';
import { PositionsView } from './components/PositionsView';
import { OrdersView } from './components/OrdersView';
import { AccountView } from './components/AccountView';
import { CheckCircle } from 'lucide-react';

const Toast = ({ message, visible }: { message: string, visible: boolean }) => (
  <div className={`fixed top-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-lg border border-slate-700 z-50 transition-all duration-300 flex items-center gap-2 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
    <CheckCircle size={18} className="text-emerald-500" />
    <span className="text-sm font-medium">{message}</span>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.TRADE);
  
  // Settings State
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('dark');

  // Auth State
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [externalWalletBalance, setExternalWalletBalance] = useState<number>(5000.00); // Mock External Wallet Funds
  
  // Market Data State
  const [candles, setCandles] = useState<Candle[]>(generateInitialData(50));
  const [currentPrice, setCurrentPrice] = useState<number>(candles[candles.length - 1].close);
  const [marketTrades, setMarketTrades] = useState<MarketTrade[]>([]);
  
  // User Data State
  const [balance, setBalance] = useState<number>(INITIAL_BALANCE);
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // History State
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([]);
  const [transferHistory, setTransferHistory] = useState<TransferRecord[]>([]);
  const [fundingHistory, setFundingHistory] = useState<FundingRecord[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);

  // Toast State
  const [toast, setToast] = useState<{ message: string, visible: boolean }>({ message: '', visible: false });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Initial Mock Data
  useEffect(() => {
    // Generate some funding history
    const mockFunding: FundingRecord[] = [];
    const now = Date.now();
    for(let i=1; i<=15; i++) {
        mockFunding.push({
            id: `funding-${i}`,
            symbol: SYMBOL,
            rate: 0.0001 + (Math.random() * 0.00005),
            amount: - (Math.random() * 2).toFixed(4) as unknown as number,
            timestamp: now - (i * 3600 * 1000) // 1 hour intervals
        });
    }
    setFundingHistory(mockFunding);
  }, []);

  // Apply Theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Simulation Loop: Market Data & Limit Order Matching
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Update Candles & Price
      let newPrice = currentPrice;
      const now = new Date();
      
      setCandles(prevCandles => {
        const lastCandle = prevCandles[prevCandles.length - 1];
        
        const volatility = 0.8; // USD movement per tick
        const move = (Math.random() - 0.5) * volatility;
        newPrice = Math.max(0.01, lastCandle.close + move);
        
        // Update High/Low of last candle
        const updatedLastCandle = {
          ...lastCandle,
          close: newPrice,
          high: Math.max(lastCandle.high, newPrice),
          low: Math.min(lastCandle.low, newPrice)
        };
        
        // 5% chance to start a new candle
        if (Math.random() > 0.95) {
           const newCandle: Candle = {
             time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
             open: newPrice,
             close: newPrice,
             high: newPrice,
             low: newPrice
           };
           return [...prevCandles.slice(1), newCandle];
        } else {
           return [...prevCandles.slice(0, -1), updatedLastCandle];
        }
      });
      
      setCurrentPrice(newPrice);
      
      // Simulate Market Trades
      const tradeSide = Math.random() > 0.5 ? Side.LONG : Side.SHORT;
      const tradeSize = parseFloat((Math.random() * 2).toFixed(4));
      const newTrade: MarketTrade = {
          id: Date.now().toString() + Math.random(),
          price: newPrice,
          size: tradeSize,
          side: tradeSide,
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      setMarketTrades(prev => [newTrade, ...prev].slice(0, 20));

      // Randomly generate funding fee (Mock)
      if (Math.random() > 0.999) { // Rare event for demo
        setFundingHistory(prev => [{
            id: Date.now().toString(),
            symbol: SYMBOL,
            rate: 0.0001,
            amount: -0.5, // Mock deduction
            timestamp: Date.now()
        }, ...prev]);
        setBalance(prev => prev - 0.5);
      }

      // 2. Check Limit Orders for Execution
      setOrders(prevOrders => {
        const remainingOrders: Order[] = [];
        const executedOrders: Order[] = [];
        let ordersExecuted = false;

        prevOrders.forEach(order => {
          let executed = false;
          // Buy Limit: Fill if current price <= limit price
          if (order.side === Side.LONG && newPrice <= order.price) {
            executed = true;
          }
          // Sell Limit: Fill if current price >= limit price
          else if (order.side === Side.SHORT && newPrice >= order.price) {
            executed = true;
          }

          if (executed) {
            ordersExecuted = true;
            
            // Calculate initial isolated margin if applicable
            const leverage = 20;
            const initialMargin = (order.amount * order.price) / leverage;

            const newPosition: Position = {
              id: Date.now().toString() + Math.random(),
              symbol: SYMBOL,
              side: order.side,
              size: order.amount,
              entryPrice: order.price, 
              leverage: 20, 
              unrealizedPnL: 0,
              marginMode: order.marginMode,
              isolatedMargin: order.marginMode === MarginMode.ISOLATED ? initialMargin : undefined
            };
            
            // NOTE: We're doing side effects in setState, ideally should use a ref or separate mechanism, 
            // but for this simple simulation it works to keep state matching.
            setPositions(prev => [newPosition, ...prev]);
            
            // Add to history
            const filledOrder: Order = { ...order, filled: order.amount, status: 'FILLED' };
            setOrderHistory(prev => [filledOrder, ...prev]);

            console.log(`Order ${order.id} executed at ${newPrice}`);
          } else {
            remainingOrders.push(order);
          }
        });

        return ordersExecuted ? remainingOrders : prevOrders;
      });

    }, 1000);

    return () => clearInterval(interval);
  }, [currentPrice]); 

  // Trading Logic
  const handlePlaceOrder = (side: Side, size: number, price: number, type: 'MARKET' | 'LIMIT', marginMode: MarginMode) => {
    if (!isWalletConnected) {
      alert("Please connect your wallet in the Assets tab first.");
      setActiveTab(Tab.ACCOUNT);
      return;
    }

    const leverage = 20; // Fixed for demo
    const requiredMargin = (price * size) / leverage; 
    
    if (requiredMargin > balance) {
      alert("Insufficient Balance");
      return;
    }

    setBalance(prev => prev - requiredMargin);

    if (type === 'MARKET') {
      const newPosition: Position = {
        id: Date.now().toString(),
        symbol: SYMBOL,
        side,
        size,
        entryPrice: price,
        leverage,
        unrealizedPnL: 0,
        marginMode,
        isolatedMargin: marginMode === MarginMode.ISOLATED ? requiredMargin : undefined
      };
      setPositions(prev => [newPosition, ...prev]);
      showToast(TRANSLATIONS[language].notifications.orderPlaced);
    } else {
      const newOrder: Order = {
        id: Date.now().toString(),
        symbol: SYMBOL,
        side,
        type: 'LIMIT',
        price,
        amount: size,
        filled: 0,
        status: 'OPEN',
        timestamp: Date.now(),
        marginMode
      };
      setOrders(prev => [newOrder, ...prev]);
      showToast(TRANSLATIONS[language].notifications.orderPlaced);
    }
  };

  const handleClosePosition = (id: string) => {
    const position = positions.find(p => p.id === id);
    if (!position) return;

    const priceDiff = currentPrice - position.entryPrice;
    const pnl = position.side === Side.LONG ? priceDiff * position.size : -priceDiff * position.size;
    
    // For isolated margin, we return the specific isolated margin + pnl
    // For cross margin, we return standard calculated margin + pnl
    let marginToReturn = 0;
    if (position.marginMode === MarginMode.ISOLATED && position.isolatedMargin) {
      marginToReturn = position.isolatedMargin;
    } else {
      marginToReturn = (position.entryPrice * position.size) / position.leverage;
    }
    
    setBalance(prev => prev + marginToReturn + pnl);
    
    const record: TradeRecord = {
      id: position.id,
      symbol: position.symbol,
      side: position.side,
      size: position.size,
      entryPrice: position.entryPrice,
      closePrice: currentPrice,
      pnl: pnl,
      timestamp: Date.now()
    };
    setTradeHistory(prev => [record, ...prev]);

    setPositions(prev => prev.filter(p => p.id !== id));
    showToast(TRANSLATIONS[language].notifications.positionClosed);
  };

  const handleCloseAllPositions = () => {
    if (positions.length === 0) return;
    
    let totalCredit = 0;
    const records: TradeRecord[] = [];

    positions.forEach(position => {
        const priceDiff = currentPrice - position.entryPrice;
        const pnl = position.side === Side.LONG ? priceDiff * position.size : -priceDiff * position.size;
        
        let marginToReturn = 0;
        if (position.marginMode === MarginMode.ISOLATED && position.isolatedMargin) {
            marginToReturn = position.isolatedMargin;
        } else {
            marginToReturn = (position.entryPrice * position.size) / position.leverage;
        }
        
        totalCredit += (marginToReturn + pnl);
        
        records.push({
            id: position.id,
            symbol: position.symbol,
            side: position.side,
            size: position.size,
            entryPrice: position.entryPrice,
            closePrice: currentPrice,
            pnl: pnl,
            timestamp: Date.now()
        });
    });

    setBalance(prev => prev + totalCredit);
    setTradeHistory(prev => [...records, ...prev]);
    setPositions([]);
    showToast(TRANSLATIONS[language].notifications.positionsClosed);
  };

  const handleUpdateMargin = (id: string, amount: number, type: 'ADD' | 'REMOVE') => {
    setPositions(prev => prev.map(pos => {
        if (pos.id === id && pos.marginMode === MarginMode.ISOLATED && pos.isolatedMargin !== undefined) {
            if (type === 'ADD') {
                if (balance >= amount) {
                    setBalance(b => b - amount);
                    return { ...pos, isolatedMargin: pos.isolatedMargin! + amount };
                }
            } else {
                // Should check if removal causes immediate liquidation risk, simplified here
                if (pos.isolatedMargin! > amount) {
                    setBalance(b => b + amount);
                    return { ...pos, isolatedMargin: pos.isolatedMargin! - amount };
                }
            }
        }
        return pos;
    }));
    showToast(TRANSLATIONS[language].notifications.marginUpdated);
  };

  const handleCancelOrder = (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    const leverage = 20;
    const margin = (order.price * order.amount) / leverage;
    setBalance(prev => prev + margin);
    
    setOrders(prev => prev.filter(o => o.id !== id));
    
    // Add to History
    setOrderHistory(prev => [{...order, status: 'CANCELLED'}, ...prev]);
    
    showToast(TRANSLATIONS[language].notifications.orderCancelled);
  };

  const handleCancelAllOrders = () => {
      if (orders.length === 0) return;
      
      let totalRefund = 0;
      const leverage = 20;

      orders.forEach(order => {
          totalRefund += (order.price * order.amount) / leverage;
          // Add to history
          setOrderHistory(prev => [{...order, status: 'CANCELLED'}, ...prev]);
      });

      setBalance(prev => prev + totalRefund);
      setOrders([]);
      showToast(TRANSLATIONS[language].notifications.ordersCancelled);
  };

  const handleDeposit = (amount: number) => {
    // Decrease external wallet, increase account balance
    if (amount > externalWalletBalance) return;
    setExternalWalletBalance(prev => prev - amount);
    setBalance(prev => prev + amount);
    
    setTransferHistory(prev => [{
      id: Date.now().toString(),
      type: 'DEPOSIT',
      amount,
      timestamp: Date.now(),
      status: 'COMPLETED'
    }, ...prev]);
    showToast(TRANSLATIONS[language].notifications.depositSuccess);
  };

  const handleWithdraw = (amount: number) => {
    if (balance < amount) return false;
    // Decrease account balance, increase external wallet
    setBalance(prev => prev - amount);
    setExternalWalletBalance(prev => prev + amount);

    setTransferHistory(prev => [{
      id: Date.now().toString(),
      type: 'WITHDRAW',
      amount,
      timestamp: Date.now(),
      status: 'COMPLETED'
    }, ...prev]);
    showToast(TRANSLATIONS[language].notifications.withdrawSuccess);
    return true;
  };

  // Calculate Equity
  const totalUnrealizedPnL = positions.reduce((acc, pos) => {
    const diff = currentPrice - pos.entryPrice;
    const pnl = pos.side === Side.LONG ? diff * pos.size : -diff * pos.size;
    return acc + pnl;
  }, 0);

  const isolatedMarginLocked = positions
    .filter(p => p.marginMode === MarginMode.ISOLATED)
    .reduce((acc, p) => acc + (p.isolatedMargin || 0), 0);
  
  const crossMarginLocked = positions
    .filter(p => p.marginMode === MarginMode.CROSS)
    .reduce((acc, p) => acc + ((p.entryPrice * p.size) / p.leverage), 0);

  const orderMargin = orders.reduce((acc, ord) => acc + ((ord.price * ord.amount) / 20), 0);

  const equity = balance + isolatedMarginLocked + crossMarginLocked + orderMargin + totalUnrealizedPnL;

  const totalPositionValue = positions.reduce((acc, pos) => acc + (pos.entryPrice * pos.size), 0);
  const maintenanceMargin = totalPositionValue * 0.01; 
  const marginRatio = equity > 0 ? (maintenanceMargin / equity) * 100 : 0;

  return (
    <div className={`min-h-screen font-sans max-w-md mx-auto border-x shadow-2xl overflow-hidden relative ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
      
      <Toast message={toast.message} visible={toast.visible} />

      {/* Main Content Area */}
      <main className="h-screen w-full">
        {activeTab === Tab.TRADE && (
          <TradeView 
            candles={candles} 
            currentPrice={currentPrice} 
            balance={balance}
            marketTrades={marketTrades}
            onPlaceOrder={handlePlaceOrder}
            lang={language}
          />
        )}
        {activeTab === Tab.POSITIONS && (
          <PositionsView 
            positions={positions} 
            currentPrice={currentPrice}
            equity={equity}
            balance={balance}
            maintenanceMargin={maintenanceMargin}
            marginRatio={marginRatio}
            onClosePosition={handleClosePosition}
            onUpdateMargin={handleUpdateMargin}
            onCloseAllPositions={handleCloseAllPositions}
            lang={language}
          />
        )}
        {activeTab === Tab.ORDERS && (
          <OrdersView 
            orders={orders} 
            orderHistory={orderHistory}
            onCancelOrder={handleCancelOrder}
            onCancelAllOrders={handleCancelAllOrders}
            lang={language}
          />
        )}
        {activeTab === Tab.ACCOUNT && (
          <AccountView 
            balance={balance}
            equity={equity}
            totalPositionValue={totalPositionValue}
            externalWalletBalance={externalWalletBalance}
            tradeHistory={tradeHistory}
            transferHistory={transferHistory}
            fundingHistory={fundingHistory}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
            isConnected={isWalletConnected}
            onConnect={() => setIsWalletConnected(true)}
            onDisconnect={() => setIsWalletConnected(false)}
            language={language}
            setLanguage={setLanguage}
            theme={theme}
            setTheme={setTheme}
          />
        )}
      </main>

      {/* Navigation */}
      <BottomNav 
        currentTab={activeTab} 
        onTabChange={setActiveTab} 
        ordersCount={orders.length}
        positionsCount={positions.length}
        lang={language}
      />
    </div>
  );
};

export default App;