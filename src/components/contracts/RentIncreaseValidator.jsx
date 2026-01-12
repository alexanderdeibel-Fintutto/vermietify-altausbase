import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function RentIncreaseValidator({ contractId, currentRent, onValidationComplete }) {
  const [newRent, setNewRent] = useState('');
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState(null);

  const handleValidate = async () => {
    if (!newRent || newRent <= currentRent) {
      alert('Bitte geben Sie eine höhere Miete ein');
      return;
    }

    setValidating(true);
    try {
      const response = await base44.functions.invoke('validateRentIncrease', {
        contractId,
        newRent: parseFloat(newRent),
        increaseDate: new Date().toISOString().split('T')[0]
      });

      setResult(response.data);
      if (onValidationComplete) {
        onValidationComplete(response.data);
      }
    } catch (error) {
      alert('Fehler bei Validierung: ' + error.message);
    } finally {
      setValidating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mieterhöhung prüfen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Aktuelle Miete: {currentRent}€</label>
          <Input
            type="number"
            placeholder="Neue Miete eingeben..."
            value={newRent}
            onChange={(e) => setNewRent(e.target.value)}
            min={currentRent}
            step="0.01"
          />
        </div>

        <Button
          onClick={handleValidate}
          disabled={validating}
          className="w-full"
        >
          {validating ? 'Prüfe...' : 'Validieren'}
        </Button>

        {result && (
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Erhöhung:</strong> {result.increasePercent.toFixed(1)}%
              </p>
              <p className="text-sm">
                <strong>3-Jahres-Erhöhung:</strong> {result.totalIncreaseInLast3Years.toFixed(1)}%
              </p>
              {result.marketRent && (
                <p className="text-sm">
                  <strong>Marktmiete:</strong> {result.marketRent}€
                </p>
              )}
            </div>

            {result.recommendation === 'ERLAUBT' ? (
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ✅ Mieterhöhung ist zulässig
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-500 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  ❌ {result.errors[0]}
                </AlertDescription>
              </Alert>
            )}

            {result.warnings?.map((warning, idx) => (
              <Alert key={idx} className="border-yellow-500 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  ⚠️ {warning}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}