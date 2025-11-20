// Technical Indicators Calculation Utilities

export interface OHLCVData {
  open: number
  high: number
  low: number
  close: number
  volume: number
  timestamp: number
}

// Simple Moving Average
export function calculateSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = []
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null)
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
      result.push(sum / period)
    }
  }
  
  return result
}

// Exponential Moving Average
export function calculateEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = []
  const multiplier = 2 / (period + 1)
  
  // Calculate initial SMA for first EMA value
  let ema: number | null = null
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null)
    } else if (i === period - 1) {
      // First EMA is SMA
      const sum = data.slice(0, period).reduce((a, b) => a + b, 0)
      ema = sum / period
      result.push(ema)
    } else {
      // Subsequent EMAs
      ema = (data[i] - ema!) * multiplier + ema!
      result.push(ema)
    }
  }
  
  return result
}

// Relative Strength Index
export function calculateRSI(data: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = []
  const gains: number[] = []
  const losses: number[] = []
  
  // Calculate price changes
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1]
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? Math.abs(change) : 0)
  }
  
  result.push(null) // First value has no RSI
  
  for (let i = 0; i < gains.length; i++) {
    if (i < period - 1) {
      result.push(null)
    } else {
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period
      
      if (avgLoss === 0) {
        result.push(100)
      } else {
        const rs = avgGain / avgLoss
        const rsi = 100 - (100 / (1 + rs))
        result.push(rsi)
      }
    }
  }
  
  return result
}

// MACD (Moving Average Convergence Divergence)
export interface MACDResult {
  macd: (number | null)[]
  signal: (number | null)[]
  histogram: (number | null)[]
}

export function calculateMACD(
  data: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  const fastEMA = calculateEMA(data, fastPeriod)
  const slowEMA = calculateEMA(data, slowPeriod)
  
  // Calculate MACD line
  const macdLine: (number | null)[] = fastEMA.map((fast, i) => {
    const slow = slowEMA[i]
    if (fast === null || slow === null) return null
    return fast - slow
  })
  
  // Calculate signal line (EMA of MACD)
  const macdValues = macdLine.filter(v => v !== null) as number[]
  const signalEMA = calculateEMA(macdValues, signalPeriod)
  
  // Align signal line with MACD line
  let signalIndex = 0
  const signal: (number | null)[] = macdLine.map(macd => {
    if (macd === null) return null
    return signalEMA[signalIndex++]
  })
  
  // Calculate histogram
  const histogram: (number | null)[] = macdLine.map((macd, i) => {
    const sig = signal[i]
    if (macd === null || sig === null) return null
    return macd - sig
  })
  
  return { macd: macdLine, signal, histogram }
}

// Apply indicators to OHLCV data
export function applyIndicators(
  ohlcvData: OHLCVData[],
  indicators: {
    sma?: number[]
    ema?: number[]
    rsi?: boolean
    macd?: boolean
  }
) {
  const closePrices = ohlcvData.map(d => d.close)
  const result: any = {
    sma: {},
    ema: {},
    rsi: null,
    macd: null
  }
  
  // Calculate SMAs
  if (indicators.sma) {
    indicators.sma.forEach(period => {
      result.sma[period] = calculateSMA(closePrices, period)
    })
  }
  
  // Calculate EMAs
  if (indicators.ema) {
    indicators.ema.forEach(period => {
      result.ema[period] = calculateEMA(closePrices, period)
    })
  }
  
  // Calculate RSI
  if (indicators.rsi) {
    result.rsi = calculateRSI(closePrices)
  }
  
  // Calculate MACD
  if (indicators.macd) {
    result.macd = calculateMACD(closePrices)
  }
  
  return result
}
