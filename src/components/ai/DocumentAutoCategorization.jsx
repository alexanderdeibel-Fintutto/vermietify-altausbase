import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FolderOpen, Upload, Tag } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentAutoCategorization() {
  const [categorized, setCategorized] = useState(null);
  const queryClient = useQueryClient();

  const categorizeMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const response = await base44.functions.invoke('categorizeDocument', { file_url });
      return response.data;
    },
    onSuccess: (data) => {
      setCategorized(data);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success(`Kategorisiert als: ${data.category}`);
    }
  });

  const categoryColors = {
    'Rechnung': 'bg-blue-600',
    'Mietvertrag': 'bg-green-600',
    'Korrespondenz': 'bg-purple-600',
    'Behördlich': 'bg-orange-600',
    'Sonstiges': 'bg-slate-600'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Auto-Kategorisierung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-purple-50 rounded-lg">
          <p className="text-sm text-purple-800">
            KI analysiert Dokumente und kategorisiert automatisch
          </p>
        </div>

        <input
          type="file"
          accept=".pdf,.jpg,.png,.doc,.docx"
          onChange={(e) => e.target.files?.[0] && categorizeMutation.mutate(e.target.files[0])}
          className="hidden"
          id="doc-categorize"
        />
        <label htmlFor="doc-categorize">
          <Button asChild className="w-full" disabled={categorizeMutation.isPending}>
            <span>
              <Upload className="w-4 h-4 mr-2" />
              {categorizeMutation.isPending ? 'Analysiere...' : 'Dokument hochladen'}
            </span>
          </Button>
        </label>

        {categorized && (
          <div className="space-y-3 p-4 bg-green-50 rounded-lg">
            <p className="font-semibold text-sm text-green-800">✓ Analysiert:</p>
            
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              <Badge className={categoryColors[categorized.category] || 'bg-slate-600'}>
                {categorized.category}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="p-2 bg-white rounded">
                <p className="text-xs text-slate-600">Erkannte Schlagwörter</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {categorized.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>

              <div className="p-2 bg-white rounded">
                <p className="text-xs text-slate-600">Zusammenfassung</p>
                <p className="text-sm mt-1">{categorized.summary}</p>
              </div>

              <div className="p-2 bg-white rounded">
                <p className="text-xs text-slate-600">Empfohlene Zuordnung</p>
                <p className="text-sm font-semibold mt-1">{categorized.suggested_entity}</p>
              </div>
            </div>

            <Badge className="bg-purple-600">Konfidenz: {categorized.confidence}%</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}