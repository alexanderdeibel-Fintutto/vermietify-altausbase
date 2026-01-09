import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

export default function TenantBulkActionsBar({ selectedIds, onClose, tenants }) {
  const [isOpen, setIsOpen] = useState(false);
  const [action, setAction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const selectedTenants = Array.from(selectedIds)
    .map(id => tenants.find(t => t.id === id))
    .filter(Boolean);

  const handleBulkAction = async (actionType) => {
    setIsLoading(true);
    try {
      const updates = selectedTenants.map(tenant => ({
        id: tenant.id,
        data: {
          portal_enabled: actionType === 'enable_portal'
        }
      }));

      for (const { id, data } of updates) {
        await base44.entities.Tenant.update(id, data);
      }

      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      
      const actionLabel = actionType === 'enable_portal' ? 'aktiviert' : 'deaktiviert';
      toast.success(`Portal-Zugang für ${selectedTenants.length} Mieter ${actionLabel}`);
      
      onClose?.();
      setIsOpen(false);
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedIds || selectedIds.size === 0) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-6 left-6 right-6 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-40"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-medium text-slate-900">
            {selectedIds.size} Mieter ausgewählt
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAction('enable_portal');
                setIsOpen(true);
              }}
            >
              Portal aktivieren
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAction('disable_portal');
                setIsOpen(true);
              }}
            >
              Portal deaktivieren
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'enable_portal' ? 'Portal aktivieren?' : 'Portal deaktivieren?'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {action === 'enable_portal'
                ? `Portal-Zugang wird für ${selectedTenants.length} Mieter aktiviert.`
                : `Portal-Zugang wird für ${selectedTenants.length} Mieter deaktiviert.`}
            </p>
            <div className="bg-slate-50 rounded p-3 max-h-48 overflow-y-auto">
              <ul className="text-xs space-y-1">
                {selectedTenants.map(t => (
                  <li key={t.id} className="text-slate-700">
                    • {t.full_name} ({t.email})
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={() => handleBulkAction(action)}
                disabled={isLoading}
                className="bg-slate-700 hover:bg-slate-800"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Wird verarbeitet...
                  </>
                ) : (
                  'Bestätigen'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}