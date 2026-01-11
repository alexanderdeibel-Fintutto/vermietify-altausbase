import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Copy, Save } from 'lucide-react';

export default function AITemplateGenerator() {
  const [templateType, setTemplateType] = useState('payment_reminder');
  const [generatedText, setGeneratedText] = useState('');
  const [loading, setLoading] = useState(false);

  const templateTypes = [
    { id: 'payment_reminder', label: 'Zahlungserinnerung' },
    { id: 'maintenance', label: 'Wartungsankündigung' },
    { id: 'welcome', label: 'Willkommensnachricht' },
    { id: 'renewal', label: 'Vertragsverlängerung' },
    { id: 'feedback', label: 'Feedback-Anfrage' },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    // Simulate AI generation
    setTimeout(() => {
      setGeneratedText(`Liebe/r Mieter/in,

hier ist eine KI-generierte Vorlage für ${templateTypes.find(t => t.id === templateType)?.label}.

Dies ist ein Beispieltext, der von der KI generiert wurde. Der Text ist professionell, freundlich und enthält alle wichtigen Informationen.

Mit freundlichen Grüßen,
Ihre Hausverwaltung`);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">KI-Vorlagen-Generator</h1>
        <p className="text-slate-600 font-light mt-2">Generieren Sie intelligente Nachrichtenvorlagen mit KI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Konfiguration */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vorlagentyp</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {templateTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setTemplateType(type.id)}
                    className={`p-3 rounded-lg border-2 transition-all text-sm ${
                      templateType === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Generierter Text
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={generatedText}
                onChange={(e) => setGeneratedText(e.target.value)}
                placeholder="Der generierte Text wird hier angezeigt..."
                className="min-h-48 font-light"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {loading ? 'Wird generiert...' : 'Neu generieren'}
                </Button>
                <Button variant="outline" className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  Kopieren
                </Button>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            Als Vorlage speichern
          </Button>
        </div>

        {/* Optionen */}
        <Card>
          <CardHeader>
            <CardTitle>Optionen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ton</label>
              <select className="w-full px-3 py-2 border rounded-lg">
                <option>Professionell</option>
                <option>Freundlich</option>
                <option>Formal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Länge</label>
              <select className="w-full px-3 py-2 border rounded-lg">
                <option>Kurz</option>
                <option>Mittel</option>
                <option>Ausführlich</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Sprache</label>
              <select className="w-full px-3 py-2 border rounded-lg">
                <option>Deutsch</option>
                <option>Englisch</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}