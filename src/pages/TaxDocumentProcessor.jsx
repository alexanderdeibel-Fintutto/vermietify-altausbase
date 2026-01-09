import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, CheckCircle2, AlertTriangle, Loader, FileText } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxDocumentProcessor() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processedDocs, setProcessedDocs] = useState([]);

  const queryClient = useQueryClient();

  // Fetch documents
  const { data: documents = [] } = useQuery({
    queryKey: ['taxDocuments', country, taxYear],
    queryFn: async () => {
      return await base44.entities.TaxDocument.filter({
        user_email: (await base44.auth.me()).email,
        country,
        tax_year: taxYear
      }, '-uploaded_at') || [];
    }
  });

  // Processing mutation
  const { mutate: processDocument, isLoading: isProcessing } = useMutation({
    mutationFn: async (fileUrl) => {
      return await base44.functions.invoke('processAndCategorizeDocument', {
        fileUrl,
        country,
        taxYear
      });
    },
    onSuccess: (data) => {
      setProcessedDocs([...processedDocs, data.data]);
      queryClient.invalidateQueries({ queryKey: ['taxDocuments'] });
    }
  });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      await uploadAndProcess(files[i]);
    }
  };

  const uploadAndProcess = async (file) => {
    try {
      // Upload file
      const uploadResponse = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadResponse.file_url;

      // Process document
      processDocument(fileUrl);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    for (let i = 0; i < files.length; i++) {
      await uploadAndProcess(files[i]);
    }
  };

  const processedCount = documents.filter(d => d.status === 'processed').length;
  const pendingCount = documents.filter(d => d.status === 'processing').length;
  const issueCount = documents.filter(d => d.status === 'processed' && d.notes).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📄 Automatic Tax Document Processor</h1>
        <p className="text-slate-500 mt-1">KI-basierte Dokumentenerkennung und automatische Kategorisierung</p>
      </div>

      {/* Controls */}
      <div className="flex gap-4 flex-wrap">
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
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={String(CURRENT_YEAR - 1)}>{CURRENT_YEAR - 1}</SelectItem>
              <SelectItem value={String(CURRENT_YEAR)}>{CURRENT_YEAR}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-all ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="pt-8 pb-8">
          <div className="text-center">
            <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <p className="font-semibold mb-2">Dokumente hochladen</p>
            <p className="text-sm text-slate-600 mb-4">
              Ziehen Sie Dateien hierher oder klicken Sie zum Auswählen
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
              accept=".pdf,.jpg,.png,.jpeg"
            />
            <label htmlFor="file-input">
              <Button as="span" className="bg-blue-600 hover:bg-blue-700">
                Dateien auswählen
              </Button>
            </label>
            <p className="text-xs text-slate-500 mt-3">PDF, JPG, PNG bis 10MB</p>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="w-6 h-6 mx-auto text-blue-600 mb-2" />
            <p className="text-sm text-slate-600">Dokumente</p>
            <p className="text-3xl font-bold">{documents.length}</p>
          </CardContent>
        </Card>
        <Card className="border-green-300 bg-green-50">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-6 h-6 mx-auto text-green-600 mb-2" />
            <p className="text-sm text-slate-600">Verarbeitet</p>
            <p className="text-3xl font-bold">{processedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Loader className="w-6 h-6 mx-auto text-yellow-600 mb-2" />
            <p className="text-sm text-slate-600">Wird verarbeitet</p>
            <p className="text-3xl font-bold">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className={issueCount > 0 ? 'border-red-300 bg-red-50' : ''}>
          <CardContent className="pt-6 text-center">
            <AlertTriangle className={`w-6 h-6 mx-auto mb-2 ${issueCount > 0 ? 'text-red-600' : 'text-slate-400'}`} />
            <p className="text-sm text-slate-600">Mit Problemen</p>
            <p className="text-3xl font-bold">{issueCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Documents Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Alle ({documents.length})</TabsTrigger>
          <TabsTrigger value="processed">Verarbeitet ({processedCount})</TabsTrigger>
          <TabsTrigger value="issues">Probleme ({issueCount})</TabsTrigger>
          <TabsTrigger value="pending">In Bearbeitung ({pendingCount})</TabsTrigger>
        </TabsList>

        {/* All Documents */}
        <TabsContent value="all" className="space-y-3 mt-4">
          {documents.map(doc => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
          {documents.length === 0 && (
            <Card className="text-center py-8 text-slate-500">
              Keine Dokumente hochgeladen
            </Card>
          )}
        </TabsContent>

        {/* Processed */}
        <TabsContent value="processed" className="space-y-3 mt-4">
          {documents
            .filter(d => d.status === 'processed')
            .map(doc => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
        </TabsContent>

        {/* Issues */}
        <TabsContent value="issues" className="space-y-3 mt-4">
          {documents
            .filter(d => d.status === 'processed' && d.notes)
            .map(doc => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          {documents.filter(d => d.status === 'processed' && d.notes).length === 0 && (
            <Card className="text-center py-8 text-slate-500">
              Keine Probleme gefunden
            </Card>
          )}
        </TabsContent>

        {/* Pending */}
        <TabsContent value="pending" className="space-y-3 mt-4">
          {documents
            .filter(d => d.status === 'processing')
            .map(doc => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DocumentCard({ document }) {
  const typeEmojis = {
    bank_statement: '🏦',
    investment_confirmation: '📈',
    dividend_slip: '💰',
    tax_certificate: '📋',
    expense_receipt: '🧾',
    mortgage_agreement: '🏠',
    rental_agreement: '📝',
    insurance_policy: '🛡️',
    trading_log: '📊',
    other: '📄'
  };

  return (
    <Card className={document.notes ? 'border-yellow-300 bg-yellow-50' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="text-3xl">
            {typeEmojis[document.document_type] || '📄'}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">{document.title}</h3>
                <p className="text-sm text-slate-600">{document.document_type.replace(/_/g, ' ')}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {document.status === 'processed' ? (
                  <Badge className="bg-green-100 text-green-800">✅ Verarbeitet</Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-800">⏳ In Bearbeitung</Badge>
                )}
              </div>
            </div>

            {document.tags?.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {document.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {document.extracted_data?.amounts?.length > 0 && (
              <div className="text-sm font-mono text-slate-700">
                {document.extracted_data.amounts.map((amt, i) => (
                  <div key={i}>
                    {amt.label}: €{(amt.value || 0).toLocaleString('de-DE')}
                  </div>
                ))}
              </div>
            )}

            {document.notes && (
              <Alert className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">{document.notes}</AlertDescription>
              </Alert>
            )}

            <div className="text-xs text-slate-500 pt-2">
              Hochgeladen: {new Date(document.uploaded_at).toLocaleDateString('de-DE')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}