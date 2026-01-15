import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function DokumentZusammenfasser() {
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

  const zusammenfasse = async () => {
    if (!imageBase64) {
      toast.error('Bitte ein Dokument hochladen');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('zusammenfasseDokument', {
        imageBase64,
        imageMediaType: 'image/jpeg'
      });

      if (response.data) {
        setResult(response.data);
        toast.success('Dokument zusammengefasst!');
      }
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>📄 Dokument-Zusammenfasser</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full gap-2"
          >
            <Upload className="w-4 h-4" />
            Dokument hochladen
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => handleImageUpload(e.target.files?.[0])}
            className="hidden"
          />

          {image && (
            <div className="bg-gray-100 rounded-lg p-3">
              <img
                src={image}
                alt="Dokument-Vorschau"
                className="w-full max-h-48 object-contain"
              />
            </div>
          )}

          <Button
            onClick={zusammenfasse}
            disabled={loading || !imageBase64}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Wird zusammengefasst...
              </>
            ) : (
              '🔍 Zusammenfassen'
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>{result.titel}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-2">Dokumenttyp:</div>
              <div className="text-sm text-blue-800">{result.dokument_typ}</div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">📋 Zusammenfassung</h3>
              <div className="text-sm text-gray-700 mb-3 font-medium">{result.zusammenfassung?.kurz}</div>
              <div className="text-sm text-gray-600">{result.zusammenfassung?.ausfuehrlich}</div>
            </div>

            {result.kernpunkte?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">🎯 Kernpunkte</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  {result.kernpunkte.map((punkt, idx) => (
                    <li key={idx}>• {punkt}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.daten && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">📊 Wichtige Daten</h3>
                {result.daten.datum && (
                  <div className="text-sm text-gray-700 mb-2"><strong>Datum:</strong> {result.daten.datum}</div>
                )}
                {result.daten.beteiligte?.length > 0 && (
                  <div className="text-sm text-gray-700 mb-2">
                    <strong>Beteiligte:</strong> {result.daten.beteiligte.join(', ')}
                  </div>
                )}
                {result.daten.betraege?.length > 0 && (
                  <div className="text-sm text-gray-700">
                    <strong>Beträge:</strong>
                    <ul className="ml-4 mt-1">
                      {result.daten.betraege.map((b, idx) => (
                        <li key={idx}>{b.beschreibung}: {b.betrag}€</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {result.handlungsbedarf?.vorhanden && result.handlungsbedarf.aktionen?.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-2">⏰ Handlungsbedarf</h3>
                <div className="space-y-2">
                  {result.handlungsbedarf.aktionen.map((aktion, idx) => (
                    <div key={idx} className="text-sm text-yellow-800">
                      <div className="font-medium">{aktion.was}</div>
                      {aktion.bis_wann && <div className="text-xs text-yellow-700">Bis: {aktion.bis_wann}</div>}
                    </div>
                  ))}
                </div>
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