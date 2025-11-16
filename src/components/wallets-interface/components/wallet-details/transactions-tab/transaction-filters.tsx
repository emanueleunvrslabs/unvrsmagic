"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download } from "lucide-react"

interface TransactionFiltersProps {
  searchTerm?: string
  typeFilter?: string
  statusFilter?: string
  onSearchChange?: (value: string) => void
  onTypeFilterChange?: (value: string) => void
  onStatusFilterChange?: (value: string) => void
}

export function TransactionFilters({
  searchTerm = "",
  typeFilter = "all",
  statusFilter = "all",
  onSearchChange = () => {},
  onTypeFilterChange = () => {},
  onStatusFilterChange = () => {},
}: TransactionFiltersProps) {
  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
      <div>
        <h3 className="text-lg font-medium">Transactions</h3>
        <p className="text-sm text-muted-foreground">View and manage your transaction history</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-[200px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={typeFilter} onValueChange={onTypeFilterChange}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="send">Send</SelectItem>
            <SelectItem value="receive">Receive</SelectItem>
            <SelectItem value="swap">Swap</SelectItem>
            <SelectItem value="stake">Stake</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <Download className="mr-1 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  )
}
