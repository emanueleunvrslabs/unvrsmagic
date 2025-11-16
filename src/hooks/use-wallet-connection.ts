import { useState } from "react"
import { toast } from "sonner"

export function useWalletConnection() {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState("")
  const [balance, setBalance] = useState("0.00")

  const connect = (walletAddress: string) => {
    setIsConnected(true)
    setAddress(walletAddress)
    setBalance("1.234")
    toast.success("Wallet connected successfully")
  }

  const disconnect = () => {
    setIsConnected(false)
    setAddress("")
    setBalance("0.00")
    toast.info("Wallet disconnected")
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast.success("Address copied to clipboard")
    }
  }

  return {
    isConnected,
    address,
    balance,
    connect,
    disconnect,
    copyAddress,
    setBalance,
  }
}
