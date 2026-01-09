import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Trash2, Download, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

const DOCUMENT_TYPES = {
  bank_statement: '🏦 Kontoauszug',
  investment_confirmation: '📊 Wertschriften-Bestätigung',
  dividend_slip: '💰 Dividendendenbeleg',
  tax_certificate: '📜 Steuerbescheinigung',
  expense_receipt: '🧾 Ausgabenbeleg',
  mortgage_agreement: '🏠 Hypothekavertrag',
  rental_agreement: '🏘️ Mietvertrag',
  insurance_policy: '🛡️ Versicherungspolice',
  trading_log: '📈 Handelsjournal',
  other: '📄 Sonstiges'
};

export default function TaxDocumentManager() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR - 1);
  const [selectedType, setSelectedType] = useState('bank_statement');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ['taxDocuments', country, taxYear],
    queryFn: async () => {
      return await base44.entities.TaxDocument.filter({ country, tax_year: taxYear }) || [];
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      setUploading(true);
      try {
        // Upload file
        const { file_url } = await base44.integrations.Core.UploadFile({ file });

        // Extract data with AI
        const { data: extractedData } = await base44.functions.invoke('extractTaxDocumentData', {
          fileUrl: file_url,
          documentType: selectedType,
          country
        });

        // Create document record
        const user = await base44.auth.me();
        await base44.entities.TaxDocument.create({
          user_email: user.email,
          country,
          tax_year: taxYear,
          document_type: selectedType,
          file_name: file.name,
          file_url,
          file_size: file.size,
          title: file.name.split('.')[0],
          extracted_data: extractedData.extracted_data || {},
          status: extractedData.confidence > 70 ? 'processed' : 'processing',
          tags: [country, taxYear.toString(), selectedType],
          uploaded_at: new Date().toISOString()
        });

        queryClient.invalidateQueries({ queryKey: ['taxDocuments', country, taxYear] });
        setUploading(false);
        setUploadProgress(0);
      } catch (error) {
        setUploading(false);
        setUploadProgress(0);
        throw error;
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TaxDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxDocuments', country, taxYear] });
    }
  });

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadMutation.mutateAsync(file);
    }
  };

  const processedDocs = documents.filter(d => d.status === 'processed').length;
  const processingDocs = documents.filter(d => d.status === 'processing').length;

  const statusIcons = {
    uploaded: <AlertCircle className="w-4 h-4 text-slate-500" />,
    processing: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
    processed: <CheckCircle2 className="w-4 h-4 text-green-600" />,
    reviewed: <CheckCircle2 className="w-4 h-4 text-green-600" />,
    rejected: <AlertCircle className="w-4 h-4 text-red-600" />
  };

  const docsByType = {};
  documents.forEach(doc => {
    if (!docsByType[doc.document_type]) {
      docsByType[doc.document_type] = [];
    }
    docsByType[doc.document_type].push(doc);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📁 Tax Document Manager</h1>
        <p className="text-slate-500 mt-1">Verwalten & organisieren Sie Ihre Steuerdokumente mit AI-Analyse</p>
      </div>

      {/* Country & Year Selection */}
      <div className="flex gap-4">
        <div className="flex-1 max-w-xs">
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

        <div className="flex-1 max-w-xs">
          <label className="text-sm font-medium">Steuerjahr</label>
          <Select value={taxYear.toString()} onValueChange={(v) => setTaxYear(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR].map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Upload Section */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" /> Dokumente hochladen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Dokumenttyp</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOCUMENT_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Datei auswählen (PDF, Bild)</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              disabled={uploading}
              className="block w-full text-sm text-slate-600
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                disabled:opacity-50"
            />
          </div>

          {uploading && (
            <div className="space-y-2">
              <p className="text-sm text-slate-600">Datei wird verarbeitet...</p>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <p className="text-sm text-slate-600">Gesamt</p>
            <p className="text-3xl font-bold">{documents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <p className="text-sm text-slate-600">Verarbeitet</p>
            <p className="text-3xl font-bold text-green-600">{processedDocs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-6 h-6 text-blue-500 mx-auto mb-1 animate-spin" />
            <p className="text-sm text-slate-600">Läuft</p>
            <p className="text-3xl font-bold text-blue-500">{processingDocs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-slate-600">Größe</p>
            <p className="text-2xl font-bold">
              {(documents.reduce((s, d) => s + (d.file_size || 0), 0) / 1024 / 1024).toFixed(1)} MB
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Documents by Type */}
      <Tabs defaultValue={Object.keys(docsByType)[0] || 'bank_statement'} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
          {Object.entries(DOCUMENT_TYPES).map(([key, label]) => {
            const count = docsByType[key]?.length || 0;
            return (
              <TabsTrigger key={key} value={key} className="text-xs">
                {count}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(DOCUMENT_TYPES).map(([docTypeKey, docTypeLabel]) => (
          <TabsContent key={docTypeKey} value={docTypeKey} className="space-y-3">
            {docsByType[docTypeKey] && docsByType[docTypeKey].length > 0 ? (
              docsByType[docTypeKey].map((doc) => (
                <Card key={doc.id} className={doc.status === 'processed' ? 'border-green-300' : 'border-slate-200'}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{statusIcons[doc.status]}</span>
                          <h4 className="font-semibold">{doc.title}</h4>
                          <Badge className={
                            doc.status === 'processed' ? 'bg-green-100 text-green-800' :
                            doc.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-800'
                          }>
                            {doc.status}
                          </Badge>
                        </div>

                        <p className="text-xs text-slate-600 mb-2">
                          Hochgeladen: {new Date(doc.uploaded_at).toLocaleDateString('de-DE')}
                        </p>

                        {doc.extracted_data && Object.keys(doc.extracted_data).length > 0 && (
                          <div className="mt-3 p-3 bg-slate-50 rounded text-xs">
                            <p className="font-semibold text-slate-700 mb-2">Extrahierte Daten:</p>
                            <div className="space-y-1 text-slate-600">
                              {Object.entries(doc.extracted_data).slice(0, 3).map(([key, value]) => (
                                <p key={key}><strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Download className="w-4 h-4" /> Download
                        </Button>
                        <Button
                          onClick={() => deleteMutation.mutate(doc.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                Keine Dokumente vom Typ "{docTypeLabel}" vorhanden.
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}