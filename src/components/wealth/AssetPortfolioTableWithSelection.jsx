import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit2, Trash2, Eye, AlertCircle } from 'lucide-react';
import { getCategoryById } from './assetCategories';

/**
 * Enhanced Portfolio Table mit Auswahl für Batch-Operationen
 */
export default function AssetPortfolioTableWithSelection({
  portfolio = [],
  onEdit,
  onDelete,
  onSelectAsset,
  selectedAssets = new Set(),
  onToggleSelection,
  onSelectAll
}) {
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

  const allSelected = useMemo(
    () => portfolio.length > 0 && selectedAssets.size === portfolio.length,
    [portfolio.length, selectedAssets.size]
  );

  const someSelected = useMemo(
    () => selectedAssets.size > 0 && selectedAssets.size < portfolio.length,
    [selectedAssets.size, portfolio.length]
  );

  return (
    <div className="space-y-3">
      {/* Selection Toolbar */}
      {selectedAssets.size > 0 && (
        <Card className="bg-blue-50 border-blue-200 p-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm font-light text-blue-900">
              {selectedAssets.size} Position(en) ausgewählt
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSelectAll?.([]), onToggleSelection?.()}
                className="text-xs font-light"
              >
                Abwählen
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      <div className="w-full overflow-x-auto -mx-6 lg:mx-0 rounded-lg border border-slate-200 lg:rounded-lg">
        <table className="w-full min-w-max lg:min-w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-3 lg:px-6 py-3 w-8">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onSelectAll?.(portfolio.map(a => a.id));
                    } else {
                      onSelectAll?.([]);
                    }
                  }}
                />
              </th>
              <th className="px-3 lg:px-6 py-3 text-left text-xs font-light text-slate-600 uppercase">Vermögenswert</th>
              <th className="px-3 lg:px-6 py-3 text-left text-xs font-light text-slate-600 uppercase hidden sm:table-cell">Kategorie</th>
              <th className="px-3 lg:px-6 py-3 text-right text-xs font-light text-slate-600 uppercase">Menge</th>
              <th className="px-3 lg:px-6 py-3 text-right text-xs font-light text-slate-600 uppercase hidden md:table-cell">Einstand</th>
              <th className="px-3 lg:px-6 py-3 text-right text-xs font-light text-slate-600 uppercase hidden lg:table-cell">Aktuell</th>
              <th className="px-3 lg:px-6 py-3 text-right text-xs font-light text-slate-600 uppercase">Wert</th>
              <th className="px-3 lg:px-6 py-3 text-right text-xs font-light text-slate-600 uppercase">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-3 lg:px-6 py-8 text-center">
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
                const isSelected = selectedAssets.has(asset.id);

                return (
                  <tr
                    key={asset.id}
                    className={`border-b border-slate-100 transition-colors ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-3 lg:px-6 py-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleSelection?.(asset.id)}
                      />
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm font-light text-slate-900 whitespace-nowrap">
                      <div className="max-w-xs">
                        <p className="font-medium truncate">{asset.name}</p>
                        {asset.isin && <p className="text-xs text-slate-500 truncate">ISIN: {asset.isin}</p>}
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm font-light hidden sm:table-cell">
                      <Badge className="bg-slate-100 text-slate-800 whitespace-nowrap">
                        {category?.label}
                      </Badge>
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm font-light text-slate-900 text-right whitespace-nowrap">
                      {asset.quantity.toLocaleString('de-DE', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm font-light text-slate-900 text-right hidden md:table-cell whitespace-nowrap">
                      €{asset.purchase_price.toLocaleString('de-DE', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm font-light text-slate-900 text-right hidden lg:table-cell whitespace-nowrap">
                      €{asset.current_value.toLocaleString('de-DE', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm font-light text-right whitespace-nowrap">
                      <div>
                        <p className="font-medium">€{totalValue.toLocaleString('de-DE', { maximumFractionDigits: 0 })}</p>
                        <p className={`text-xs ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {gain >= 0 ? '+' : ''}{gainPercent.toFixed(1)}%
                        </p>
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-right flex gap-1 justify-end whitespace-nowrap">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onSelectAsset?.(asset)}
                        className="h-8 w-8"
                        title="Details"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onDelete?.(asset.id)}
                        className="h-8 w-8"
                        title="Löschen"
                      >
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
    </div>
  );
}