import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function JobsMonitor() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lavori in Corso</CardTitle>
        <CardDescription>
          Monitora lo stato dei processamenti in corso
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-8">
          Nessun lavoro in corso al momento
        </p>
      </CardContent>
    </Card>
  );
}
