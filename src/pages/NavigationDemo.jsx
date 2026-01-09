import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Package, Zap, Eye, Lock } from 'lucide-react';

export default function NavigationDemo() {
  const [setupRunning, setSetupRunning] = useState(false);
  const [setupResult, setSetupResult] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: navigationState } = useQuery({
    queryKey: ['navigationState'],
    queryFn: async () => {
      const states = await base44.entities.NavigationState.list('-updated_date', 1);
      return states[0];
    }
  });

  const { data: packageConfig } = useQuery({
    queryKey: ['packageConfig', user?.id],
    queryFn: async () => {
      const configs = await base44.entities.UserPackageConfiguration.filter({ user_id: user.id });
      return configs[0];
    },
    enabled: !!user?.id
  });

  const { data: onboarding } = useQuery({
    queryKey: ['onboarding', user?.id],
    queryFn: async () => {
      const records = await base44.entities.UserOnboarding.filter({ user_id: user.id });
      return records[0];
    },
    enabled: !!user?.id
  });

  const runSetup = async () => {
    setSetupRunning(true);
    try {
      const response = await base44.functions.invoke('setupAdaptiveNavigationDemo', {});
      setSetupResult(response.data);
    } catch (error) {
      setSetupResult({ error: error.message });
    } finally {
      setSetupRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">🧭 Adaptive Navigation Demo</h1>
        <p className="text-slate-600 mt-2">Test und Konfiguration der intelligenten Navigation</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            Demo-Setup
          </CardTitle>
          <CardDescription>Initialisiert alle benötigten Daten für die adaptive Navigation</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runSetup} 
            disabled={setupRunning}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {setupRunning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Setup starten
          </Button>

          {setupResult && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 font-medium">
                <CheckCircle2 className="w-5 h-5" />
                Setup abgeschlossen
              </div>
              <pre className="mt-2 text-xs text-green-700">
                {JSON.stringify(setupResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5 text-blue-600" />
              Package Konfiguration
            </CardTitle>
          </CardHeader>
          <CardContent>
            {packageConfig ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Paket:</span>
                  <Badge>{packageConfig.package_type}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Max. Gebäude:</span>
                  <span className="font-medium">{packageConfig.max_buildings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Module:</span>
                  <span className="text-xs">{packageConfig.additional_modules?.join(', ') || 'Keine'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Status:</span>
                  <Badge variant={packageConfig.is_active ? 'default' : 'secondary'}>
                    {packageConfig.is_active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Keine Konfiguration gefunden</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="w-5 h-5 text-emerald-600" />
              Sichtbare Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            {navigationState ? (
              <div className="flex flex-wrap gap-2">
                {navigationState.visible_features?.map(feature => (
                  <Badge key={feature} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Navigation nicht initialisiert</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Onboarding Status</CardTitle>
        </CardHeader>
        <CardContent>
          {onboarding ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Fortschritt</span>
                <span className="font-semibold text-indigo-700">{onboarding.onboarding_progress}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all" 
                  style={{ width: `${onboarding.onboarding_progress}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Level:</span>
                  <Badge className="ml-2">{onboarding.user_level}</Badge>
                </div>
                <div>
                  <span className="text-slate-600">Daten-Qualität:</span>
                  <span className="ml-2 font-medium">{onboarding.data_quality_score}/100</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Kein Onboarding-Status gefunden</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">User Informationen</CardTitle>
        </CardHeader>
        <CardContent>
          {user && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Subscription:</span>
                <span>{user.subscription_plan || 'Nicht gesetzt'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Rolle:</span>
                <Badge>{user.role}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}