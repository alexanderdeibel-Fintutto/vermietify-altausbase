import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Sparkles, CheckCircle } from 'lucide-react';
import AdvancedTemplateEditor from './AdvancedTemplateEditor';

const STEPS = {
    UPLOAD: 1,
    ANALYZING: 2,
    PREVIEW: 3
};

export default function PDFTemplateImporter({ open, onOpenChange }) {
    const [currentStep, setCurrentStep] = useState(STEPS.UPLOAD);
    const [uploading, setUploading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [generatedTemplate, setGeneratedTemplate] = useState(null);
    const [editorOpen, setEditorOpen] = useState(false);

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || file.type !== 'application/pdf') {
            alert('Bitte eine PDF-Datei hochladen');
            return;
        }

        setUploading(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setPdfUrl(file_url);
            setCurrentStep(STEPS.ANALYZING);
            await analyzeDocument(file_url);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Fehler beim Hochladen');
        } finally {
            setUploading(false);
        }
    };

    const analyzeDocument = async (fileUrl) => {
        setAnalyzing(true);
        try {
            const prompt = `
Du bist ein Experte für Dokumentenanalyse. Analysiere dieses PDF-Dokument und erstelle daraus eine strukturierte Vorlage.

AUFGABE:
1. Identifiziere die Dokumentstruktur (Header, Body, Footer, Tabellen)
2. Erkenne wiederverwendbare Felder als Platzhalter (Namen, Adressen, Daten, etc.)
3. Erstelle HTML mit CSS für das Layout
4. Identifiziere Tabellen und ihre Struktur

AUSGABE als JSON mit dieser Struktur:
{
  "name": "Dokumentenname",
  "category": "Übergabeprotokolle|Mietrecht|Verwaltung|Finanzen",
  "header_html": "HTML für Kopfbereich mit Logo-Platzhalter",
  "content": "HTML für Hauptinhalt mit Platzhaltern wie {{tenant.first_name}}, {{building.address}}, etc.",
  "footer_html": "HTML für Fußbereich",
  "required_data_sources": ["building", "unit", "tenant", "contract", "meter"],
  "page_format": "A4",
  "margins": {"top": "20mm", "bottom": "20mm", "left": "20mm", "right": "20mm"},
  "styles": {
    "font_family": "Arial, sans-serif",
    "font_size": "11pt",
    "primary_color": "#000000",
    "secondary_color": "#666666"
  },
  "tables": [
    {
      "id": "meters",
      "title": "Zählerstände",
      "data_source": "meter",
      "columns": [
        {"field": "meter_type", "label": "Typ", "width": "150px"},
        {"field": "meter_number", "label": "Nummer", "width": "150px"}
      ]
    }
  ]
}

WICHTIGE PLATZHALTER:
- Gebäude: {{building.name}}, {{building.address}}, {{building.city}}, {{building.postal_code}}
- Wohnung: {{unit.unit_number}}, {{unit.floor}}, {{unit.sqm}}, {{unit.rooms}}
- Mieter: {{tenant.first_name}}, {{tenant.last_name}}, {{tenant.email}}, {{tenant.phone}}
- Vertrag: {{contract.start_date}}, {{contract.base_rent}}, {{contract.total_rent}}
- Datum: {{date.today}}, {{date.now}}

Nutze moderne CSS für das Layout (flexbox, grid). Erstelle ein professionelles, druckbares Design.
`;

            const response = await base44.integrations.Core.InvokeLLM({
                prompt,
                file_urls: [fileUrl],
                add_context_from_internet: false,
                response_json_schema: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        category: { type: "string" },
                        header_html: { type: "string" },
                        content: { type: "string" },
                        footer_html: { type: "string" },
                        required_data_sources: { type: "array", items: { type: "string" } },
                        page_format: { type: "string" },
                        margins: { type: "object" },
                        styles: { type: "object" },
                        tables: { type: "array" }
                    }
                }
            });

            setGeneratedTemplate(response);
            setCurrentStep(STEPS.PREVIEW);
        } catch (error) {
            console.error('Analysis error:', error);
            alert('Fehler bei der Analyse');
            setCurrentStep(STEPS.UPLOAD);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSaveTemplate = () => {
        setEditorOpen(true);
    };

    const handleReset = () => {
        setCurrentStep(STEPS.UPLOAD);
        setPdfUrl(null);
        setGeneratedTemplate(null);
    };

    const handleEditorClose = (saved) => {
        setEditorOpen(false);
        if (saved) {
            onOpenChange(false);
            handleReset();
        }
    };

    return (
        <>
            <Dialog open={open && !editorOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                            Template aus PDF importieren
                        </DialogTitle>
                    </DialogHeader>

                    {/* Progress */}
                    <div className="mb-6">
                        <Progress value={(currentStep / 3) * 100} />
                        <div className="flex justify-between text-sm text-slate-600 mt-2">
                            <span className={currentStep >= 1 ? 'text-emerald-600 font-medium' : ''}>1. Upload</span>
                            <span className={currentStep >= 2 ? 'text-emerald-600 font-medium' : ''}>2. KI-Analyse</span>
                            <span className={currentStep >= 3 ? 'text-emerald-600 font-medium' : ''}>3. Vorschau</span>
                        </div>
                    </div>

                    {/* Step 1: Upload */}
                    {currentStep === STEPS.UPLOAD && (
                        <Card className="p-12 text-center border-2 border-dashed">
                            <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">PDF-Dokument hochladen</h3>
                            <p className="text-sm text-slate-600 mb-6">
                                Das Dokument wird automatisch analysiert und in eine bearbeitbare Vorlage umgewandelt
                            </p>
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="pdf-import"
                            />
                            <label htmlFor="pdf-import">
                                <Button asChild disabled={uploading}>
                                    <span>
                                        <Upload className="w-4 h-4 mr-2" />
                                        {uploading ? 'Lädt hoch...' : 'PDF auswählen'}
                                    </span>
                                </Button>
                            </label>
                        </Card>
                    )}

                    {/* Step 2: Analyzing */}
                    {currentStep === STEPS.ANALYZING && (
                        <Card className="p-12 text-center">
                            <div className="animate-pulse">
                                <Sparkles className="w-16 h-16 mx-auto text-purple-600 mb-4" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">KI analysiert Dokument...</h3>
                            <p className="text-sm text-slate-600 mb-4">
                                Layout wird erkannt, Platzhalter identifiziert, Tabellen strukturiert
                            </p>
                            <div className="w-64 mx-auto">
                                <Progress value={50} className="animate-pulse" />
                            </div>
                        </Card>
                    )}

                    {/* Step 3: Preview */}
                    {currentStep === STEPS.PREVIEW && generatedTemplate && (
                        <div className="space-y-4">
                            <Card className="p-4 bg-emerald-50 border-emerald-200">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-emerald-900">Template erfolgreich generiert!</h3>
                                        <p className="text-sm text-emerald-700">
                                            {generatedTemplate.name} - {generatedTemplate.required_data_sources?.length || 0} Datenquellen, 
                                            {generatedTemplate.tables?.length || 0} Tabellen erkannt
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-4">
                                <h4 className="font-semibold mb-3">Vorschau des generierten Templates</h4>
                                <div className="border rounded-lg overflow-hidden bg-white" style={{ height: '400px' }}>
                                    <iframe
                                        srcDoc={`
                                            <!DOCTYPE html>
                                            <html>
                                            <head>
                                                <meta charset="UTF-8">
                                                <style>
                                                    body {
                                                        font-family: ${generatedTemplate.styles?.font_family || 'Arial, sans-serif'};
                                                        font-size: ${generatedTemplate.styles?.font_size || '11pt'};
                                                        margin: 20px;
                                                    }
                                                    table {
                                                        width: 100%;
                                                        border-collapse: collapse;
                                                        margin: 20px 0;
                                                    }
                                                    table th, table td {
                                                        border: 1px solid #ccc;
                                                        padding: 8px;
                                                    }
                                                    table th {
                                                        background-color: #f0f0f0;
                                                    }
                                                </style>
                                            </head>
                                            <body>
                                                ${generatedTemplate.header_html || ''}
                                                <div>${generatedTemplate.content || ''}</div>
                                                ${generatedTemplate.footer_html || ''}
                                            </body>
                                            </html>
                                        `}
                                        className="w-full h-full"
                                        title="Template Preview"
                                    />
                                </div>
                            </Card>

                            <div className="flex justify-between">
                                <Button variant="outline" onClick={handleReset}>
                                    Neues Dokument
                                </Button>
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                                        Abbrechen
                                    </Button>
                                    <Button onClick={handleSaveTemplate} className="bg-emerald-600 hover:bg-emerald-700">
                                        Im Editor bearbeiten & speichern
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {editorOpen && generatedTemplate && (
                <AdvancedTemplateEditor
                    open={editorOpen}
                    onOpenChange={(open) => {
                        setEditorOpen(open);
                        if (!open) {
                            onOpenChange(false);
                            handleReset();
                        }
                    }}
                    initialData={generatedTemplate}
                />
            )}
        </>
    );
}