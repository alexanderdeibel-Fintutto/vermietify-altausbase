import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, Loader2, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function FinancialDataSync({ onDataSynced }) {
  const [buildingId, setBuildingId] = useState('');
  const [taxYear, setTaxYear] = useState(new Date().getFullYear() - 1);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const handleSync = async () => {
    if (!buildingId) {
      toast.error('Bitte Gebäude auswählen');
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      const response = await base44.functions.invoke('syncFinancialDataToElster', {
        building_id: buildingId,
        tax_year: taxYear
      });

      if (response.data.success) {
        setSyncResult(response.data);
        toast.success(`${response.data.item_count} Buchungen synchronisiert`);
        onDataSynced?.(response.data.form_data);
      }
    } catch (error) {
      toast.error('Synchronisation fehlgeschlagen');
      console.error(error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Finanzdaten synchronisieren</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Lädt automatisch alle Einnahmen und Ausgaben aus Ihren Buchungen und ordnet sie den ELSTER-Feldern zu.
          </AlertDescription>
        </Alert>

        <div>
          <Label>Gebäude</Label>
          <Select value={buildingId} onValueChange={setBuildingId}>
            <SelectTrigger>
              <SelectValue placeholder="Gebäude wählen..." />
            </SelectTrigger>
            <SelectContent>
              {buildings.map(b => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name || b.address}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Steuerjahr</Label>
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[...Array(5)].map((_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleSync} 
          disabled={syncing || !buildingId}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {syncing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Daten synchronisieren
        </Button>

        {syncResult && (
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium">
                {syncResult.item_count} Buchungen verarbeitet
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-green-50 border border-green-200 rounded">
                <div className="text-green-700">Einnahmen</div>
                <div className="font-bold text-green-900">
                  {syncResult.summary.total_income.toLocaleString('de-DE', { 
                    style: 'currency', 
                    currency: 'EUR' 
                  })}
                </div>
              </div>
              <div className="p-2 bg-red-50 border border-red-200 rounded">
                <div className="text-red-700">Ausgaben</div>
                <div className="font-bold text-red-900">
                  {syncResult.summary.total_expenses.toLocaleString('de-DE', { 
                    style: 'currency', 
                    currency: 'EUR' 
                  })}
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
              <div className="text-blue-700 mb-1">Ergebnis</div>
              <div className="font-bold text-blue-900">
                {syncResult.summary.net_result.toLocaleString('de-DE', { 
                  style: 'currency', 
                  currency: 'EUR' 
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}