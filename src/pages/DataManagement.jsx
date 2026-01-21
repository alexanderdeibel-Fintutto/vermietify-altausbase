import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Download, Upload, RefreshCw } from 'lucide-react';

export default function DataManagement() {
    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Datenverwaltung</h1>
                    <p className="vf-page-subtitle">Import, Export & Backup</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6 text-center">
                        <Download className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Daten exportieren</h3>
                        <p className="text-sm text-gray-600 mb-4">Exportieren Sie Ihre Daten als CSV oder Excel</p>
                        <Button className="vf-btn-primary w-full">Export starten</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 text-center">
                        <Upload className="w-12 h-12 text-green-600 mx-auto mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Daten importieren</h3>
                        <p className="text-sm text-gray-600 mb-4">Importieren Sie Daten aus externen Quellen</p>
                        <Button className="vf-btn-primary w-full">Import starten</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 text-center">
                        <RefreshCw className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Backup erstellen</h3>
                        <p className="text-sm text-gray-600 mb-4">Sichern Sie Ihre Daten regelmäßig</p>
                        <Button className="vf-btn-primary w-full">Backup erstellen</Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Letzte Aktivitäten</h3>
                    <div className="space-y-2">
                        <div className="p-3 bg-gray-50 rounded-lg flex justify-between">
                            <span>Automatisches Backup</span>
                            <span className="text-gray-600 text-sm">Heute, 03:00</span>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg flex justify-between">
                            <span>Mieterdaten exportiert</span>
                            <span className="text-gray-600 text-sm">Gestern, 14:30</span>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg flex justify-between">
                            <span>Rechnungen importiert</span>
                            <span className="text-gray-600 text-sm">20.01.2026, 10:15</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}