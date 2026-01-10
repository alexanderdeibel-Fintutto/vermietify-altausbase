import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function TemplateLibrary() {
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['templateLibrary'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getTemplateLibrary', {});
      return response.data.templates;
    }
  });

  const useMutation = useMutation({
    mutationFn: async (templateId) => {
      await base44.functions.invoke('useTemplate', { template_id: templateId });
    },
    onSuccess: () => {
      toast.success('Vorlage verwendet');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Vorlagen-Bibliothek
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {templates.map(template => (
          <div key={template.id} className="p-3 bg-slate-50 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-sm">{template.name}</p>
                <p className="text-xs text-slate-600">{template.description}</p>
                <Badge className="mt-2" variant="outline">{template.category}</Badge>
              </div>
              <Button size="sm" onClick={() => useMutation.mutate(template.id)}>
                <Download className="w-4 h-4 mr-1" />
                Nutzen
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}