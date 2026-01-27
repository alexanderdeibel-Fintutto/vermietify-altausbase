import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import UpgradePrompt from './UpgradePrompt';

export function FeatureGate({ 
  featureCode, 
  requiredPlan = 'Professional',
  children,
  fallback 
}) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  const { data: hasAccess, isLoading } = useQuery({
    queryKey: ['feature-access', featureCode],
    queryFn: async () => {
      const response = await base44.functions.invoke('checkFeatureAccess', {
        feature_code: featureCode
      });
      return response.data.hasAccess;
    }
  });

  if (isLoading) return null;

  if (!hasAccess) {
    return (
      <>
        <div onClick={() => setShowUpgrade(true)}>
          {fallback || children}
        </div>
        <UpgradePrompt
          open={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          feature={featureCode}
          requiredPlan={requiredPlan}
        />
      </>
    );
  }

  return <>{children}</>;
}

export default FeatureGate;