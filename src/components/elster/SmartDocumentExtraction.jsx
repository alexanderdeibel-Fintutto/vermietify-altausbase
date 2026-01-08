import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileUp, Sparkles, CheckCircle, AlertCircle, 
  Loader2, Download, Eye 
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SmartDocumentExtraction() {
  const [uploading, setUploading] = useState(false);
  const [extractionResults, setExtractionResults] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setProgress(0);

    const results = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(((i + 1) / files.length) * 100);

        // Upload file
        const uploadResponse = await base44.integrations.Core.UploadFile({ file });

        // Extract data with AI
        const extractionResponse = await base44.integrations.Core.InvokeLLM({
          prompt: `Extrahiere alle steuerrelevanten Informationen aus diesem Dokument (Rechnung, Beleg, Vertrag).

Identifiziere:
- Dokumenttyp
- Datum
- Betrag (Brutto, Netto, USt)
- Lieferant/Empfänger
- Beschreibung/Leistung
- Kategorie (z.B. Instandhaltung, Verwaltung, Betriebskosten)
- Steuersatz
- Belegnummer
- Zuordnung zu Steuerkategorie`,
          file_urls: [uploadResponse.file_url],
          response_json_schema: {
            type: 'object',
            properties: {
              document_type: { type: 'string' },
              date: { type: 'string' },
              amount_gross: { type: 'number' },
              amount_net: { type: 'number' },
              vat_amount: { type: 'number' },
              vat_rate: { type: 'number' },
              supplier: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              tax_category: { type: 'string' },
              document_number: { type: 'string' },
              confidence: { type: 'number' }
            }
          }
        });

        results.push({
          file_name: file.name,
          file_url: uploadResponse.file_url,
          extracted_data: extractionResponse,
          status: 'success'
        });
      }

      setExtractionResults(results);
      toast.success(`${results.length} Dokumente erfolgreich verarbeitet`);
    } catch (error) {
      toast.error('Extraktion fehlgeschlagen');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateBookings = async () => {
    try {
      const bookings = extractionResults.map(r => ({
        date: r.extracted_data.date,
        amount: r.extracted_data.amount_net,
        description: r.extracted_data.description,
        category: r.extracted_data.tax_category,
        supplier: r.extracted_data.supplier,
        document_url: r.file_url
      }));

      await base44.functions.invoke('bulkCreateFinancialItems', { items: bookings });
      
      toast.success(`${bookings.length} Buchungen erstellt`);
      setExtractionResults(null);
    } catch (error) {
      toast.error('Buchungserstellung fehlgeschlagen');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          KI-gestützte Beleg-Extraktion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!extractionResults ? (
          <>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileUp className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 mb-4">
                Rechnungen, Belege oder Verträge hochladen
              </p>
              <p className="text-sm text-slate-500 mb-4">
                KI extrahiert automatisch alle steuerrelevanten Daten
              </p>
              <input
                type="file"
                className="hidden"
                id="document-upload"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload(Array.from(e.target.files || []))}
              />
              <Button
                onClick={() => document.getElementById('document-upload')?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileUp className="w-4 h-4 mr-2" />
                )}
                Dokumente auswählen
              </Button>
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Verarbeite Dokumente...</span>
                  <span>{progress.toFixed(0)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
          </>
        ) : (
          <>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">
                  {extractionResults.length} Dokumente verarbeitet
                </span>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {extractionResults.map((result, idx) => (
                <div key={idx} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-medium text-sm mb-1">{result.file_name}</div>
                      <Badge variant="outline" className="text-xs">
                        {result.extracted_data.document_type}
                      </Badge>
                    </div>
                    <Badge className={
                      result.extracted_data.confidence >= 90 ? 'bg-green-100 text-green-800' :
                      result.extracted_data.confidence >= 70 ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {result.extracted_data.confidence}% Konfidenz
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-600">Datum:</span>
                      <div className="font-medium">{result.extracted_data.date}</div>
                    </div>
                    <div>
                      <span className="text-slate-600">Betrag:</span>
                      <div className="font-medium">
                        {result.extracted_data.amount_gross?.toLocaleString('de-DE')} €
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-600">Lieferant:</span>
                      <div className="font-medium">{result.extracted_data.supplier}</div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-600">Kategorie:</span>
                      <div className="font-medium">{result.extracted_data.tax_category}</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(result.file_url, '_blank')}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Dokument anzeigen
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreateBookings}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Buchungen erstellen
              </Button>
              <Button
                variant="outline"
                onClick={() => setExtractionResults(null)}
                className="flex-1"
              >
                Neue Extraktion
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}