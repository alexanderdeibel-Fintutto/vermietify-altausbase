import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Download } from 'lucide-react';

export default function TemplateLibrary() {
  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getTemplateLibrary', {});
      return response.data.templates;
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
        {templates.map(tpl => (
          <div key={tpl.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="font-semibold text-sm">{tpl.name}</p>
              <Badge variant="outline" className="text-xs">{tpl.category}</Badge>
            </div>
            <Button size="sm" variant="ghost">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}