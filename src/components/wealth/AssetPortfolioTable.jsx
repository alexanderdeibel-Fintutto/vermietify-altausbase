import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { getCategoryById } from '@/constants/assetCategories';

export default function AssetPortfolioTable({ portfolio = [], onEdit, onDelete }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'sold':
        return 'bg-slate-100 text-slate-800';
      case 'transferred':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'Aktiv';
      case 'sold':
        return 'Verkauft';
      case 'transferred':
        return 'Übertragen';
      default:
        return status;
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-3 text-left text-xs font-light text-slate-600 uppercase">Vermögenswert</th>
            <th className="px-6 py-3 text-left text-xs font-light text-slate-600 uppercase">Kategorie</th>
            <th className="px-6 py-3 text-left text-xs font-light text-slate-600 uppercase">Menge</th>
            <th className="px-6 py-3 text-right text-xs font-light text-slate-600 uppercase">Kaufpreis</th>
            <th className="px-6 py-3 text-right text-xs font-light text-slate-600 uppercase">Aktueller Wert</th>
            <th className="px-6 py-3 text-right text-xs font-light text-slate-600 uppercase">Gesamtwert</th>
            <th className="px-6 py-3 text-center text-xs font-light text-slate-600 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-light text-slate-600 uppercase">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {portfolio.length === 0 ? (
            <tr>
              <td colSpan="8" className="px-6 py-8 text-center">
                <p className="text-sm font-light text-slate-500">Keine Vermögenswerte vorhanden</p>
              </td>
            </tr>
          ) : (
            portfolio.map((asset) => {
              const category = getCategoryById(asset.asset_category);
              const totalValue = asset.quantity * asset.current_value;
              const totalInvested = asset.quantity * asset.purchase_price;
              const gain = totalValue - totalInvested;
              const gainPercent = totalInvested > 0 ? (gain / totalInvested * 100) : 0;

              return (
                <tr key={asset.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-light text-slate-900">
                    <div>
                      <p className="font-medium">{asset.name}</p>
                      {asset.isin && <p className="text-xs text-slate-500">ISIN: {asset.isin}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-light">
                    <Badge className="bg-slate-100 text-slate-800">
                      {category?.icon} {category?.label}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm font-light text-slate-900">
                    {asset.quantity.toLocaleString('de-DE', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-sm font-light text-slate-900 text-right">
                    €{asset.purchase_price.toLocaleString('de-DE', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-sm font-light text-slate-900 text-right">
                    €{asset.current_value.toLocaleString('de-DE', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-sm font-light text-right">
                    <div>
                      <p className="font-medium">€{totalValue.toLocaleString('de-DE', { maximumFractionDigits: 0 })}</p>
                      <p className={`text-xs ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {gain >= 0 ? '+' : ''}{gainPercent.toFixed(1)}%
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge className={getStatusColor(asset.status)}>
                      {getStatusLabel(asset.status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right flex gap-1 justify-end">
                    <Button size="icon" variant="ghost" onClick={() => onEdit?.(asset)} className="h-8 w-8">
                      <Edit2 className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => onDelete?.(asset.id)} className="h-8 w-8">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}