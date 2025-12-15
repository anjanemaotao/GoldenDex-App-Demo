
export enum Tab {
  TRADE = 'TRADE',
  POSITIONS = 'POSITIONS',
  ORDERS = 'ORDERS',
  ACCOUNT = 'ACCOUNT'
}

export enum Side {
  LONG = 'LONG',
  SHORT = 'SHORT'
}

export enum MarginMode {
  CROSS = 'CROSS',
  ISOLATED = 'ISOLATED'
}

export type Language = 'en' | 'zh-CN' | 'zh-TW';
export type Theme = 'dark' | 'light';
export type ChartType = 'line' | 'candle' | 'depth';

export interface Position {
  id: string;
  symbol: string;
  side: Side;
  size: number;
  entryPrice: number;
  leverage: number;
  unrealizedPnL: number;
  marginMode: MarginMode;
  isolatedMargin?: number; // Specific margin for isolated positions
}

export interface Order {
  id: string;
  symbol: string;
  side: Side;
  type: 'LIMIT' | 'MARKET';
  price: number;
  amount: number;
  filled: number;
  status: 'OPEN' | 'FILLED' | 'CANCELLED';
  timestamp: number;
  marginMode: MarginMode;
}

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface Wallet {
  balance: number;
  equity: number;
}

export interface TradeRecord {
  id: string;
  symbol: string;
  side: Side;
  size: number;
  entryPrice: number;
  closePrice: number;
  pnl: number;
  timestamp: number;
}

export interface TransferRecord {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAW';
  amount: number;
  timestamp: number;
  status: 'COMPLETED' | 'PENDING';
}

export interface FundingRecord {
  id: string;
  symbol: string;
  rate: number;
  amount: number;
  timestamp: number;
}

export interface MarketTrade {
  id: string;
  price: number;
  size: number;
  side: Side;
  time: string;
}
