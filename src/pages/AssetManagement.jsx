import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, TrendingUp, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import AssetFormDialog from '@/components/wealth/AssetFormDialog';

export default function AssetManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list('-updated_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Asset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setShowForm(false);
      setEditingAsset(null);
      toast.success('Asset erstellt');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Asset.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setShowForm(false);
      setEditingAsset(null);
      toast.success('Asset aktualisiert');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Asset.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset gelöscht');
    }
  });

  const handleSave = (data) => {
    if (editingAsset) {
      updateMutation.mutate({ id: editingAsset.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setShowForm(true);
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.isin?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === 'all' || asset.asset_class === filterClass;
    return matchesSearch && matchesClass;
  });

  const assetClassLabels = {
    stock: 'Aktie',
    etf: 'ETF',
    bond: 'Anleihe',
    crypto: 'Krypto',
    commodity: 'Rohstoff',
    precious_metal: 'Edelmetall',
    p2p_loan: 'P2P',
    real_estate_fund: 'Immobilienfonds',
    other: 'Sonstiges'
  };

  if (isLoading) {
    return <div className="text-center py-8">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-8 h-8" />
            Asset-Verwaltung
          </h1>
          <p className="text-slate-600 mt-1">Wertpapiere und Vermögenswerte verwalten</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Neues Asset
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">Gesamt</p>
            <p className="text-2xl font-bold text-slate-900">{assets.length}</p>
          </CardContent>
        </Card>
        {['stock', 'etf', 'crypto'].map(type => (
          <Card key={type}>
            <CardContent className="p-4">
              <p className="text-sm text-slate-600">{assetClassLabels[type]}</p>
              <p className="text-2xl font-bold text-slate-900">
                {assets.filter(a => a.asset_class === type).length}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter & Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nach Symbol, Name oder ISIN suchen..."
                className="pl-10"
              />
            </div>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="all">Alle Klassen</option>
              {Object.entries(assetClassLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Asset List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-6 py-3 font-semibold text-slate-900">Symbol</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-900">Name</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-900">ISIN</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-900">Klasse</th>
                  <th className="text-center px-6 py-3 font-semibold text-slate-900">Währung</th>
                  <th className="text-right px-6 py-3 font-semibold text-slate-900">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      {searchTerm || filterClass !== 'all' 
                        ? 'Keine Assets gefunden'
                        : 'Noch keine Assets vorhanden'}
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map(asset => (
                    <tr 
                      key={asset.id} 
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                      onClick={() => window.location.href = createPageUrl('AssetDetail') + '/' + asset.id}
                    >
                      <td className="px-6 py-3">
                        <span className="font-semibold text-slate-900">{asset.symbol}</span>
                      </td>
                      <td className="px-6 py-3 text-slate-700">{asset.name}</td>
                      <td className="px-6 py-3 text-slate-600 font-mono text-xs">
                        {asset.isin || '-'}
                      </td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                          {assetClassLabels[asset.asset_class]}
                        </span>
                      </td>
                      <td className="text-center px-6 py-3 text-slate-600">
                        {asset.currency}
                      </td>
                      <td className="text-right px-6 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(asset);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Asset wirklich löschen?')) {
                                deleteMutation.mutate(asset.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <AssetFormDialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingAsset(null);
        }}
        onSave={handleSave}
        editingAsset={editingAsset}
      />
    </div>
  );
}