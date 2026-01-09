import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, Download } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ImportHistoryPanel() {
  const { data: importBatches, isLoading } = useQuery({
    queryKey: ['importBatches'],
    queryFn: async () => {
      // Fetch unique import batches
      const assets = await base44.entities.AssetPortfolio.filter(
        { import_batch_id: { $exists: true } },
        '-import_date',
        100
      );
      
      // Group by batch_id
      const batches = {};
      assets.forEach(asset => {
        if (asset.import_batch_id) {
          if (!batches[asset.import_batch_id]) {
            batches[asset.import_batch_id] = {
              batch_id: asset.import_batch_id,
              import_date: asset.import_date,
              import_source: asset.import_source,
              count: 0,
              assets: []
            };
          }
          batches[asset.import_batch_id].count++;
          batches[asset.import_batch_id].assets.push(asset);
        }
      });

      return Object.values(batches).sort(
        (a, b) => new Date(b.import_date) - new Date(a.import_date)
      );
    }
  });

  const getBrokerLabel = (source) => {
    if (!source) return 'Manual';
    const labels = {
      'csv_trade_republic': 'Trade Republic',
      'csv_scalable_capital': 'Scalable Capital',
      'csv_ing_diba': 'ING',
      'csv_comdirect': 'comdirect',
      'csv_generic': 'Generic CSV',
      'manual': 'Manual'
    };
    return labels[source] || source;
  };

  if (isLoading) {
    return <div className="h-20 bg-slate-100 rounded animate-pulse" />;
  }

  if (!importBatches || importBatches.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm font-light text-slate-500">Keine Importe vorhanden</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-light">Import-Verlauf</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {importBatches.map((batch) => (
            <div
              key={batch.batch_id}
              className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">
                      {getBrokerLabel(batch.import_source)}
                    </Badge>
                    <span className="text-xs font-light text-slate-500">
                      {batch.count} Positionen
                    </span>
                  </div>
                  <p className="text-sm font-light text-slate-900">
                    {format(new Date(batch.import_date), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-slate-600 hover:text-slate-900"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>

              {/* Asset Preview */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="space-y-1">
                  {batch.assets.slice(0, 2).map((asset) => (
                    <div key={asset.id} className="text-xs font-light text-slate-600">
                      • {asset.name}
                      {asset.isin && ` (${asset.isin})`}
                    </div>
                  ))}
                  {batch.count > 2 && (
                    <div className="text-xs font-light text-slate-500">
                      + {batch.count - 2} weitere
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}