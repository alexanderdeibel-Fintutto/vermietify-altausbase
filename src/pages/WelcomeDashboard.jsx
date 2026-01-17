import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import QuickActionCard from '@/components/dashboards/QuickActionCard';
import TrialCountdown from '@/components/subscription/TrialCountdown';
import { Building2, Users, FileText, Calculator, TrendingUp, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function WelcomeDashboard() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: subscription } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: async () => {
      const subs = await base44.entities.UserSubscription.filter({ user_email: user.email });
      return subs[0] || null;
    },
    enabled: !!user
  });

  const quickActions = [
    { icon: Building2, title: 'Objekt anlegen', description: 'Erste Immobilie erfassen', href: 'Buildings', color: 'primary' },
    { icon: Users, title: 'Mieter hinzufügen', description: 'Mieterdaten verwalten', href: 'Tenants', color: 'accent' },
    { icon: Calculator, title: 'Tools nutzen', description: '9 kostenlose Rechner', href: 'VermitifyToolsOverview', color: 'success' },
    { icon: FileText, title: 'Anlage V erstellen', description: 'Steuererklärung automatisch', href: 'AnlageVDashboard', color: 'warning' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Willkommen bei vermitify, {user?.full_name?.split(' ')[0] || 'Vermieter'}! 👋
        </h1>
        <p className="text-xl text-[var(--theme-text-secondary)]">
          Lassen Sie uns gemeinsam Ihre Immobilienverwaltung optimieren
        </p>
      </div>

      {subscription?.status === 'TRIAL' && subscription.trial_end_date && (
        <div className="mb-6">
          <TrialCountdown trialEndDate={subscription.trial_end_date} />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {quickActions.map((action) => (
          <QuickActionCard key={action.title} {...action} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Erste Schritte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[var(--vf-primary-600)] text-white flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Profil vervollständigen</h4>
                <p className="text-sm text-[var(--theme-text-secondary)] mb-2">
                  Fügen Sie wichtige Informationen hinzu
                </p>
                <Link to={createPageUrl('SettingsProfile')}>
                  <Button variant="outline" size="sm">Zum Profil →</Button>
                </Link>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[var(--vf-primary-600)] text-white flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Erstes Objekt anlegen</h4>
                <p className="text-sm text-[var(--theme-text-secondary)] mb-2">
                  Starten Sie mit Ihrer ersten Immobilie
                </p>
                <Link to={createPageUrl('Buildings')}>
                  <Button variant="outline" size="sm">Objekt anlegen →</Button>
                </Link>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[var(--vf-neutral-300)] text-white flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Rechner ausprobieren</h4>
                <p className="text-sm text-[var(--theme-text-secondary)] mb-2">
                  Nutzen Sie unsere kostenlosen Rechner
                </p>
                <Link to={createPageUrl('VermitifyToolsOverview')}>
                  <Button variant="outline" size="sm">Tools ansehen →</Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}