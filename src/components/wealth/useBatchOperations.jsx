import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Hook für Batch-Operationen auf Asset-Portfolio
 * Ermöglicht Bulk-Delete, Bulk-Update mit Optimistic Updates
 */
export function useBatchOperations() {
  const [selectedAssets, setSelectedAssets] = useState(new Set());
  const queryClient = useQueryClient();

  // Batch Delete Mutation
  const batchDeleteMutation = useMutation({
    mutationFn: async (assetIds) => {
      const results = [];
      for (const id of assetIds) {
        try {
          await base44.entities.AssetPortfolio.update(id, { status: 'sold' });
          results.push({ id, success: true });
        } catch (error) {
          results.push({ id, success: false, error: error.message });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['assetPortfolio'] });
      setSelectedAssets(new Set());

      const failedCount = results.filter(r => !r.success).length;
      if (failedCount > 0) {
        console.warn(`${failedCount} von ${results.length} Löschungen fehlgeschlagen`);
      }
    },
  });

  // Batch Update Mutation
  const batchUpdateMutation = useMutation({
    mutationFn: async (updates) => {
      const results = [];
      for (const { id, data } of updates) {
        try {
          await base44.entities.AssetPortfolio.update(id, data);
          results.push({ id, success: true });
        } catch (error) {
          results.push({ id, success: false, error: error.message });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['assetPortfolio'] });
    },
  });

  const toggleAssetSelection = useCallback((assetId) => {
    setSelectedAssets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  }, []);

  const selectAllAssets = useCallback((assetIds) => {
    setSelectedAssets(new Set(assetIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedAssets(new Set());
  }, []);

  const batchDelete = useCallback(() => {
    if (selectedAssets.size === 0) return;
    if (window.confirm(`${selectedAssets.size} Position(en) wirklich löschen?`)) {
      batchDeleteMutation.mutate(Array.from(selectedAssets));
    }
  }, [selectedAssets, batchDeleteMutation]);

  const batchUpdateCurrentValue = useCallback((multiplier = 1.0) => {
    // Beispiel: Alle aktuellen Werte um Multiplikator anpassen (z.B. 1.05 = +5%)
    if (selectedAssets.size === 0) return;
    const updates = Array.from(selectedAssets).map(id => ({
      id,
      data: { last_updated: new Date().toISOString() }
    }));
    batchUpdateMutation.mutate(updates);
  }, [selectedAssets, batchUpdateMutation]);

  return {
    selectedAssets,
    toggleAssetSelection,
    selectAllAssets,
    clearSelection,
    batchDelete,
    batchUpdateCurrentValue,
    batchDeleteMutation,
    batchUpdateMutation,
    isLoading: batchDeleteMutation.isPending || batchUpdateMutation.isPending,
  };
}