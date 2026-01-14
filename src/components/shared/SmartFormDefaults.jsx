import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useSmartDefaults(entityType, formData, setValue) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: recentEntries } = useQuery({
    queryKey: ['recentEntries', entityType],
    queryFn: async () => {
      try {
        return await base44.entities[entityType].list('-created_date', 5);
      } catch {
        return [];
      }
    },
    enabled: !!entityType
  });

  useEffect(() => {
    if (!recentEntries?.length || !setValue) return;

    const mostRecent = recentEntries[0];
    
    // Auto-fill common fields from most recent entry
    const defaultableFields = [
      'category',
      'cost_type_id',
      'payment_method',
      'currency',
      'tax_rate',
      'building_id',
      'unit_id'
    ];

    defaultableFields.forEach(field => {
      if (mostRecent[field] && !formData[field]) {
        setValue(field, mostRecent[field]);
      }
    });
  }, [recentEntries, setValue, formData]);

  return {
    recentEntries,
    user
  };
}

export default useSmartDefaults;