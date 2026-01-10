import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Download, Wand2 } from 'lucide-react';
import TemplateUploadDialog from './TemplateUploadDialog';
import DocumentGeneratorDialog from './DocumentGeneratorDialog';

export default function TemplateLibrary({ legalForm, companyId, companyData }) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [generatorDialogOpen, setGeneratorDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const { data: templates = [] } = useQuery({
    queryKey: ['document-templates', legalForm],
    queryFn: async () => {
      const all = await base44.entities.DocumentTemplate.list();
      return all.filter(t => t.legal_form === legalForm || t.legal_form === 'universal');
    }
  });

  const categoryLabels = {
    contract: 'Vertrag',
    agreement: 'Vereinbarung',
    regulation: 'Regelwerk',
    statement: 'Erklärung',
    other: 'Sonstiges'
  };

  const handleGenerateDocument = (template) => {
    setSelectedTemplate(template);
    setGeneratorDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5" />
            Dokumentvorlagen
          </CardTitle>
          <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Vorlage hochladen
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {templates.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-8">Keine Vorlagen für diese Rechtsform</p>
            ) : (
              templates.map(template => (
                <div key={template.id} className="p-3 bg-slate-50 rounded-lg border">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-slate-900">{template.name}</h4>
                      <p className="text-xs text-slate-600 mt-1">{template.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {categoryLabels[template.category]}
                        </Badge>
                        {template.is_custom && (
                          <Badge className="bg-purple-100 text-purple-700 text-xs">Custom</Badge>
                        )}
                        {template.usage_count > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {template.usage_count}x verwendet
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(template.template_url, '_blank')}
                        title="Vorlage anzeigen"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1"
                        onClick={() => handleGenerateDocument(template)}
                      >
                        <Wand2 className="w-4 h-4" />
                        Erstellen
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <TemplateUploadDialog
        isOpen={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        legalForm={legalForm}
      />

      {selectedTemplate && (
        <DocumentGeneratorDialog
          isOpen={generatorDialogOpen}
          onClose={() => setGeneratorDialogOpen(false)}
          template={selectedTemplate}
          companyData={companyData}
          companyId={companyId}
        />
      )}
    </>
  );
}