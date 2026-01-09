import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Lock, TrendingUp, Target } from 'lucide-react';

export default function UnlockProgressTracker() {
  const [nextUnlocks, setNextUnlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNextUnlocks();
  }, []);

  const loadNextUnlocks = async () => {
    try {
      const response = await base44.functions.invoke('getNextUnlockProgress', {});
      setNextUnlocks(response.data.nextUnlocks || []);
    } catch (error) {
      console.error('Error loading unlock progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || nextUnlocks.length === 0) return null;

  return (
    <Card className="border border-indigo-200 bg-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="w-5 h-5 text-indigo-600" />
          Nächste Features freischalten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {nextUnlocks.slice(0, 3).map((unlock, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-900">{unlock.featureName}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {unlock.progress}%
              </Badge>
            </div>
            <Progress value={unlock.progress} className="h-2" />
            <p className="text-xs text-slate-600">{unlock.requirement}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}