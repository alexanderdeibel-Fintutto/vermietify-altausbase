import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Loader2 } from 'lucide-react';

export default function OnboardingRedirect({ children }) {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  });

  const { data: buildings, isLoading: loadingBuildings } = useQuery({
    queryKey: ['user-buildings'],
    queryFn: () => base44.entities.Building.list().catch(() => []),
    enabled: !!user,
    retry: 1,
    retryDelay: 2000,
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000
  });

  const { data: progress } = useQuery({
    queryKey: ['onboarding-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return undefined;
      try {
        const results = await base44.entities.OnboardingProgress.filter({ user_id: user.id }, null, 1);
        return results[0];
      } catch (e) {
        console.debug('Onboarding progress skipped');
        return undefined;
      }
    },
    enabled: !!user?.id,
    retry: 1,
    retryDelay: 2000,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  });

  useEffect(() => {
    if (!loadingBuildings && user) {
      // Skip redirect if data is unavailable (network issue)
      if (buildings === undefined || progress === undefined) return;
      
      const shouldRedirect = buildings && buildings.length === 0 && 
                            !progress?.is_completed && 
                            !window.location.pathname.includes('Onboarding') &&
                            !window.location.pathname.includes('UserSettings');
      
      if (shouldRedirect) {
        navigate(createPageUrl('Onboarding'));
      }
    }
  }, [user, buildings, progress, loadingBuildings, navigate]);

  if (loadingBuildings) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 className="w-8 h-8 text-emerald-600" />
        </motion.div>
      </div>
    );
  }

  return children;
}