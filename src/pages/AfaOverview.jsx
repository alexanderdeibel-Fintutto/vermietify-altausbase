import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Plus, Building2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSelectedBuilding } from '@/components/hooks/useSelectedBuilding';
import AfaAssetForm from '@/components/tax-property/AfaAssetForm';
import AfaScheduleViewer from '@/components/tax-property/AfaScheduleViewer';

export default function AfaOverview() {
  const { selectedBuilding } = useSelectedBuilding();
  const [showForm, setShowForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const { data: assets, refetch, isLoading } = useQuery({
    queryKey: ['afaAssets', selectedBuilding],
    queryFn: async () => {
      if (!selectedBuilding) return [];
      return base44.entities.AfaAsset.filter({
        building_id: selectedBuilding
      });
    },
    enabled: !!selectedBuilding
  });

  const handleDelete = async (assetId) => {
    if (!confirm('Wirklich löschen?')) return;
    try {
      // Zugehörige Einträge löschen
      const entries = await base44.entities.AfaYearlyEntry.filter({
        afa_asset_id: assetId
      });
      for (const entry of entries) {
        await base44.entities.AfaYearlyEntry.delete(entry.id);
      }
      // Asset löschen
      await base44.entities.AfaAsset.delete(assetId);
      toast.success('AfA-Anlage gelöscht');
      refetch();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  if (!selectedBuilding) {
    return <div className="p-6 text-center text-gray-500">Bitte wählen Sie ein Gebäude</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">AfA-Verwaltung</h1>
        <Button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Neue Anlage
        </Button>
      </div>

      {showForm && (
        <AfaAssetForm
          buildingId={selectedBuilding}
          onAssetCreated={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}

      <div className="grid gap-4">
        {isLoading ? (
          <div>Lädt...</div>
        ) : assets?.length ? (
          assets.map((asset) => (
            <Card key={asset.id}>
              <CardHeader className="flex flex-row justify-between items-start">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <div>
                    <CardTitle>{asset.description}</CardTitle>
                    <div className="text-sm text-gray-500 mt-1">
                      {asset.asset_type} • Kauf: {new Date(asset.acquisition_date).toLocaleDateString('de-DE')} • {asset.acquisition_cost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(asset.id)}
                  className="text-red-500 hover:text-red-700"
                  title="Löschen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </CardHeader>
              <CardContent>
                <button
                  onClick={() => setSelectedAsset(selectedAsset === asset.id ? null : asset.id)}
                  className="text-indigo-600 hover:underline text-sm font-medium"
                >
                  {selectedAsset === asset.id ? 'Plan ausblenden' : 'Abschreibungsplan anzeigen'}
                </button>
                {selectedAsset === asset.id && (
                  <div className="mt-4">
                    <AfaScheduleViewer assetId={asset.id} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center text-gray-500 py-10">Keine AfA-Anlagen vorhanden</div>
        )}
      </div>
    </div>
  );
}