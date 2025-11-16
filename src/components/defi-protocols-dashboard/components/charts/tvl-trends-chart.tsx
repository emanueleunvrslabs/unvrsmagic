import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function TvlTrendsChart({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>TVL Trends</CardTitle>
        <CardDescription>Total Value Locked over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          Chart placeholder
        </div>
      </CardContent>
    </Card>
  )
}
