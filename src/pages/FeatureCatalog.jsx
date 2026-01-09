import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Unlock, Search, TrendingUp, Zap, Clock } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

export default function FeatureCatalogPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: response = {} } = useQuery({
    queryKey: ['featureCatalog'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getFeatureCatalog', {});
      return res.data;
    }
  });

  const { catalog = [], unlockedCount = 0, totalCount = 0 } = response;

  const filteredFeatures = catalog.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unlockProgress = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">🎯 Feature-Katalog</h1>
        <p className="text-slate-600 mt-1">Entdecke alle verfügbaren Features und ihre Freischaltungskriterien</p>
      </div>

      <Card className="border border-emerald-200 bg-emerald-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-slate-700">Dein Feature-Fortschritt</p>
              <p className="text-2xl font-bold text-slate-900">{unlockedCount} / {totalCount}</p>
            </div>
            <div className="text-3xl">🎉</div>
          </div>
          <Progress value={unlockProgress} className="h-3" />
          <p className="text-xs text-slate-600 mt-2">{unlockProgress}% aller Features freigeschaltet</p>
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Features durchsuchen..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Alle ({filteredFeatures.length})</TabsTrigger>
          <TabsTrigger value="unlocked">Freigeschaltet ({filteredFeatures.filter(f => f.unlocked).length})</TabsTrigger>
          <TabsTrigger value="locked">Gesperrt ({filteredFeatures.filter(f => !f.unlocked).length})</TabsTrigger>
          <TabsTrigger value="soon">Bald verfügbar</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {filteredFeatures.map((feature) => (
            <FeatureCard key={feature.key} feature={feature} />
          ))}
        </TabsContent>

        <TabsContent value="unlocked" className="space-y-3">
          {filteredFeatures.filter(f => f.unlocked).map((feature) => (
            <FeatureCard key={feature.key} feature={feature} />
          ))}
        </TabsContent>

        <TabsContent value="locked" className="space-y-3">
          {filteredFeatures.filter(f => !f.unlocked).map((feature) => (
            <FeatureCard key={feature.key} feature={feature} />
          ))}
        </TabsContent>

        <TabsContent value="soon" className="space-y-3">
          {filteredFeatures.filter(f => !f.unlocked && f.progress >= 50).map((feature) => (
            <FeatureCard key={feature.key} feature={feature} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FeatureCard({ feature }) {
  const Icon = feature.unlocked ? Unlock : Lock;
  const iconColor = feature.unlocked ? 'text-green-600' : 'text-slate-400';

  return (
    <Card className={`border ${feature.unlocked ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-lg ${feature.unlocked ? 'bg-green-100' : 'bg-slate-100'} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-slate-900">{feature.name}</h3>
              {feature.unlocked ? (
                <Badge className="bg-green-600">Freigeschaltet</Badge>
              ) : (
                <Badge variant="outline">Gesperrt</Badge>
              )}
              {feature.isNew && (
                <Badge className="bg-orange-600">NEU</Badge>
              )}
            </div>
            <p className="text-sm text-slate-600 mb-3">{feature.description}</p>
            
            {!feature.unlocked && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Freischaltung:</span>
                  <span className="font-medium text-slate-900">{feature.progress || 0}%</span>
                </div>
                {feature.progress !== undefined && (
                  <Progress value={feature.progress || 0} className="h-2" />
                )}
                <p className="text-xs text-slate-600">{feature.unlockRequirement}</p>
              </div>
            )}

            {feature.unlocked && feature.unlockedAt && (
              <p className="text-xs text-slate-500">
                Freigeschaltet am {new Date(feature.unlockedAt).toLocaleDateString('de-DE')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}