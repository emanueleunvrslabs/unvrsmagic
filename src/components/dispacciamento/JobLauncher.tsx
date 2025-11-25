import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function JobLauncher() {
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [launching, setLaunching] = useState(false);

  const { data: zones } = useQuery({
    queryKey: ['dispatch-zones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dispatch_zones')
        .select('*')
        .order('code');
      
      if (error) throw error;
      return data;
    }
  });

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 24; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const value = `${year}-${month}`;
      const label = date.toLocaleDateString('it-IT', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    
    return options;
  };

  const handleLaunch = async () => {
    if (!selectedZone || !selectedMonth) {
      toast.error("Seleziona zona e mese per continuare");
      return;
    }

    setLaunching(true);
    try {
      const { data, error } = await supabase.functions.invoke('dispatch-orchestrator', {
        body: {
          zones: [selectedZone],
          dispatchMonth: selectedMonth
        }
      });

      if (error) throw error;

      toast.success("Elaborazione avviata con successo");
      console.log('Job started:', data);
      
      // Reset form
      setSelectedZone("");
      setSelectedMonth("");
      
    } catch (error) {
      console.error('Error launching job:', error);
      toast.error("Errore nell'avvio dell'elaborazione");
    } finally {
      setLaunching(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avvia Elaborazione</CardTitle>
        <CardDescription>
          Seleziona la zona e il mese di dispacciamento per avviare l'analisi
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Zona</Label>
          <Select value={selectedZone} onValueChange={setSelectedZone}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona zona..." />
            </SelectTrigger>
            <SelectContent>
              {zones?.map((zone) => (
                <SelectItem key={zone.code} value={zone.code}>
                  {zone.name} ({zone.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Mese di Dispacciamento</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona mese..." />
            </SelectTrigger>
            <SelectContent>
              {generateMonthOptions().map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleLaunch} 
          disabled={launching || !selectedZone || !selectedMonth}
          className="w-full"
        >
          {launching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Avvio in corso...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Avvia Elaborazione
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
