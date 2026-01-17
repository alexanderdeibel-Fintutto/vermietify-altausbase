import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function LimitChecker({ entityType, children, onLimitReached }) {
  const { data: count } = useQuery({
    queryKey: ['entity-count', entityType],
    queryFn: async () => {
      const items = await base44.entities[entityType].list();
      return items.length;
    }
  });

  const limits = {
    Building: 5,
    Unit: 20,
    Tenant: 25
  };

  const limit = limits[entityType] || 999;
  const isAtLimit = count >= limit;

  if (isAtLimit && onLimitReached) {
    return onLimitReached();
  }

  return children;
}