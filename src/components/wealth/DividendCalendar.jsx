import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function DividendCalendar() {
  const { data: dividends = [] } = useQuery({
    queryKey: ['dividends'],
    queryFn: () => base44.entities.Dividend.list('-payment_date', 10)
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list()
  });

  const getAssetName = (assetId) => {
    const asset = assets.find(a => a.id === assetId);
    return asset ? asset.symbol : 'N/A';
  };

  const upcoming = dividends.filter(d => new Date(d.payment_date) >= new Date());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-600" />
          Anstehende Dividenden
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-500">Keine anstehenden Dividenden</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map(dividend => (
              <div key={dividend.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900">{getAssetName(dividend.asset_id)}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(dividend.payment_date).toLocaleDateString('de-DE')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-emerald-600">
                    {new Intl.NumberFormat('de-DE', {
                      style: 'currency',
                      currency: 'EUR'
                    }).format(dividend.net_amount_eur)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {dividend.gross_amount_per_share.toFixed(2)} €/St.
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}