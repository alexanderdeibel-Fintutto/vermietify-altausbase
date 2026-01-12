import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, RefreshCw, MapPin, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function RentMarketAnalyzer({ building, unit, currentRent }) {
  const [analyzing, setAnalyzing] = useState(false);

  const { data: rentIndices = [] } = useQuery({
    queryKey: ['rentIndices', building?.city, building?.postal_code],
    queryFn: () => base44.entities.RentIndex.filter({ 
      city: building.city,
      postal_code: building.postal_code
    }),
    enabled: !!building
  });

  const fetchDataMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('fetchMietspiegelData', {
        city: building.city,
        postal_code: building.postal_code
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Mietspiegeldaten aktualisiert');
    }
  });

  const relevantIndex = rentIndices.find(idx => {
    const unitArea = unit?.wohnflaeche_qm || 0;
    const buildingYear = building?.year_built || 0;
    const wohnlage = unit?.mietspiegel_lage || 'Mittel';

    return idx.wohnlage === wohnlage &&
           (!idx.qm_von || unitArea >= idx.qm_von) &&
           (!idx.qm_bis || unitArea <= idx.qm_bis) &&
           (!idx.baujahr_von || buildingYear >= idx.baujahr_von) &&
           (!idx.baujahr_bis || buildingYear <= idx.baujahr_bis);
  });

  const analysis = React.useMemo(() => {
    if (!relevantIndex || !currentRent || !unit?.wohnflaeche_qm) return null;

    const currentPerSqm = currentRent / unit.wohnflaeche_qm;
    const avgRent = relevantIndex.miete_mittel;
    const deviation = ((currentPerSqm - avgRent) / avgRent * 100).toFixed(1);
    const potential = (avgRent - currentPerSqm) * unit.wohnflaeche_qm;

    return {
      currentPerSqm: currentPerSqm.toFixed(2),
      avgRent: avgRent.toFixed(2),
      minRent: relevantIndex.miete_min.toFixed(2),
      maxRent: relevantIndex.miete_max.toFixed(2),
      deviation: parseFloat(deviation),
      potential: potential.toFixed(2),
      isUnderpriced: deviation < -5,
      isOverpriced: deviation > 10,
      mietpreisbremse: relevantIndex.mietpreisbremse_aktiv
    };
  }, [relevantIndex, currentRent, unit]);

  if (!building || !unit) return null;

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-base">Marktanalyse</CardTitle>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchDataMutation.mutate()}
            disabled={fetchDataMutation.isPending}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${fetchDataMutation.isPending ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!relevantIndex && (
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              <p className="text-sm font-medium">Keine Mietspiegeldaten verfügbar</p>
              <p className="text-xs mt-1">Klicken Sie auf "Aktualisieren", um aktuelle Daten zu laden.</p>
            </AlertDescription>
          </Alert>
        )}

        {analysis && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white rounded-lg p-2">
                <p className="text-xs text-slate-600">Min</p>
                <p className="text-sm font-semibold">{analysis.minRent} €/m²</p>
              </div>
              <div className="bg-white rounded-lg p-2 border-2 border-purple-300">
                <p className="text-xs text-slate-600">Durchschnitt</p>
                <p className="text-sm font-semibold text-purple-700">{analysis.avgRent} €/m²</p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-xs text-slate-600">Max</p>
                <p className="text-sm font-semibold">{analysis.maxRent} €/m²</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-600">Ihre Miete:</span>
                <span className="font-semibold">{analysis.currentPerSqm} €/m²</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Abweichung vom Ø:</span>
                <div className="flex items-center gap-1">
                  {analysis.deviation > 0 ? (
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-emerald-500" />
                  )}
                  <span className={`font-semibold ${analysis.deviation > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {analysis.deviation > 0 ? '+' : ''}{analysis.deviation}%
                  </span>
                </div>
              </div>
            </div>

            {analysis.isUnderpriced && (
              <Alert className="border-emerald-200 bg-emerald-50">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <AlertDescription>
                  <p className="text-sm font-medium text-emerald-900">Erhöhungspotential</p>
                  <p className="text-xs text-emerald-800 mt-1">
                    Sie könnten die Miete um ca. {Math.abs(parseFloat(analysis.potential)).toFixed(2)} EUR/Monat erhöhen
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {analysis.isOverpriced && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <AlertDescription>
                  <p className="text-sm font-medium text-red-900">Miete über Marktdurchschnitt</p>
                  <p className="text-xs text-red-800 mt-1">
                    {analysis.mietpreisbremse ? 'Achtung: Mietpreisbremse aktiv!' : 'Miete liegt deutlich über dem Durchschnitt'}
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {relevantIndex && (
              <div className="text-xs text-slate-500">
                <p>Datenquelle: {relevantIndex.vergleichsmiete_quelle}</p>
                <p>Wohnlage: {relevantIndex.wohnlage}</p>
                {relevantIndex.mietpreisbremse_aktiv && (
                  <Badge className="bg-amber-100 text-amber-800 mt-1">
                    Mietpreisbremse aktiv
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}