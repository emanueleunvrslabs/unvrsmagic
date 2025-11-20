import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import { ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Bar, Line } from "recharts"

interface MktDataChartProps {
  symbol: string
  data: Array<{
    timestamp: number
    open: number
    high: number
    low: number
    close: number
    volume: number
    sma20?: number | null
    sma50?: number | null
    ema12?: number | null
    ema26?: number | null
    rsi?: number | null
    macd?: number | null
    macdSignal?: number | null
    macdHistogram?: number | null
  }>
  currentPrice: number
  priceChange: number
  volume24h: number
  indicators: {
    sma20: boolean
    sma50: boolean
    ema12: boolean
    ema26: boolean
    rsi: boolean
    macd: boolean
  }
}

interface CandleProps {
  x: number
  y: number
  width: number
  height: number
  open: number
  close: number
  high: number
  low: number
}

const Candlestick = ({ x, y, width, height, open, close, high, low }: CandleProps) => {
  const isPositive = close >= open
  const color = isPositive ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'

  // height: pixel height of full candle range (high-low)
  // y: pixel y of high price (top)
  const priceRange = high - low || 1
  const yScale = height / priceRange

  const highY = y
  const lowY = y + (high - low) * yScale
  const openY = y + (high - open) * yScale
  const closeY = y + (high - close) * yScale

  const candleY = Math.min(openY, closeY)
  const candleHeight = Math.max(Math.abs(closeY - openY), 1)
  const candleX = x + width / 2

  return (
    <g>
      {/* Shadow (wick) */}
      <line
        x1={candleX}
        y1={highY}
        x2={candleX}
        y2={lowY}
        stroke={color}
        strokeWidth={1}
      />
      {/* Body */}
      <rect
        x={x + width * 0.15}
        y={candleY}
        width={width * 0.7}
        height={candleHeight}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  )
}

export const MktDataChart = ({ symbol, data, currentPrice, priceChange, volume24h, indicators }: MktDataChartProps) => {
  const chartData = data.map(item => ({
    time: new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
    sma20: item.sma20,
    sma50: item.sma50,
    ema12: item.ema12,
    ema26: item.ema26,
    rsi: item.rsi,
    macd: item.macd,
    macdSignal: item.macdSignal
  }))

  const isPositive = priceChange >= 0

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <CardTitle>{symbol}</CardTitle>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">24h Volume</p>
            <p className="text-sm font-medium">${volume24h.toFixed(2)}M</p>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">${currentPrice.toLocaleString()}</span>
          <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload[0]) return null
                const data = payload[0].payload
                return (
                  <div className="bg-background border border-border rounded-md p-2 text-xs">
                    <p className="font-semibold">{data.time}</p>
                    <p className="text-muted-foreground">O: ${data.open?.toFixed(2)}</p>
                    <p className="text-muted-foreground">H: ${data.high?.toFixed(2)}</p>
                    <p className="text-muted-foreground">L: ${data.low?.toFixed(2)}</p>
                    <p className="text-muted-foreground">C: ${data.close?.toFixed(2)}</p>
                  </div>
                )
              }}
            />
            <Bar 
              dataKey="high"
              shape={(props: any) => {
                const { x, y, width, height, payload } = props
                if (!payload) return null
                
                // Calculate scale for candlestick positioning
                const yScale = height / (payload.high - payload.low)
                const baseY = y
                
                return (
                  <Candlestick
                    x={x}
                    y={baseY}
                    width={width}
                    height={yScale}
                    open={payload.open}
                    close={payload.close}
                    high={payload.high}
                    low={payload.low}
                  />
                )
              }}
            />
            
            {/* Technical Indicators */}
            {indicators.sma20 && (
              <Line 
                type="monotone" 
                dataKey="sma20" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={2}
                dot={false}
                name="SMA 20"
              />
            )}
            {indicators.sma50 && (
              <Line 
                type="monotone" 
                dataKey="sma50" 
                stroke="hsl(var(--chart-3))" 
                strokeWidth={2}
                dot={false}
                name="SMA 50"
              />
            )}
            {indicators.ema12 && (
              <Line 
                type="monotone" 
                dataKey="ema12" 
                stroke="hsl(var(--chart-4))" 
                strokeWidth={2}
                dot={false}
                name="EMA 12"
              />
            )}
            {indicators.ema26 && (
              <Line 
                type="monotone" 
                dataKey="ema26" 
                stroke="hsl(var(--chart-5))" 
                strokeWidth={2}
                dot={false}
                name="EMA 26"
              />
            )}
            {indicators.macd && (
              <Line 
                type="monotone" 
                dataKey="macd" 
                stroke="hsl(var(--primary))" 
                strokeWidth={1.5}
                dot={false}
                name="MACD"
              />
            )}
            {indicators.macd && (
              <Line 
                type="monotone" 
                dataKey="macdSignal" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={1.5}
                dot={false}
                name="Signal"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
