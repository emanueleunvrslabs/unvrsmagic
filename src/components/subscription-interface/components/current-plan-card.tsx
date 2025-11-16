"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Plan, UsageItem } from "../types"

interface CurrentPlanCardProps {
  currentPlan: Plan
  billingCycle: "monthly" | "annual"
  usageData: UsageItem[]
  onCancelSubscription: () => void
}

export function CurrentPlanCard({ currentPlan, billingCycle, usageData, onCancelSubscription }: CurrentPlanCardProps) {
  const price = billingCycle === "monthly" ? currentPlan.price.monthly : currentPlan.price.annual

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Current Plan</CardTitle>
        <CardDescription>Your active subscription details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
          <p className="text-muted-foreground">
            ${price}/{billingCycle === "monthly" ? "mo" : "yr"}
          </p>
        </div>

        {usageData.map((usage) => (
          <div key={usage.name} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{usage.name}</span>
              <span>{usage.used} / {usage.total}{usage.unit || ''}</span>
            </div>
            <Progress value={usage.percentage} />
          </div>
        ))}

        <Button variant="outline" className="w-full" onClick={onCancelSubscription}>
          Cancel Subscription
        </Button>
      </CardContent>
    </Card>
  )
}
