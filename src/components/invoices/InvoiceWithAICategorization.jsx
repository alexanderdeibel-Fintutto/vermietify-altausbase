import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function InvoiceWithAICategorization({ invoice, buildingId, onCategorized }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestion, setSuggestion] = useState(null);

  const analyzeWithAI = async () => {
    setAnalyzing(true);
    try {
      // Building-Daten laden für Kontext
      const building = await base44.entities.Building.filter({ id: buildingId });
      
      const response = await base44.functions.invoke('categorizeExpenseWithAI', {
        invoice_data: {
          supplier: invoice.supplier_name,
          amount: invoice.amount,
          description: invoice.description,
          date: invoice.date
        },
        building_ownership: building[0]?.ownership_type || 'VERMIETUNG',
        legal_form: building[0]?.legal_form || 'PRIVATPERSON',
        historical_bookings: []
      });

      if (response.data.success) {
        setSuggestion(response.data.categorization);
        toast.success('KI-Analyse abgeschlossen');
      }
    } catch (error) {
      toast.error('KI-Analyse fehlgeschlagen');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const acceptSuggestion = () => {
    onCategorized(suggestion.suggested_category);
    toast.success('Kategorie übernommen');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          KI-Kategorisierung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!suggestion ? (
          <Button onClick={analyzeWithAI} disabled={analyzing} className="w-full">
            {analyzing ? 'Analysiere...' : 'Mit KI kategorisieren'}
          </Button>
        ) : (
          <>
            <div className="p-4 bg-blue-50 rounded-lg space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-blue-900">{suggestion.display_name}</div>
                  <div className="text-sm text-blue-700 mt-1">{suggestion.reasoning}</div>
                </div>
                <Badge variant="secondary" className="ml-2">
                  {suggestion.confidence}% Vertrauen
                </Badge>
              </div>

              {suggestion.tax_implications && (
                <div className="border-t border-blue-200 pt-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-600">Steuerbehandlung:</span>
                      <div className="font-medium">{suggestion.tax_implications.tax_treatment}</div>
                    </div>
                    <div>
                      <span className="text-slate-600">Umlagefähig:</span>
                      <div className="font-medium">
                        {suggestion.tax_implications.allocatable ? 'Ja' : 'Nein'}
                      </div>
                    </div>
                    {suggestion.tax_implications.skr03_account && (
                      <div>
                        <span className="text-slate-600">SKR03:</span>
                        <div className="font-medium">{suggestion.tax_implications.skr03_account}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {suggestion.warnings?.length > 0 && (
                <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="text-xs text-yellow-800">
                    {suggestion.warnings.map((w, i) => <div key={i}>• {w}</div>)}
                  </div>
                </div>
              )}
            </div>

            {suggestion.alternative_categories?.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Alternative Vorschläge:</div>
                <div className="space-y-1">
                  {suggestion.alternative_categories.map((alt, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => onCategorized(alt.category)}
                    >
                      <span className="flex-1">{alt.category}</span>
                      <span className="text-slate-500">{alt.confidence}%</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={acceptSuggestion} className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                Übernehmen
              </Button>
              <Button variant="outline" onClick={() => setSuggestion(null)}>
                Neu analysieren
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}