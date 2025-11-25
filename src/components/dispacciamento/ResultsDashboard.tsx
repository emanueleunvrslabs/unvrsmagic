import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ResultsDashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Risultati</CardTitle>
        <CardDescription>
          Visualizza e scarica i risultati dei processamenti completati
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-8">
          Nessun risultato disponibile
        </p>
      </CardContent>
    </Card>
  );
}
