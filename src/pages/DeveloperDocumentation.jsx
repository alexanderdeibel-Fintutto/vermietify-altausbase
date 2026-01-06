import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
    FileText, 
    Download, 
    Eye, 
    Loader2, 
    RefreshCw, 
    CheckCircle, 
    AlertCircle,
    FileJson,
    Code,
    Database,
    Network,
    Settings,
    FileSpreadsheet,
    Workflow,
    Shield,
    AlertTriangle,
    Archive,
    BookOpen,
    Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ReactMarkdown from 'react-markdown';

const DOCUMENTATION_TYPES = [
    {
        type: 'database_structure',
        title: 'Datenbankstruktur',
        description: 'Vollständige Datenbank-Dokumentation aller Tabellen, Felder, Beziehungen und Constraints',
        icon: Database,
        estimatedSize: '500 KB',
        estimatedDuration: 30
    },
    {
        type: 'module_architecture',
        title: 'Modul-Architektur',
        description: 'Übersicht aller Module, deren Abhängigkeiten und Datenflüsse',
        icon: Network,
        estimatedSize: '200 KB',
        estimatedDuration: 20
    },
    {
        type: 'master_data',
        title: 'Master Data & Konstanten',
        description: 'Alle Auswahloptionen, Kategorien und festen Werte des Systems',
        icon: FileSpreadsheet,
        estimatedSize: '300 KB',
        estimatedDuration: 15
    },
    {
        type: 'business_logic',
        title: 'Geschäftslogik & Validierungen',
        description: 'Alle Geschäftsregeln, Validierungen, Berechnungen und Automatismen',
        icon: Settings,
        estimatedSize: '400 KB',
        estimatedDuration: 25
    },
    {
        type: 'external_integrations',
        title: 'Externe Integrationen',
        description: 'Dokumentation aller API-Verbindungen und externen Services',
        icon: Code,
        estimatedSize: '150 KB',
        estimatedDuration: 10
    },
    {
        type: 'document_generation',
        title: 'Dokumenten-Generierung',
        description: 'Vollständige Beschreibung aller automatischen Dokumenten-Templates',
        icon: FileText,
        estimatedSize: '350 KB',
        estimatedDuration: 20
    },
    {
        type: 'user_workflows',
        title: 'User-Workflows',
        description: 'Schritt-für-Schritt Dokumentation aller wichtigen Benutzer-Prozesse',
        icon: Workflow,
        estimatedSize: '400 KB',
        estimatedDuration: 25
    },
    {
        type: 'permissions_roles',
        title: 'Berechtigungen & Rollen',
        description: 'Dokumentation des Rollen- und Berechtigungssystems',
        icon: Shield,
        estimatedSize: '100 KB',
        estimatedDuration: 10
    },
    {
        type: 'error_handling',
        title: 'Fehlerbehandlung & Logging',
        description: 'Übersicht über Fehlerbehandlung, Logging und Monitoring',
        icon: AlertTriangle,
        estimatedSize: '150 KB',
        estimatedDuration: 10
    },
    {
        type: 'data_migration',
        title: 'Daten-Migration & Historisierung',
        description: 'Dokumentation der Historisierung und Daten-Migration',
        icon: Archive,
        estimatedSize: '100 KB',
        estimatedDuration: 10
    },
    {
        type: 'executive_summary',
        title: 'Executive Summary',
        description: 'Kompakte Gesamtübersicht der App-Architektur (1-2 Seiten)',
        icon: BookOpen,
        estimatedSize: '50 KB',
        estimatedDuration: 5
    }
];

