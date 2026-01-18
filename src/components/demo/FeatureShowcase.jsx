import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function FeatureShowcase({ features = [] }) {
  const defaultFeatures = [
    { icon: '🏢', title: 'Objekt-Verwaltung', description: 'Alle Immobilien an einem Ort' },
    { icon: '👥', title: 'Mieter-Management', description: 'Verwalten Sie Ihre Mieter effizient' },
    { icon: '📊', title: 'Berichte', description: 'Umfassende Finanzberichte' }
  ];

  const displayFeatures = features.length > 0 ? features : defaultFeatures;

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {displayFeatures.map((feature, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-3">{feature.icon}</div>
            <h3 className="font-semibold mb-2">{feature.title}</h3>
            <p className="text-sm text-[var(--theme-text-secondary)]">{feature.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}