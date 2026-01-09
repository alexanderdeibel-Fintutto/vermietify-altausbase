import React, { useState } from 'react';
import { usePackageAccess } from '@/components/hooks/usePackageAccess';
import UpgradeDialog from '@/components/UpgradeDialog';
import { base44 } from '@/api/base44Client';

export default function ModuleGuard({ moduleName, children, fallback = null }) {
  const { hasModuleAccess, packageConfig } = usePackageAccess();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeSuggestions, setUpgradeSuggestions] = useState([]);

  const checkAccess = async () => {
    if (hasModuleAccess(moduleName)) {
      return true;
    }

    // Backend-Validierung + Upgrade-Optionen
    const response = await base44.functions.invoke('validatePackageAccess', {
      moduleName,
      action: 'access'
    });

    if (!response.data.hasAccess) {
      setUpgradeSuggestions(response.data.upgradeSuggestions || []);
      setShowUpgrade(true);
      return false;
    }

    return true;
  };

  React.useEffect(() => {
    checkAccess();
  }, [moduleName]);

  if (!hasModuleAccess(moduleName)) {
    return (
      <>
        {fallback}
        <UpgradeDialog
          open={showUpgrade}
          onOpenChange={setShowUpgrade}
          moduleName={moduleName}
          currentPackage={packageConfig?.package_type}
          upgradeSuggestions={upgradeSuggestions}
        />
      </>
    );
  }

  return <>{children}</>;
}