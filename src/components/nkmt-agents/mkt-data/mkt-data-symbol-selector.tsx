import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface MktDataSymbolSelectorProps {
  symbols: string[]
  selectedSymbol: string
  onSymbolChange: (symbol: string) => void
}

export const MktDataSymbolSelector = ({ symbols, selectedSymbol, onSymbolChange }: MktDataSymbolSelectorProps) => {
  return (
    <div className="space-y-2">
      <ScrollArea className="h-[600px]">
        <div className="space-y-2 pr-4">
          {symbols.map((symbol) => {
            const shortName = symbol.replace('USDT', '')
            const isSelected = symbol === selectedSymbol
            
            return (
              <Button
                key={symbol}
                variant={isSelected ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => onSymbolChange(symbol)}
              >
                {shortName}
              </Button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
