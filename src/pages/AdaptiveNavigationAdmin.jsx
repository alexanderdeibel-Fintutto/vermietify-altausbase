import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Users, Unlock, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdaptiveNavigationAdminPage() {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: navigationStates = [] } = useQuery({
    queryKey: ['allNavigationStates'],
    queryFn: () => base44.entities.NavigationState.list('-last_computed', 50)
  });

  const { data: featureUnlocks = [] } = useQuery({
    queryKey: ['allFeatureUnlocks'],
    queryFn: () => base44.entities.FeatureUnlock.list('-created_date', 100)
  });

  const { data: onboardingData = [] } = useQuery({
    queryKey: ['allOnboarding'],
    queryFn: () => base44.entities.UserOnboarding.list()
  });

  const batchUpdateMutation = useMutation({
    mutationFn: () => base44.functions.invoke('batchUpdateAllNavigationStates', {}),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['allNavigationStates']);
      toast.success(`${response.data.updated} User-Navigationen aktualisiert!`);
    }
  });

  // Calculate statistics
  const totalUsers = navigationStates.length;
  const avgVisibleFeatures = navigationStates.reduce((sum, ns) => sum + (ns.visible_features?.length || 0), 0) / (totalUsers || 1);
  const totalUnlocks = featureUnlocks.length;
  const recentUnlocks = featureUnlocks.filter(u => {
    const unlockDate = new Date(u.created_date);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return unlockDate > weekAgo;
  }).length;

  const avgOnboardingProgress = onboardingData.reduce((sum, o) => sum + (o.onboarding_progress || 0), 0) / (onboardingData.length || 1);
  const usersByLevel = onboardingData.reduce((acc, o) => {
    acc[o.user_level || 'beginner'] = (acc[o.user_level || 'beginner'] || 0) + 1;
    return acc;
  }, {});

  // Feature unlock distribution
  const unlocksByFeature = featureUnlocks.reduce((acc, u) => {
    acc[u.feature_key] = (acc[u.feature_key] || 0) + 1;
    return acc;
  }, {});

  const topUnlocks = Object.entries(unlocksByFeature)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">🧭 Adaptive Navigation Admin</h1>
          <p className="text-slate-600 mt-1">System-Überwachung & Verwaltung</p>
        </div>
        <Button 
          onClick={() => batchUpdateMutation.mutate()}
          disabled={batchUpdateMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${batchUpdateMutation.isPending ? 'animate-spin' : ''}`} />
          Alle aktualisieren
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="border border-blue-200 bg-blue-50">
          <CardContent className="pt-6 text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Aktive User</p>
            <p className="text-2xl font-bold text-slate-900">{totalUsers}</p>
          </CardContent>
        </Card>
        <Card className="border border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center">
            <Unlock className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Total Unlocks</p>
            <p className="text-2xl font-bold text-slate-900">{totalUnlocks}</p>
          </CardContent>
        </Card>
        <Card className="border border-orange-200 bg-orange-50">
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Neue Unlocks (7d)</p>
            <p className="text-2xl font-bold text-slate-900">{recentUnlocks}</p>
          </CardContent>
        </Card>
        <Card className="border border-purple-200 bg-purple-50">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Ø Onboarding</p>
            <p className="text-2xl font-bold text-slate-900">{Math.round(avgOnboardingProgress)}%</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="states">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="states">Navigation States</TabsTrigger>
          <TabsTrigger value="unlocks">Feature Unlocks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
        </TabsList>

        <TabsContent value="states" className="space-y-3">
          {navigationStates.map((state) => (
            <Card key={state.id} className="border border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-900">User: {state.user_id}</p>
                    <p className="text-xs text-slate-600">
                      Zuletzt berechnet: {new Date(state.last_computed).toLocaleString('de-DE')}
                    </p>
                  </div>
                  <Badge className="bg-blue-600">{state.visible_features?.length || 0} Features</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {state.visible_features?.map(f => (
                    <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="unlocks" className="space-y-3">
          {featureUnlocks.slice(0, 20).map((unlock) => (
            <Card key={unlock.id} className="border border-slate-200">
              <CardContent className="pt-6 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{unlock.feature_key}</p>
                  <p className="text-xs text-slate-600">
                    User: {unlock.user_id} • {new Date(unlock.created_date).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={
                    unlock.unlock_reason === 'time_based' ? 'bg-blue-600' :
                    unlock.unlock_reason === 'data_based' ? 'bg-green-600' :
                    unlock.unlock_reason === 'usage_based' ? 'bg-purple-600' :
                    'bg-orange-600'
                  }>
                    {unlock.unlock_reason}
                  </Badge>
                  {!unlock.notification_shown && (
                    <Badge className="bg-red-600">Ungesehen</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Feature Unlocks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topUnlocks.map(([feature, count]) => (
                    <div key={feature} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">{feature}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(usersByLevel).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 capitalize">{level}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>System Metriken</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-slate-600">Ø Sichtbare Features</p>
                    <p className="text-2xl font-bold text-slate-900">{avgVisibleFeatures.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Ø Onboarding Progress</p>
                    <p className="text-2xl font-bold text-slate-900">{Math.round(avgOnboardingProgress)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Unlock Rate</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {totalUsers > 0 ? (totalUnlocks / totalUsers).toFixed(1) : 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-3">
          {onboardingData.map((data) => (
            <Card key={data.id} className="border border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-900">User: {data.user_id}</p>
                    <p className="text-xs text-slate-600">
                      Level: {data.user_level} • {data.days_since_signup} Tage
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">{data.onboarding_progress}%</p>
                    <p className="text-xs text-slate-600">Score: {data.data_quality_score}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}