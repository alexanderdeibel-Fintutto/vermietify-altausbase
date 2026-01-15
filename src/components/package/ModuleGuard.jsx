import React, { useState } from 'react';
import { usePackageAccess } from '@/components/hooks/usePackageAccess';
import UpgradeDialog from '@/components/UpgradeDialog';
import { base44 } from '@/api/base44Client';

export default function ModuleGuard({ moduleName, children, fallback = null }) {
  // Feature gates deaktiviert - alle Features sind verfügbar
  return <>{children}</>;
}