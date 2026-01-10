import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, FolderTree } from 'lucide-react';
import { toast } from 'sonner';

export default function SmartFilingAssistant() {
  const { data: unorganized = [] } = useQuery({
    queryKey: ['unorganizedDocs'],
    queryFn: () => base44.entities.Document.filter(
      { 
        $or: [
          { building_id: { $exists: false } },
          { ai_category: { $exists: false } }
        ]
      },
      '-created_date',
      50
    )
  });

  const organizeMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('autoOrganizeDocuments', {
        analyze_all: true
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`${data.organized} Dokumente organisiert`);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Automatische Ablage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm text-orange-900">Unorganisierte Dokumente</p>
          <p className="text-3xl font-bold text-orange-900">{unorganized.length}</p>
        </div>

        <Button
          onClick={() => organizeMutation.mutate()}
          disabled={organizeMutation.isPending || unorganized.length === 0}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
        >
          <FolderTree className="w-4 h-4 mr-2" />
          {organizeMutation.isPending ? 'KI organisiert...' : 'Automatisch ablegen'}
        </Button>

        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-900 mb-2">KI ordnet zu:</p>
          <ul className="space-y-1 text-xs text-slate-600">
            <li>• Passende Kategorie</li>
            <li>• Verknüpfung zu Gebäuden</li>
            <li>• Relevante Tags</li>
            <li>• Steuerliche Einordnung</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}