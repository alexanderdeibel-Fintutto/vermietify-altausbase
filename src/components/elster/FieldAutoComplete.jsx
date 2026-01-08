import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function FieldAutoComplete({ 
  field, 
  label, 
  value, 
  onChange, 
  buildingId, 
  formType,
  ...props 
}) {
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (buildingId && field) {
      loadSuggestion();
    }
  }, [buildingId, field]);

  const loadSuggestion = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('suggestFormFields', {
        building_id: buildingId,
        form_type: formType || 'ANLAGE_V',
        field_name: field
      });

      if (response.data.success && response.data.suggestions?.[field]) {
        setSuggestion(response.data.suggestions[field]);
      }
    } catch (error) {
      console.error('Failed to load suggestion:', error);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = () => {
    if (suggestion?.suggested_value) {
      onChange({ target: { value: suggestion.suggested_value } });
    }
  };

  const getTrendIcon = () => {
    if (!suggestion?.trend) return null;
    return suggestion.trend === 'increasing' ? TrendingUp : TrendingDown;
  };

  const TrendIcon = getTrendIcon();

  return (
    <div className="space-y-2">
      <Label htmlFor={field}>
        {label}
        {loading && <span className="ml-2 text-xs text-slate-400">Lädt...</span>}
      </Label>
      
      <div className="relative">
        <Input
          id={field}
          value={value}
          onChange={onChange}
          {...props}
        />
        
        {suggestion && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span className="font-medium text-blue-900">KI-Vorschlag</span>
                {TrendIcon && (
                  <TrendIcon className="w-3 h-3 text-slate-500" />
                )}
              </div>
              <button
                type="button"
                onClick={applySuggestion}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Übernehmen
              </button>
            </div>
            
            <div className="text-xs text-blue-800">
              Vorgeschlagen: {suggestion.suggested_value?.toLocaleString('de-DE', {
                style: 'currency',
                currency: 'EUR'
              })}
            </div>
            
            {suggestion.avg && (
              <div className="text-xs text-slate-600 mt-1">
                Durchschnitt: {suggestion.avg.toLocaleString('de-DE', {
                  style: 'currency',
                  currency: 'EUR'
                })}
              </div>
            )}
            
            {suggestion.reasoning && (
              <div className="text-xs text-slate-600 mt-1">
                {suggestion.reasoning}
              </div>
            )}
            
            {suggestion.confidence && (
              <Badge variant="outline" className="mt-2 text-xs">
                {suggestion.confidence}% Vertrauen
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}