import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Download, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function AnlageVQuickGenerator() {
  const [generating, setGenerating] = useState(false);

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list(null, 100)
  });

  const generateMutation = useMutation({
    mutationFn: async (buildingId) => {
      const response = await base44.functions.invoke('createMultipleAnlagenV', {
        building_ids: [buildingId],
        year: new Date().getFullYear()
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Anlage V generiert');
    }
  });

  const generateAllMutation = useMutation({
    mutationFn: async () => {
      setGenerating(true);
      const response = await base44.functions.invoke('createMultipleAnlagenV', {
        building_ids: buildings.map(b => b.id),
        year: new Date().getFullYear()
      });
      return response.data;
    },
    onSuccess: (data) => {
      setGenerating(false);
      toast.success(`${data.created} Anlagen V erstellt`);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Anlage V Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={() => generateAllMutation.mutate()}
          disabled={generating || buildings.length === 0}
          className="w-full h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Zap className="w-5 h-5 mr-2" />
          {generating ? 'Generiere...' : `Alle ${buildings.length} Anlagen V erstellen`}
        </Button>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">Einzeln generieren:</p>
          {buildings.slice(0, 5).map(building => (
            <div key={building.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <span className="text-sm">{building.name}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => generateMutation.mutate(building.id)}
              >
                <Download className="w-3 h-3 mr-1" />
                Generieren
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}