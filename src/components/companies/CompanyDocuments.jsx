import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Trash2, Eye, Download } from 'lucide-react';

const documentTypes = {
  einzelunternehmen: ['Identitätsnachweis', 'Gewerbeanmeldung'],
  gbr: ['Gesellschaftervertrag', 'Identitätsnachweise', 'Gewerbeanmeldung'],
  gmbh: ['Gründungsurkunde', 'Handelsregisterauszug', 'Gesellschaftervertrag', 'Satzung'],
  ag: ['Satzung', 'Handelsregisterauszug', 'Gründungsprotokolle'],
  ev: ['Vereinsregisterauszug', 'Satzung'],
  other: ['Sonstige Dokumente']
};

export default function CompanyDocuments({ companyId, legalForm, documents = [], onUpdate }) {
  const [selectedDoc, setSelectedDoc] = useState(null);

  const handleDocumentUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      const uploadedDocs = [];
      
      for (const file of files) {
        const result = await base44.integrations.Core.UploadFile({ file });
        uploadedDocs.push({
          id: Math.random().toString(36),
          name: file.name,
          type: 'other',
          url: result.file_url,
          uploadedAt: new Date().toISOString()
        });
      }

      onUpdate([...documents, ...uploadedDocs]);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const allowedTypes = documentTypes[legalForm] || documentTypes.other;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="w-5 h-5" />
          Rechtliche Dokumente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload */}
        <label className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-slate-400">
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleDocumentUpload}
            className="hidden"
          />
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700">Dokumente hochladen</p>
          <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG</p>
        </label>

        {/* Required Documents Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm font-medium text-blue-900 mb-2">Erforderliche Dokumente ({legalForm}):</p>
          <div className="flex flex-wrap gap-1">
            {allowedTypes.map(type => (
              <Badge key={type} variant="outline" className="text-xs bg-white">
                {type}
              </Badge>
            ))}
          </div>
        </div>

        {/* Documents List */}
        <div className="space-y-2">
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
              <div className="flex-1">
                <p className="font-medium text-sm text-slate-900">{doc.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(doc.uploadedAt).toLocaleDateString('de-DE')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedDoc(doc)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(doc.url, '_blank')}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600"
                  onClick={() => onUpdate(documents.filter(d => d.id !== doc.id))}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {documents.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-4">Keine Dokumente vorhanden</p>
        )}
      </CardContent>
    </Card>
  );
}