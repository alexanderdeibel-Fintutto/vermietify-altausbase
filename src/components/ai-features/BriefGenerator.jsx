import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Download, Copy } from 'lucide-react';
import { toast } from 'sonner';

const BRIEFTYPEN = [
  { value: 'mietkuendigung', label: '📋 Mietausfall-Kündigung' },
  { value: 'mietanpassung', label: '📈 Mieterhöhung (§558 BGB)' },
  { value: 'mahnung', label: '⏰ Zahlungsmahnung' },
  { value: 'nebenkostenwiderspruch', label: '❌ Widerspruch Nebenkosten' },
  { value: 'maengelanzeige', label: '🔧 Mängelanzeige' },
  { value: 'modernisierungsankuendigung', label: '🏗️ Modernisierungs-Ankündigung' },
];

export default function BriefGenerator() {
  const [brieftyp, setBrieftyp] = useState('mietkuendigung');
  const [formData, setFormData] = useState({
    vermieter_name: '',
    vermieter_adresse: '',
    mieter_name: '',
    mieter_adresse: '',
    objekt_adresse: '',
    zusatzinfo: '',
    betrag: '',
    frist: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generiere = async () => {
    if (!formData.vermieter_name || !formData.mieter_name || !formData.objekt_adresse) {
      toast.error('Bitte alle erforderlichen Felder ausfüllen');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('generiereBrief', {
        brieftyp,
        ...formData
      });

      if (response.data) {
        setResult(response.data);
        toast.success('Brief generiert!');
      }
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result.brief_vollstaendig);
    toast.success('In Zwischenablage kopiert!');
  };

  const downloadAsPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      
      const lines = doc.splitTextToSize(result.brief_vollstaendig, 190);
      doc.text(lines, 10, 10);
      
      doc.save(`Brief_${brieftyp}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF heruntergeladen!');
    } catch (error) {
      toast.error('PDF-Export fehlgeschlagen');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>✉️ Rechtssicherer Brief-Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium">Brieftyp</label>
            <select
              value={brieftyp}
              onChange={(e) => setBrieftyp(e.target.value)}
              className="w-full mt-2 px-3 py-2 border rounded-lg"
            >
              {BRIEFTYPEN.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Vermieter Name</label>
              <Input
                name="vermieter_name"
                value={formData.vermieter_name}
                onChange={handleChange}
                placeholder="Max Mustermann"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Vermieter Adresse</label>
              <Input
                name="vermieter_adresse"
                value={formData.vermieter_adresse}
                onChange={handleChange}
                placeholder="Musterstr. 123, 10115 Berlin"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Mieter Name</label>
              <Input
                name="mieter_name"
                value={formData.mieter_name}
                onChange={handleChange}
                placeholder="Erika Musterfrau"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Mieter Adresse</label>
              <Input
                name="mieter_adresse"
                value={formData.mieter_adresse}
                onChange={handleChange}
                placeholder="Musterstr. 123, Wohnung 42"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Mietobjekt Adresse</label>
            <Input
              name="objekt_adresse"
              value={formData.objekt_adresse}
              onChange={handleChange}
              placeholder="Musterstr. 123, 10115 Berlin"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {formData.betrag !== undefined && (
              <div>
                <label className="text-sm font-medium">Betrag (€)</label>
                <Input
                  name="betrag"
                  type="number"
                  step="0.01"
                  value={formData.betrag}
                  onChange={handleChange}
                  placeholder="1200.00"
                  className="mt-1"
                />
              </div>
            )}
            {formData.frist !== undefined && (
              <div>
                <label className="text-sm font-medium">Frist</label>
                <Input
                  name="frist"
                  value={formData.frist}
                  onChange={handleChange}
                  placeholder="14 Tage"
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Zusätzliche Informationen</label>
            <textarea
              name="zusatzinfo"
              value={formData.zusatzinfo}
              onChange={handleChange}
              placeholder="Weitere Infos für den Brief..."
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
              rows="3"
            />
          </div>

          <Button
            onClick={generiere}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Brief wird generiert...
              </>
            ) : (
              '📝 Brief generieren'
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Generierter Brief</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-2">Betreff:</div>
              <div className="text-sm text-blue-800">{result.betreff}</div>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-lg font-serif text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
              {result.brief_vollstaendig}
            </div>

            {result.fristen && result.fristen.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="font-semibold text-yellow-900 mb-2">⏰ Wichtige Fristen:</div>
                <div className="space-y-1">
                  {result.fristen.map((frist, idx) => (
                    <div key={idx} className="text-sm text-yellow-800">
                      <strong>{frist.was}:</strong> {frist.datum}
                      {frist.wichtig && ' ⚠️'}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.versandhinweise && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="font-semibold text-green-900 mb-2">📮 Versandempfehlung:</div>
                <div className="text-sm text-green-800">
                  <div><strong>{result.versandhinweise.empfohlen.toUpperCase()}</strong></div>
                  <div>{result.versandhinweise.begruendung}</div>
                </div>
              </div>
            )}

            {result.anlagen && result.anlagen.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-semibold text-gray-900 mb-2">📎 Anlagen:</div>
                <ul className="text-sm text-gray-700 space-y-1">
                  {result.anlagen.map((anlage, idx) => (
                    <li key={idx}>• {anlage}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={copyToClipboard} variant="outline" className="flex-1 gap-2">
                <Copy className="w-4 h-4" />
                Kopieren
              </Button>
              <Button onClick={downloadAsPDF} className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4" />
                Als PDF
              </Button>
            </div>

            {result._meta && (
              <div className="text-xs text-gray-500 pt-2 border-t">
                ℹ️ Kosten: {result._meta.costEur}€ | Model: {result._meta.model}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}