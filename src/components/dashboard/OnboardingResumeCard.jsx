import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VfProgress } from '@/components/shared/VfProgress';
import { BookOpen, ArrowRight } from 'lucide-react';

export default function OnboardingResumeCard({ progress = 60, nextStep = 'Mieter anlegen' }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Onboarding fortsetzen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">Fortschritt</span>
              <span className="text-sm font-bold">{progress}%</span>
            </div>
            <VfProgress value={progress} max={100} variant="gradient" />
          </div>

          <div className="p-3 bg-[var(--theme-surface)] rounded-lg">
            <div className="text-xs text-[var(--theme-text-muted)] mb-1">Nächster Schritt</div>
            <div className="font-medium text-sm">{nextStep}</div>
          </div>

          <Button variant="gradient" className="w-full">
            Weiter
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}