import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DataEnrichmentPanel({ portfolio = [] }) {
  const queryClient = useQueryClient();
  const [results, setResults] = useState({});

  const enrichMutation = useMutation({
    mutationFn: async (assetId) => {
      return await base44.functions.invoke('enrichAssetWithISIN', { assetId });
    },
    onSuccess: (data, assetId) => {
      setResults(prev => ({
        ...prev,
        [assetId]: data.data
      }));
      queryClient.invalidateQueries({ queryKey: ['assetPortfolio'] });
    }
  });

  const assetsNeedingEnrichment = portfolio.filter(a => !a.api_symbol || !a.sector);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Daten-Anreicherung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {assetsNeedingEnrichment.length === 0 ? (
          <div className="text-sm text-slate-600">✅ Alle Positionen mit Daten angereichert</div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-slate-600">
              {assetsNeedingEnrichment.length} Position(en) können mit OpenFIGI-Daten angereichert werden
            </p>
            {assetsNeedingEnrichment.map(asset => (
              <div key={asset.id} className="flex items-center justify-between p-3 bg-slate-50 rounded border">
                <div>
                  <div className="font-medium text-sm">{asset.name}</div>
                  {asset.isin && <div className="text-xs text-slate-500">ISIN: {asset.isin}</div>}
                </div>
                <Button
                  size="sm"
                  onClick={() => enrichMutation.mutate(asset.id)}
                  disabled={enrichMutation.isPending}
                  variant="outline"
                >
                  {enrichMutation.isPending ? 'Lädt...' : 'Anreichern'}
                </Button>
              </div>
            ))}
          </div>
        )}

        {Object.entries(results).map(([assetId, result]) => (
          <div key={assetId} className="p-3 rounded border flex items-start gap-2">
            {result.success ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="text-sm">
              <p>{result.message}</p>
              {result.data?.sector && (
                <Badge className="mt-2">{result.data.sector}</Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}