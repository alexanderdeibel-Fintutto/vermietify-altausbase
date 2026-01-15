import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { Loader2, FileText, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export default function OperatingCostStatementBuilder({ buildingId, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [statement, setStatement] = useState(null);
  const [formData, setFormData] = useState({
    accountingYear: new Date().getFullYear() - 1,
    periodStart: `${new Date().getFullYear() - 1}-01-01`,
    periodEnd: `${new Date().getFullYear() - 1}-12-31`
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    if (!formData.periodStart || !formData.periodEnd) {
      toast.error('Bitte Zeitraum auswählen');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateOperatingCostStatement', {
        buildingId,
        accountingYear: formData.accountingYear,
        periodStart: formData.periodStart,
        periodEnd: formData.periodEnd
      });

      setStatement(response.data);
      toast.success('Betriebskostenabrechnung erstellt');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!statement && (
        <Card>
          <CardHeader>
            <CardTitle>Betriebskostenabrechnung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Abrechnungsjahr</label>
              <Input
                type="number"
                name="accountingYear"
                value={formData.accountingYear}
                onChange={handleChange}
                min="2020"
                max={new Date().getFullYear()}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Zeitraum Start</label>
                <Input
                  type="date"
                  name="periodStart"
                  value={formData.periodStart}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Zeitraum Ende</label>
                <Input
                  type="date"
                  name="periodEnd"
                  value={formData.periodEnd}
                  onChange={handleChange}
                />
              </div>
            </div>

            <Button onClick={handleGenerate} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <BarChart3 className="w-4 h-4 mr-2" />
              Abrechnung berechnen
            </Button>
          </CardContent>
        </Card>
      )}

      {statement && (
        <div className="space-y-3">
          <Card className="bg-blue-50">
            <CardHeader>
              <CardTitle>Abrechnungszusammenfassung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Gesamtkosten</p>
                  <p className="text-lg font-bold">€{statement.summary.totalCosts.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Vorauszahlungen</p>
                  <p className="text-lg font-bold">€{statement.summary.totalPaid.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded">
                  <p className="text-xs text-green-800 font-medium">Rückerstattungen</p>
                  <p className="text-lg font-bold text-green-900">€{statement.summary.totalRefunds.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-red-100 rounded">
                  <p className="text-xs text-red-800 font-medium">Nachzahlungen</p>
                  <p className="text-lg font-bold text-red-900">€{statement.summary.totalBalances.toFixed(2)}</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mt-4">
                Betroffen: <strong>{statement.summary.unitsCount} Einheiten</strong>
              </p>
            </CardContent>
          </Card>

          <Button className="w-full" variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Abrechnungsdokument herunterladen
          </Button>
        </div>
      )}
    </div>
  );
}