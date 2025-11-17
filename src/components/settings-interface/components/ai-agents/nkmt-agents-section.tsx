"use client"

import type React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const NKMT_AGENTS = [
  { id: "nkmt", name: "nkmt", model: "GPT-5.1 Thinking", description: "Main orchestrator" },
  { id: "mkt-data", name: "mkt.data", model: "Code", description: "Market data processor" },
  { id: "deriv-data", name: "deriv.data", model: "Code", description: "Derivatives data processor" },
  { id: "sentiment-scout", name: "sentiment.scout", model: "GPT-5.1", description: "Sentiment analysis" },
  { id: "chain-analyst", name: "chain.analyst", model: "Qwen 3", description: "Blockchain analysis" },
  { id: "market-modeler", name: "market.modeler", model: "Claude Sonnet 4.5", description: "Market modeling" },
  { id: "signal-maker", name: "signal.maker", model: "GPT-5.1 Thinking", description: "Signal generation" },
  { id: "risk-mgr", name: "risk.mgr", model: "GPT-5.1 Thinking", description: "Risk management" },
  { id: "trade-executor", name: "trade.executor", model: "Code", description: "Trade execution" },
  { id: "reviewer", name: "reviewer", model: "Claude Sonnet 4.5", description: "Trade review" },
]

export const NKMTAgentsSection: React.FC = () => {
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {NKMT_AGENTS.map((agent) => (
            <TableRow key={agent.id}>
              <TableCell className="font-medium">{agent.name}</TableCell>
              <TableCell>
                <Badge variant={agent.model === "Code" ? "outline" : "secondary"}>
                  {agent.model}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{agent.description}</TableCell>
              <TableCell className="text-right">
                <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                  Active
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
