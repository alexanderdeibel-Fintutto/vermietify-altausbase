import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Database, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DataManagement() {
    const [backups, setBackups] = useState([
        { id: 1, date: '2026-01-20', size: '2.5 MB', status: 'completed' },
        { id: 2, date: '2026-01-19', size: '2.4 MB', status: 'completed' },
        { id: 3, date: '2026-01-18', size: '2.3 MB', status: 'completed' }
    ]);

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Datenverwaltung</h1>
                    <p className="vf-page-subtitle">Import, Export & Sicherungen</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Download className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{backups.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Sicherungen</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Database className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold">15.2</div>
                        <div className="text-sm text-gray-600 mt-1">Datengröße (MB)</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <RotateCcw className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold">Täglich</div>
                        <div className="text-sm text-gray-600 mt-1">Backup-Plan</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">Aktiv</div>
                        <div className="text-sm opacity-90 mt-1">Status</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Daten exportieren</h3>
                        <div className="space-y-3">
                            <Button variant="outline" className="w-full justify-start">
                                <Download className="w-4 h-4 mr-2" />
                                Gebäude exportieren
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                <Download className="w-4 h-4 mr-2" />
                                Mieter exportieren
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                <Download className="w-4 h-4 mr-2" />
                                Verträge exportieren
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                <Download className="w-4 h-4 mr-2" />
                                Rechnungen exportieren
                            </Button>
                            <Button className="vf-btn-primary w-full">
                                <Download className="w-4 h-4 mr-2" />
                                Alle Daten exportieren
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Daten importieren</h3>
                        <div className="space-y-3">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600">
                                    CSV oder Excel-Datei hier ablegen
                                </p>
                                <Button variant="outline" className="mt-3">
                                    Datei wählen
                                </Button>
                            </div>
                            <div className="text-xs text-gray-500">
                                Unterstützte Formate: CSV, XLSX
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Sicherungsverlauf</h3>
                    <div className="space-y-2">
                        {backups.map((backup) => (
                            <div key={backup.id} className="p-4 bg-gray-50 rounded-lg border flex items-center justify-between">
                                <div>
                                    <div className="font-semibold text-sm">{backup.date}</div>
                                    <div className="text-xs text-gray-600 mt-1">{backup.size}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className="vf-badge-success">{backup.status}</Badge>
                                    <Button size="sm" variant="outline">
                                        <Download className="w-4 h-4" />
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