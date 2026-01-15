import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function NebenkostenPruefer() {
  const [mode, setMode] = useState('image');
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [abrechnungstext, setAbrechnungstext] = useState('');
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

  const pruefe = async () => {
    setLoading(true);
    try {
      const payload = mode === 'image'
        ? { imageBase64, imageMediaType: 'image/jpeg' }
        : { abrechnungstext };

      const response = await base44.functions.invoke('pruefeNebenkostenabrechnung', payload);

      if (response.data) {
        setResult(response.data);
        toast.success('Abrechnung geprüft!');
      }
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ok': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'auffaellig': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'fehlerhaft': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return null;
    }
  };

  const getRecommendationColor = (status) => {
    switch (status) {
      case 'akzeptieren': return 'bg-green-50 border-green-200';
      case 'pruefen_lassen': return 'bg-yellow-50 border-yellow-200';
      case 'widerspruch': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🏠 Nebenkostenabrechnung-Prüfer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={mode === 'image' ? 'default' : 'outline'}
              onClick={() => setMode('image')}
              className="flex-1"
            >
              PDF/Bild hochladen
            </Button>
            <Button
              variant={mode === 'text' ? 'default' : 'outline'}
              onClick={() => setMode('text')}
              className="flex-1"
            >
              Text eingeben
            </Button>
          </div>

          {mode === 'image' && (
            <div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full gap-2"
              >
                <Upload className="w-4 h-4" />
                Abrechnung hochladen
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
                    alt="Abrechnung-Vorschau"
                    className="w-full max-h-48 object-contain"
                  />
                </div>
              )}
            </div>
          )}

          {mode === 'text' && (
            <div>
              <textarea
                value={abrechnungstext}
                onChange={(e) => setAbrechnungstext(e.target.value)}
                placeholder="Abrechnung eingeben oder kopieren..."
                className="w-full p-3 border rounded-lg text-sm font-mono"
                rows="6"
              />
            </div>
          )}

          <Button
            onClick={pruefe}
            disabled={loading || (mode === 'image' && !imageBase64) || (mode === 'text' && !abrechnungstext)}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Prüfe...
              </>
            ) : (
              '🔍 Abrechnung prüfen'
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Prüfergebnis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {result.grunddaten && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3">Grunddaten</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Zeitraum:</span>
                    <div className="font-medium">{result.grunddaten.abrechnungszeitraum_von} bis {result.grunddaten.abrechnungszeitraum_bis}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Wohnung:</span>
                    <div className="font-medium">{result.grunddaten.wohnungsflaeche_qm}m²</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Vorauszahlungen:</span>
                    <div className="font-medium">{result.grunddaten.vorauszahlungen_gesamt.toFixed(2)}€</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Ergebnis:</span>
                    <div className={`font-medium ${result.grunddaten.ist_nachzahlung ? 'text-red-600' : 'text-green-600'}`}>
                      {result.grunddaten.ist_nachzahlung ? 'Nachzahlung' : 'Erstattung'}: {Math.abs(result.grunddaten.abrechnungsergebnis).toFixed(2)}€
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result.formelle_pruefung && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Formelle Prüfung</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Abrechnungsfrist eingehalten:</span>
                    {result.formelle_pruefung.abrechnungsfrist_eingehalten ? 
                      <CheckCircle className="w-5 h-5 text-green-600" /> : 
                      <AlertCircle className="w-5 h-5 text-red-600" />}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Umlageschlüssel angegeben:</span>
                    {result.formelle_pruefung.umlageschluessel_angegeben ? 
                      <CheckCircle className="w-5 h-5 text-green-600" /> : 
                      <AlertCircle className="w-5 h-5 text-red-600" />}
                  </div>
                  {result.formelle_pruefung.fehler && result.formelle_pruefung.fehler.length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                      <div className="text-sm font-semibold text-red-900 mb-2">Fehler gefunden:</div>
                      <ul className="text-sm text-red-800 space-y-1">
                        {result.formelle_pruefung.fehler.map((fehler, idx) => (
                          <li key={idx}>• {fehler}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {result.positionen && result.positionen.length > 0 && (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Kostenpositionen</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {result.positionen.map((pos, idx) => (
                    <div key={idx} className="flex items-start justify-between p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{pos.bezeichnung}</div>
                        <div className="text-xs text-gray-600">Schlüssel: {pos.umlageschluessel}</div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-medium text-gray-900">{pos.anteil_mieter?.toFixed(2)}€</div>
                        <div className="flex items-center justify-end gap-1">
                          {getStatusIcon(pos.pruefung)}
                          <span className="text-xs text-gray-600">{pos.pruefung}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.nicht_umlagefaehige_kosten && result.nicht_umlagefaehige_kosten.length > 0 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <h3 className="font-semibold text-red-900 mb-3">⚠️ Nicht umlagefähige Kosten</h3>
                <div className="space-y-2">
                  {result.nicht_umlagefaehige_kosten.map((kosten, idx) => (
                    <div key={idx} className="text-sm text-red-800">
                      <strong>{kosten.bezeichnung}:</strong> {kosten.betrag.toFixed(2)}€
                      <div className="text-xs text-red-700 mt-1">{kosten.grund}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.empfehlung && (
              <div className={`border rounded-lg p-4 ${getRecommendationColor(result.empfehlung.status)}`}>
                <h3 className="font-semibold mb-2">
                  {result.empfehlung.status === 'akzeptieren' && '✅ Empfehlung: AKZEPTIEREN'}
                  {result.empfehlung.status === 'pruefen_lassen' && '🔍 Empfehlung: PRÜFEN LASSEN'}
                  {result.empfehlung.status === 'widerspruch' && '⚖️ Empfehlung: WIDERSPRUCH'}
                </h3>
                <p className="text-sm mb-2">{result.empfehlung.begruendung}</p>
                {result.empfehlung.ersparnis > 0 && (
                  <div className="text-sm font-semibold text-green-700">
                    💰 Mögliche Ersparnis: {result.empfehlung.ersparnis.toFixed(2)}€
                  </div>
                )}
                {result.empfehlung.widerspruchsfrist && (
                  <div className="text-xs text-gray-700 mt-2">
                    ⏰ Widerspruchsfrist bis: {result.empfehlung.widerspruchsfrist}
                  </div>
                )}
              </div>
            )}

            {result._meta && (
              <div className="text-xs text-gray-500 pt-2 border-t">
                ℹ️ Kosten: {result._meta.costEur}€
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}