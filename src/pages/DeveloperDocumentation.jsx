import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    Trash2,
    Clock,
    Play,
    Search,
    History,
    Copy,
    BarChart3,
    FileCheck,
    Package,
    Star,
    MessageSquare,
    Zap,
    User,
    CalendarDays,
    Bug,
    Highlighter
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import ReactMarkdown from 'react-markdown';
import { cn } from "@/lib/utils";
import DocumentationAdvancedFilters from '@/components/documentation/DocumentationAdvancedFilters';
import DocumentationFulltextSearch from '@/components/documentation/DocumentationFulltextSearch';

const PRIORITY_TYPES = [
    {
        type: 'sample_data',
        title: 'Beispiel-Daten & Szenarien',
        description: 'Anonymisierte Beispiel-Daten typischer Objekte mit vollständigen User-Journeys und realistischen Nutzungsszenarien',
        icon: User,
        estimatedSize: '600 KB',
        estimatedDuration: 40,
        priority: true,
        group: 'priority'
    },
    {
        type: 'user_issues',
        title: 'Häufige Probleme & FAQ',
        description: 'Top 20 User-Fragen, typische Fehler, bekannte Bugs, Limitierungen, Edge-Cases und deren Lösungen (statische Wissensdatenbank)',
        icon: Bug,
        estimatedSize: '300 KB',
        estimatedDuration: 25,
        priority: true,
        group: 'priority'
    }
];

const CORE_TYPES = [
    {
        type: 'database_structure',
        title: 'Datenbankstruktur',
        description: 'Vollständige Datenbank-Dokumentation aller Tabellen, Felder, Beziehungen und Constraints',
        icon: Database,
        estimatedSize: '500 KB',
        estimatedDuration: 30,
        group: 'core'
    },
    {
        type: 'module_architecture',
        title: 'Modul-Architektur',
        description: 'Übersicht aller Module, deren Abhängigkeiten und Datenflüsse',
        icon: Network,
        estimatedSize: '200 KB',
        estimatedDuration: 20,
        group: 'core'
    },
    {
        type: 'master_data',
        title: 'Master Data & Konstanten',
        description: 'Alle Auswahloptionen, Kategorien und festen Werte des Systems',
        icon: FileSpreadsheet,
        estimatedSize: '300 KB',
        estimatedDuration: 15,
        group: 'core'
    },
    {
        type: 'business_logic',
        title: 'Geschäftslogik & Validierungen',
        description: 'Alle Geschäftsregeln, Validierungen, Berechnungen und Automatismen',
        icon: Settings,
        estimatedSize: '400 KB',
        estimatedDuration: 25,
        group: 'core'
    },
    {
        type: 'external_integrations',
        title: 'Externe Integrationen',
        description: 'Dokumentation aller API-Verbindungen und externen Services',
        icon: Code,
        estimatedSize: '150 KB',
        estimatedDuration: 10,
        group: 'core'
    },
    {
        type: 'document_generation',
        title: 'Dokumenten-Generierung',
        description: 'Vollständige Beschreibung aller automatischen Dokumenten-Templates',
        icon: FileText,
        estimatedSize: '350 KB',
        estimatedDuration: 20,
        group: 'core'
    },
    {
        type: 'user_workflows',
        title: 'User-Workflows',
        description: 'Schritt-für-Schritt Dokumentation aller wichtigen Benutzer-Prozesse',
        icon: Workflow,
        estimatedSize: '400 KB',
        estimatedDuration: 25,
        group: 'core'
    },
    {
        type: 'permissions_roles',
        title: 'Berechtigungen & Rollen',
        description: 'Dokumentation des Rollen- und Berechtigungssystems',
        icon: Shield,
        estimatedSize: '100 KB',
        estimatedDuration: 10,
        group: 'core'
    },
    {
        type: 'error_handling',
        title: 'Fehlerbehandlung & Logging',
        description: 'Übersicht über Fehlerbehandlung, Logging und Monitoring',
        icon: AlertTriangle,
        estimatedSize: '150 KB',
        estimatedDuration: 10,
        group: 'core'
    },
    {
        type: 'data_migration',
        title: 'Daten-Migration & Historisierung',
        description: 'Dokumentation der Historisierung und Daten-Migration',
        icon: Archive,
        estimatedSize: '100 KB',
        estimatedDuration: 10,
        group: 'core'
    },
    {
        type: 'executive_summary',
        title: 'Executive Summary',
        description: 'Kompakte Gesamtübersicht der App-Architektur (1-2 Seiten)',
        icon: BookOpen,
        estimatedSize: '50 KB',
        estimatedDuration: 5,
        group: 'core'
    }
];

