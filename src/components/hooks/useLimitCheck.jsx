import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useLimitCheck(limitCode) {
  return useQuery({
    queryKey: ['limitCheck', limitCode],
    queryFn: async () => {
      const response = await base44.functions.invoke('checkUserLimit', { limit_code: limitCode });
      return response.data;
    },
    enabled: !!limitCode,
    staleTime: 30000 // Cache for 30 seconds
  });
}