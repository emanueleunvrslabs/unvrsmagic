import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { Transaction } from "../../types";
import { formatCurrency, getTransactionBadgeVariant } from "../../utils";

interface TransactionsTableProps {
  transactions: Transaction[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Asset</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Chain</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                No transactions found.
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-medium">{tx.date}</TableCell>
                <TableCell>
                  <Badge variant={getTransactionBadgeVariant(tx.type)}>
                    {tx.type}
                  </Badge>
                </TableCell>
                <TableCell>{tx.asset}</TableCell>
                <TableCell className="text-right">{tx.amount}</TableCell>
                <TableCell className="text-right">${formatCurrency(tx.price)}</TableCell>
                <TableCell className="text-right font-medium">
                  <div className="flex items-center justify-end gap-1">
                    ${formatCurrency(tx.value)}
                    {tx.type === "Buy" || tx.type === "Deposit" ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{tx.status}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{tx.chain}</Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
