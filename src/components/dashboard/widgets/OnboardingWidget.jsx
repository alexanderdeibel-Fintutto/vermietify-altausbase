import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle } from 'lucide-react';

export default function OnboardingWidget() {
  const [progress, setProgress] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { base44 } = await import('@/api/base44Client');
        const u = await base44.auth.me();
        setUser(u);
        const saved = localStorage.getItem(`onboarding_${u?.id}`);
        if (saved) {
          setProgress(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    loadUser();
  }, []);

  const completed = Object.values(progress).filter(Boolean).length;
  const total = 8;
  const completionPercent = (completed / total) * 100;

  if (completionPercent === 100) {
    return (
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <p className="font-light text-slate-700">Onboarding abgeschlossen! 🎉</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Onboarding-Fortschritt</CardTitle>
        <p className="text-xs text-slate-600 mt-1">{completed}/{total} abgeschlossen</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={completionPercent} className="h-2" />
        <p className="text-sm font-light text-slate-700 mt-3">
          {Math.round(completionPercent)}% fertig
        </p>
      </CardContent>
    </Card>
  );
}