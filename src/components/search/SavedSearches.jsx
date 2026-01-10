import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bookmark, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function SavedSearches() {
  const [name, setName] = useState('');
  const queryClient = useQueryClient();

  const { data: searches = [] } = useQuery({
    queryKey: ['savedSearches'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getSavedSearches', {});
      return response.data.searches;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('saveSearch', { name, filters: {} });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] });
      toast.success('Suche gespeichert');
      setName('');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bookmark className="w-5 h-5" />
          Gespeicherte Suchen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input placeholder="Name der Suche" value={name} onChange={(e) => setName(e.target.value)} />
          <Button size="icon" onClick={() => saveMutation.mutate()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {searches.map(search => (
          <Button key={search.id} variant="outline" className="w-full justify-start">
            {search.name}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}