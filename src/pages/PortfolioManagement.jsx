import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import PortfolioSummary from '@/components/wealth/PortfolioSummary';
import AssetFormDialog from '@/components/wealth/AssetFormDialog';
import CapitalGainCalculator from '@/components/wealth/CapitalGainCalculator';
import TaxLossHarvestingWidget from '@/components/wealth/TaxLossHarvestingWidget';

export default function PortfolioManagement() {
  const [showAssetDialog, setShowAssetDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const queryClient = useQueryClient();

  const { data: portfolios = [] } = useQuery({
    queryKey: ['portfolios'],
    queryFn: () => base44.entities.Portfolio.list()
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list()
  });

  const createAssetMutation = useMutation({
    mutationFn: (data) => base44.entities.Asset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setShowAssetDialog(false);
    }
  });

  const handleAssetSubmit = (data) => {
    if (editingAsset) {
      base44.entities.Asset.update(editingAsset.id, data);
    } else {
      createAssetMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">💼 Vermögensmanagement</h1>
          <p className="text-slate-600 mt-1">Verwalten Sie Ihre Investitionen und Wertpapiere</p>
        </div>
        <Button 
          onClick={() => {
            setEditingAsset(null);
            setShowAssetDialog(true);
          }}
          className="bg-slate-700 hover:bg-slate-800 gap-2"
        >
          <Plus className="w-4 h-4" />
          Neues Asset
        </Button>
      </div>

      <PortfolioSummary assets={assets} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaxLossHarvestingWidget assets={assets} />
        {assets.length > 0 && (
          <CapitalGainCalculator assetId={assets[0]?.id} taxYear={new Date().getFullYear()} />
        )}
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Assets</h2>
        <div className="space-y-2">
          {assets.map(asset => (
            <div key={asset.id} className="flex justify-between p-3 bg-slate-50 rounded">
              <div>
                <p className="font-semibold">{asset.name}</p>
                <p className="text-sm text-slate-600">{asset.asset_class} • {asset.quantity} Stück</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">€{(asset.current_value || 0).toFixed(2)}</p>
                <p className="text-sm text-slate-600">€{asset.current_price || 0}/Stück</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <AssetFormDialog 
        open={showAssetDialog}
        onOpenChange={setShowAssetDialog}
        asset={editingAsset}
        portfolios={portfolios}
        onSubmit={handleAssetSubmit}
      />
    </div>
  );
}