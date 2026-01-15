import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function MietvertragPruefer() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (files) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result.split(',')[1];
        setImages(prev => [...prev, { base64, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const pruefe = async () => {
    if (images.length === 0) {
      toast.error('Bitte mindestens eine Seite hochladen');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('pruefeMietvertrag', {
        imagesBase64: images.map(img => img.base64),
        imagesMediaTypes: images.map(() => 'image/jpeg')
      });

      if (response.data) {
        setResult(response.data);
        toast.success('Mietvertrag geprüft!');
      }
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getKlauselIcon = (bewertung) => {
    switch (bewertung) {
      case 'ok': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'achtung': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'unwirksam': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>📋 Mietvertrag-Prüfer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full gap-2"
          >
            <Upload className="w-4 h-4" />
            Vertragsseiten hochladen (mehrere möglich)
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={(e) => handleImageUpload(e.target.files)}
            className="hidden"
          />

          {images.length > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-blue-900">
                ✓ {images.length} Seite{images.length !== 1 ? 'n' : ''} hochgeladen
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {images.map((img, idx) => (
                  <div key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {img.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={pruefe}
            disabled={loading || images.length === 0}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Vertrag wird geprüft...
              </>
            ) : (
              '🔍 Vertrag prüfen'
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
            {result.zusammenfassung && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3">Grunddaten</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Objekt:</span>
                    <div className="font-medium">{result.zusammenfassung.mietobjekt}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Vermieter:</span>
                    <div className="font-medium">{result.zusammenfassung.vermieter}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Miete:</span>
                    <div className="font-medium">{result.zusammenfassung.kaltmiete}€ + {result.zusammenfassung.nebenkosten}€</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Kaution:</span>
                    <div className="font-medium">{result.zusammenfassung.kaution}€</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Beginn:</span>
                    <div className="font-medium">{result.zusammenfassung.mietbeginn}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Befristung:</span>
                    <div className="font-medium">{result.zusammenfassung.befristung}</div>
                  </div>
                </div>
              </div>
            )}

            {result.bewertung && (
              <div className={`p-4 rounded-lg ${
                result.bewertung.gesamtnote === 'gut' ? 'bg-green-50 border border-green-200' :
                result.bewertung.gesamtnote === 'mittel' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-red-50 border border-red-200'
              }`}>
                <h3 className="font-semibold mb-2">
                  {result.bewertung.gesamtnote === 'gut' && '✅'}
                  {result.bewertung.gesamtnote === 'mittel' && '⚠️'}
                  {result.bewertung.gesamtnote === 'kritisch' && '❌'}
                  {' '}Gesamtbewertung: {result.bewertung.gesamtnote.toUpperCase()}
                </h3>
                <p className="text-sm">{result.bewertung.kurzfassung}</p>
              </div>
            )}

            {result.klauseln && result.klauseln.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">📜 Klauseln im Detail</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {result.klauseln.map((klausel, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-gray-900">{klausel.thema}</div>
                        {getKlauselIcon(klausel.bewertung)}
                      </div>
                      <div className="text-xs text-gray-600 bg-white p-2 rounded mb-2 italic">
                        "{klausel.originaltext}"
                      </div>
                      <div className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">Bedeutung:</span> {klausel.erklaerung}
                      </div>
                      {klausel.handlungsempfehlung && (
                        <div className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                          <span className="font-medium">💡 Empfehlung:</span> {klausel.handlungsempfehlung}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.tipps && result.tipps.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">💡 Tipps für dich</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  {result.tipps.map((tipp, idx) => (
                    <li key={idx}>• {tipp}</li>
                  ))}
                </ul>
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