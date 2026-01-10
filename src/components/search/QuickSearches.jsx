import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Star, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function QuickSearches({ entityName, onExecute }) {
  const queryClient = useQueryClient();

  const { data: savedSearches = [] } = useQuery({
    queryKey: ['savedSearches', entityName],
    queryFn: async () => {
      const response = await base44.functions.invoke('getSavedSearches', { entity: entityName });
      return response.data;
    }
  });

  const executeMutation = useMutation({
    mutationFn: async (search) => {
      const response = await base44.functions.invoke('enhancedSearch', {
        entity: search.entity,
        conditions: search.conditions
      });
      return response.data;
    },
    onSuccess: (data, search) => {
      onExecute?.(data);
      toast.success(`"${search.name}" ausgeführt - ${data.length} Ergebnisse`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (searchId) => {
      await base44.functions.invoke('deleteSavedSearch', { search_id: searchId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] });
      toast.success('Suche gelöscht');
    }
  });

  if (savedSearches.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Gespeicherte Suchen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {savedSearches.map((search) => (
          <div
            key={search.id}
            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="flex-1">
              <p className="font-semibold text-sm">{search.name}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {search.conditions.slice(0, 3).map((cond, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {cond.field}
                  </Badge>
                ))}
                {search.conditions.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{search.conditions.length - 3}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => executeMutation.mutate(search)}
                disabled={executeMutation.isPending}
              >
                <Search className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteMutation.mutate(search.id)}
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}