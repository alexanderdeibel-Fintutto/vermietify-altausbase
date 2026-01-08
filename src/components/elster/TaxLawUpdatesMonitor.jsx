import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, BookOpen, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxLawUpdatesMonitor() {
  const [updates] = useState([
    {
      id: '1',
      title: 'Erhöhung der AfA-Sätze für Wohngebäude',
      date: new Date(Date.now() - 172800000),
      category: 'AfA',
      impact: 'high',
      description: 'Neue degressive AfA-Regelung ab 2024',
      action_required: true,
      link: 'https://www.bundesfinanzministerium.de'
    },
    {
      id: '2',
      title: 'Änderung bei Erhaltungsaufwendungen',
      date: new Date(Date.now() - 604800000),
      category: 'Werbungskosten',
      impact: 'medium',
      description: 'Anpassung der 15%-Regel',
      action_required: false,
      link: 'https://www.bundesfinanzministerium.de'
    },
    {
      id: '3',
      title: 'Neue ELSTER-Schnittstelle verfügbar',
      date: new Date(Date.now() - 1209600000),
      category: 'Technisch',
      impact: 'low',
      description: 'ERiC-Version 42.0 verfügbar',
      action_required: false,
      link: 'https://www.elster.de'
    }
  ]);

  const impactConfig = {
    high: { color: 'bg-red-100 text-red-800', label: 'Hohe Auswirkung' },
    medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Mittlere Auswirkung' },
    low: { color: 'bg-blue-100 text-blue-800', label: 'Geringe Auswirkung' }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Steuerrechtliche Updates
          </CardTitle>
          <Button size="sm" variant="ghost">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {updates.map(update => (
            <div key={update.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-medium text-sm">{update.title}</div>
                    {update.action_required && (
                      <Badge className="bg-orange-100 text-orange-800">
                        Handlung erforderlich
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {update.category}
                    </Badge>
                    <Badge className={impactConfig[update.impact].color}>
                      {impactConfig[update.impact].label}
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-700 mb-2">
                    {update.description}
                  </div>
                  <div className="text-xs text-slate-500">
                    {update.date.toLocaleDateString('de-DE')}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(update.link, '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Mehr erfahren
              </Button>
            </div>
          ))}
        </div>

        <Button variant="outline" className="w-full">
          <Bell className="w-4 h-4 mr-2" />
          Updates abonnieren
        </Button>
      </CardContent>
    </Card>
  );
}