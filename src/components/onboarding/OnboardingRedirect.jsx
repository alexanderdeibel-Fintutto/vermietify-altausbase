import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../../utils';
import { Loader2 } from 'lucide-react';

export default function OnboardingRedirect({ children }) {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: buildings, isLoading: loadingBuildings } = useQuery({
    queryKey: ['user-buildings'],
    queryFn: () => base44.entities.Building.list(),
    enabled: !!user
  });

  const { data: progress } = useQuery({
    queryKey: ['onboarding-progress', user?.id],
    queryFn: async () => {
      const results = await base44.entities.OnboardingProgress.filter({ user_id: user.id });
      return results[0];
    },
    enabled: !!user
  });

  useEffect(() => {
    if (!loadingBuildings && user && buildings !== undefined && progress !== undefined) {
      // Redirect to onboarding if no buildings and onboarding not completed
      const shouldRedirect = buildings.length === 0 && 
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
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return children;
}