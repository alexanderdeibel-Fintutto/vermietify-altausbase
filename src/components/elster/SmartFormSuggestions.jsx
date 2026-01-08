import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SmartFormSuggestions({ onCreateForm }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const response = await base44.functions.invoke('suggestNextForm', {});
      
      if (response.data.success) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  if (suggestions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          Empfohlene Formulare
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion, idx) => (
          <div key={idx} className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-medium">{suggestion.form_type}</div>
                <div className="text-xs text-slate-600 mt-1">{suggestion.reason}</div>
              </div>
              <Badge variant={suggestion.priority === 'high' ? 'default' : 'secondary'}>
                {suggestion.priority}
              </Badge>
            </div>
            <Button 
              size="sm" 
              onClick={() => onCreateForm(suggestion)}
              className="w-full"
            >
              <Plus className="w-3 h-3 mr-1" />
              Jetzt erstellen
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}