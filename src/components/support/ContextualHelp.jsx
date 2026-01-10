import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, ExternalLink } from 'lucide-react';

export default function ContextualHelp({ page }) {
  const helpContent = {
    Buildings: {
      title: 'Hilfe: Gebäude verwalten',
      tips: [
        'Klicken Sie auf "+" um ein neues Gebäude anzulegen',
        'Nutzen Sie die Filter-Funktion für schnelle Suche',
        'Gebäude können mit Einheiten und Mietern verknüpft werden'
      ],
      videoUrl: 'https://help.example.com/buildings'
    }
  };

  const content = helpContent[page] || helpContent.Buildings;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <HelpCircle className="w-4 h-4" />
          {content.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <ul className="text-xs space-y-1">
          {content.tips.map((tip, idx) => (
            <li key={idx}>• {tip}</li>
          ))}
        </ul>
        <Button size="sm" variant="outline" className="w-full text-xs">
          <ExternalLink className="w-3 h-3 mr-1" />
          Mehr erfahren
        </Button>
      </CardContent>
    </Card>
  );
}