const CONTEXT_TYPES = [
    {
        type: 'timeline_calendar',
        title: 'Geschäftsprozesse & Zeitplanung',
        description: 'Jahreskalender, kritische Fristen, typische Tagesabläufe und saisonale Besonderheiten',
        icon: CalendarDays,
        estimatedSize: '200 KB',
        estimatedDuration: 15,
        group: 'context'
    }
];

const TECHNICAL_TYPES = [
    {
        type: 'performance_data',
        title: 'Performance-Metriken & Limits',
        description: 'Typische Datenmengen, Performance-kritische Operationen, System-Limits und Optimierungs-Strategien',
        icon: Zap,
        estimatedSize: '150 KB',
        estimatedDuration: 10,
        group: 'technical'
    },
    {
        type: 'coding_conventions',
        title: 'Code-Standards & Konventionen',
        description: 'Naming Conventions, Code-Organisation, Kommentar-Stil und Entwicklungs-Standards',
        icon: Code,
        estimatedSize: '100 KB',
        estimatedDuration: 10,
        group: 'technical'
    },
    {
        type: 'testing_qa',
        title: 'Testing & Qualitätssicherung',
        description: 'Test-Strategie, Test-Daten, QA-Prozess und Freigabe-Workflows',
        icon: CheckCircle,
        estimatedSize: '150 KB',
        estimatedDuration: 10,
        group: 'technical'
    }
];

const DOCUMENTATION_TYPES = [...PRIORITY_TYPES, ...CORE_TYPES, ...CONTEXT_TYPES, ...TECHNICAL_TYPES];

