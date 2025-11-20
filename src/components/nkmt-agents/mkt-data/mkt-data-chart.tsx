import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import { ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Bar } from "recharts"

interface MktDataChartProps {
  symbol: string
  data: Array<{
    timestamp: number
    open: number
    high: number
    low: number
    close: number
    volume: number
  }>
  currentPrice: number
  priceChange: number
  volume24h: number
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
  
  const candleY = Math.min(open, close)
  const candleHeight = Math.abs(close - open)
  const candleX = x + width / 2

  return (
    <g>
      {/* Shadow (wick) */}
      <line
        x1={candleX}
        y1={high}
        x2={candleX}
        y2={low}
        stroke={color}
        strokeWidth={1}
      />
      {/* Body */}
      <rect
        x={x}
        y={candleY}
        width={width}
        height={candleHeight || 1}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  )
}

export const MktDataChart = ({ symbol, data, currentPrice, priceChange, volume24h }: MktDataChartProps) => {
  const chartData = data.map(item => ({
    time: new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close
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
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
