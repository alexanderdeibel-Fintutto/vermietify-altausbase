import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AITemplateGenerator() {
  const [templateType, setTemplateType] = useState('payment_reminder');
  const [prompt, setPrompt] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async () => {
      setIsLoading(true);
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Erstelle eine professionelle und höfliche ${getTemplateTypeLabel(templateType)} für eine Immobilienverwaltung. 
        
Kontext: ${prompt || 'Standard-Kommunikation mit Mietern'}

Die Nachricht sollte:
- Formell aber freundlich sein
- Klar und verständlich sein
- Alle wichtigen Informationen enthalten
- Mit einem professionellen Gruß enden

Gib nur die Nachricht aus, ohne Erklärungen.`,
      });
      return response;
    },
    onSuccess: (data) => {
      setGeneratedText(data);
      toast.success('Vorlage generiert');
    },
    onError: () => {
      toast.error('Fehler bei der Generierung');
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const getTemplateTypeLabel = (type) => {
    const labels = {
      payment_reminder: 'Zahlungserinnerung',
      contract_renewal: 'Vertragsverlängerung',
      maintenance_notice: 'Wartungsmitteilung',
      announcement: 'Ankündigung',
      welcome: 'Willkommensnachricht',
      feedback_request: 'Feedback-Anfrage',
      complaint_response: 'Beschwerdeantwort',
      rule_violation: 'Regelverstoß-Benachrichtigung',
    };
    return labels[type] || type;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText);
    toast.success('In Zwischenablage kopiert');
  };

  const templateDescriptions = {
    payment_reminder: 'Erinnerung an ausstehende Mietzahlungen',
    contract_renewal: 'Ankündigung einer Vertragsverlängerung',
    maintenance_notice: 'Ankündigung von Wartungsarbeiten',
    announcement: 'Allgemeine Ankündigung für Mieter',
    welcome: 'Willkommensnachricht für neue Mieter',
    feedback_request: 'Anfrage nach Feedback oder Bewertung',
    complaint_response: 'Antwort auf eine Beschwerde',
    rule_violation: 'Benachrichtigung über Regelverstoß',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">KI-Vorlagen-Generator</h1>
        <p className="text-slate-600 font-light mt-2">Intelligente Textgenerierung für Kommunikationsvorlagen</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator Panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Vorlage generieren
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Vorlagentyp</label>
                <select
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {Object.entries(templateDescriptions).map(([key, desc]) => (
                    <option key={key} value={key}>
                      {getTemplateTypeLabel(key)} - {desc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Zusätzliche Details (optional)</label>
                <Textarea
                  placeholder="z.B. Spezifische Mieterdaten, Besonderheiten, Ton der Nachricht..."
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <Button
                onClick={() => generateMutation.mutate()}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generierung läuft...
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Vorlage generieren
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {generatedText && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle>Generierte Vorlage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-white border rounded-lg">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{generatedText}</p>
                </div>
                <Button onClick={copyToClipboard} className="w-full">
                  <Copy className="w-4 h-4 mr-2" />
                  In Zwischenablage kopieren
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Examples Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tipps & Beispiele</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-3">
              <div>
                <p className="font-semibold text-slate-900">Zahlungserinnerungen</p>
                <p>Beste Ergebnisse mit Mieterdaten wie Name, Betrag und Zahlungsfrist.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Wartungsmitteilungen</p>
                <p>Geben Sie Details zum Arbeitstyp und Datum an.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Beschwerdeantworten</p>
                <p>Beschreiben Sie das Problem für kontextuelle Antworten.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Willkommensnachrichten</p>
                <p>Personalisierung mit Gebäudename und -informationen möglich.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kürzliche Vorlagen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Keine gespeicherten Vorlagen vorhanden</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}