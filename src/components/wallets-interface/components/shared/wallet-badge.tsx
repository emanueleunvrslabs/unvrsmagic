import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getWalletType } from "../../utils"

interface WalletBadgeProps {
  walletType: string
  size?: "sm" | "md" | "lg"
}

export function WalletBadge({ walletType, size = "md" }: WalletBadgeProps) {
  const wallet = getWalletType(walletType)

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-8 w-8",
  }

  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage src={wallet.icon || "/placeholder.svg"} alt={wallet.name} />
      <AvatarFallback className={wallet.color}>{wallet.name.substring(0, 2)}</AvatarFallback>
    </Avatar>
  )
}
