import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function SubscriptionInitializer({ children }) {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['userSubscription', user?.email],
    queryFn: async () => {
      const subs = await base44.entities.UserSubscription.filter({ 
        user_email: user.email 
      });
      return subs[0] || null;
    },
    enabled: !!user?.email
  });

  // AI Features Initialization
  const { data: aiSettings } = useQuery({
    queryKey: ['aiSettings'],
    queryFn: async () => {
      const settings = await base44.entities.AISettings.list('-updated_date', 1);
      return settings[0] || null;
    },
    enabled: !!user
  });

  const initAIMutation = useMutation({
    mutationFn: () => base44.functions.invoke('initializeAIFeatures', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiSettings'] });
      queryClient.invalidateQueries({ queryKey: ['aiFeatures'] });
    }
  });

  useEffect(() => {
    if (user && aiSettings === null && !initAIMutation.isPending && !initAIMutation.isSuccess) {
      initAIMutation.mutate();
    }
  }, [user, aiSettings]);

  return <>{children}</>;
}