"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { DeFiPosition } from "../../types"

interface DefiTableProps {
  searchTerm: string
  onSearchChange: (value: string) => void
}

const mockPositions: DeFiPosition[] = [
  {
    id: 1,
    protocol: "Uniswap V3",
    chain: "Ethereum",
    type: "Liquidity Pool",
    asset: "ETH/USDC",
    amount: "2.5 ETH",
    value: 8500,
    apy: 12.5,
    rewards: 42.50,
    risk: "Medium",
  },
  {
    id: 2,
    protocol: "Aave",
    chain: "Polygon",
    type: "Lending",
    asset: "WETH",
    amount: "5.0 WETH",
    value: 11250,
    apy: 3.8,
    rewards: 8.75,
    risk: "Low",
  },
]

export function DefiTable({ searchTerm }: DefiTableProps) {
  const filtered = mockPositions.filter((pos) =>
    pos.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pos.asset.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Protocol</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Asset</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead className="text-right">APY</TableHead>
            <TableHead>Risk</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((position) => (
            <TableRow key={position.id}>
              <TableCell className="font-medium">{position.protocol}</TableCell>
              <TableCell>{position.type}</TableCell>
              <TableCell>{position.asset}</TableCell>
              <TableCell className="text-right">${position.value.toLocaleString()}</TableCell>
              <TableCell className="text-right">{position.apy}%</TableCell>
              <TableCell>
                <Badge variant={position.risk === "Low" ? "outline" : position.risk === "Medium" ? "secondary" : "destructive"}>
                  {position.risk}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
