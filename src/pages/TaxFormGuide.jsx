import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileText, HelpCircle } from 'lucide-react';

export default function TaxFormGuide() {
  const [country, setCountry] = useState('DE');
  const [formType, setFormType] = useState('income_tax');
  const [guiding, setGuiding] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['taxFormGuide', country, formType],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateTaxFormGuidance', {
        country,
        form_type: formType
      });
      return response.data?.guidance || {};
    },
    enabled: guiding
  });

  const forms = [
    { value: 'income_tax', label: 'Einkommensteuer' },
    { value: 'capital_gains', label: 'Kapitalgewinne' },
    { value: 'self_employed', label: 'Selbstständige' },
    { value: 'rental_income', label: 'Mieteinnahmen' },
    { value: 'other_income', label: 'Sonstige Einkünfte' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📖 Steuererklär-Leitfaden</h1>
        <p className="text-slate-500 mt-1">Schritt-für-Schritt-Anleitung für Steuererklärungsformulare</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Land</label>
          <Select value={country} onValueChange={setCountry} disabled={guiding}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
              <SelectItem value="CH">🇨🇭 Schweiz</SelectItem>
              <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Formulartyp</label>
          <Select value={formType} onValueChange={setFormType} disabled={guiding}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {forms.map(f => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => setGuiding(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
          disabled={guiding}
        >
          {guiding ? '⏳...' : 'Leitfaden anzeigen'}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Wird geladen...</div>
      ) : guiding && result.content ? (
        <>
          {result.content?.overview && (
            <Card className="border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">📋 Überblick</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{result.content.overview}</p>
              </CardContent>
            </Card>
          )}

          {(result.content?.sections || []).length > 0 && (
            <div className="space-y-3">
              {result.content.sections.map((section, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="text-sm">{i + 1}. {section.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-slate-600">{section.description}</p>
                    {section.fields && (
                      <div className="text-xs bg-slate-50 p-2 rounded space-y-1">
                        <p className="font-medium">Zu beachtende Felder:</p>
                        {section.fields.map((field, j) => (
                          <p key={j}>• {field}</p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {(result.content?.tips || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  💡 Tipps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.tips.map((tip, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {tip}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {result.content?.required_documents && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📄 Erforderliche Dokumente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line">{result.content.required_documents}</p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">Wählen Sie einen Formulartyp und klicken Sie "Leitfaden anzeigen"</div>
      )}
    </div>
  );
}