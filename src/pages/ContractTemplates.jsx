import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Edit, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const templates = [
    { id: 1, name: 'Standard Wohnungsmietvertrag', type: 'Wohnung', uses: 45, lastModified: '2026-01-15' },
    { id: 2, name: 'Gewerbemietvertrag', type: 'Gewerbe', uses: 12, lastModified: '2026-01-10' },
    { id: 3, name: 'WG-Zimmer Mietvertrag', type: 'Zimmer', uses: 23, lastModified: '2025-12-20' },
    { id: 4, name: 'Tierhaltungsklausel Zusatz', type: 'Zusatz', uses: 8, lastModified: '2025-11-05' }
];

export default function ContractTemplates() {
    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Vertragsvorlagen</h1>
                    <p className="vf-page-subtitle">{templates.length} Vorlagen</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <FileText className="w-4 h-4" />
                        Neue Vorlage
                    </Button>
                </div>
            </div>

            <div className="space-y-3">
                {templates.map((template) => (
                    <Card key={template.id} className="vf-card-clickable">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center text-white">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">{template.name}</h3>
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <Badge className="vf-badge-default">{template.type}</Badge>
                                            <span>•</span>
                                            <span>{template.uses}× verwendet</span>
                                            <span>•</span>
                                            <span>Geändert: {new Date(template.lastModified).toLocaleDateString('de-DE')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm">
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}