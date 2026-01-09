import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Lock } from 'lucide-react';

export default function NavigationRoadmap() {
  const { data: catalog = [] } = useQuery({
    queryKey: ['featureCatalog'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getFeatureCatalog', {});
      return res.data.catalog || [];
    }
  });

  const roadmapStages = [
    { label: 'Basis', features: catalog.filter(f => f.category === 'core') },
    { label: 'Erweitert', features: catalog.filter(f => f.category === 'advanced') },
    { label: 'Premium', features: catalog.filter(f => f.category === 'premium') }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>🗺️ Feature-Roadmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {roadmapStages.map((stage, idx) => (
            <div key={idx}>
              <h3 className="font-semibold text-slate-900 mb-3">{stage.label}</h3>
              <div className="space-y-2">
                {stage.features.map(feature => (
                  <div key={feature.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                    {feature.unlocked ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : feature.progress > 0 ? (
                      <Circle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    ) : (
                      <Lock className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{feature.name}</p>
                      {!feature.unlocked && feature.progress > 0 && (
                        <p className="text-xs text-slate-500">{feature.progress}% erreicht</p>
                      )}
                    </div>
                    {feature.unlocked && (
                      <Badge className="bg-green-600 text-xs">✓</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}