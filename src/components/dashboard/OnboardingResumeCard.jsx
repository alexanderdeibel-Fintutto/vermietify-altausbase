import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VfProgress } from '@/components/shared/VfProgress';
import { PlayCircle } from 'lucide-react';

export default function OnboardingResumeCard({ progress = 0, onResume }) {
  if (progress >= 100) return null;

  return (
    <Card className="border-[var(--vf-primary-600)]">
      <CardHeader>
        <CardTitle>Onboarding fortsetzen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[var(--theme-text-secondary)]">
          Sie haben den Einrichtungsassistenten zu {progress}% abgeschlossen
        </p>
        
        <VfProgress value={progress} max={100} variant="gradient" />

        <Button variant="gradient" className="w-full" onClick={onResume}>
          <PlayCircle className="h-4 w-4 mr-2" />
          Fortsetzen
        </Button>
      </CardContent>
    </Card>
  );
}