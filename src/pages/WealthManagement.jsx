import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import PortfolioKPICards from '@/components/wealth/PortfolioKPICards';
import AssetPortfolioTable from '@/components/wealth/AssetPortfolioTable';
import AssetFormDialog from '@/components/wealth/AssetFormDialog';

export default function WealthManagementPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: portfolio = [], isLoading } = useQuery({
    queryKey: ['assetPortfolio', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const results = await base44.entities.AssetPortfolio.filter(
        { user_id: currentUser.id, status: 'active' },
        '-created_date',
        100
      );
      return results;
    },
    enabled: !!currentUser?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AssetPortfolio.create({
      ...data,
      user_id: currentUser.id,
      last_updated: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetPortfolio'] });
      setShowDialog(false);
      setEditingAsset(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.AssetPortfolio.update(editingAsset.id, {
      ...data,
      last_updated: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetPortfolio'] });
      setShowDialog(false);
      setEditingAsset(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AssetPortfolio.update(id, { status: 'sold' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assetPortfolio'] }),
  });

  const handleOpenDialog = (asset = null) => {
    setEditingAsset(asset);
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingAsset(null);
  };

  const handleSubmit = (formData) => {
    if (editingAsset) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md">
          <p className="text-sm font-light text-slate-600">Bitte melden Sie sich an.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Mein Vermögen</h1>
        <p className="text-sm font-light text-slate-600 mt-1">
          Verwalten Sie alle Ihre Vermögenswerte für eine ganzheitliche Übersicht
        </p>
      </div>

      <PortfolioKPICards portfolio={portfolio} />

      <Card>
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-light text-slate-900">Portfolio Übersicht</h2>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-slate-900 hover:bg-slate-800 font-light gap-2"
          >
            <Plus className="w-4 h-4" />
            Vermögenswert hinzufügen
          </Button>
        </div>
        <div className="p-6">
          {isLoading ? (
            <p className="text-sm font-light text-slate-600">Lädt...</p>
          ) : (
            <AssetPortfolioTable
              portfolio={portfolio}
              onEdit={handleOpenDialog}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          )}
        </div>
      </Card>

      <AssetFormDialog
        open={showDialog}
        onOpenChange={handleCloseDialog}
        onSubmit={handleSubmit}
        initialData={editingAsset}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}