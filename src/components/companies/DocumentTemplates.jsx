import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Download, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const templatesByLegalForm = {
  gmbh: [
    { id: 'gesellschaftervertrag', name: 'Gesellschaftervertrag', type: 'contract' },
    { id: 'geschaeftsordnung', name: 'Geschäftsordnung', type: 'regulation' },
    { id: 'arbeitsverhältnis', name: 'Arbeitsvertrag', type: 'employment' }
  ],
  gbr: [
    { id: 'partnerschaftsvertrag', name: 'Partnerschaftsvertrag', type: 'contract' },
    { id: 'gewinnverteilungsvertrag', name: 'Gewinnverteilungsvertrag', type: 'contract' }
  ],
  ag: [
    { id: 'satzung', name: 'Satzung', type: 'regulation' },
    { id: 'geschaeftsordnung', name: 'Geschäftsordnung', type: 'regulation' }
  ],
  ev: [
    { id: 'satzung', name: 'Satzung', type: 'regulation' },
    { id: 'geschaeftsordnung', name: 'Geschäftsordnung', type: 'regulation' }
  ]
};

export default function DocumentTemplates({ legalForm, companyId }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const templates = templatesByLegalForm[legalForm] || [];

  const handleDownloadTemplate = async (template) => {
    // PDF-Generierung via Backend-Funktion
    try {
      const response = await base44.functions.invoke('generateCompanyTemplate', {
        company_id: companyId,
        template_id: template.id
      });
      // Download-Link
      window.open(response.data.file_url, '_blank');
    } catch (error) {
      console.error('Template download failed:', error);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="w-5 h-5" />
          Dokumentvorlagen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {templates.map(template => (
          <div key={template.id} className="p-3 bg-slate-50 rounded-lg border">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-medium text-sm text-slate-900">{template.name}</h4>
              <Badge variant="outline" className="text-xs">{template.type}</Badge>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownloadTemplate(template)}
              >
                <Download className="w-4 h-4 mr-1" />
                Herunterladen
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedTemplate(template)}
              >
                Vorschau
              </Button>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-4">Keine Vorlagen verfügbar</p>
        )}

        <Button variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Benutzerdefinierte Vorlage
        </Button>
      </CardContent>
    </Card>
  );
}