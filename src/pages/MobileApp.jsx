import React from 'react';
import MobileNotifications from '@/components/mobile/MobileNotifications';
import QuickActionsWidget from '@/components/widgets/QuickActionsWidget';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function MobileApp() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  return (
    <div className="min-h-screen bg-[var(--theme-background)] pb-20">
      <div className="bg-[var(--vf-gradient-primary)] text-white p-6">
        <h1 className="text-2xl font-bold">Hallo {user?.full_name?.split(' ')[0]}!</h1>
        <p className="text-sm opacity-90 mt-1">
          {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="p-4 space-y-4">
        <QuickActionsWidget />
        
        <div>
          <h2 className="font-semibold mb-3">Benachrichtigungen</h2>
          <MobileNotifications />
        </div>
      </div>
    </div>
  );
}