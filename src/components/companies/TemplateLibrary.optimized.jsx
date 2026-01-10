import React, { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Download, Wand2 } from 'lucide-react';
import { CardSkeleton } from '@/components/shared/LoadingFallback';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

const TemplateUploadDialog = lazy(() => import('./TemplateUploadDialog'));
const DocumentGeneratorDialog = lazy(() => import('./DocumentGeneratorDialog'));

const categoryLabels = {
  contract: 'Vertrag',
  agreement: 'Vereinbarung',
  regulation: 'Regelwerk',
  statement: 'Erklärung',
  other: 'Sonstiges'
};

const TemplateCard = React.memo(({ template, onGenerate }) => (
  <div className="p-3 bg-slate-50 rounded-lg border hover:shadow-sm transition-shadow">
    <div className="flex items-start justify-between gap-2 mb-2">
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-slate-900 truncate">{template.name}</h4>
        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{template.description}</p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {categoryLabels[template.category]}
          </Badge>
          {template.is_custom && (
            <Badge className="bg-purple-100 text-purple-700 text-xs">Custom</Badge>
          )}
          {template.usage_count > 0 && (
            <Badge variant="secondary" className="text-xs">
              {template.usage_count}x
            </Badge>
          )}
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.open(template.template_url, '_blank')}
          title="Vorlage anzeigen"
          aria-label={`${template.name} herunterladen`}
          className="w-8 h-8 p-0"
        >
          <Download className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          onClick={() => onGenerate(template)}
          title="Dokument generieren"
          aria-label={`Dokument aus ${template.name} generieren`}
          className="gap-1 whitespace-nowrap"
        >
          <Wand2 className="w-4 h-4" />
          <span className="hidden sm:inline">Erstellen</span>
        </Button>
      </div>
    </div>
  </div>
));

TemplateCard.displayName = 'TemplateCard';

const TemplateLibraryContent = React.memo(({ legalForm, companyId, companyData }) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [generatorDialogOpen, setGeneratorDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['document-templates', legalForm],
    queryFn: async () => {
      const all = await base44.entities.DocumentTemplate.list();
      return all.filter(t => t.legal_form === legalForm || t.legal_form === 'universal');
    },
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000
  });

  const sortedTemplates = useMemo(
    () => templates.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0)),
    [templates]
  );

  const handleGenerateDocument = useCallback((template) => {
    setSelectedTemplate(template);
    setGeneratorDialogOpen(true);
  }, []);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5" />
            Dokumentvorlagen
          </CardTitle>
          <Button 
            size="sm" 
            onClick={() => setUploadDialogOpen(true)}
            aria-label="Dokumentvorlage hochladen"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Vorlage</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {isLoading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : sortedTemplates.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm">Keine Vorlagen für diese Rechtsform</p>
              </div>
            ) : (
              sortedTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onGenerate={handleGenerateDocument}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Suspense fallback={null}>
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
      </Suspense>
    </>
  );
});

TemplateLibraryContent.displayName = 'TemplateLibraryContent';

export default function TemplateLibrary({ legalForm, companyId, companyData }) {
  return (
    <ErrorBoundary fallback="Fehler beim Laden der Dokumentvorlagen">
      <TemplateLibraryContent
        legalForm={legalForm}
        companyId={companyId}
        companyData={companyData}
      />
    </ErrorBoundary>
  );
}