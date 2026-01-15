import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Loader2, GitCompare } from 'lucide-react';
import { toast } from 'sonner';

export default function PropertyComparisonTool() {
  const [buildings, setBuildings] = useState([]);
  const [selected1, setSelected1] = useState('');
  const [selected2, setSelected2] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchBuildings = async () => {
      const data = await base44.entities.Building.list();
      setBuildings(data);
    };
    fetchBuildings();
  }, []);

  const handleCompare = async () => {
    if (!selected1 || !selected2) {
      toast.error('Bitte beide Gebäude auswählen');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateComparisonReport', {
        buildingId1: selected1,
        buildingId2: selected2
      });

      setResult(response.data);
      toast.success('Vergleich erstellt');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!result ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-blue-600" />
              Gebäudevergleich
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Gebäude 1</label>
                <select
                  value={selected1}
                  onChange={(e) => setSelected1(e.target.value)}
                  className="w-full mt-2 border rounded px-3 py-2 text-sm"
                >
                  <option value="">Wählen...</option>
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Gebäude 2</label>
                <select
                  value={selected2}
                  onChange={(e) => setSelected2(e.target.value)}
                  className="w-full mt-2 border rounded px-3 py-2 text-sm"
                >
                  <option value="">Wählen...</option>
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              onClick={handleCompare}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Vergleiche...
                </>
              ) : (
                'Vergleich starten'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-center font-bold text-slate-900">
                {result.building_1} vs {result.building_2}
              </p>
            </CardContent>
          </Card>

          {/* Comparison Table */}
          {result.report.comparison && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Metriken</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.report.comparison.map((item, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-slate-50">
                      <p className="font-bold text-slate-900 mb-2">{item.metric}</p>
                      <div className="grid grid-cols-3 gap-3 mb-2">
                        <div>
                          <p className="text-xs text-slate-600">{result.building_1}</p>
                          <p className="font-bold text-slate-900">{item.building_1}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-green-600">{item.winner}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-600">{result.building_2}</p>
                          <p className="font-bold text-slate-900">{item.building_2}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 border-t pt-2">{item.analysis}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Insights */}
          {result.report.insights.length > 0 && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-lg">Schlüsselerkenntnisse</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.report.insights.map((insight, idx) => (
                    <li key={idx} className="flex gap-2 text-sm">
                      <span className="text-yellow-600">•</span>
                      <span className="text-slate-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={() => setResult(null)}
            variant="outline"
            className="w-full"
          >
            Neuer Vergleich
          </Button>
        </div>
      )}
    </div>
  );
}