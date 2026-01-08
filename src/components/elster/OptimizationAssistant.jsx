import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb, TrendingUp, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function OptimizationAssistant() {
  const [buildingId, setBuildingId] = useState('');
  const [taxYear, setTaxYear] = useState(new Date().getFullYear() - 1);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const analyze = async () => {
    if (!buildingId) {
      toast.error('Bitte Gebäude auswählen');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('suggestTaxOptimizations', {
        building_id: buildingId,
        tax_year: taxYear
      });

      if (response.data.success) {
        setSuggestions(response.data);
        toast.success(`${response.data.suggestions.length} Optimierungen gefunden`);
      }
    } catch (error) {
      toast.error('Analyse fehlgeschlagen');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return AlertCircle;
      case 'medium': return TrendingUp;
      default: return CheckCircle;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Steuer-Optimierungs-Assistent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Analysiert Ihre Daten und findet Möglichkeiten zur Steueroptimierung
          </AlertDescription>
        </Alert>

        <div>
          <Label>Gebäude</Label>
          <Select value={buildingId} onValueChange={setBuildingId}>
            <SelectTrigger>
              <SelectValue placeholder="Gebäude wählen..." />
            </SelectTrigger>
            <SelectContent>
              {buildings.map(b => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name || b.address}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Steuerjahr</Label>
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[...Array(5)].map((_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={analyze} 
          disabled={loading || !buildingId}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Lightbulb className="w-4 h-4 mr-2" />
          )}
          Optimierungen analysieren
        </Button>

        {suggestions && (
          <div className="space-y-3 pt-3 border-t">
            {suggestions.total_potential_savings > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-green-700">Geschätztes Einsparpotenzial</div>
                <div className="text-2xl font-bold text-green-900">
                  {suggestions.total_potential_savings.toLocaleString('de-DE', { 
                    style: 'currency', 
                    currency: 'EUR' 
                  })}
                </div>
              </div>
            )}

            <Accordion type="single" collapsible>
              {suggestions.suggestions.map((suggestion, idx) => {
                const Icon = getPriorityIcon(suggestion.priority);
                return (
                  <AccordionItem key={idx} value={`item-${idx}`} className="border rounded-lg mb-2">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-2 text-left">
                        <Icon className={`w-4 h-4 ${getPriorityColor(suggestion.priority)}`} />
                        <div>
                          <div className="font-medium">{suggestion.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {suggestion.category}
                            </Badge>
                            {suggestion.potential_savings > 0 && (
                              <span className="text-xs text-green-600">
                                +{suggestion.potential_savings.toLocaleString('de-DE', { 
                                  style: 'currency', 
                                  currency: 'EUR' 
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-3">
                        <p className="text-sm text-slate-700">{suggestion.description}</p>
                        
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                          <div className="font-medium text-blue-900 mb-1">👉 Nächster Schritt:</div>
                          <div className="text-blue-700">{suggestion.action}</div>
                        </div>

                        {suggestion.examples && suggestion.examples.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-slate-600 mb-1">Beispiele:</div>
                            <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                              {suggestion.examples.map((example, eidx) => (
                                <li key={eidx}>{example}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
}