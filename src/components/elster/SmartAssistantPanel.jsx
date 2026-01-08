import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SmartAssistantPanel() {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateSmartSuggestions', {
        context: 'dashboard'
      });

      if (response.data.success) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      toast.error('Vorschläge konnten nicht geladen werden');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadSuggestions();
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-slate-200 bg-slate-50';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Smart-Assistent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-600">
            Analysiere...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Smart-Assistent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!suggestions || suggestions.length === 0 ? (
          <div className="text-center py-8 text-slate-600">
            Keine Vorschläge verfügbar
          </div>
        ) : (
          <>
            {suggestions.map((suggestion, idx) => (
              <div 
                key={idx} 
                className={`p-3 border rounded-lg ${getPriorityColor(suggestion.priority)}`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{suggestion.title}</div>
                    <div className="text-xs text-slate-600 mt-1">{suggestion.description}</div>
                  </div>
                </div>
              </div>
            ))}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadSuggestions}
              className="w-full"
            >
              Aktualisieren
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}