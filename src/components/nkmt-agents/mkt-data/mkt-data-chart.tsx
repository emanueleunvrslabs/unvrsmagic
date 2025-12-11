import { TrendingUp, Activity } from "lucide-react"
import { ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Line } from "recharts"
import { Badge } from "@/components/ui/badge"
import "@/components/labs/SocialMediaCard.css"
import type { ChartDataPoint, CandlestickLayerProps, IndicatorSettings } from "@/types/nkmt"

interface MktDataChartProps {
  symbol: string
  data: ChartDataPoint[]
  currentPrice: number
  priceChange: number
  volume24h: number
  indicators: IndicatorSettings
  isLive?: boolean
}

// Candlestick custom layer component
const CandlestickLayer = (props: CandlestickLayerProps) => {
  const { data, xAxisMap, yAxisMap, margin, width } = props
  if (!data || !xAxisMap || !yAxisMap || !margin || !width) return null
  
  const xAxis = xAxisMap[0]
  const yAxis = yAxisMap['price']
  if (!xAxis || !yAxis) return null
  
  const { scale: xScale } = xAxis
  const { scale: yScale } = yAxis
  
  // Calculate bar width based on data points
  const barWidth = Math.max(3, (width - margin.left - margin.right) / data.length * 0.7)
  
  return (
    <g className="recharts-candlestick-layer">
      {data.map((item, index: number) => {
        if (!item.open || !item.close || !item.high || !item.low || !item.time) return null
        
        const isPositive = item.close >= item.open
        const color = isPositive ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'
        
        const xPos = xScale(item.time)
        const highY = yScale(item.high)
        const lowY = yScale(item.low)
        const openY = yScale(item.open)
        const closeY = yScale(item.close)
        
        const candleY = Math.min(openY, closeY)
        const candleHeight = Math.abs(closeY - openY) || 1
        
        return (
          <g key={`candle-${index}`}>
            {/* Wick */}
            <line
              x1={xPos}
              y1={highY}
              x2={xPos}
              y2={lowY}
              stroke={color}
              strokeWidth={1}
            />
            {/* Body */}
            <rect
              x={xPos - barWidth / 2}
              y={candleY}
              width={barWidth}
              height={candleHeight}
              fill={color}
              stroke={color}
              strokeWidth={1}
            />
          </g>
        )
      })}
    </g>
  )
}

export const MktDataChart = ({ symbol, data, currentPrice, priceChange, volume24h, indicators, isLive = false }: MktDataChartProps) => {
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
    <div className="labs-client-card relative rounded-2xl overflow-hidden h-full">
      <div className="relative p-5 z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold text-white">{symbol}</span>
            {isLive && (
              <Badge variant="default" className="animate-pulse bg-green-500 text-white">
                <Activity className="h-3 w-3 mr-1" />
                Analyzing
              </Badge>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">24h Volume</p>
            <p className="text-sm font-medium text-white">${volume24h.toFixed(2)}M</p>
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-bold text-white">${currentPrice.toLocaleString()}</span>
          <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
          </span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              yAxisId="price"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              domain={['dataMin - 10', 'dataMax + 10']}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
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
            
            <CandlestickLayer />
            
            {/* Technical Indicators */}
            {indicators.sma20 && (
              <Line 
                yAxisId="price"
                type="monotone" 
                dataKey="sma20" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                name="SMA 20"
              />
            )}
            {indicators.sma50 && (
              <Line 
                yAxisId="price"
                type="monotone" 
                dataKey="sma50" 
                stroke="hsl(var(--chart-3))" 
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                name="SMA 50"
              />
            )}
            {indicators.ema12 && (
              <Line 
                yAxisId="price"
                type="monotone" 
                dataKey="ema12" 
                stroke="hsl(var(--chart-4))" 
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                name="EMA 12"
              />
            )}
            {indicators.ema26 && (
              <Line 
                yAxisId="price"
                type="monotone" 
                dataKey="ema26" 
                stroke="hsl(var(--chart-5))" 
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                name="EMA 26"
              />
            )}
            {indicators.macd && (
              <Line 
                yAxisId="price"
                type="monotone" 
                dataKey="macd" 
                stroke="hsl(var(--primary))" 
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                name="MACD"
              />
            )}
            {indicators.macd && (
              <Line 
                yAxisId="price"
                type="monotone" 
                dataKey="macdSignal" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                name="Signal"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
