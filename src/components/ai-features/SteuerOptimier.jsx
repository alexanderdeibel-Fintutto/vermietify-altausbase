import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SteuerOptimier() {
  const [infoText, setInfoText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const optimiere = async () => {
    if (!infoText.trim()) {
      toast.error('Bitte Immobilien-Infos eingeben');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('optimiereSteuern', {
        immobilien_info: infoText
      });

      if (response.data) {
        setResult(response.data);
        toast.success('Steuertipps generiert!');
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
          <CardTitle>💰 Steuer-Optimierer für Vermieter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={infoText}
            onChange={(e) => setInfoText(e.target.value)}
            placeholder="Beschreibe deine Vermietungssituation:&#10;- Anzahl Objekte&#10;- Kaltmiete&#10;- Finanzierungskosten&#10;- Reparaturen&#10;- Abschreibungen&#10;etc."
            className="w-full p-3 border rounded-lg text-sm"
            rows="6"
          />
          <Button
            onClick={optimiere}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Analysiert...
              </>
            ) : (
              '🔍 Steuertipps finden'
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Deine Steuerspar-Tipps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {result.situation && (
              <div className="bg-gray-50 p-4 rounded-lg text-sm">
                <div className="font-medium text-gray-900 mb-2">📊 Deine Situation</div>
                <div className="text-gray-700">
                  {result.situation.immobilien_anzahl} Immobilie(n) - {result.situation.vermietungsart}
                </div>
              </div>
            )}

            {result.optimierungspotenzial?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">💡 Optimierungspotenzial</h3>
                <div className="space-y-3">
                  {result.optimierungspotenzial.map((opt, idx) => (
                    <div key={idx} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-gray-900">{opt.bereich}</span>
                        <span className="text-green-700 font-bold text-sm">{opt.ersparnis_geschaetzt}</span>
                      </div>
                      <div className="text-sm text-gray-700 mb-2">{opt.beschreibung}</div>
                      <div className="text-sm text-gray-600 mb-2">💡 {opt.tipp}</div>
                      <div className="text-xs text-gray-500">Aufwand: {opt.aufwand}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.checkliste_jahresende?.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-3">✅ Jahresende-Checkliste</h3>
                <ul className="space-y-2">
                  {result.checkliste_jahresende.map((item, idx) => (
                    <li key={idx} className="text-sm text-yellow-800">
                      <span className="font-medium">• {item.aktion}</span>
                      <span className="text-yellow-700"> (Frist: {item.frist})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.disclaimer && (
              <div className="bg-gray-100 p-3 rounded text-xs text-gray-700 italic">
                ⚠️ {result.disclaimer}
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