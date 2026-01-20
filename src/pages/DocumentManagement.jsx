import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Download, Trash2, Eye, Archive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DocumentManagement() {
    const [selectedDoc, setSelectedDoc] = useState(null);

    const { data: documents = [] } = useQuery({
        queryKey: ['documents'],
        queryFn: () => base44.entities.GeneratedDocument.list('-created_date')
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const documentsByType = {};
    documents.forEach(doc => {
        if (!documentsByType[doc.dokumenttyp]) {
            documentsByType[doc.dokumenttyp] = [];
        }
        documentsByType[doc.dokumenttyp].push(doc);
    });

    const draftDocs = documents.filter(d => d.versand_status === 'Entwurf');
    const sentDocs = documents.filter(d => d.versand_status === 'Versendet' || d.versand_status === 'Zugestellt');

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
                        Dokument hochladen
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{documents.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Dokumente</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FileText className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="text-3xl font-bold">{draftDocs.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Entwürfe</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FileText className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold">{sentDocs.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Versendet</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{Object.keys(documentsByType).length}</div>
                        <div className="text-sm opacity-90 mt-1">Dokumenttypen</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Entwürfe ({draftDocs.length})</h3>
                        <div className="space-y-2">
                            {draftDocs.slice(0, 5).map((doc) => {
                                const building = buildings.find(b => b.id === doc.building_id);
                                return (
                                    <div
                                        key={doc.id}
                                        className="p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 cursor-pointer transition"
                                        onClick={() => setSelectedDoc(doc)}
                                    >
                                        <div className="font-semibold text-sm">{doc.titel}</div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            {building?.name || 'Unbekannt'}
                                        </div>
                                        <Badge className="mt-2 vf-badge-warning text-xs">{doc.dokumenttyp}</Badge>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Versendet ({sentDocs.length})</h3>
                        <div className="space-y-2">
                            {sentDocs.slice(0, 5).map((doc) => {
                                const building = buildings.find(b => b.id === doc.building_id);
                                return (
                                    <div
                                        key={doc.id}
                                        className="p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 cursor-pointer transition"
                                        onClick={() => setSelectedDoc(doc)}
                                    >
                                        <div className="font-semibold text-sm">{doc.titel}</div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            Versendet: {new Date(doc.versendet_am).toLocaleDateString('de-DE')}
                                        </div>
                                        <Badge className="mt-2 vf-badge-success text-xs">{doc.dokumenttyp}</Badge>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Dokumenttypen</h3>
                        <div className="space-y-2">
                            {Object.entries(documentsByType).map(([type, docs]) => (
                                <div key={type} className="p-3 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold">{type}</span>
                                        <Badge className="vf-badge-primary">{docs.length}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {selectedDoc && (
                <Card className="border-blue-300 bg-blue-50/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg">{selectedDoc.titel}</h3>
                            <Button size="sm" variant="ghost" onClick={() => setSelectedDoc(null)}>✕</Button>
                        </div>
                        <div className="space-y-4 p-4 bg-white rounded-lg border">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-gray-600">Dokumenttyp</div>
                                    <div className="font-semibold">{selectedDoc.dokumenttyp}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Versandstatus</div>
                                    <Badge className={
                                        selectedDoc.versand_status === 'Zugestellt' ? 'vf-badge-success' :
                                        selectedDoc.versand_status === 'Versendet' ? 'vf-badge-info' :
                                        'vf-badge-warning'
                                    }>
                                        {selectedDoc.versand_status}
                                    </Badge>
                                </div>
                            </div>
                            {selectedDoc.versendet_am && (
                                <div>
                                    <div className="text-sm text-gray-600">Versendet am</div>
                                    <div className="font-semibold">{new Date(selectedDoc.versendet_am).toLocaleDateString('de-DE')}</div>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Button className="flex-1" variant="outline">
                                    <Eye className="w-4 h-4 mr-2" />
                                    Vorschau
                                </Button>
                                <Button className="flex-1" variant="outline">
                                    <Download className="w-4 h-4 mr-2" />
                                    Herunterladen
                                </Button>
                                <Button className="flex-1" variant="outline">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Löschen
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}