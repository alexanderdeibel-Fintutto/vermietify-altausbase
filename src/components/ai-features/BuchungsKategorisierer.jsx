import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function BuchungsKategorisierer() {
  const [mode, setMode] = useState('text'); // 'text' oder 'image'
  const [buchungenText, setBuchungenText] = useState('');
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1];
      setImageBase64(base64);
      setImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const kategorisiere = async () => {
    setLoading(true);
    try {
      const payload = mode === 'text'
        ? { buchungen_text: buchungenText }
        : { imageBase64, imageMediaType: 'image/jpeg' };

      const response = await base44.functions.invoke('kategorisiereBuchungen', payload);

      if (response.data) {
        setResult(response.data);
        toast.success('Buchungen kategorisiert!');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const importIntoApp = async () => {
    try {
      for (const buchung of result.buchungen) {
        await base44.entities.Invoice.create({
          datum: buchung.datum,
          beschreibung: buchung.beschreibung,
          betrag: buchung.betrag,
          typ: buchung.typ,
          skr03_konto: buchung.skr03_konto,
          mwst_satz: buchung.mwst_satz,
          netto_betrag: buchung.netto_betrag
        });
      }
      toast.success(`${result.buchungen.length} Buchungen importiert!`);
      setResult(null);
      setBuchungenText('');
    } catch (error) {
      toast.error('Import-Fehler: ' + error.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>📊 Buchungs-Kategorisierer (SKR03)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={mode === 'text' ? 'default' : 'outline'}
              onClick={() => setMode('text')}
              className="flex-1"
            >
              Text eingeben
            </Button>
            <Button
              variant={mode === 'image' ? 'default' : 'outline'}
              onClick={() => setMode('image')}
              className="flex-1"
            >
              Bild hochladen
            </Button>
          </div>

          {mode === 'text' && (
            <div>
              <label className="text-sm font-medium">Buchungen (eine pro Zeile)</label>
              <textarea
                value={buchungenText}
                onChange={(e) => setBuchungenText(e.target.value)}
                placeholder="z.B.&#10;2026-01-15 REWE Lebensmittel 45,67&#10;2026-01-14 Autowerkstatt Reparatur 234,50&#10;2026-01-13 Deutsche Telekom Telefon 79,99"
                className="w-full mt-2 p-3 border rounded-md text-sm font-mono"
                rows="6"
              />
            </div>
          )}

          {mode === 'image' && (
            <div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full gap-2"
              >
                <Upload className="w-4 h-4" />
                Kontoauszug hochladen
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleImageUpload(e.target.files?.[0])}
                className="hidden"
              />

              {image && (
                <div className="mt-3 bg-gray-100 rounded-lg p-3">
                  <img
                    src={image}
                    alt="Vorschau"
                    className="w-full max-h-48 object-contain"
                  />
                </div>
              )}
            </div>
          )}

          <Button
            onClick={kategorisiere}
            disabled={loading || (mode === 'text' && !buchungenText) || (mode === 'image' && !imageBase64)}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Kategorisiere...
              </>
            ) : (
              '🔍 Kategorisieren'
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Kategorisierungsergebnis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <div className="text-2xl font-bold">{result.zusammenfassung.anzahl_buchungen}</div>
                <div className="text-xs text-gray-600">Buchungen</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{result.zusammenfassung.summe_einnahmen.toFixed(2)}</div>
                <div className="text-xs text-gray-600">Einnahmen €</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{result.zusammenfassung.summe_ausgaben.toFixed(2)}</div>
                <div className="text-xs text-gray-600">Ausgaben €</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{result.zusammenfassung.summe_mwst_vorsteuer.toFixed(2)}</div>
                <div className="text-xs text-gray-600">MwSt Vorsteuer €</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Konten-Übersicht</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {result.konten_uebersicht?.map((konto) => (
                  <div key={konto.konto} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-mono text-sm font-bold">{konto.konto}</div>
                      <div className="text-xs text-gray-600">{konto.bezeichnung}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{konto.summe.toFixed(2)} €</div>
                      <div className="text-xs text-gray-600">{konto.anzahl} Buchungen</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              <h3 className="font-semibold mb-3">Buchungen</h3>
              <div className="space-y-2 text-sm">
                {result.buchungen?.slice(0, 20).map((b, idx) => (
                  <div key={idx} className="p-2 bg-gray-50 rounded">
                    <div className="flex justify-between">
                      <span className="font-mono">{b.datum}</span>
                      <span className={b.betrag > 0 ? 'text-green-600' : 'text-red-600'}>
                        {b.betrag > 0 ? '+' : ''}{b.betrag.toFixed(2)} €
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">{b.beschreibung}</div>
                    <div className="flex gap-2 mt-1">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                        {b.skr03_konto}
                      </span>
                      <span className="text-xs text-gray-500">{b.konto_bezeichnung}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={importIntoApp} className="w-full bg-green-600 hover:bg-green-700">
              ✓ In App importieren
            </Button>

            {result._meta && (
              <div className="text-xs text-gray-500 pt-2 border-t">
                ℹ️ Kosten: {result._meta.costEur}€ | Tokens: {result._meta.tokens}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}