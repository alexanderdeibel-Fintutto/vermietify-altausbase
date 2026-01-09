import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxDocumentManager() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [fileInputKey, setFileInputKey] = useState(0);

  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ['taxDocuments', country, taxYear],
    queryFn: async () => {
      const docs = await base44.entities.TaxDocument.filter({
        country,
        tax_year: taxYear
      }).catch(() => []);
      return docs;
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.entities.TaxDocument.create({
        user_email: (await base44.auth.me()).email,
        country,
        tax_year: taxYear,
        document_type: 'other',
        file_name: file.name,
        file_url,
        file_size: file.size,
        status: 'uploaded'
      });

      setFileInputKey(k => k + 1);
      refetch();
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const requiredDocs = [
    { type: 'bank_statement', label: 'Kontoauszüge' },
    { type: 'investment_confirmation', label: 'Anlagebestätigungen' },
    { type: 'tax_certificate', label: 'Steuerbescheinigungen' },
    { type: 'expense_receipt', label: 'Belege & Rechnungen' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📁 Steuerdokument-Manager</h1>
        <p className="text-slate-500 mt-1">Organisieren Sie alle Ihre Steuerdokumente</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="text-sm font-medium">Land</label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
              <SelectItem value="CH">🇨🇭 Schweiz</SelectItem>
              <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Steuerjahr</label>
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR - 1, CURRENT_YEAR].map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <label htmlFor="file-upload" className="w-full">
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Datei hochladen
              </span>
            </Button>
            <input
              id="file-upload"
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              key={fileInputKey}
            />
          </label>
        </div>
      </div>

      {/* Required Documents */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">✓ Erforderliche Dokumente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {requiredDocs.map(doc => {
            const uploaded = documents.some(d => d.document_type === doc.type);
            return (
              <div key={doc.type} className="flex justify-between items-center p-2 bg-white rounded">
                <span className="text-sm">{doc.label}</span>
                {uploaded ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Uploaded Documents */}
      {isLoading ? (
        <div className="text-center py-8">⏳ Wird geladen...</div>
      ) : documents.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">📄 Hochgeladene Dokumente ({documents.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {documents.map((doc, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">{doc.file_name}</p>
                    <p className="text-xs text-slate-600">{(doc.file_size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded">
                  {doc.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-slate-500">
            Keine Dokumente hochgeladen. Klicken Sie "Datei hochladen", um zu beginnen.
          </CardContent>
        </Card>
      )}
    </div>
  );
}