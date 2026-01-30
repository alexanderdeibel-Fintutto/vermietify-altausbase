import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FeatureGate({ featureKey, requiredTier, children }) {
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, [featureKey]);

  async function checkAccess() {
    try {
      const user = await base44.auth.me();
      
      // Admins haben immer Zugriff
      if (user.role === 'admin') {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // Feature-Config laden
      const features = await base44.entities.AIFeatureConfig.list();
      const feature = features.find(f => f.feature_key === featureKey);
      
      if (!feature || !feature.is_enabled) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // Subscription-Check (vereinfacht)
      const tierOrder = ['free', 'starter', 'pro', 'business'];
      const userTier = 'free'; // TODO: Aus UserSubscription laden
      const requiredTierLevel = tierOrder.indexOf(feature.requires_subscription);
      const userTierLevel = tierOrder.indexOf(userTier);
      
      setHasAccess(userTierLevel >= requiredTierLevel);
    } catch (e) {
      console.error('Failed to check feature access:', e);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Prüfe Berechtigung...</div>
        </CardContent>
      </Card>
    );
  }

  if (!hasAccess) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Lock className="w-12 h-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-semibold mb-2">Feature nicht verfügbar</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Dieses KI-Feature erfordert ein {requiredTier || 'höheres'} Abonnement.
              </p>
              <Button asChild>
                <Link to={createPageUrl('Pricing')}>
                  <Zap className="w-4 h-4 mr-2" />
                  Jetzt upgraden
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}