import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxRuleEvaluator() {
  const [category, setCategory] = useState('ANLAGE_V');
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const [contextJson, setContextJson] = useState('{\n  "baujahr": 1995,\n  "gebaeudewert": 250000\n}');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEvaluate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const context = JSON.parse(contextJson);
      
      const response = await base44.functions.invoke('evaluateTaxRule', {
        category_code: category,
        tax_year: parseInt(taxYear),
        context
      });
      
      setResults(response.data);
    } catch (err) {
      setError(err.message);
      toast.error('Fehler bei der Regelauswertung');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('In Zwischenablage kopiert');
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Eingaben</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Kategorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ANLAGE_V">Anlage V - Vermietung</SelectItem>
                <SelectItem value="ANLAGE_KAP">Anlage KAP - Kapitalerträge</SelectItem>
                <SelectItem value="EST_ALLGEMEIN">Einkommensteuer</SelectItem>
                <SelectItem value="UST">Umsatzsteuer</SelectItem>
                <SelectItem value="GEWST">Gewerbesteuer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Steuerjahr</Label>
            <Input 
              type="number" 
              value={taxYear} 
              onChange={(e) => setTaxYear(e.target.value)}
              min="2000"
              max={new Date().getFullYear() + 1}
            />
          </div>

          <div>
            <Label>Kontext (JSON)</Label>
            <Textarea 
              value={contextJson}
              onChange={(e) => setContextJson(e.target.value)}
              className="font-mono text-xs h-48"
              placeholder='{ "baujahr": 1995, "gebaeudewert": 250000 }'
            />
          </div>

          <Button 
            onClick={handleEvaluate}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Auswertung...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Regeln auswerten
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ergebnisse</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800 mb-4">
              {error}
            </div>
          )}

          {results && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-2">Angewandte Regeln:</p>
                <div className="flex flex-wrap gap-2">
                  {results.applied_rules?.map(rule => (
                    <Badge key={rule} variant="secondary">{rule}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-2">Resultate:</p>
                {results.results?.map((r, idx) => (
                  <div key={idx} className="bg-slate-50 rounded p-2 mb-2 text-xs">
                    <div className="font-semibold text-slate-900">{r.rule_name}</div>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(r.result, null, 2))}
                      className="text-slate-400 hover:text-slate-600 mt-1"
                      title="In Zwischenablage kopieren"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <pre className="text-slate-600 overflow-auto max-h-32 mt-1">
                      {JSON.stringify(r.result, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>

              {results.errors?.length > 0 && (
                <div>
                  <p className="text-xs text-red-600 mb-2">Fehler:</p>
                  {results.errors.map((err, idx) => (
                    <div key={idx} className="text-xs text-red-600 bg-red-50 p-2 rounded mb-1">
                      {err}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!results && !error && (
            <p className="text-xs text-slate-400">Keine Ergebnisse noch</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}