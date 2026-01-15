import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Upload, Loader2, FileText, Tag, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function AIDocumentAnalyzer() {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast.error('Bitte Datei auswählen');
      return;
    }

    setAnalyzing(true);
    try {
      // Datei hochladen
      const uploadResponse = await base44.integrations.Core.UploadFile({
        file
      });

      // Kategorisierung durchführen
      const categorizeResponse = await base44.functions.invoke('categorizeDocumentAI', {
        documentUrl: uploadResponse.data.file_url,
        documentName: file.name
      });

      // Wenn Rechnung, zusätzlich Daten extrahieren
      let invoiceData = null;
      if (categorizeResponse.data.classification.category === 'INVOICE') {
        const invoiceResponse = await base44.functions.invoke('extractInvoiceData', {
          invoiceUrl: uploadResponse.data.file_url
        });
        invoiceData = invoiceResponse.data.invoice_data;
      }

      setResult({
        classification: categorizeResponse.data.classification,
        invoice: invoiceData,
        fileUrl: uploadResponse.data.file_url
      });

      toast.success('Analyse abgeschlossen');
    } catch (error) {
      toast.error('Analyse fehlgeschlagen: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      LEASE_CONTRACT: 'bg-blue-100 text-blue-900',
      OPERATING_COSTS: 'bg-purple-100 text-purple-900',
      INVOICE: 'bg-green-100 text-green-900',
      REPAIR_REQUEST: 'bg-yellow-100 text-yellow-900',
      PAYMENT_CONFIRMATION: 'bg-cyan-100 text-cyan-900',
      INSPECTION_REPORT: 'bg-pink-100 text-pink-900',
      HANDOVER_PROTOCOL: 'bg-indigo-100 text-indigo-900',
      OTHER: 'bg-gray-100 text-gray-900'
    };
    return colors[category] || 'bg-gray-100 text-gray-900';
  };

  const getCategoryLabel = (category) => {
    const labels = {
      LEASE_CONTRACT: 'Mietvertrag',
      OPERATING_COSTS: 'Betriebskosten',
      INVOICE: 'Rechnung',
      REPAIR_REQUEST: 'Reparaturanfrage',
      PAYMENT_CONFIRMATION: 'Zahlungsbestätigung',
      INSPECTION_REPORT: 'Inspektionsbericht',
      HANDOVER_PROTOCOL: 'Übergabeprotokoll',
      OTHER: 'Sonstiges'
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            KI-Dokumentanalyse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Zone */}
          <div
            className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => document.getElementById('file-input').click()}
          >
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-medium text-slate-900">
              {file ? file.name : 'Datei auswählen oder hier ablegen'}
            </p>
            <p className="text-xs text-slate-500">PDF, Bilder oder Dokumente</p>
            <input
              id="file-input"
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
          </div>

          {/* Analyze Button */}
          <Button
            onClick={handleAnalyze}
            disabled={!file || analyzing}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analysiere...
              </>
            ) : (
              'Analysieren'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Classification Result */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-base">Klassifizierung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Kategorie</p>
                  <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${getCategoryColor(result.classification.category)}`}>
                    {getCategoryLabel(result.classification.category)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">Sicherheit</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {(result.classification.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-600 mb-1">Zusammenfassung</p>
                <p className="text-sm text-slate-900">{result.classification.summary}</p>
              </div>

              {result.classification.tags.length > 0 && (
                <div>
                  <p className="text-sm text-slate-600 mb-2 flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.classification.tags.map((tag, idx) => (
                      <span key={idx} className="bg-white px-3 py-1 rounded-full text-xs border border-blue-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Data */}
          {result.invoice && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-base">Extrahierte Daten</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">Anbieter</p>
                    <p className="font-medium">{result.invoice.vendor}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Rechnungsnummer</p>
                    <p className="font-medium">{result.invoice.invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Datum</p>
                    <p className="font-medium">{new Date(result.invoice.invoice_date).toLocaleDateString('de-DE')}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Betrag</p>
                    <p className="font-medium">€{result.invoice.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Kategorie</p>
                    <p className="font-medium">{result.invoice.category}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Steuersatz</p>
                    <p className="font-medium">{(result.invoice.tax_rate * 100).toFixed(0)}%</p>
                  </div>
                </div>

                {result.invoice.description && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-slate-600 text-sm">Beschreibung</p>
                    <p className="text-sm mt-1">{result.invoice.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}