export default function DeveloperDocumentation() {
    const [previewDoc, setPreviewDoc] = useState(null);
    const [generatingAll, setGeneratingAll] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [currentGenerating, setCurrentGenerating] = useState(null);
    const [progress, setProgress] = useState(0);
    const [showScheduleDialog, setShowScheduleDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showVersionHistory, setShowVersionHistory] = useState(null);
    const [showExportPresets, setShowExportPresets] = useState(false);
    const [showFulltextSearch, setShowFulltextSearch] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState({
        status: null,
        daysOld: null,
        sizeRange: null
    });
    const queryClient = useQueryClient();

    const { data: documentations = [], isLoading } = useQuery({
        queryKey: ['generated-documentations'],
        queryFn: () => base44.entities.GeneratedDocumentation.list('-last_generated_at')
    });

    const { data: scheduledTasks = [] } = useQuery({
        queryKey: ['scheduled-tasks'],
        queryFn: async () => {
            try {
                const response = await base44.functions.invoke('listScheduledTasks', {});
                return response.data?.tasks || [];
            } catch (error) {
                console.error('Failed to fetch scheduled tasks:', error);
                return [];
            }
        }
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
            // Erstmal Status auf "generating" setzen
            const existing = documentations.find(d => d.documentation_type === docType);
            if (existing) {
                await base44.entities.GeneratedDocumentation.update(existing.id, {
                    status: 'generating'
                });
            } else {
                await base44.entities.GeneratedDocumentation.create({
                    documentation_type: docType,
                    title: DOCUMENTATION_TYPES.find(t => t.type === docType)?.title || docType,
                    description: DOCUMENTATION_TYPES.find(t => t.type === docType)?.description || '',
                    status: 'generating'
                });
            }
            queryClient.invalidateQueries({ queryKey: ['generated-documentations'] });

            let response;
            // Spezielle Funktionen für Prioritäts-Bereiche
            if (docType === 'sample_data') {
                response = await base44.functions.invoke('generateSampleData', { preset: 'komplett' });
            } else if (docType === 'user_issues') {
                response = await base44.functions.invoke('generateUserIssuesDocumentation', {});
            } 
            // Spezielle Funktionen für Kontext & Technische Bereiche
            else if (docType === 'timeline_calendar') {
                response = await base44.functions.invoke('generateTimelineDocumentation', {});
            } else if (docType === 'performance_data') {
                response = await base44.functions.invoke('generatePerformanceDocumentation', {});
            } else if (docType === 'coding_conventions') {
                response = await base44.functions.invoke('generateCodingConventionsDocumentation', {});
            } else if (docType === 'testing_qa') {
                response = await base44.functions.invoke('generateTestingDocumentation', {});
            } 
            // Fallback: Standard-Generierung
            else {
                response = await base44.functions.invoke('generateDocumentation_v2', {
                    documentation_type: docType
                });
            }
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['generated-documentations'] });
            toast.success('Dokumentation erfolgreich generiert');
        },
        onError: async (error, docType) => {
            console.error('Generation error:', error);
            // Status auf error setzen
            const existing = documentations.find(d => d.documentation_type === docType);
            if (existing) {
                await base44.entities.GeneratedDocumentation.update(existing.id, {
                    status: 'error',
                    error_message: error.message
                });
            }
            queryClient.invalidateQueries({ queryKey: ['generated-documentations'] });
            toast.error('Fehler beim Generieren: ' + error.message);
        }
    });

    const handleGenerateAll = async () => {
        setGeneratingAll(true);
        setProgress(0);
        let successCount = 0;
        let errorCount = 0;
        const timeout = 30000; // 30 Sekunden Timeout pro Dokumentation
        
        for (let i = 0; i < DOCUMENTATION_TYPES.length; i++) {
            const docType = DOCUMENTATION_TYPES[i];
            setCurrentGenerating(docType.title);
            setProgress(((i + 1) / DOCUMENTATION_TYPES.length) * 100);
            
            try {
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Generierung dauert zu lange')), timeout)
                );
                await Promise.race([generateMutation.mutateAsync(docType.type), timeoutPromise]);
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

    const applyAdvancedFilters = (docs) => {
        return docs.filter(doc => {
            if (advancedFilters.status && doc.status !== advancedFilters.status) return false;
            
            if (advancedFilters.daysOld && doc.last_generated_at) {
                const now = new Date();
                const docDate = new Date(doc.last_generated_at);
                const ageInDays = (now - docDate) / (1000 * 60 * 60 * 24);
                if (ageInDays > advancedFilters.daysOld) return false;
            }
            
            if (advancedFilters.sizeRange && doc.file_size_bytes) {
                const kb = doc.file_size_bytes / 1024;
                if (advancedFilters.sizeRange === 'small' && kb > 100) return false;
                if (advancedFilters.sizeRange === 'medium' && (kb <= 100 || kb > 500)) return false;
                if (advancedFilters.sizeRange === 'large' && kb <= 500) return false;
            }
            
            return true;
        });
    };

    const formatBytes = (bytes) => {
        if (!bytes) return '0 KB';
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(0)} KB`;
        return `${(kb / 1024).toFixed(1)} MB`;
    };

    const handleCopyToClipboard = (doc) => {
        navigator.clipboard.writeText(doc.content_markdown);
        toast.success('In Zwischenablage kopiert');
    };

    // Statistiken berechnen
    const priorityDocs = PRIORITY_TYPES.map(t => t.type);
    const stats = {
        total: DOCUMENTATION_TYPES.length,
        completed: documentations.filter(d => d.status === 'completed').length,
        generating: documentations.filter(d => d.status === 'generating').length,
        outdated: documentations.filter(d => 
            d.status === 'completed' && 
            d.last_generated_at && 
            new Date(d.last_generated_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        totalSize: documentations.reduce((sum, d) => sum + (d.file_size_bytes || 0), 0),
        avgDuration: documentations.filter(d => d.generation_duration_seconds).length > 0
            ? documentations.reduce((sum, d) => sum + (d.generation_duration_seconds || 0), 0) / 
              documentations.filter(d => d.generation_duration_seconds).length
            : 0,
        priority: PRIORITY_TYPES.length,
        priorityCompleted: documentations.filter(d => priorityDocs.includes(d.documentation_type) && d.status === 'completed').length
    };

    if (isLoading) {
        return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl font-bold text-slate-900">Entwickler-Dokumentation</h1>
                <p className="text-slate-600 mt-2">
                    Automatische App-Dokumentation für KI-Assistenten
                </p>
                {lastUpdate && (
                    <p className="text-sm text-slate-500 mt-1">
                        Letzte Aktualisierung: {format(lastUpdate, 'dd.MM.yyyy HH:mm:ss', { locale: de })} Uhr
                    </p>
                )}
            </motion.div>

            {/* Statistik-Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {[
                    { icon: FileCheck, label: `${stats.completed}/${stats.total}`, title: "Erstellt", color: "emerald" },
                    { icon: Star, label: `${stats.priorityCompleted}/${stats.priority}`, title: "Priorität", color: "yellow" },
                    { icon: AlertTriangle, label: stats.outdated, title: "Veraltet", color: "yellow" },
                    { icon: Archive, label: formatBytes(stats.totalSize), title: "Gesamt", color: "blue" },
                    { icon: Clock, label: `${stats.avgDuration.toFixed(1)}s`, title: "Ø Dauer", color: "purple" },
                    { icon: Loader2, label: stats.generating, title: "In Arbeit", color: "slate", spin: stats.generating > 0 }
                ].map((stat, idx) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                    >
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <stat.icon className={`w-8 h-8 text-${stat.color}-600 ${stat.spin ? 'animate-spin' : ''}`} />
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stat.label}</p>
                                <p className="text-xs text-slate-600">{stat.title}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                    </motion.div>
                ))}
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

            {/* Auswahl-Aktionen */}
            {selectedTypes.length > 0 && (
                <Card className="bg-emerald-50 border-emerald-200">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                                <div>
                                    <p className="font-semibold text-emerald-900">
                                        {selectedTypes.length} Dokumentation{selectedTypes.length !== 1 ? 'en' : ''} ausgewählt
                                    </p>
                                    <p className="text-sm text-emerald-700">
                                        Bereit für Batch-Operationen
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={async () => {
                                        const selectedDocs = documentations.filter(d => 
                                            selectedTypes.includes(d.documentation_type) && d.content_markdown
                                        );
                                        if (selectedDocs.length === 0) {
                                            toast.error('Keine generierten Dokumentationen ausgewählt');
                                            return;
                                        }
                                        const combined = selectedDocs.map(d => `# ${d.title}\n\n${d.content_markdown}`).join('\n\n---\n\n');
                                        const blob = new Blob([combined], { type: 'text/markdown' });
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `selected-docs-${Date.now()}.md`;
                                        document.body.appendChild(a);
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                        a.remove();
                                        toast.success('Ausgewählte Dokumentationen exportiert');
                                    }}
                                    disabled={generatingAll}
                                >
                                    <Download className="w-4 h-4 mr-1" />
                                    Exportieren
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedTypes([])}
                                >
                                    Auswahl aufheben
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
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
                            Alle {DOCUMENTATION_TYPES.length} generieren
                        </>
                    )}
                </Button>
                <Button 
                    onClick={async () => {
                        setGeneratingAll(true);
                        setProgress(0);
                        let successCount = 0;
                        
                        for (let i = 0; i < PRIORITY_TYPES.length; i++) {
                            const docType = PRIORITY_TYPES[i];
                            setCurrentGenerating(docType.title);
                            setProgress(((i + 1) / PRIORITY_TYPES.length) * 100);
                            
                            try {
                                await generateMutation.mutateAsync(docType.type);
                                successCount++;
                            } catch (error) {
                                console.error(`Failed to generate ${docType.type}:`, error);
                            }
                        }
                        
                        setGeneratingAll(false);
                        setCurrentGenerating(null);
                        setProgress(0);
                        toast.success(`${successCount} wichtige Dokumentationen generiert`);
                    }}
                    disabled={generatingAll}
                    size="lg"
                    variant="outline"
                >
                    <Star className="w-5 h-5 mr-2 text-yellow-600" />
                    Nur Wichtige generieren
                </Button>
                <Button 
                    onClick={async () => {
                        setGeneratingAll(true);
                        setProgress(0);
                        let successCount = 0;
                        
                        for (let i = 0; i < CORE_TYPES.length; i++) {
                            const docType = CORE_TYPES[i];
                            setCurrentGenerating(docType.title);
                            setProgress(((i + 1) / CORE_TYPES.length) * 100);
                            
                            try {
                                await generateMutation.mutateAsync(docType.type);
                                successCount++;
                            } catch (error) {
                                console.error(`Failed to generate ${docType.type}:`, error);
                            }
                        }
                        
                        setGeneratingAll(false);
                        setCurrentGenerating(null);
                        setProgress(0);
                        toast.success(`${successCount} Kern-Dokumentationen generiert`);
                    }}
                    disabled={generatingAll}
                    size="lg"
                    variant="outline"
                >
                    <Database className="w-5 h-5 mr-2" />
                    Kern-Doku generieren
                </Button>
                <Button 
                    variant="outline" 
                    size="lg"
                    onClick={async () => {
                        if (selectedTypes.length === 0) {
                            toast.error('Bitte wähle mindestens eine Dokumentation aus');
                            return;
                        }

                        try {
                            const JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;
                            const zip = new JSZip();

                            const selectedDocs = documentations.filter(d => 
                                selectedTypes.includes(d.documentation_type) && d.content_markdown
                            );

                            if (selectedDocs.length === 0) {
                                toast.error('Keine generierten Dokumentationen ausgewählt');
                                return;
                            }

                            const DATEINAMEN = {
                                'database_structure': '01_datenbankstruktur',
                                'module_architecture': '02_modul_architektur',
                                'master_data': '03_stammdaten',
                                'business_logic': '04_geschaeftslogik',
                                'external_integrations': '05_integrationen',
                                'document_generation': '06_dokumente',
                                'user_workflows': '07_workflows',
                                'permissions_roles': '08_berechtigungen',
                                'error_handling': '09_fehlerbehandlung',
                                'data_migration': '10_datenhistorie',
                                'executive_summary': '11_zusammenfassung',
                                'sample_data': '13_beispiel_daten',
                                'user_issues': '14_faq_probleme',
                                'timeline_calendar': '15_geschaeftsprozesse',
                                'performance_data': '16_performance',
                                'coding_conventions': '18_code_standards',
                                'testing_qa': '19_testing_qa',
                            };

                            selectedDocs.forEach(doc => {
                                const dateiname = DATEINAMEN[doc.documentation_type] || doc.documentation_type;
                                const inhalt = `# ${doc.title.toUpperCase()}\n\n**Typ:** ${doc.documentation_type}\n**Generiert am:** ${doc.last_generated_at || new Date().toISOString()}\n**Größe:** ${doc.file_size_bytes ? Math.round(doc.file_size_bytes / 1024) + ' KB' : 'unbekannt'}\n\n---\n\n${doc.content_markdown}`;
                                zip.file(`${dateiname}.md`, inhalt);
                            });

                            const readme = `# Entwickler-Dokumentation Export\n\n**Exportiert am:** ${new Date().toISOString()}\n**Anzahl Bereiche:** ${selectedDocs.length}\n\n## VERWENDUNG\n\nDiese Dokumentationen können einzeln hochgeladen oder analysiert werden.\nJede Datei ist eigenständig und enthält die vollständige Dokumentation\ndes jeweiligen Bereichs.\n\n---\nGeneriert von: base44 Immobilienverwaltung\n`;
                            zip.file('README.md', readme);

                            const content = await zip.generateAsync({ type: 'blob' });
                            const url = window.URL.createObjectURL(content);
                            const a = document.createElement('a');
                            a.href = url;
                            const datum = new Date().toISOString().split('T')[0].replace(/-/g, '');
                            a.download = `entwickler_doku_${selectedDocs.length}_bereiche_${datum}.zip`;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            a.remove();
                            toast.success(`${selectedDocs.length} Bereiche heruntergeladen`);
                        } catch (error) {
                            console.error('Download error:', error);
                            toast.error('Download fehlgeschlagen: ' + error.message);
                        }
                    }}
                    disabled={selectedTypes.length === 0}
                >
                    <Download className="w-5 h-5 mr-2" />
                    Ausgewählte als ZIP ({selectedTypes.length})
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

                        try {
                            const allTypes = allDocs.map(d => d.documentation_type);
                            const response = await base44.functions.invoke('downloadDocumentationZip', {
                                documentationTypes: allTypes
                            });

                            if (response.data instanceof Blob || response.data instanceof ArrayBuffer) {
                                const blob = response.data instanceof Blob 
                                    ? response.data 
                                    : new Blob([response.data]);
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                const datum = new Date().toISOString().split('T')[0].replace(/-/g, '');
                                a.download = `entwickler_doku_alle_${allTypes.length}_bereiche_${datum}.zip`;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                a.remove();
                                toast.success('ZIP-Archiv mit allen Dokumentationen erstellt');
                            }
                        } catch (error) {
                            console.error('ZIP creation error:', error);
                            toast.error('ZIP-Erstellung fehlgeschlagen: ' + error.message);
                        }
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
                        const outdated = documentations.filter(d => 
                            d.status === 'completed' && 
                            d.last_generated_at && 
                            new Date(d.last_generated_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        );

                        if (outdated.length === 0) {
                            toast.info('Alle Dokumentationen sind aktuell');
                            return;
                        }

                        setGeneratingAll(true);
                        setProgress(0);
                        let successCount = 0;

                        for (let i = 0; i < outdated.length; i++) {
                            const doc = outdated[i];
                            setCurrentGenerating(doc.title);
                            setProgress(((i + 1) / outdated.length) * 100);

                            try {
                                await generateMutation.mutateAsync(doc.documentation_type);
                                successCount++;
                            } catch (error) {
                                console.error(`Failed to update ${doc.documentation_type}:`, error);
                            }
                        }

                        setGeneratingAll(false);
                        setCurrentGenerating(null);
                        setProgress(0);
                        toast.success(`${successCount} veraltete Dokumentationen aktualisiert`);
                    }}
                    disabled={generatingAll}
                >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Veraltete aktualisieren
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
                    <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => {
                        if (selectedTypes.length === DOCUMENTATION_TYPES.length) {
                            setSelectedTypes([]);
                        } else {
                            setSelectedTypes(DOCUMENTATION_TYPES.map(t => t.type));
                        }
                    }}
                    >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {selectedTypes.length === DOCUMENTATION_TYPES.length ? 'Keine' : 'Alle'} auswählen
                    </Button>
                    <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => setShowScheduleDialog(true)}
                >
                    <Clock className="w-5 h-5 mr-2" />
                    Automatische Updates
                </Button>
                <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => setShowExportPresets(true)}
                >
                    <Package className="w-5 h-5 mr-2" />
                    Export-Presets
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

            {/* Erweiterte Such- und Filteroptionen */}
            <div className="space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Dokumentationen global durchsuchen..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <DocumentationAdvancedFilters
                    filters={advancedFilters}
                    onFiltersChange={setAdvancedFilters}
                    documentations={documentations}
                />
            </div>

            {/* Dokumentations-Bereiche */}
            <div className="space-y-8">
                {/* Priorität */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <Star className="w-6 h-6 text-yellow-600" />
                        <h2 className="text-2xl font-bold text-slate-900">🔥 Priorität: Sofort erstellen</h2>
                    </div>
                    <div className="grid gap-4">
                        {PRIORITY_TYPES.filter(docType => {
                            if (!searchQuery) return true;
                            const query = searchQuery.toLowerCase();
                            return docType.title.toLowerCase().includes(query) || 
                                   docType.description.toLowerCase().includes(query);
                        }).map(docType => applyAdvancedFilters([getDocumentation(docType.type)]).length > 0 ? docType : null)
                        .filter(Boolean).map((docType) => {
                            const doc = getDocumentation(docType.type);
                            const Icon = docType.icon;
                            const isGenerating = doc?.status === 'generating';

                            return (
                                <Card key={docType.type} className={cn(
                                    'border-2',
                                    selectedTypes.includes(docType.type) ? 'border-emerald-500' : 'border-yellow-300 bg-yellow-50'
                                )}>
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
                                                <Icon className="w-6 h-6 text-yellow-600 mt-1" />
                                                <div className="flex-1">
                                                    <CardTitle className="text-lg flex items-center gap-2">
                                                        {docType.title}
                                                        <Badge className="bg-yellow-600 text-white">⭐ WICHTIG</Badge>
                                                        {docType.badge && (
                                                            <Badge variant="outline" className="text-xs">{docType.badge}</Badge>
                                                        )}
                                                    </CardTitle>
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
                                                        onClick={() => handleCopyToClipboard(doc)}
                                                    >
                                                        <Copy className="w-4 h-4 mr-1" />
                                                        Kopieren
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
                </div>

                {/* Kern-Dokumentation */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <Database className="w-6 h-6 text-emerald-600" />
                        <h2 className="text-2xl font-bold text-slate-900">📊 Kern-Dokumentation</h2>
                    </div>
                    <div className="grid gap-4">
                        {CORE_TYPES.filter(docType => {
                            if (!searchQuery) return true;
                            const query = searchQuery.toLowerCase();
                            return docType.title.toLowerCase().includes(query) || 
                                   docType.description.toLowerCase().includes(query);
                        }).map(docType => applyAdvancedFilters([getDocumentation(docType.type)]).length > 0 ? docType : null)
                        .filter(Boolean).map((docType) => {
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
                                                    <CardTitle className="text-lg">
                                                        {docType.title}
                                                    </CardTitle>
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
                                                        onClick={() => handleCopyToClipboard(doc)}
                                                    >
                                                        <Copy className="w-4 h-4 mr-1" />
                                                        Kopieren
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
                </div>

                {/* Kontext & Planung */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <CalendarDays className="w-6 h-6 text-blue-600" />
                        <h2 className="text-2xl font-bold text-slate-900">📅 Kontext & Planung</h2>
                    </div>
                    <div className="grid gap-4">
                        {CONTEXT_TYPES.filter(docType => {
                            if (!searchQuery) return true;
                            const query = searchQuery.toLowerCase();
                            return docType.title.toLowerCase().includes(query) || 
                                   docType.description.toLowerCase().includes(query);
                        }).map(docType => applyAdvancedFilters([getDocumentation(docType.type)]).length > 0 ? docType : null)
                        .filter(Boolean).map((docType) => {
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
                                                <Icon className="w-6 h-6 text-blue-600 mt-1" />
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
                                                        onClick={() => handleCopyToClipboard(doc)}
                                                    >
                                                        <Copy className="w-4 h-4 mr-1" />
                                                        Kopieren
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
                </div>

                {/* Technische Details */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <Settings className="w-6 h-6 text-purple-600" />
                        <h2 className="text-2xl font-bold text-slate-900">🔧 Technische Details</h2>
                    </div>
                    <div className="grid gap-4">
                        {TECHNICAL_TYPES.filter(docType => {
                            if (!searchQuery) return true;
                            const query = searchQuery.toLowerCase();
                            return docType.title.toLowerCase().includes(query) || 
                                   docType.description.toLowerCase().includes(query);
                        }).map(docType => applyAdvancedFilters([getDocumentation(docType.type)]).length > 0 ? docType : null)
                        .filter(Boolean).map((docType) => {
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
                                                <Icon className="w-6 h-6 text-purple-600 mt-1" />
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
                                            
                                            {/* Status Badge - Same structure */}
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
                                                        onClick={() => handleCopyToClipboard(doc)}
                                                    >
                                                        <Copy className="w-4 h-4 mr-1" />
                                                        Kopieren
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
                                                    {doc.content_json && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDownloadJSON(doc)}
                                                        >
                                                            <FileJson className="w-4 h-4 mr-1" />
                                                            JSON
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                        </div>
                        </div>
                        </div>

            {/* Preview Dialog */}
            <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <DialogTitle>{previewDoc?.title}</DialogTitle>
                            <button
                                onClick={() => setShowFulltextSearch(!showFulltextSearch)}
                                className="text-slate-400 hover:text-slate-600"
                                title="Volltextsuche"
                            >
                                <Highlighter className="w-5 h-5" />
                            </button>
                        </div>
                    </DialogHeader>
                    {showFulltextSearch && (
                        <DocumentationFulltextSearch
                            content={previewDoc?.content_markdown || ''}
                            onClose={() => setShowFulltextSearch(false)}
                        />
                    )}
                    <div className="prose prose-slate max-w-none">
                        <ReactMarkdown>{previewDoc?.content_markdown || ''}</ReactMarkdown>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Version History Dialog */}
            <Dialog open={!!showVersionHistory} onOpenChange={(open) => !open && setShowVersionHistory(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Versionsverlauf: {showVersionHistory?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Card className="bg-emerald-50 border-emerald-200">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-emerald-900">
                                            Version {showVersionHistory?.version_number} (Aktuell)
                                        </p>
                                        <p className="text-sm text-emerald-700">
                                            {showVersionHistory?.last_generated_at && 
                                                format(new Date(showVersionHistory.last_generated_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                                        </p>
                                        <p className="text-sm text-emerald-700">
                                            Größe: {formatBytes(showVersionHistory?.file_size_bytes)}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPreviewDoc(showVersionHistory)}
                                        >
                                            <Eye className="w-4 h-4 mr-1" />
                                            Anzeigen
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDownloadMarkdown(showVersionHistory)}
                                        >
                                            <Download className="w-4 h-4 mr-1" />
                                            Download
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <p className="text-sm text-slate-600">
                            Hinweis: Ältere Versionen werden derzeit nicht gespeichert. 
                            Diese Funktion zeigt die Versionsnummer und Metadaten der aktuellen Version.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Export Presets Dialog */}
            <Dialog open={showExportPresets} onOpenChange={setShowExportPresets}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Export-Presets</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">
                            Wählen Sie ein vordefiniertes Export-Set für verschiedene Anwendungsfälle.
                        </p>
                        
                        <div className="grid gap-3">
                            {/* KI-Assistant Full Package */}
                            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={async () => {
                                const types = ['executive_summary', 'database_structure', 'module_architecture', 'business_logic', 'external_integrations'];
                                const docs = documentations.filter(d => types.includes(d.documentation_type) && d.content_markdown);
                                if (docs.length === 0) {
                                    toast.error('Bitte generieren Sie zuerst die benötigten Dokumentationen');
                                    return;
                                }
                                const combined = docs.map(d => `# ${d.title}\n\n${d.content_markdown}`).join('\n\n---\n\n');
                                const blob = new Blob([combined], { type: 'text/markdown' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `ai-assistant-full-${Date.now()}.md`;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                a.remove();
                                toast.success('KI-Assistant Paket exportiert');
                                setShowExportPresets(false);
                            }}>
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <Star className="w-6 h-6 text-yellow-600 mt-1" />
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-900">KI-Assistant (Komplett)</p>
                                            <p className="text-sm text-slate-600 mt-1">
                                                Executive Summary, Datenbankstruktur, Module, Geschäftslogik und Integrationen
                                            </p>
                                            <Badge variant="outline" className="mt-2">5 Dokumentationen</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Developer Onboarding */}
                            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={async () => {
                                const types = ['executive_summary', 'module_architecture', 'user_workflows', 'error_handling'];
                                const docs = documentations.filter(d => types.includes(d.documentation_type) && d.content_markdown);
                                if (docs.length === 0) {
                                    toast.error('Bitte generieren Sie zuerst die benötigten Dokumentationen');
                                    return;
                                }
                                const combined = docs.map(d => `# ${d.title}\n\n${d.content_markdown}`).join('\n\n---\n\n');
                                const blob = new Blob([combined], { type: 'text/markdown' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `developer-onboarding-${Date.now()}.md`;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                a.remove();
                                toast.success('Developer-Onboarding Paket exportiert');
                                setShowExportPresets(false);
                            }}>
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <Code className="w-6 h-6 text-blue-600 mt-1" />
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-900">Developer Onboarding</p>
                                            <p className="text-sm text-slate-600 mt-1">
                                                Übersicht, Architektur, Workflows und Fehlerbehandlung für neue Entwickler
                                            </p>
                                            <Badge variant="outline" className="mt-2">4 Dokumentationen</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Technical Deep Dive */}
                            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={async () => {
                                const types = ['database_structure', 'business_logic', 'data_migration', 'permissions_roles'];
                                const docs = documentations.filter(d => types.includes(d.documentation_type) && d.content_markdown);
                                if (docs.length === 0) {
                                    toast.error('Bitte generieren Sie zuerst die benötigten Dokumentationen');
                                    return;
                                }
                                const combined = docs.map(d => `# ${d.title}\n\n${d.content_markdown}`).join('\n\n---\n\n');
                                const blob = new Blob([combined], { type: 'text/markdown' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `technical-deep-dive-${Date.now()}.md`;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                a.remove();
                                toast.success('Technical Deep-Dive exportiert');
                                setShowExportPresets(false);
                            }}>
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <Database className="w-6 h-6 text-purple-600 mt-1" />
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-900">Technical Deep-Dive</p>
                                            <p className="text-sm text-slate-600 mt-1">
                                                Datenbank, Geschäftslogik, Migration und Berechtigungen für technische Analysen
                                            </p>
                                            <Badge variant="outline" className="mt-2">4 Dokumentationen</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* User Documentation */}
                            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={async () => {
                                const types = ['user_workflows', 'document_generation', 'permissions_roles'];
                                const docs = documentations.filter(d => types.includes(d.documentation_type) && d.content_markdown);
                                if (docs.length === 0) {
                                    toast.error('Bitte generieren Sie zuerst die benötigten Dokumentationen');
                                    return;
                                }
                                const combined = docs.map(d => `# ${d.title}\n\n${d.content_markdown}`).join('\n\n---\n\n');
                                const blob = new Blob([combined], { type: 'text/markdown' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `user-documentation-${Date.now()}.md`;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                a.remove();
                                toast.success('User-Documentation exportiert');
                                setShowExportPresets(false);
                            }}>
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <BookOpen className="w-6 h-6 text-emerald-600 mt-1" />
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-900">User-Dokumentation</p>
                                            <p className="text-sm text-slate-600 mt-1">
                                                Workflows, Dokumentengenerierung und Berechtigungen für Endnutzer
                                            </p>
                                            <Badge variant="outline" className="mt-2">3 Dokumentationen</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Schedule Dialog */}
            <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Automatische Dokumentations-Updates</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">
                            Richten Sie automatische Updates ein, damit die Dokumentation immer aktuell bleibt.
                        </p>
                        
                        {scheduledTasks.find(t => t.function_name === 'updateDocumentation') ? (
                            <Card className="bg-green-50 border-green-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <div>
                                            <p className="font-medium text-green-900">Automatische Updates aktiv</p>
                                            <p className="text-sm text-green-700">
                                                Die Dokumentation wird automatisch wöchentlich aktualisiert.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="bg-slate-50">
                                <CardContent className="p-4">
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700">
                                            Empfehlung: Wöchentliche Updates jeden Montag um 3:00 Uhr
                                        </p>
                                        <Button
                                            onClick={async () => {
                                                try {
                                                    await base44.functions.invoke('createScheduledTask', {
                                                        name: 'Dokumentations-Update',
                                                        description: 'Automatische Aktualisierung aller Entwickler-Dokumentationen',
                                                        function_name: 'updateDocumentation',
                                                        repeat_unit: 'weeks',
                                                        repeat_on_days: [1],
                                                        start_time: '03:00',
                                                        is_active: true
                                                    });
                                                    queryClient.invalidateQueries({ queryKey: ['scheduled-tasks'] });
                                                    toast.success('Automatische Updates aktiviert');
                                                } catch (error) {
                                                    toast.error('Fehler: ' + error.message);
                                                }
                                            }}
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            <Play className="w-4 h-4 mr-2" />
                                            Automatische Updates aktivieren
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        
                        <div className="flex justify-end">
                            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                                Schließen
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}