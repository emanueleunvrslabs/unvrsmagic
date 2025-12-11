// NKMT TypeScript Interfaces

export interface OHLCVCandle {
  timestamp_ms: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartDataPoint {
  timestamp: number;
  time?: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma20?: number | null;
  sma50?: number | null;
  ema12?: number | null;
  ema26?: number | null;
  rsi?: number | null;
  macd?: number | null;
  macdSignal?: number | null;
  macdHistogram?: number | null;
}

export interface LiveTicker {
  symbol: string;
  shortName: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

export interface ActivityLog {
  id: string;
  type: 'candles' | 'analysis' | 'signal';
  symbol: string;
  details: string;
  timestamp: string;
  duration: string;
  status: 'success' | 'error' | 'pending';
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export interface OrderBook {
  symbol: string;
  spread: number;
  spreadPercent: number;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

export interface IndicatorSettings {
  sma20: boolean;
  sma50: boolean;
  ema12: boolean;
  ema26: boolean;
  rsi: boolean;
  macd: boolean;
}

// Recharts custom layer props
export interface CandlestickLayerProps {
  data?: ChartDataPoint[];
  xAxisMap?: Record<number, { scale: (value: string) => number }>;
  yAxisMap?: Record<string, { scale: (value: number) => number }>;
  margin?: { top: number; right: number; bottom: number; left: number };
  width?: number;
  height?: number;
}

// Technical indicators result
export interface TechnicalIndicatorsResult {
  sma: Record<number, (number | null)[]>;
  ema: Record<number, (number | null)[]>;
  rsi: (number | null)[] | null;
  macd: {
    macd: (number | null)[];
    signal: (number | null)[];
    histogram: (number | null)[];
  } | null;
}

// Agent log metadata
export interface AgentLogMetadata {
  symbols?: string[];
  duration_ms?: number;
  error?: string;
  [key: string]: unknown;
}
