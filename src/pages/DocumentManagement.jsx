import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Download, Trash2, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function DocumentManagement() {
    const [searchTerm, setSearchTerm] = React.useState('');

    const { data: documents = [] } = useQuery({
        queryKey: ['documents'],
        queryFn: () => base44.entities.GeneratedDocument.list('-created_date')
    });

    const filteredDocuments = documents.filter(doc =>
        doc.titel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.dokumenttyp?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const documentsByType = documents.reduce((acc, doc) => {
        const type = doc.dokumenttyp || 'Sonstige';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Dokumentenverwaltung</h1>
                    <p className="vf-page-subtitle">{documents.length} Dokumente</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Upload className="w-4 h-4 mr-2" />
                        Neues Dokument
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{documents.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Dokumente gesamt</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{Object.keys(documentsByType).length}</div>
                        <div className="text-sm text-gray-600 mt-1">Dokumenttypen</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">
                            {documents.filter(d => d.versand_status === 'Versendet').length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Versendet</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">
                            {documents.filter(d => d.versand_status === 'Entwurf').length}
                        </div>
                        <div className="text-sm opacity-90 mt-1">Entwürfe</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <div className="mb-4 relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Dokumente suchen..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="space-y-2">
                        {filteredDocuments.map((doc) => (
                            <div key={doc.id} className="p-4 bg-gray-50 rounded-lg border">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <div className="font-semibold">{doc.titel}</div>
                                            <div className="text-sm text-gray-600">{doc.dokumenttyp}</div>
                                        </div>
                                    </div>
                                    <Badge className={
                                        doc.versand_status === 'Versendet' ? 'vf-badge-success' :
                                        doc.versand_status === 'Final' ? 'vf-badge-primary' :
                                        'vf-badge-default'
                                    }>
                                        {doc.versand_status}
                                    </Badge>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <Button size="sm" variant="outline">
                                        <Download className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="outline">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}