import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Scale, FileText, Download, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function LegalDocuments() {
    const { data: documents = [] } = useQuery({
        queryKey: ['generatedDocuments'],
        queryFn: () => base44.entities.GeneratedDocument.list('-created_date')
    });

    const legalDocs = documents.filter(d => 
        ['Mietvertrag', 'Kündigung', 'Mahnung', 'Nachtrag'].includes(d.dokumenttyp)
    );

    const byType = legalDocs.reduce((acc, doc) => {
        acc[doc.dokumenttyp] = (acc[doc.dokumenttyp] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Rechtsdokumente</h1>
                    <p className="vf-page-subtitle">{legalDocs.length} Dokumente</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <FileText className="w-4 h-4" />
                        Neues Dokument
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                {Object.entries(byType).map(([type, count]) => (
                    <Card key={type}>
                        <CardContent className="p-6 text-center">
                            <Scale className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                            <div className="text-2xl font-bold">{count}</div>
                            <div className="text-sm text-gray-600 mt-1">{type}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {legalDocs.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Scale className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-xl font-semibold mb-2">Keine Rechtsdokumente</h3>
                        <p className="text-gray-600">Noch keine rechtlichen Dokumente erstellt</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {legalDocs.map((doc) => (
                        <Card key={doc.id}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-1">{doc.titel}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Badge className="vf-badge-default">{doc.dokumenttyp}</Badge>
                                                <span>•</span>
                                                <span>{new Date(doc.created_date).toLocaleDateString('de-DE')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}