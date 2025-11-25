import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

export function JobMonitor() {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['dispatch-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dispatch_jobs')
        .select('*, dispatch_zones(name)')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'pending': 'secondary',
      'processing': 'default',
      'completed': 'default',
      'failed': 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lavori in Corso</CardTitle>
        <CardDescription>
          Monitora lo stato delle elaborazioni in tempo reale
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!jobs || jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nessun lavoro in corso
          </p>
        ) : (
          <div className="space-y-4">
            {jobs.map((job: any) => (
              <div key={job.id} className="space-y-2 p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(job.status)}
                    <div>
                      <p className="text-sm font-medium">
                        {job.dispatch_zones?.name || job.zone_code}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {job.dispatch_month}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(job.status)}
                </div>

                {job.status === 'processing' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {job.current_agent || 'Inizializzazione...'}
                      </span>
                      <span className="font-medium">{job.progress}%</span>
                    </div>
                    <Progress value={job.progress} />
                  </div>
                )}

                {job.warnings && job.warnings.length > 0 && (
                  <div className="text-xs text-amber-500">
                    ⚠️ {job.warnings.length} avvertimenti
                  </div>
                )}

                {job.errors && job.errors.length > 0 && (
                  <div className="text-xs text-red-500">
                    ❌ {job.errors.length} errori
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Avviato {new Date(job.created_at).toLocaleString('it-IT')}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
