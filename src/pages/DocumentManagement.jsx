import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { FileText, Upload, Search, Folder } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DocumentManagement() {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: documents = [] } = useQuery({
        queryKey: ['documents'],
        queryFn: () => base44.entities.GeneratedDocument.list('-created_date', 50)
    });

    const filteredDocs = documents.filter(doc =>
        doc.titel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.dokumenttyp?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const docTypes = [...new Set(documents.map(d => d.dokumenttyp))];

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Dokumentenverwaltung</h1>
                    <p className="vf-page-subtitle">{documents.length} Dokumente</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Upload className="w-4 h-4" />
                        Hochladen
                    </Button>
                </div>
            </div>

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

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {docTypes.map((type, idx) => {
                    const count = documents.filter(d => d.dokumenttyp === type).length;
                    return (
                        <Card key={idx} className="vf-card-clickable">
                            <CardContent className="p-6 text-center">
                                <Folder className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                                <div className="font-semibold mb-1">{type}</div>
                                <div className="text-sm text-gray-600">{count} Dokumente</div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {filteredDocs.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <FileText className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-xl font-semibold mb-2">Keine Dokumente gefunden</h3>
                        <p className="text-gray-600">Laden Sie Ihr erstes Dokument hoch</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {filteredDocs.map((doc) => (
                        <Card key={doc.id} className="vf-card-clickable">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <FileText className="w-8 h-8 text-purple-600" />
                                        <div>
                                            <h3 className="font-semibold">{doc.titel}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                                <Badge className="vf-badge-default">{doc.dokumenttyp}</Badge>
                                                <span>•</span>
                                                <span>{new Date(doc.created_date).toLocaleDateString('de-DE')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Badge className={
                                        doc.versand_status === 'Versendet' ? 'vf-badge-success' :
                                        doc.versand_status === 'Final' ? 'vf-badge-info' :
                                        'vf-badge-default'
                                    }>
                                        {doc.versand_status || 'Entwurf'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}