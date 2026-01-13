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

  const initializeMutation = useMutation({
    mutationFn: () => base44.functions.invoke('initializeNewUser'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscription'] });
      queryClient.invalidateQueries({ queryKey: ['userLimits'] });
    }
  });

  useEffect(() => {
    if (user && !isLoading && !subscription && !initializeMutation.isPending) {
      initializeMutation.mutate();
    }
  }, [user, subscription, isLoading]);

  return <>{children}</>;
}