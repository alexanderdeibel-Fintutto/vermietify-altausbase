import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Search, Download, Eye, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DocumentLibrary() {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: documents = [], isLoading } = useQuery({
        queryKey: ['documents'],
        queryFn: () => base44.entities.Document.list('-created_date', 100)
    });

    const filteredDocs = documents.filter(doc => 
        doc.titel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.dokumenttyp?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalSize = documents.reduce((sum, doc) => sum + (doc.seitenanzahl || 0), 0);

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Dokumentenbibliothek</h1>
                    <p className="vf-page-subtitle">{documents.length} Dokumente • {totalSize} Seiten</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Upload className="w-4 h-4" />
                        Hochladen
                    </Button>
                </div>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <VfInput
                        leftIcon={Search}
                        placeholder="Dokumente durchsuchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </CardContent>
            </Card>

            {filteredDocs.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center">
                            <FileText className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">Keine Dokumente gefunden</h3>
                            <p className="text-gray-600">Laden Sie Ihr erstes Dokument hoch</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDocs.map((doc) => (
                        <Card key={doc.id} className="vf-card-clickable">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold mb-1 truncate">{doc.titel}</h3>
                                        <Badge className="vf-badge-default text-xs mb-2">{doc.dokumenttyp}</Badge>
                                        <div className="text-xs text-gray-500">
                                            {new Date(doc.created_date).toLocaleDateString('de-DE')}
                                        </div>
                                        {doc.seitenanzahl && (
                                            <div className="text-xs text-gray-500">{doc.seitenanzahl} Seiten</div>
                                        )}
                                        <div className="flex gap-2 mt-3">
                                            <Button variant="outline" size="sm">
                                                <Eye className="w-3 h-3" />
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                <Download className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}