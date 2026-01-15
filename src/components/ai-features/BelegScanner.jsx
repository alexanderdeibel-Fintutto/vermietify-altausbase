import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function BelegScanner() {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [editedData, setEditedData] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleImageUpload = async (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1];
      setImageBase64(base64);
      setImage(e.target.result);
      
      // Auto-scan after upload
      await scanBeleg(base64);
    };
    reader.readAsDataURL(file);
  };

  const scanBeleg = async (base64String) => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('scanBeleg', {
        imageBase64: base64String,
        imageMediaType: 'image/jpeg'
      });

      if (response.data) {
        setResult(response.data);
        setEditedData(JSON.parse(JSON.stringify(response.data)));
        toast.success('Beleg erfolgreich gescannt!');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Fehler beim Scannen: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Create Invoice or Expense entity
      await base44.entities.Invoice.create({
        betrag: editedData.betraege.brutto,
        datum: editedData.datum,
        beschreibung: editedData.haendler?.name || 'Beleg',
        kategorie: editedData.kategorie_vorschlag,
        skr03_konto: editedData.skr03_konto,
        haendler: editedData.haendler?.name,
        mwst_satz: editedData.betraege.mwst_19 > 0 ? 19 : 7,
        netto: editedData.betraege.netto
      });
      toast.success('Beleg gespeichert!');
      // Reset form
      setImage(null);
      setResult(null);
      setEditedData(null);
    } catch (error) {
      toast.error('Fehler beim Speichern: ' + error.message);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📸 Beleg-Scanner
            <span className="text-sm font-normal text-gray-500">OCR mit Claude AI</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => cameraInputRef.current?.click()}
              className="gap-2"
            >
              <Camera className="w-4 h-4" />
              Foto aufnehmen
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Datei auswählen
            </Button>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleImageUpload(e.target.files?.[0])}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => handleImageUpload(e.target.files?.[0])}
            className="hidden"
          />

          {image && (
            <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={image}
                alt="Beleg-Vorschau"
                className="w-full max-h-96 object-contain"
              />
            </div>
          )}

          {image && !result && (
            <Button
              onClick={() => scanBeleg(imageBase64)}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Beleg analysiert...
                </>
              ) : (
                '🔍 Beleg analysieren'
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {result && editedData && (
        <Card>
          <CardHeader>
            <CardTitle>✅ Erkannte Daten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Typ</label>
                <select
                  value={editedData.typ || ''}
                  onChange={(e) =>
                    setEditedData({ ...editedData, typ: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                >
                  <option value="rechnung">Rechnung</option>
                  <option value="quittung">Quittung</option>
                  <option value="kassenbon">Kassenbon</option>
                  <option value="tankbeleg">Tankbeleg</option>
                  <option value="restaurantrechnung">Restaurantrechnung</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Händler</label>
                <input
                  type="text"
                  value={editedData.haendler?.name || ''}
                  onChange={(e) =>
                    setEditedData({
                      ...editedData,
                      haendler: { ...editedData.haendler, name: e.target.value }
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Datum</label>
                <input
                  type="date"
                  value={editedData.datum || ''}
                  onChange={(e) =>
                    setEditedData({ ...editedData, datum: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Brutto (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editedData.betraege?.brutto || 0}
                  onChange={(e) =>
                    setEditedData({
                      ...editedData,
                      betraege: {
                        ...editedData.betraege,
                        brutto: parseFloat(e.target.value)
                      }
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">MwSt 19% (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editedData.betraege?.mwst_19 || 0}
                  onChange={(e) =>
                    setEditedData({
                      ...editedData,
                      betraege: {
                        ...editedData.betraege,
                        mwst_19: parseFloat(e.target.value)
                      }
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Kategorie</label>
                <select
                  value={editedData.kategorie_vorschlag || ''}
                  onChange={(e) =>
                    setEditedData({
                      ...editedData,
                      kategorie_vorschlag: e.target.value
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                >
                  <option value="bürobedarf">Bürobedarf</option>
                  <option value="fahrtkosten">Fahrtkosten</option>
                  <option value="versicherung">Versicherung</option>
                  <option value="reparatur">Reparatur</option>
                  <option value="sonstiges">Sonstiges</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">SKR03-Konto</label>
                <input
                  type="text"
                  value={editedData.skr03_konto || ''}
                  onChange={(e) =>
                    setEditedData({
                      ...editedData,
                      skr03_konto: e.target.value
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    checked={editedData.steuerlich_absetzbar || false}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        steuerlich_absetzbar: e.target.checked
                      })
                    }
                  />
                  <span className="text-sm">Steuerlich absetzbar</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Notizen</label>
              <textarea
                value={editedData.notizen || ''}
                onChange={(e) =>
                  setEditedData({ ...editedData, notizen: e.target.value })
                }
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                rows="3"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700">
                💾 Beleg speichern
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setEditedData(null);
                }}
                className="flex-1"
              >
                Neue Aufnahme
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