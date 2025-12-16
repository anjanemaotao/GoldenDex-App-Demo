import React, { useState, useEffect } from 'react';
import { Tab, Side, Position, Order, Candle, FillRecord, TransferRecord, MarginMode, Language, Theme, CashFlowRecord, MarketTrade, Timeframe, PositionMode } from './types';
import { generateInitialData, INITIAL_BALANCE, SYMBOL, TRANSLATIONS } from './constants';
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
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('dark');
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [positionMode, setPositionMode] = useState<PositionMode>(PositionMode.ONE_WAY);

  // Auth State
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [externalWalletBalance, setExternalWalletBalance] = useState<number>(5000.00); // Mock External Wallet Funds
  
  // Market Data State
  const [candles, setCandles] = useState<Candle[]>(generateInitialData(50, '15m'));
  const [currentPrice, setCurrentPrice] = useState<number>(candles[candles.length - 1].close);
  const [marketTrades, setMarketTrades] = useState<MarketTrade[]>([]);
  
  // User Data State
  const [balance, setBalance] = useState<number>(INITIAL_BALANCE);
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // History State
  const [fillHistory, setFillHistory] = useState<FillRecord[]>([]); // Trade Execution History
  const [transferHistory, setTransferHistory] = useState<TransferRecord[]>([]);
  const [cashFlowHistory, setCashFlowHistory] = useState<CashFlowRecord[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);

  // Toast State
  const [toast, setToast] = useState<{ message: string, visible: boolean, type?: 'success' | 'error' }>({ message: '', visible: false, type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, visible: true, type });
    setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Update Candles when timeframe changes
  useEffect(() => {
    const newData = generateInitialData(50, timeframe);
    setCandles(newData);
    // Don't reset current price to avoid jumpy UI, just let it sync
  }, [timeframe]);

  // Initial Mock Data
  useEffect(() => {
    // Generate some diverse cash flow history
    const mockCashFlow: CashFlowRecord[] = [];
    const now = Date.now();
    
    // 1. Funding Fees
    for(let i=1; i<=10; i++) {
        mockCashFlow.push({
            id: `funding-${i}`,
            type: 'FUNDING_FEE',
            symbol: SYMBOL,
            amount: (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 2),
            timestamp: now - (i * 3600 * 1000)
        });
    }

    // 2. Transaction Fees & PnL
    setCashFlowHistory(mockCashFlow.sort((a, b) => b.timestamp - a.timestamp));

    // Generate Trade Execution History (Fills)
    const mockFills: FillRecord[] = [];
    for(let i=0; i<15; i++) {
        const isBuy = Math.random() > 0.5;
        const price = 2020 + Math.random() * 30;
        const size = parseFloat((Math.random() * 0.5 + 0.01).toFixed(3));
        const val = price * size;
        const fee = val * 0.001; // 0.1%
        const isClose = Math.random() > 0.7; // Some are closing trades
        const pnl = isClose ? (Math.random() * 50 - 20) : 0;
        
        mockFills.push({
            id: `fill-${i}`,
            symbol: SYMBOL,
            side: isBuy ? Side.LONG : Side.SHORT,
            price: price,
            size: size,
            value: val,
            fee: -fee,
            realizedPnl: pnl,
            timestamp: now - (i * 10000 * 1000)
        });
    }
    setFillHistory(mockFills.sort((a, b) => b.timestamp - a.timestamp));

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
        
        // Adjust volatility for visual effect based on timeframe
        const volatility = 0.8; 
        const move = (Math.random() - 0.5) * volatility;
        newPrice = Math.max(0.01, lastCandle.close + move);
        
        // Update High/Low of last candle
        const updatedLastCandle = {
          ...lastCandle,
          close: newPrice,
          high: Math.max(lastCandle.high, newPrice),
          low: Math.min(lastCandle.low, newPrice)
        };
        
        return [...prevCandles.slice(0, -1), updatedLastCandle];
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
        const feeAmount = -0.5;
        setCashFlowHistory(prev => [{
            id: Date.now().toString(),
            type: 'FUNDING_FEE',
            symbol: SYMBOL,
            amount: feeAmount,
            timestamp: Date.now()
        }, ...prev]);
        setBalance(prev => prev + feeAmount);
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
            
            setPositions(prev => [newPosition, ...prev]);
            
            // Add to Order history
            const filledOrder: Order = { ...order, filled: order.amount, status: 'FILLED' };
            setOrderHistory(prev => [filledOrder, ...prev]);

            // Add Transaction Fee
            const fee = -(order.amount * order.price * 0.001);
            setCashFlowHistory(prev => [{
                id: `fee-${Date.now()}`,
                type: 'TRANSACTION_FEE',
                symbol: SYMBOL,
                amount: fee,
                timestamp: Date.now()
            }, ...prev]);
            
            // Add Fill Record
            setFillHistory(prev => [{
                id: `fill-${Date.now()}`,
                symbol: SYMBOL,
                side: order.side,
                price: order.price,
                size: order.amount,
                value: order.amount * order.price,
                fee: fee,
                realizedPnl: 0, // Opening trade
                timestamp: Date.now()
            }, ...prev]);

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

  // Handle Position Mode Change
  const handleSetPositionMode = (mode: PositionMode) => {
      // Check if there are active positions or open orders
      if (positions.length > 0 || orders.length > 0) {
          showToast(TRANSLATIONS[language].positionModeError, 'error');
          return;
      }
      setPositionMode(mode);
      showToast(TRANSLATIONS[language].notifications.positionModeUpdated, 'success');
  };

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
      
      const fee = -(size * price * 0.001);

      // Add Transaction Fee for market order
      setCashFlowHistory(prev => [{
          id: `fee-${Date.now()}`,
          type: 'TRANSACTION_FEE',
          symbol: SYMBOL,
          amount: fee,
          timestamp: Date.now()
      }, ...prev]);

      // Add Fill Record
      setFillHistory(prev => [{
        id: `fill-${Date.now()}`,
        symbol: SYMBOL,
        side: side,
        price: price,
        size: size,
        value: size * price,
        fee: fee,
        realizedPnl: 0, // Opening trade
        timestamp: Date.now()
      }, ...prev]);

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
    
    // Add Fill Record (Closing)
    const fee = -(currentPrice * position.size * 0.001);
    setFillHistory(prev => [{
        id: `fill-close-${position.id}`,
        symbol: position.symbol,
        side: position.side === Side.LONG ? Side.SHORT : Side.LONG, // Closing side is opposite
        price: currentPrice,
        size: position.size,
        value: currentPrice * position.size,
        fee: fee,
        realizedPnl: pnl,
        timestamp: Date.now()
    }, ...prev]);

    // Record Realized PnL to Cash Flow
    setCashFlowHistory(prev => [{
        id: `pnl-${Date.now()}`,
        type: 'REALIZED_PNL',
        symbol: position.symbol,
        amount: pnl,
        timestamp: Date.now()
    }, ...prev]);
    
    // Record Closing Fee
    setCashFlowHistory(prev => [{
        id: `fee-${Date.now()}`,
        type: 'TRANSACTION_FEE',
        symbol: position.symbol,
        amount: fee,
        timestamp: Date.now()
    }, ...prev]);

    setPositions(prev => prev.filter(p => p.id !== id));
    showToast(TRANSLATIONS[language].notifications.positionClosed);
  };

  const handleCloseAllPositions = () => {
    if (positions.length === 0) return;
    
    let totalCredit = 0;
    const cashFlows: CashFlowRecord[] = [];
    const fills: FillRecord[] = [];

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
        const fee = -(currentPrice * position.size * 0.001);
        
        // Add Fill
        fills.push({
            id: `fill-close-all-${position.id}`,
            symbol: position.symbol,
            side: position.side === Side.LONG ? Side.SHORT : Side.LONG,
            price: currentPrice,
            size: position.size,
            value: currentPrice * position.size,
            fee: fee,
            realizedPnl: pnl,
            timestamp: Date.now()
        });

        // Add PnL to Cash Flow
        cashFlows.push({
             id: `pnl-${position.id}-${Date.now()}`,
             type: 'REALIZED_PNL',
             symbol: position.symbol,
             amount: pnl,
             timestamp: Date.now()
        });
        
        // Add Fee to Cash Flow
        cashFlows.push({
             id: `fee-${position.id}-${Date.now()}`,
             type: 'TRANSACTION_FEE',
             symbol: position.symbol,
             amount: fee,
             timestamp: Date.now()
        });
    });

    setBalance(prev => prev + totalCredit);
    setFillHistory(prev => [...fills, ...prev]);
    setCashFlowHistory(prev => [...cashFlows, ...prev]);
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
      
      <Toast message={toast.message} visible={toast.visible} type={toast.type} />

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
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
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
            fillHistory={fillHistory}
            transferHistory={transferHistory}
            cashFlowHistory={cashFlowHistory}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
            isConnected={isWalletConnected}
            onConnect={() => setIsWalletConnected(true)}
            onDisconnect={() => setIsWalletConnected(false)}
            language={language}
            setLanguage={setLanguage}
            theme={theme}
            setTheme={setTheme}
            positionMode={positionMode}
            onSetPositionMode={handleSetPositionMode}
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