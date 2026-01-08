import React, { useState } from 'react';
import { usePackageAccess } from '@/components/hooks/usePackageAccess';
import UpgradeDialog from './UpgradeDialog';
import { Loader2 } from 'lucide-react';

/**
 * Schützt eine Seite mit Paket-Validierung
 * @param {string} requiredModule - Z.B. 'objekte', 'mieter', 'dokumentation'
 * @param {React.ReactNode} children - Der Seiteninhalt
 */
export default function ProtectedPage({ requiredModule, children }) {
  const { packageConfig, packageTemplate, hasModuleAccess, isLoading } = usePackageAccess();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const hasAccess = hasModuleAccess(requiredModule);

  if (!hasAccess) {
    setShowUpgradeDialog(true);
  }

  return (
    <>
      {hasAccess ? children : <div className="p-8 text-center text-slate-600">Lädt...</div>}
      
      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        moduleName={requiredModule}
        currentPackage={packageConfig?.package_type || 'easyVermieter'}
        upgradeSuggestions={[]}
      />
    </>
  );
}