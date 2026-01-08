import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { BarChart2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function FieldUsageAnalyzer() {
  const [formType, setFormType] = useState('ANLAGE_V');
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('analyzeFormFieldUsage', {
        form_type: formType,
        year_range: 3
      });

      if (response.data.success) {
        setInsights(response.data.insights);
        toast.success('Analyse abgeschlossen');
      }
    } catch (error) {
      toast.error('Analyse fehlgeschlagen');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5" />
          Feld-Nutzungsanalyse
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={formType} onValueChange={setFormType}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ANLAGE_V">Anlage V</SelectItem>
              <SelectItem value="EUER">EÜR</SelectItem>
              <SelectItem value="GEWERBESTEUER">Gewerbesteuer</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={analyze} disabled={loading}>
            {loading ? 'Analysiere...' : 'Analysieren'}
          </Button>
        </div>

        {insights && (
          <div className="space-y-4 pt-4 border-t">
            <div className="text-sm text-slate-600">
              Basierend auf {insights.total_submissions} Submissions
            </div>

            {insights.most_used && insights.most_used.length > 0 && (
              <div className="space-y-3">
                <div className="font-medium">Meistgenutzte Felder</div>
                {insights.most_used.slice(0, 5).map((field, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="truncate">{field.field}</span>
                      <span className="text-slate-600">{Math.round(field.usage_rate)}%</span>
                    </div>
                    <Progress value={field.usage_rate} />
                  </div>
                ))}
              </div>
            )}

            {insights.rarely_used && insights.rarely_used.length > 0 && (
              <div className="space-y-2">
                <div className="font-medium text-sm">Selten genutzte Felder</div>
                <div className="text-xs text-slate-500">
                  {insights.rarely_used.length} Felder werden in weniger als 20% der Fälle verwendet
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}