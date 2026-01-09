import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';

const FEATURE_LABELS = {
  'zaehlerVerwaltung': 'Zählerverwaltung',
  'betriebskostenabrechnung': 'Betriebskostenabrechnung',
  'automatedWorkflows': 'Automatisierte Workflows',
  'aiOptimization': 'KI-Optimierung',
  'mieterKommunikation': 'Mieter-Kommunikation',
  'portfolioAnalytics': 'Portfolio-Analytics',
  'tenantPortal': 'Mieter-Portal',
  'aiCategorization': 'KI-Kategorisierung'
};

export default function FeatureUnlockNotification() {
  const [shown, setShown] = useState(new Set());

  useEffect(() => {
    checkNewUnlocks();
    const interval = setInterval(checkNewUnlocks, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const checkNewUnlocks = async () => {
    try {
      const unlocks = await base44.entities.FeatureUnlock.filter({});
      const newUnlocks = unlocks.filter(u => !u.notification_shown && !shown.has(u.id));

      for (const unlock of newUnlocks) {
        const label = FEATURE_LABELS[unlock.feature_key] || unlock.feature_key;
        
        toast.success(`🎉 Neues Feature freigeschaltet!`, {
          description: `${label} ist jetzt verfügbar`,
          icon: <Sparkles className="w-4 h-4 text-orange-600" />,
          duration: 5000
        });

        // Mark as shown
        await base44.entities.FeatureUnlock.update(unlock.id, { notification_shown: true });
        setShown(prev => new Set([...prev, unlock.id]));
      }
    } catch (error) {
      console.error('Error checking unlocks:', error);
    }
  };

  return null;
}