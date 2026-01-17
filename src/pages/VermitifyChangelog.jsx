import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles, Bug, Zap, FileText } from 'lucide-react';

export default function VermitifyChangelog() {
  const updates = [
    {
      version: 'v2.0.0',
      date: '17. Januar 2026',
      type: 'major',
      items: [
        { type: 'feature', text: 'Komplett neues Design System "Vermitify"' },
        { type: 'feature', text: '9 kostenlose Tools für Vermieter' },
        { type: 'feature', text: 'Lead Capture & Marketing-Funktionen' },
        { type: 'feature', text: '5 verschiedene Themes (Vermieter, Mieter, B2B, Komfort, Invest)' },
        { type: 'improvement', text: 'Komplett responsive Design' },
        { type: 'improvement', text: 'Performance-Optimierung (50% schneller)' }
      ]
    },
    {
      version: 'v1.8.2',
      date: '10. Dezember 2025',
      type: 'minor',
      items: [
        { type: 'feature', text: 'LetterXpress Integration für Briefversand' },
        { type: 'feature', text: 'VPI-Index automatisches Update' },
        { type: 'bug', text: 'BK-Abrechnung Rundungsfehler behoben' },
        { type: 'improvement', text: 'ELSTER-Export verbessert' }
      ]
    },
    {
      version: 'v1.8.0',
      date: '1. November 2025',
      type: 'minor',
      items: [
        { type: 'feature', text: 'Anlage V Generator mit KI-Unterstützung' },
        { type: 'feature', text: 'Automatische Kategorisierung von Belegen' },
        { type: 'bug', text: 'Mieterportal Login-Problem behoben' }
      ]
    }
  ];

  const typeIcons = {
    feature: { icon: Sparkles, color: 'text-[var(--vf-success-500)]', label: 'Neu' },
    improvement: { icon: Zap, color: 'text-[var(--vf-info-500)]', label: 'Verbessert' },
    bug: { icon: Bug, color: 'text-[var(--vf-error-500)]', label: 'Fix' },
    docs: { icon: FileText, color: 'text-[var(--vf-neutral-500)]', label: 'Doku' }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Changelog</h1>
        <p className="text-[var(--theme-text-secondary)]">
          Alle Updates und Verbesserungen
        </p>
      </div>

      <div className="space-y-8">
        {updates.map((update, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span>{update.version}</span>
                <span className={cn(
                  "vf-badge",
                  update.type === 'major' ? "vf-badge-gradient" : "vf-badge-default"
                )}>
                  {update.type === 'major' ? 'Major Release' : 'Update'}
                </span>
                <span className="text-sm font-normal text-[var(--theme-text-muted)] ml-auto">
                  {update.date}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {update.items.map((item, itemIndex) => {
                  const iconData = typeIcons[item.type];
                  const ItemIcon = iconData.icon;
                  
                  return (
                    <li key={itemIndex} className="flex items-start gap-3">
                      <div className={cn("mt-0.5", iconData.color)}>
                        <ItemIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <span className={cn("vf-badge vf-badge-sm mr-2", iconData.color)}>
                          {iconData.label}
                        </span>
                        {item.text}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}