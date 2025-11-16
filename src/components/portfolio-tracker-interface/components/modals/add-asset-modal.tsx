"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"

interface AddAssetModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddAssetModal({ open, onOpenChange }: AddAssetModalProps) {
  const [asset, setAsset] = useState("")
  const [holdings, setHoldings] = useState("")
  const [chain, setChain] = useState("")

  const handleAdd = () => {
    if (!asset || !holdings) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Asset added",
      description: `${asset} has been added to your portfolio.`,
    })

    setAsset("")
    setHoldings("")
    setChain("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Asset</DialogTitle>
          <DialogDescription>Add a new asset to your portfolio</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="asset">Asset</Label>
            <Select value={asset} onValueChange={setAsset}>
              <SelectTrigger>
                <SelectValue placeholder="Select asset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BTC">Bitcoin</SelectItem>
                <SelectItem value="ETH">Ethereum</SelectItem>
                <SelectItem value="SOL">Solana</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="holdings">Holdings</Label>
            <Input
              id="holdings"
              value={holdings}
              onChange={(e) => setHoldings(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="chain">Chain</Label>
            <Select value={chain} onValueChange={setChain}>
              <SelectTrigger>
                <SelectValue placeholder="Select chain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="polygon">Polygon</SelectItem>
                <SelectItem value="bsc">BSC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleAdd}>
              Add Asset
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
