import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TemplateLibrary({ onSelectTemplate }) {
  const { data: templates = [] } = useQuery({
    queryKey: ['elster-templates'],
    queryFn: () => base44.entities.ElsterFormTemplate.list('-created_date')
  });

  const useTemplate = async (template) => {
    try {
      // Erstelle neue Submission aus Template
      const newSub = await base44.entities.ElsterSubmission.create({
        tax_form_type: template.form_type,
        legal_form: template.legal_form,
        tax_year: new Date().getFullYear(),
        form_data: template.field_mappings,
        status: 'DRAFT',
        submission_mode: 'TEST'
      });

      toast.success('Submission aus Template erstellt');
      onSelectTemplate?.(newSub.id);
    } catch (error) {
      toast.error('Template-Verwendung fehlgeschlagen');
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Template-Bibliothek
        </CardTitle>
      </CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <p className="text-sm text-slate-600 text-center py-4">
            Keine Templates vorhanden
          </p>
        ) : (
          <div className="space-y-2">
            {templates.map(template => (
              <div
                key={template.id}
                className="p-3 border rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{template.form_type}</div>
                    <div className="text-xs text-slate-600 mt-1">
                      {template.legal_form} • Version {template.version}
                    </div>
                    {template.description && (
                      <div className="text-xs text-slate-500 mt-1">
                        {template.description}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => useTemplate(template)}
                    size="sm"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Verwenden
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}