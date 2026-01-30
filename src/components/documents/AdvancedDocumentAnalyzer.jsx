import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader, Search } from 'lucide-react';
import { toast } from 'sonner';

const DOCUMENT_TYPES = [
    { value: 'invoice', label: 'Rechnung' },
    { value: 'receipt', label: 'Beleg' },
    { value: 'contract', label: 'Vertrag' },
    { value: 'letter', label: 'Brief' },
    { value: 'report', label: 'Bericht' },
    { value: 'other', label: 'Sonstiges' }
];

export default function AdvancedDocumentAnalyzer() {
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [documentType, setDocumentType] = useState('invoice');
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);

    const handleFileSelect = (file) => {
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error('Datei zu groß (max. 10 MB)');
            return;
        }

        setSelectedFile(file);
        setResult(null);
    };

    const handleAnalyze = async () => {
        if (!selectedFile) {
            toast.error('Bitte wählen Sie eine Datei');
            return;
        }

        setAnalyzing(true);

        try {
            // Upload file
            const { file_url } = await base44.integrations.Core.UploadFile({
                file: selectedFile
            });

            // Start analysis
            const { analysis_id } = await base44.functions.invoke('analyzeDocumentAdvanced', {
                document_name: selectedFile.name,
                file_url,
                document_type: documentType
            });

            // Poll for completion
            let attempts = 0;
            const pollInterval = setInterval(async () => {
                attempts++;
                const data = await base44.entities.DocumentAnalysis.list(undefined, 1, { id: analysis_id });
                
                if (data && data.length > 0) {
                    const analysis = data[0];
                    if (analysis.analysis_status === 'completed') {
                        clearInterval(pollInterval);
                        setResult(analysis);
                        setAnalyzing(false);
                        toast.success('Analyse abgeschlossen');
                    } else if (analysis.analysis_status === 'failed') {
                        clearInterval(pollInterval);
                        setAnalyzing(false);
                        toast.error('Analyse fehlgeschlagen');
                    }
                }

                if (attempts > 30) { // 30 Sekunden timeout
                    clearInterval(pollInterval);
                    setAnalyzing(false);
                    toast.error('Timeout - Analyse dauert zu lange');
                }
            }, 1000);

        } catch (error) {
            toast.error(`Fehler: ${error.message}`);
            setAnalyzing(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Upload Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Erweiterte Dokumentanalyse
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* File Upload */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={(e) => handleFileSelect(e.target.files[0])}
                            className="hidden"
                            accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.txt"
                        />
                        
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                                selectedFile ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            {selectedFile ? (
                                <div>
                                    <FileText className="w-10 h-10 text-green-600 mx-auto mb-2" />
                                    <p className="font-medium text-green-700">{selectedFile.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                    <p className="font-semibold text-gray-700">Datei hochladen</p>
                                    <p className="text-sm text-gray-500 mt-1">PDF, DOCX, Bilder (max. 10 MB)</p>
                                </>
                            )}
                        </div>

                        {/* Document Type */}
                        {selectedFile && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Dokumenttyp</label>
                                <select
                                    value={documentType}
                                    onChange={(e) => setDocumentType(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                >
                                    {DOCUMENT_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Analyze Button */}
                        <Button
                            onClick={handleAnalyze}
                            disabled={!selectedFile || analyzing}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                            {analyzing ? (
                                <>
                                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                                    Analysiert...
                                </>
                            ) : (
                                <>
                                    <Search className="w-4 h-4 mr-2" />
                                    Dokument analysieren
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            {result && (
                <div className="space-y-4">
                    {/* Summary */}
                    {result.summary && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Zusammenfassung</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-700">{result.summary}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Extracted Data */}
                    {result.extracted_data && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Extrahierte Daten</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {Object.entries(result.extracted_data).map(([key, value]) => {
                                        if (!value || key === 'line_items') return null;
                                        return (
                                            <div key={key} className="text-sm">
                                                <span className="font-medium capitalize">
                                                    {key.replace(/_/g, ' ')}:
                                                </span>{' '}
                                                <span className="text-gray-700">
                                                    {typeof value === 'number' ? value.toFixed(2) : value}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Line Items */}
                                {result.extracted_data.line_items && result.extracted_data.line_items.length > 0 && (
                                    <div className="mt-4 pt-4 border-t">
                                        <h5 className="font-semibold text-sm mb-2">Positionen:</h5>
                                        <div className="space-y-2">
                                            {result.extracted_data.line_items.map((item, i) => (
                                                <div key={i} className="text-xs p-2 bg-gray-50 rounded">
                                                    {item.description} - {item.quantity}x {item.unit_price} = {item.total}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Keywords & Sentiment */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">KI-Analyse</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Keywords */}
                            {result.keywords && result.keywords.length > 0 && (
                                <div>
                                    <h5 className="text-xs font-semibold text-gray-600 mb-2">Schlüsselwörter:</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {result.keywords.map((keyword, i) => (
                                            <Badge key={i} variant="outline">{keyword}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sentiment */}
                            {result.sentiment_label && (
                                <div>
                                    <h5 className="text-xs font-semibold text-gray-600 mb-2">Sentiment:</h5>
                                    <Badge className={
                                        result.sentiment_label.includes('positive') 
                                            ? 'bg-green-100 text-green-800' :
                                        result.sentiment_label.includes('negative')
                                            ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                    }>
                                        {result.sentiment_label} {result.sentiment_score && `(${result.sentiment_score})`}
                                    </Badge>
                                </div>
                            )}

                            {/* Confidence */}
                            {result.confidence_score && (
                                <div>
                                    <h5 className="text-xs font-semibold text-gray-600 mb-2">Vertrauenswert:</h5>
                                    <Badge variant="outline">{result.confidence_score}%</Badge>
                                </div>
                            )}

                            {/* Language */}
                            {result.language && (
                                <div>
                                    <h5 className="text-xs font-semibold text-gray-600 mb-2">Sprache:</h5>
                                    <Badge variant="outline">{result.language.toUpperCase()}</Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}