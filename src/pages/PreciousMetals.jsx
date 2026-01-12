import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Plus } from 'lucide-react';

export default function PreciousMetals() {
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets_metals'],
    queryFn: async () => {
      const all = await base44.entities.Asset.list();
      return all.filter(a => ['GOLD', 'SILVER', 'PLATINUM'].includes(a.asset_class));
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Asset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets_metals'] });
    },
  });

  // Gruppiere nach Metall
  const groupedByMetal = assets.reduce((acc, asset) => {
    if (!acc[asset.asset_class]) {
      acc[asset.asset_class] = [];
    }
    acc[asset.asset_class].push(asset);
    return acc;
  }, {});

  const metalSummary = {
    GOLD: {
      name: 'Gold',
      symbol: 'XAU',
      totalQty: 0,
      totalValue: 0,
      color: 'from-yellow-400 to-yellow-600',
    },
    SILVER: {
      name: 'Silber',
      symbol: 'XAG',
      totalQty: 0,
      totalValue: 0,
      color: 'from-gray-300 to-gray-500',
    },
    PLATINUM: {
      name: 'Platin',
      symbol: 'XPT',
      totalQty: 0,
      totalValue: 0,
      color: 'from-slate-400 to-slate-600',
    },
  };

  // Berechne Summen
  Object.entries(groupedByMetal).forEach(([metal, metalAssets]) => {
    metalAssets.forEach(asset => {
      metalSummary[metal].totalQty += asset.quantity || 0;
      metalSummary[metal].totalValue += asset.current_value || 0;
    });
  });

  if (isLoading) {
    return <div className="p-6 text-center text-slate-600">Wird geladen...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edelmetalle</h1>
          <p className="text-slate-600 mt-1">Verwalte deine physischen und Papierbestände</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Bestand hinzufügen
        </Button>
      </div>

      {/* Metal Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(metalSummary).map(([key, metal]) => (
          <Card key={key} className="overflow-hidden">
            <div className={`h-1 bg-gradient-to-r ${metal.color}`}></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{metal.name} ({metal.symbol})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-slate-600">Gesamtmenge</p>
                <p className="text-2xl font-bold">{metal.totalQty.toFixed(2)} g</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Gesamtwert</p>
                <p className="text-xl font-bold">
                  {metal.totalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detaillierte Bestände */}
      <Card>
        <CardHeader>
          <CardTitle>Bestände im Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Metall</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Beschreibung</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-600">Form</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Gewicht (g)</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Wert</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Lagerort</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(asset => (
                  <tr key={asset.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">{asset.asset_class}</td>
                    <td className="py-3 px-4">{asset.name}</td>
                    <td className="text-center py-3 px-4">
                      {asset.is_physical ? '🏠 Physisch' : '📄 Papier'}
                    </td>
                    <td className="text-right py-3 px-4">{asset.quantity} g</td>
                    <td className="text-right py-3 px-4 font-medium">
                      {(asset.current_value || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{asset.storage_location || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {assets.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-slate-600">Keine Edelmetalle hinzugefügt</p>
          <Button className="mt-4 gap-2">
            <Plus className="w-4 h-4" />
            Ersten Bestand hinzufügen
          </Button>
        </Card>
      )}
    </div>
  );
}