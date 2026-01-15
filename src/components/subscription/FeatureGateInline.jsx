import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

export function FeatureGateInline({ 
  featureCode, 
  children,
  showBadge = true
}) {
  // Feature gates deaktiviert - alle Features sind verfügbar
  return <>{children}</>;
}

export default FeatureGateInline;