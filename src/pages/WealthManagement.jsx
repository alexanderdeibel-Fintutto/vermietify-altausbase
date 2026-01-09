import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Trash2 } from 'lucide-react';
import PortfolioKPICards from '@/components/wealth/PortfolioKPICards';
import AssetPortfolioTable from '@/components/wealth/AssetPortfolioTable';
import AssetWizard from '@/components/wealth/AssetWizard';
import CSVImportDialog from '@/components/wealth/CSVImportDialog';
import AssetDetailModal from '@/components/wealth/AssetDetailModal';
import ImportHistoryPanel from '@/components/wealth/ImportHistoryPanel';
import PortfolioErrorBoundary from '@/components/wealth/PortfolioErrorBoundary';
import { useBatchOperations } from '@/components/wealth/useBatchOperations';

export default function WealthManagementPage() {
  const [showWizard, setShowWizard] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const queryClient = useQueryClient();
  
  const {
    selectedAssets,
    toggleAssetSelection,
    selectAllAssets,
    clearSelection,
    batchDelete,
    isLoading: batchLoading
  } = useBatchOperations();

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
      import_source: 'manual',
      validation_status: 'validated',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetPortfolio'] });
      setShowWizard(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AssetPortfolio.update(id, { status: 'sold' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assetPortfolio'] }),
  });

  const handleWizardSubmit = (formData) => {
    createMutation.mutate(formData);
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
    <PortfolioErrorBoundary>
      <div className="space-y-4 lg:space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-light text-slate-900">Mein Vermögen</h1>
          <p className="text-xs lg:text-sm font-light text-slate-600 mt-1">
            Verwalten Sie alle Ihre Vermögenswerte für eine ganzheitliche Übersicht
          </p>
        </div>

        <PortfolioKPICards portfolio={portfolio} />

        <Card>
          <div className="p-4 lg:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h2 className="text-base lg:text-lg font-light text-slate-900">Portfolio Übersicht</h2>
            <div className="flex gap-2 flex-col sm:flex-row">
              {selectedAssets.size > 0 && (
                <Button
                  onClick={batchDelete}
                  disabled={batchLoading}
                  variant="destructive"
                  className="font-light gap-2 text-sm w-full sm:w-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    Löschen ({selectedAssets.size})
                  </span>
                  <span className="sm:hidden">
                    ({selectedAssets.size})
                  </span>
                </Button>
              )}
              <Button
                onClick={() => setShowImportDialog(true)}
                variant="outline"
                className="font-light gap-2 text-sm w-full sm:w-auto"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Importieren</span>
                <span className="sm:hidden">Import</span>
              </Button>
              <Button
                onClick={() => setShowWizard(true)}
                className="bg-slate-900 hover:bg-slate-800 font-light gap-2 text-sm w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                Hinzufügen
              </Button>
            </div>
          </div>
        <div className="p-4 lg:p-6 overflow-x-hidden">
          {isLoading ? (
            <p className="text-sm font-light text-slate-600">Lädt...</p>
          ) : (
            <AssetPortfolioTable
              portfolio={portfolio}
              onSelectAsset={setSelectedAsset}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          )}
        </div>
      </Card>

      <AssetWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        onSubmit={handleWizardSubmit}
        isLoading={createMutation.isPending}
      />

      <CSVImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={(data) => {
          queryClient.invalidateQueries({ queryKey: ['assetPortfolio'] });
          queryClient.invalidateQueries({ queryKey: ['importBatches'] });
        }}
        isLoading={false}
      />

      <AssetDetailModal
        asset={selectedAsset}
        open={!!selectedAsset}
        onOpenChange={(open) => !open && setSelectedAsset(null)}
        onEdit={(asset) => console.log('Edit asset:', asset)}
        onDelete={(id) => {
          deleteMutation.mutate(id);
          setSelectedAsset(null);
        }}
      />

        <div className="mt-6 lg:mt-8">
          <ImportHistoryPanel />
        </div>
      </div>
    </PortfolioErrorBoundary>
  );
}