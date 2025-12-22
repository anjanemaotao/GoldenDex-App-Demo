
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

export enum PositionMode {
  ONE_WAY = 'ONE_WAY',
  HEDGE = 'HEDGE'
}

export type Language = 'en' | 'zh-CN' | 'zh-TW';
export type Theme = 'dark' | 'light';
export type ChartType = 'line' | 'candle' | 'depth';
export type Timeframe = '1m' | '3m' | '5m' | '15m' | '30m' | '1H' | '2H' | '4H' | '8H' | '12H' | '1D' | '3D' | '1W' | '1M';

export interface Position {
  id: string;
  symbol: string;
  side: Side;
  size: number;
  entryPrice: number;
  leverage: number;
  unrealizedPnL: number;
  marginMode: MarginMode;
  isolatedMargin?: number;
}

export interface Order {
  id: string;
  symbol: string;
  side: Side;
  type: 'LIMIT' | 'MARKET';
  price: number;
  amount: number;
  filled: number;
  status: 'OPEN' | 'FILLED' | 'CANCELLED' | 'PARTIAL_FILLED';
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

export interface MarketInfo {
  symbol: string;
  name: string;
  lastPrice: number;
  change24h: number;
  volume24h: number;
  fundingRate: number;
  leverage: number;
}

export interface Wallet {
  balance: number;
  equity: number;
}

export interface FillRecord {
  id: string;
  symbol: string;
  side: Side;
  price: number;
  size: number;
  value: number;
  fee: number;
  realizedPnl: number;
  timestamp: number;
}

export interface TransferRecord {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAW';
  amount: number;
  timestamp: number;
  status: 'COMPLETED' | 'PENDING' | 'REJECTED' | 'CANCELLED';
  network: string;
}

export type CashFlowType = 'TRANSACTION_FEE' | 'FUNDING_FEE' | 'REALIZED_PNL' | 'LIQUIDATION_FEE';

export interface CashFlowRecord {
  id: string;
  type: CashFlowType;
  symbol: string;
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
