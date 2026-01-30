import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, GitCompare, Loader, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentComparisonTool() {
    const file1Ref = useRef(null);
    const file2Ref = useRef(null);
    const [doc1, setDoc1] = useState(null);
    const [doc2, setDoc2] = useState(null);
    const [comparing, setComparing] = useState(false);
    const [comparison, setComparison] = useState(null);

    const handleFileSelect = async (file, docNumber) => {
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error('Datei zu groß (max. 10 MB)');
            return;
        }

        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            
            if (docNumber === 1) {
                setDoc1({ name: file.name, url: file_url });
            } else {
                setDoc2({ name: file.name, url: file_url });
            }
        } catch (error) {
            toast.error(`Upload fehlgeschlagen: ${error.message}`);
        }
    };

    const handleCompare = async () => {
        if (!doc1 || !doc2) {
            toast.error('Bitte beide Dokumente hochladen');
            return;
        }

        setComparing(true);
        try {
            const { comparison_id } = await base44.functions.invoke('compareDocuments', {
                document_1_url: doc1.url,
                document_1_name: doc1.name,
                document_2_url: doc2.url,
                document_2_name: doc2.name
            });

            // Poll for completion
            let attempts = 0;
            const pollInterval = setInterval(async () => {
                attempts++;
                const data = await base44.entities.DocumentComparison.list(undefined, 1, { id: comparison_id });
                
                if (data && data.length > 0) {
                    const comp = data[0];
                    if (comp.comparison_status === 'completed') {
                        clearInterval(pollInterval);
                        setComparison(comp);
                        setComparing(false);
                        toast.success('Vergleich abgeschlossen');
                    } else if (comp.comparison_status === 'failed') {
                        clearInterval(pollInterval);
                        setComparing(false);
                        toast.error('Vergleich fehlgeschlagen');
                    }
                }

                if (attempts > 30) { // 30 Sekunden timeout
                    clearInterval(pollInterval);
                    setComparing(false);
                    toast.error('Timeout - Vergleich dauert zu lange');
                }
            }, 1000);

        } catch (error) {
            toast.error(`Fehler: ${error.message}`);
            setComparing(false);
        }
    };

    const DIFF_COLORS = {
        added: 'bg-green-50 border-green-300 text-green-900',
        removed: 'bg-red-50 border-red-300 text-red-900',
        modified: 'bg-yellow-50 border-yellow-300 text-yellow-900'
    };

    const DIFF_LABELS = {
        added: '+ Hinzugefügt',
        removed: '- Entfernt',
        modified: '~ Geändert'
    };

    return (
        <div className="space-y-6">
            {/* Upload Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GitCompare className="w-5 h-5" />
                        Dokumente vergleichen
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Document 1 */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Dokument 1 (Original)</label>
                            <input
                                ref={file1Ref}
                                type="file"
                                onChange={(e) => handleFileSelect(e.target.files[0], 1)}
                                className="hidden"
                                accept=".pdf,.docx,.doc,.txt"
                            />
                            <div
                                onClick={() => file1Ref.current?.click()}
                                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50"
                            >
                                {doc1 ? (
                                    <div className="text-sm">
                                        <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                        <p className="font-medium text-green-700">{doc1.name}</p>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">Klicken zum Hochladen</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Document 2 */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Dokument 2 (Version zum Vergleich)</label>
                            <input
                                ref={file2Ref}
                                type="file"
                                onChange={(e) => handleFileSelect(e.target.files[0], 2)}
                                className="hidden"
                                accept=".pdf,.docx,.doc,.txt"
                            />
                            <div
                                onClick={() => file2Ref.current?.click()}
                                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50"
                            >
                                {doc2 ? (
                                    <div className="text-sm">
                                        <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                        <p className="font-medium text-green-700">{doc2.name}</p>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">Klicken zum Hochladen</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleCompare}
                        disabled={!doc1 || !doc2 || comparing}
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                        {comparing ? (
                            <>
                                <Loader className="w-4 h-4 mr-2 animate-spin" />
                                Vergleicht Dokumente...
                            </>
                        ) : (
                            <>
                                <GitCompare className="w-4 h-4 mr-2" />
                                Dokumente vergleichen
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Comparison Results */}
            {comparison && (
                <div className="space-y-4">
                    {/* Similarity Score */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Ähnlichkeit:</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600"
                                            style={{ width: `${comparison.similarity_score}%` }}
                                        />
                                    </div>
                                    <span className="font-bold text-lg">{comparison.similarity_score}%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Summary */}
                    {comparison.ai_summary && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Zusammenfassung</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-700">{comparison.ai_summary}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Key Changes */}
                    {comparison.key_changes && comparison.key_changes.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Wichtigste Änderungen</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {comparison.key_changes.map((change, i) => (
                                        <li key={i} className="text-sm flex items-start gap-2">
                                            <span className="text-blue-600">→</span>
                                            {change}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {/* Detailed Differences */}
                    {comparison.differences && comparison.differences.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Detaillierte Unterschiede ({comparison.differences.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {comparison.differences.map((diff, i) => (
                                        <div key={i} className={`p-4 border rounded-lg ${DIFF_COLORS[diff.type]}`}>
                                            <div className="flex items-start justify-between mb-2">
                                                <h5 className="font-semibold text-sm">
                                                    {diff.section}
                                                </h5>
                                                <div className="flex gap-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        {DIFF_LABELS[diff.type]}
                                                    </Badge>
                                                    <Badge className={
                                                        diff.importance === 'high' ? 'bg-red-100 text-red-800' :
                                                        diff.importance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }>
                                                        {diff.importance}
                                                    </Badge>
                                                </div>
                                            </div>
                                            {diff.content_1 && (
                                                <div className="text-sm mb-2">
                                                    <span className="font-medium">Vorher:</span> {diff.content_1}
                                                </div>
                                            )}
                                            {diff.content_2 && (
                                                <div className="text-sm">
                                                    <span className="font-medium">Nachher:</span> {diff.content_2}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}