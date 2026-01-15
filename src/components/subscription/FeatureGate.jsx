import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import UpgradePrompt from './UpgradePrompt';

export function FeatureGate({ 
  featureCode, 
  children, 
  fallback = null,
  showUpgradePrompt = true 
}) {
  // Feature gates deaktiviert - alle Features sind verfügbar
  return <>{children}</>;
}

export default FeatureGate;