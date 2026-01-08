import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Lightbulb, Calculator, BookOpen } from 'lucide-react';

const FIELD_HELP = {
  income_rent: {
    title: 'Mieteinnahmen',
    description: 'Alle erhaltenen Mietzahlungen des Jahres',
    tips: [
      'Kaltmiete + Nebenkosten-Vorauszahlungen',
      'Auch Nachzahlungen aus Vorjahren',
      'Kaution zählt NICHT als Einnahme'
    ],
    calculation: 'Monatliche Miete × 12 Monate',
    legal: '§ 21 EStG - Einkünfte aus Vermietung und Verpachtung'
  },
  expense_maintenance: {
    title: 'Instandhaltungskosten',
    description: 'Reparaturen und Erhaltungsaufwendungen',
    tips: [
      'Nur laufende Reparaturen',
      'Modernisierung = AfA (nicht hier)',
      'Mit Rechnung nachweisbar'
    ],
    examples: ['Heizungsreparatur', 'Dachreparatur', 'Malerarbeiten'],
    legal: '§ 9 Abs. 1 EStG - Werbungskosten'
  },
  expense_management: {
    title: 'Verwaltungskosten',
    description: 'Kosten für Hausverwaltung und Verwaltung',
    tips: [
      'Hausverwaltungsgebühren',
      'Kontoführungsgebühren',
      'Porto, Telefon für Vermietung'
    ],
    legal: '§ 9 Abs. 1 EStG - Werbungskosten'
  },
  afa_amount: {
    title: 'Absetzung für Abnutzung (AfA)',
    description: 'Jährliche Gebäudeabschreibung',
    tips: [
      'Gebäude vor 1925: 2,5% p.a.',
      'Gebäude nach 1925: 2% p.a.',
      'Nur auf Gebäude, nicht Grundstück'
    ],
    calculation: 'Gebäudewert × AfA-Satz',
    legal: '§ 7 Abs. 4 EStG - AfA bei Gebäuden'
  }
};

export default function SmartFieldHelper({ fieldName, children }) {
  const help = FIELD_HELP[fieldName];

  if (!help) return children;

  return (
    <div className="flex items-center gap-2">
      {children}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <HelpCircle className="h-4 w-4 text-slate-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-1">{help.title}</h4>
              <p className="text-xs text-slate-600">{help.description}</p>
            </div>

            {help.tips && (
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <Lightbulb className="w-3 h-3 text-yellow-600" />
                  <span className="text-xs font-medium">Wichtig:</span>
                </div>
                <ul className="space-y-1">
                  {help.tips.map((tip, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start gap-1">
                      <span className="text-slate-400">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {help.examples && (
              <div>
                <div className="text-xs font-medium mb-1">Beispiele:</div>
                <div className="flex flex-wrap gap-1">
                  {help.examples.map((ex, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {ex}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {help.calculation && (
              <div className="p-2 bg-blue-50 rounded border border-blue-200">
                <div className="flex items-center gap-1 mb-1">
                  <Calculator className="w-3 h-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-900">Berechnung:</span>
                </div>
                <p className="text-xs text-blue-800">{help.calculation}</p>
              </div>
            )}

            {help.legal && (
              <div className="p-2 bg-slate-50 rounded border text-xs">
                <div className="flex items-center gap-1 mb-1">
                  <BookOpen className="w-3 h-3 text-slate-600" />
                  <span className="font-medium">Rechtsgrundlage:</span>
                </div>
                <p className="text-slate-600">{help.legal}</p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}