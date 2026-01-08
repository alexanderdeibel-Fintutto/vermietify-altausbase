import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SmartFieldHelper({ fieldName, currentValue, formType, buildingId, taxYear, onApplySuggestion }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (fieldName && formType) {
      fetchSuggestions();
    }
  }, [fieldName, currentValue, formType]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('suggestFormFields', {
        field_name: fieldName,
        current_value: currentValue,
        form_type: formType,
        building_id: buildingId,
        tax_year: taxYear
      });

      if (response.data.success) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Sparkles className="w-4 h-4 animate-pulse" />
            Lade Vorschläge...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!suggestions || suggestions.historical_values?.length === 0) {
    return null;
  }

  const getTrendIcon = () => {
    switch (suggestions.trend) {
      case 'steigend': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'fallend': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stabil': return <Minus className="w-4 h-4 text-slate-600" />;
      default: return null;
    }
  };

  return (
    <Card className={`border-2 ${suggestions.warning ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-700">KI-Vorschläge</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {suggestions.confidence}% Vertrauen
          </Badge>
        </div>

        {suggestions.warning && (
          <div className="flex items-start gap-2 p-2 bg-yellow-100 rounded text-xs">
            <AlertTriangle className="w-4 h-4 text-yellow-700 flex-shrink-0 mt-0.5" />
            <span className="text-yellow-800">{suggestions.warning}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          {suggestions.avg_value !== null && (
            <div className="p-2 bg-white rounded">
              <div className="text-slate-600">Durchschnitt</div>
              <div className="font-semibold text-slate-900">{suggestions.avg_value}</div>
            </div>
          )}
          
          {suggestions.median_value !== null && (
            <div className="p-2 bg-white rounded">
              <div className="text-slate-600">Median</div>
              <div className="font-semibold text-slate-900">{suggestions.median_value}</div>
            </div>
          )}

          {suggestions.range && (
            <div className="p-2 bg-white rounded col-span-2">
              <div className="text-slate-600">Bereich</div>
              <div className="font-semibold text-slate-900">
                {suggestions.range.min} - {suggestions.range.max}
              </div>
            </div>
          )}

          {suggestions.trend && (
            <div className="p-2 bg-white rounded flex items-center gap-2 col-span-2">
              {getTrendIcon()}
              <div>
                <div className="text-slate-600">Trend</div>
                <div className="font-semibold text-slate-900 capitalize">{suggestions.trend}</div>
              </div>
            </div>
          )}
        </div>

        {suggestions.avg_value !== null && onApplySuggestion && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => onApplySuggestion(suggestions.avg_value)}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Durchschnittswert übernehmen
          </Button>
        )}

        <div className="text-xs text-slate-600 pt-1 border-t">
          Basierend auf {suggestions.historical_values.length} früheren Einreichungen
        </div>
      </CardContent>
    </Card>
  );
}