import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileJson, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

export function ResultsDashboard() {
  const { data: results, isLoading } = useQuery({
    queryKey: ['dispatch-results'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dispatch_results')
        .select('*, dispatch_zones(name), dispatch_jobs(status, completed_at)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const downloadJSON = (result: any) => {
    try {
      const exportData = {
        zona: result.zone_code,
        mese_dispacciamento: result.dispatch_month,
        data_elaborazione: result.created_at,
        curva_96_valori: result.curve_96_values,
        breakdown: {
          ip: result.ip_curve,
          orari: result.o_curve
        },
        statistiche: {
          totale_pod_o: result.total_pods,
          pod_con_dati: result.pods_with_data,
          pod_senza_dati: result.pods_without_data,
          quality_score: result.quality_score
        },
        metadata: result.metadata
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dispatch_${result.zone_code}_${result.dispatch_month}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('File JSON scaricato con successo');
    } catch (error) {
      console.error('Error downloading JSON:', error);
      toast.error('Errore nel download del file JSON');
    }
  };

  const downloadCSV = (result: any) => {
    try {
      const curve = result.curve_96_values || [];
      const [year, month] = result.dispatch_month.split('-');
      const zoneCode = result.zone_code;
      
      // Generate header row
      let csv = 'ANNO;MESE;CODICE_DP;DATA;AREA;FASCIA_GEOGRAFICA;PIVA_DISTRIBUTORE;RAGIONE_SOCIALE_DISTRIBUTORE;';
      // Add QH1-QH100 columns
      for (let i = 1; i <= 100; i++) {
        csv += `QH${i}`;
        if (i < 100) csv += ';';
      }
      csv += '\n';

      // Get days in the month
      const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
      
      // Generate one row per day
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${day.toString().padStart(2, '0')}/${month}/${year}`;
        
        // Row data
        csv += `${year};${month};DP_${zoneCode};${dateStr};${zoneCode};FG_OR;;;`;
        
        // Add 96 quarter-hour values
        for (let i = 0; i < 96; i++) {
          const value = curve[i] !== undefined ? Math.round(curve[i]) : '';
          csv += `${value};`;
        }
        
        // Add empty QH97-QH100
        csv += ';;;\n';
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
      link.download = `${timestamp}_AGGR_${zoneCode}_${year}${month}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('File CSV scaricato con successo');
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast.error('Errore nel download del file CSV');
    }
  };

  const downloadXLSX = (result: any) => {
    try {
      const curve = result.curve_96_values;
      const ipCurve = result.ip_curve || [];
      const oCurve = result.o_curve || [];

      // Create main data sheet - IP + O only (no LP)
      const mainData = [];
      for (let i = 0; i < 96; i++) {
        mainData.push({
          'Quarto Ora': i + 1,
          'Valore Totale (IP + O)': curve[i] || 0,
          'IP': ipCurve[i] || 0,
          'Orari (O)': oCurve[i] || 0
        });
      }

      // Create summary sheet
      const summaryData = [
        { Campo: 'Zona', Valore: result.zone_code },
        { Campo: 'Mese Dispacciamento', Valore: result.dispatch_month },
        { Campo: 'Data Elaborazione', Valore: new Date(result.created_at).toLocaleString('it-IT') },
        { Campo: 'Totale POD (O)', Valore: result.total_pods },
        { Campo: 'POD con Dati', Valore: result.pods_with_data },
        { Campo: 'POD senza Dati', Valore: result.pods_without_data },
        { Campo: 'Quality Score', Valore: result.quality_score },
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Add main data sheet
      const ws1 = XLSX.utils.json_to_sheet(mainData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Curva 96 Valori');
      
      // Add summary sheet
      const ws2 = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Riepilogo');

      // Generate and download
      XLSX.writeFile(wb, `dispatch_${result.zone_code}_${result.dispatch_month}.xlsx`);
      
      toast.success('File Excel scaricato con successo');
    } catch (error) {
      console.error('Error downloading XLSX:', error);
      toast.error('Errore nel download del file Excel');
    }
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Risultati Elaborazioni</CardTitle>
          <CardDescription>
            Scarica i risultati delle elaborazioni completate in diversi formati (IP + O)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!results || results.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nessun risultato disponibile
            </p>
          ) : (
            <div className="space-y-4">
              {results.map((result: any) => (
                <div key={result.id} className="space-y-3 p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {result.dispatch_zones?.name || result.zone_code}
                        </p>
                        <Badge variant="outline">{result.zone_code}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Mese: {result.dispatch_month}
                      </p>
                    </div>
                    <Badge>Completato</Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Totale POD (O)</p>
                      <p className="font-medium">{result.total_pods}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Con Dati</p>
                      <p className="font-medium text-green-500">{result.pods_with_data}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Senza Dati</p>
                      <p className="font-medium text-amber-500">{result.pods_without_data}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Quality Score</p>
                      <p className="font-medium">{result.quality_score?.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadJSON(result)}
                    >
                      <FileJson className="mr-2 h-4 w-4" />
                      JSON
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadCSV(result)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadXLSX(result)}
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Excel
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground pt-2">
                    Elaborato il {new Date(result.created_at).toLocaleString('it-IT')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