export default function DeveloperDocumentation() {
    const [previewDoc, setPreviewDoc] = useState(null);
    const [generatingAll, setGeneratingAll] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [currentGenerating, setCurrentGenerating] = useState(null);
    const [progress, setProgress] = useState(0);
    const queryClient = useQueryClient();

    const { data: documentations = [], isLoading } = useQuery({
        queryKey: ['generated-documentations'],
        queryFn: () => base44.entities.GeneratedDocumentation.list('-last_generated_at')
    });

    const { data: lastUpdate } = useQuery({
        queryKey: ['last-documentation-update'],
        queryFn: () => {
            const latest = documentations.reduce((max, doc) => {
                if (!doc.last_generated_at) return max;
                const docDate = new Date(doc.last_generated_at);
                return !max || docDate > max ? docDate : max;
            }, null);
            return latest;
        },
        enabled: documentations.length > 0
    });

    const generateMutation = useMutation({
        mutationFn: async (docType) => {
            const response = await base44.functions.invoke('generateDocumentation', {
                documentation_type: docType
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['generated-documentations'] });
            toast.success('Dokumentation erfolgreich generiert');
        },
        onError: (error) => {
            toast.error('Fehler beim Generieren: ' + error.message);
        }
    });

    const handleGenerateAll = async () => {
        setGeneratingAll(true);
        setProgress(0);
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < DOCUMENTATION_TYPES.length; i++) {
            const docType = DOCUMENTATION_TYPES[i];
            setCurrentGenerating(docType.title);
            setProgress(((i + 1) / DOCUMENTATION_TYPES.length) * 100);
            
            try {
                await generateMutation.mutateAsync(docType.type);
                successCount++;
            } catch (error) {
                errorCount++;
                console.error(`Failed to generate ${docType.type}:`, error);
            }
        }
        
        setGeneratingAll(false);
        setCurrentGenerating(null);
        setProgress(0);
        toast.success(`Fertig: ${successCount} erfolgreich, ${errorCount} Fehler`);
    };

    const handleDownloadMarkdown = (doc) => {
        const blob = new Blob([doc.content_markdown], { type: 'text/markdown' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.documentation_type}_${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    };

    const handleDownloadJSON = (doc) => {
        const blob = new Blob([JSON.stringify(doc.content_json, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.documentation_type}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    };

    const handleDownloadPDF = async (doc) => {
        try {
            // Konvertiere Markdown zu HTML mit Styling
            const ReactMarkdown = (await import('react-markdown')).default;
            const { renderToString } = await import('react-dom/server');
            
            const htmlContent = renderToString(
                <ReactMarkdown>{doc.content_markdown}</ReactMarkdown>
            );
            
            const styledHtml = `
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            padding: 40px; 
                            line-height: 1.6;
                            color: #333;
                        }
                        h1 { 
                            color: #10b981; 
                            border-bottom: 2px solid #10b981; 
                            padding-bottom: 10px;
                        }
                        h2 { 
                            color: #059669; 
                            margin-top: 30px;
                        }
                        h3 { 
                            color: #047857;
                        }
                        code { 
                            background: #f3f4f6; 
                            padding: 2px 6px; 
                            border-radius: 3px;
                            font-family: 'Courier New', monospace;
                        }
                        pre { 
                            background: #1f2937; 
                            color: #f9fafb; 
                            padding: 15px; 
                            border-radius: 5px;
                            overflow-x: auto;
                        }
                        pre code {
                            background: transparent;
                            color: #f9fafb;
                        }
                        table { 
                            border-collapse: collapse; 
                            width: 100%; 
                            margin: 20px 0;
                        }
                        th, td { 
                            border: 1px solid #d1d5db; 
                            padding: 12px; 
                            text-align: left;
                        }
                        th { 
                            background: #f3f4f6; 
                            font-weight: bold;
                        }
                        blockquote {
                            border-left: 4px solid #10b981;
                            padding-left: 20px;
                            margin-left: 0;
                            color: #666;
                        }
                    </style>
                </head>
                <body>${htmlContent}</body>
                </html>
            `;
            
            const response = await base44.functions.invoke('generatePDF', {
                html: styledHtml,
                fileName: `${doc.documentation_type}.pdf`
            });
            
            if (response.data?.file_url) {
                window.open(response.data.file_url, '_blank');
            }
        } catch (error) {
            toast.error('PDF-Generierung fehlgeschlagen: ' + error.message);
        }
    };

    const getDocumentation = (type) => {
        return documentations.find(d => d.documentation_type === type);
    };

    const formatBytes = (bytes) => {
        if (!bytes) return '0 KB';
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(0)} KB`;
        return `${(kb / 1024).toFixed(1)} MB`;
    };

    if (isLoading) {
        return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Entwickler-Dokumentation</h1>
                <p className="text-slate-600 mt-2">
                    Automatische App-Dokumentation für KI-Assistenten
                </p>
                {lastUpdate && (
                    <p className="text-sm text-slate-500 mt-1">
                        Letzte Aktualisierung: {format(lastUpdate, 'dd.MM.yyyy HH:mm:ss', { locale: de })} Uhr
                    </p>
                )}
            </div>

            {/* Info Box */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <Code className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <p className="text-blue-900 font-medium">KI-Assistent Integration</p>
                            <p className="text-blue-700 text-sm mt-1">
                                Diese Dokumentationen können direkt an KI-Assistenten wie Claude übergeben werden, 
                                um vollständiges Verständnis der App-Architektur zu ermöglichen.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Auswahl-Buttons */}
            {DOCUMENTATION_TYPES.length > 0 && (
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedTypes(DOCUMENTATION_TYPES.map(t => t.type))}
                    >
                        Alle auswählen
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedTypes([])}
                    >
                        Keine auswählen
                    </Button>
                </div>
            )}

            {/* Sammel-Aktionen */}
            <div className="flex gap-3 flex-wrap">
                <Button 
                    onClick={handleGenerateAll}
                    disabled={generatingAll}
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    {generatingAll ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            {currentGenerating}...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="w-5 h-5 mr-2" />
                            Alle Dokumentationen generieren
                        </>
                    )}
                </Button>
                <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => {
                        const allDocs = documentations.filter(d => d.content_markdown);
                        if (allDocs.length === 0) {
                            toast.error('Keine Dokumentationen zum Download vorhanden');
                            return;
                        }
                        const combined = allDocs.map(d => `# ${d.title}\n\n${d.content_markdown}`).join('\n\n---\n\n');
                        const blob = new Blob([combined], { type: 'text/markdown' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `complete_documentation_${Date.now()}.md`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        a.remove();
                    }}
                >
                    <Download className="w-5 h-5 mr-2" />
                    Alle als Markdown
                </Button>
                <Button 
                    variant="outline" 
                    size="lg"
                    onClick={async () => {
                        const allDocs = documentations.filter(d => d.content_markdown);
                        if (allDocs.length === 0) {
                            toast.error('Keine Dokumentationen zum Download vorhanden');
                            return;
                        }
                        
                        const JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;
                        const zip = new JSZip();
                        
                        allDocs.forEach(doc => {
                            zip.file(`${doc.documentation_type}.md`, doc.content_markdown);
                            if (doc.content_json) {
                                zip.file(`${doc.documentation_type}.json`, JSON.stringify(doc.content_json, null, 2));
                            }
                        });
                        
                        const content = await zip.generateAsync({ type: 'blob' });
                        const url = window.URL.createObjectURL(content);
                        const a = document.createElement('a');
                        a.href = url;
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                        a.download = `app-dokumentation-${timestamp}.zip`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        a.remove();
                        toast.success('ZIP-Archiv erstellt');
                    }}
                >
                    <Archive className="w-5 h-5 mr-2" />
                    Alle als ZIP
                </Button>
                <Button 
                    variant="outline" 
                    size="lg"
                    onClick={async () => {
                        if (selectedTypes.length === 0) {
                            toast.error('Bitte wählen Sie mindestens eine Dokumentation aus');
                            return;
                        }
                        
                        setGeneratingAll(true);
                        let successCount = 0;
                        let errorCount = 0;
                        
                        for (const type of selectedTypes) {
                            try {
                                await generateMutation.mutateAsync(type);
                                successCount++;
                            } catch (error) {
                                errorCount++;
                                console.error(`Failed to generate ${type}:`, error);
                            }
                        }
                        
                        setGeneratingAll(false);
                        setSelectedTypes([]);
                        toast.success(`${successCount} Dokumentationen generiert, ${errorCount} Fehler`);
                    }}
                    disabled={selectedTypes.length === 0 || generatingAll}
                >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Ausgewählte generieren ({selectedTypes.length})
                </Button>
                <Button 
                    variant="outline" 
                    size="lg"
                    onClick={async () => {
                        if (!confirm('Wirklich alle Dokumentationen löschen? Dies kann nicht rückgängig gemacht werden.')) {
                            return;
                        }
                        
                        try {
                            for (const doc of documentations) {
                                await base44.entities.GeneratedDocumentation.delete(doc.id);
                            }
                            queryClient.invalidateQueries({ queryKey: ['generated-documentations'] });
                            toast.success('Alle Dokumentationen gelöscht');
                        } catch (error) {
                            toast.error('Fehler beim Löschen: ' + error.message);
                        }
                    }}
                    className="text-red-600 hover:text-red-700"
                >
                    <Trash2 className="w-5 h-5 mr-2" />
                    Alle löschen
                </Button>
            </div>

            {/* Progress Bar */}
            {generatingAll && (
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-blue-900">
                                <span>Generierung läuft...</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Dokumentations-Bereiche */}
            <div className="grid gap-4">
                {DOCUMENTATION_TYPES.map((docType) => {
                    const doc = getDocumentation(docType.type);
                    const Icon = docType.icon;
                    const isGenerating = doc?.status === 'generating';

                    return (
                        <Card key={docType.type} className={selectedTypes.includes(docType.type) ? 'border-2 border-emerald-500' : ''}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                        <input
                                            type="checkbox"
                                            checked={selectedTypes.includes(docType.type)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedTypes([...selectedTypes, docType.type]);
                                                } else {
                                                    setSelectedTypes(selectedTypes.filter(t => t !== docType.type));
                                                }
                                            }}
                                            className="w-5 h-5 mt-2 cursor-pointer"
                                        />
                                        <Icon className="w-6 h-6 text-emerald-600 mt-1" />
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">{docType.title}</CardTitle>
                                            <CardDescription className="mt-1">
                                                {docType.description}
                                            </CardDescription>
                                            <div className="flex gap-4 mt-2 text-sm text-slate-600">
                                                <span>Geschätzte Größe: {docType.estimatedSize}</span>
                                                <span>•</span>
                                                <span>Geschätzte Dauer: ~{docType.estimatedDuration}s</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Status Badge */}
                                    <div>
                                        {!doc || doc.status === 'not_created' ? (
                                            <Badge variant="outline" className="text-slate-600">
                                                ❌ Nicht erstellt
                                            </Badge>
                                        ) : doc.status === 'generating' ? (
                                            <Badge className="bg-blue-100 text-blue-700">
                                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                In Erstellung...
                                            </Badge>
                                        ) : doc.status === 'completed' ? (
                                            <div className="text-right">
                                                {doc.last_generated_at && new Date(doc.last_generated_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? (
                                                    <Badge className="bg-yellow-100 text-yellow-700 mb-1">
                                                        ⚠️ Veraltet (>7 Tage)
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-emerald-100 text-emerald-700">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        ✅ Aktuell
                                                    </Badge>
                                                )}
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {format(new Date(doc.last_generated_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {formatBytes(doc.file_size_bytes)}
                                                </p>
                                                {doc.generation_duration_seconds && (
                                                    <p className="text-xs text-slate-500">
                                                        {doc.generation_duration_seconds.toFixed(1)}s
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <Badge className="bg-red-100 text-red-700">
                                                <AlertCircle className="w-3 h-3 mr-1" />
                                                Fehler
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2 flex-wrap">
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => generateMutation.mutate(docType.type)}
                                        disabled={isGenerating || generatingAll}
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                                Generiere...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="w-4 h-4 mr-1" />
                                                Generieren
                                            </>
                                        )}
                                    </Button>

                                    {doc?.status === 'completed' && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPreviewDoc(doc)}
                                            >
                                                <Eye className="w-4 h-4 mr-1" />
                                                Vorschau
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDownloadMarkdown(doc)}
                                            >
                                                <Download className="w-4 h-4 mr-1" />
                                                MD
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDownloadPDF(doc)}
                                            >
                                                <FileText className="w-4 h-4 mr-1" />
                                                PDF
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDownloadJSON(doc)}
                                            >
                                                <FileJson className="w-4 h-4 mr-1" />
                                                JSON
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Preview Dialog */}
            <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{previewDoc?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="prose prose-slate max-w-none">
                        <ReactMarkdown>{previewDoc?.content_markdown || ''}</ReactMarkdown>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}