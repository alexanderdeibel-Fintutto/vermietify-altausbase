import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Sparkles } from 'lucide-react';

export default function CrossSellBanner({ 
  title = 'Mehr Funktionen mit FinTuttO',
  description = 'Erweitern Sie Ihre Immobilienverwaltung mit der Hauptapplikation',
  ctaText = 'Mehr erfahren',
  ctaUrl = 'https://vermietify.app'
}) {
  return (
    <Card className="bg-gradient-to-r from-blue-900 to-orange-600 text-white border-0">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{title}</h3>
            <p className="text-sm opacity-90">{description}</p>
          </div>
          <a href={ctaUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" className="bg-white text-blue-900 hover:bg-gray-100">
              {ctaText}
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </a>
        </div>
      </div>
    </Card>
  );
}