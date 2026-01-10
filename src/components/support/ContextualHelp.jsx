import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';

export default function ContextualHelp({ context = 'general' }) {
  const helpTexts = {
    general: 'Willkommen! Nutzen Sie die Navigation oben, um zwischen Modulen zu wechseln.',
    tax: 'Hier verwalten Sie Ihre Steuerdaten. Laden Sie Belege hoch und lassen Sie sich Steueroptimierungen vorschlagen.',
    wealth: 'Verwalten Sie Ihr Vermögen und tracken Sie Ihre Investments.',
    documents: 'Alle Dokumente zentral verwalten mit KI-gestützter Kategorisierung.'
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <Card className="w-80 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Hilfe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-600">{helpTexts[context]}</p>
        </CardContent>
      </Card>
    </div>
  );
}