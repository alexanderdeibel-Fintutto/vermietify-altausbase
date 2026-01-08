import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SmartFieldAutocomplete({ submissionId, fieldName, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (submissionId && fieldName) {
      loadSuggestions();
    }
  }, [submissionId, fieldName]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('smartFormCompletion', {
        submission_id: submissionId,
        field_name: fieldName
      });

      if (response.data.success) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || suggestions.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      {suggestions.map((sugg, idx) => (
        <Button
          key={idx}
          variant="outline"
          size="sm"
          onClick={() => onSelect(sugg.value)}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span className="text-xs">{sugg.value}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {sugg.confidence}%
          </Badge>
        </Button>
      ))}
    </div>
  );
}