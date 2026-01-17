import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import UpgradePrompt from '@/components/subscription/UpgradePrompt';

export default function LimitGuard({ 
  entityType, 
  children,
  onLimitReached 
}) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  const { data: limitCheck } = useQuery({
    queryKey: ['limit-check', entityType],
    queryFn: async () => {
      const response = await base44.functions.invoke('checkLimitAccess', {
        entity_type: entityType
      });
      return response.data;
    }
  });

  const handleClick = () => {
    if (limitCheck && !limitCheck.allowed) {
      setShowUpgrade(true);
      if (onLimitReached) onLimitReached();
    }
  };

  return (
    <>
      <div onClick={handleClick}>
        {children}
      </div>
      <UpgradePrompt
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature={`Mehr ${entityType === 'Building' ? 'Objekte' : 'Einheiten'}`}
      />
    </>
  );
}