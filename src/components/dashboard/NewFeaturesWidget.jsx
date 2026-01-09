import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function NewFeaturesWidget() {
  const { data: recentUnlocks = [] } = useQuery({
    queryKey: ['recentUnlocks'],
    queryFn: async () => {
      const unlocks = await base44.entities.FeatureUnlock.list('-created_date', 5);
      return unlocks.filter(u => {
        const unlockDate = new Date(u.created_date);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return unlockDate > weekAgo;
      });
    }
  });

  if (recentUnlocks.length === 0) return null;

  return (
    <Card className="border border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-orange-600" />
          Neue Features
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600">
          🎉 Du hast {recentUnlocks.length} neue Feature{recentUnlocks.length !== 1 ? 's' : ''} freigeschaltet!
        </p>
        <div className="space-y-2">
          {recentUnlocks.map(unlock => (
            <div key={unlock.id} className="p-2 bg-white rounded-lg border border-orange-200">
              <p className="text-sm font-medium text-slate-900">{unlock.feature_key}</p>
              <p className="text-xs text-slate-500">
                {new Date(unlock.created_date).toLocaleDateString('de-DE')}
              </p>
            </div>
          ))}
        </div>
        <Link to={createPageUrl('FeatureCatalog')}>
          <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700">
            Alle Features ansehen
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}