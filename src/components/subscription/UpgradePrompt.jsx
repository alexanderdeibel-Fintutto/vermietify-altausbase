import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export default function UpgradePrompt({ feature }) {
  return (
    <Card className="border-2 border-[var(--vf-accent-200)]">
      <CardContent className="p-6 text-center">
        <Sparkles className="h-12 w-12 mx-auto mb-4 text-[var(--vf-accent-500)]" />
        <h3 className="font-semibold text-lg mb-2">Premium-Feature</h3>
        <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
          {feature || 'Diese Funktion'} ist in Ihrem aktuellen Plan nicht verfügbar.
        </p>
        <Button variant="gradient" className="w-full">
          Jetzt upgraden
        </Button>
      </CardContent>
    </Card>
  );
}