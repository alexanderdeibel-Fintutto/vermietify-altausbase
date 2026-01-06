import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    FileText,
    Plus,
    Building2,
    CheckCircle2,
    AlertTriangle,
    Info,
    Download
} from 'lucide-react';
import AnlageVWizard from '@/components/tax/AnlageVWizard';

export default function TaxForms() {
    const [wizardOpen, setWizardOpen] = useState(false);
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 1);

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const { data: submissions = [] } = useQuery({
        queryKey: ['anlageVSubmissions'],
        queryFn: () => base44.entities.AnlageVSubmission.list('-created_date')
    });

    const handleCreateAnlageV = (building) => {
        setSelectedBuilding(building);
        setWizardOpen(true);
    };

    const getStatusBadge = (status) => {
        const config = {
            'entwurf': { label: 'Entwurf', variant: 'secondary', icon: FileText },
            'validiert': { label: 'Validiert', variant: 'default', icon: CheckCircle2 },
            'eingereicht': { label: 'Eingereicht', variant: 'success', icon: CheckCircle2 },
            'abgeschlossen': { label: 'Abgeschlossen', variant: 'outline', icon: CheckCircle2 }
        };

        const cfg = config[status] || config.entwurf;
        const Icon = cfg.icon;

        return (
            <Badge variant={cfg.variant} className="gap-1">
                <Icon className="w-3 h-3" />
                {cfg.label}
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Steuerformulare</h1>
                    <p className="text-slate-500">Automatische Erstellung von Anlage V und weiteren Formularen</p>
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Übersicht</TabsTrigger>
                    <TabsTrigger value="create">Neu erstellen</TabsTrigger>
                    <TabsTrigger value="history">Verlauf</TabsTrigger>
                </TabsList>

                {/* Übersicht */}
                <TabsContent value="overview" className="mt-6">
                    <div className="grid gap-4 md:grid-cols-3 mb-6">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600">Objekte</p>
                                        <p className="text-2xl font-bold text-slate-800">{buildings.length}</p>
                                    </div>
                                    <Building2 className="w-8 h-8 text-blue-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600">Anlagen erstellt</p>
                                        <p className="text-2xl font-bold text-slate-800">{submissions.length}</p>
                                    </div>
                                    <FileText className="w-8 h-8 text-emerald-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600">Steuerjahr</p>
                                        <p className="text-2xl font-bold text-slate-800">{selectedYear}</p>
                                    </div>
                                    <FileText className="w-8 h-8 text-purple-600" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Info-Box */}
                    <Card className="mb-6 border-blue-200 bg-blue-50">
                        <CardContent className="p-6">
                            <div className="flex gap-4">
                                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-blue-900 mb-2">
                                        Anlage V - Einkünfte aus Vermietung und Verpachtung
                                    </h3>
                                    <p className="text-sm text-blue-800">
                                        Das System sammelt automatisch alle relevanten Daten aus Ihren Objekten, 
                                        Mietverträgen und Rechnungen. Nach einer dreistufigen Validierung können 
                                        Sie die Anlage V als PDF oder ELSTER-XML exportieren.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Letzte Submissions */}
                    {submissions.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Zuletzt bearbeitet</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {submissions.slice(0, 5).map(submission => {
                                        const building = buildings.find(b => b.id === submission.building_id);
                                        return (
                                            <div key={submission.id} 
                                                 className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <Building2 className="w-4 h-4 text-slate-400" />
                                                        <span className="font-medium text-slate-800">
                                                            {building?.name || 'Objekt gelöscht'}
                                                        </span>
                                                        <Badge variant="outline">
                                                            {submission.tax_year}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-slate-600 ml-7">
                                                        {building?.address} {building?.house_number}, {building?.city}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {getStatusBadge(submission.status)}
                                                    <Button size="sm" variant="outline">
                                                        Bearbeiten
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Neu erstellen */}
                <TabsContent value="create" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Anlage V erstellen</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {buildings.length === 0 ? (
                                <div className="text-center py-12">
                                    <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-800 mb-2">
                                        Keine Objekte vorhanden
                                    </h3>
                                    <p className="text-slate-600 mb-4">
                                        Legen Sie zuerst ein Gebäude an, um eine Anlage V zu erstellen
                                    </p>
                                    <Button onClick={() => window.location.href = '/buildings'}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Objekt anlegen
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Steuerjahr auswählen
                                        </label>
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                                            className="w-48 rounded-md border border-slate-300 px-3 py-2"
                                        >
                                            {[0, 1, 2, 3].map(offset => {
                                                const year = new Date().getFullYear() - offset;
                                                return (
                                                    <option key={year} value={year}>{year}</option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    <h3 className="font-semibold text-slate-800 mb-3">
                                        Objekt auswählen
                                    </h3>
                                    <div className="grid gap-4">
                                        {buildings.map(building => (
                                            <div key={building.id} 
                                                 className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <Building2 className="w-4 h-4 text-slate-400" />
                                                        <span className="font-medium text-slate-800">
                                                            {building.name}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 ml-7">
                                                        {building.address} {building.house_number}, {building.city}
                                                    </p>
                                                </div>
                                                <Button
                                                    onClick={() => handleCreateAnlageV(building)}
                                                    className="bg-emerald-600 hover:bg-emerald-700"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Anlage V erstellen
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Verlauf */}
                <TabsContent value="history" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Erstellte Anlagen</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {submissions.length === 0 ? (
                                <div className="text-center py-12">
                                    <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                    <p className="text-slate-600">Noch keine Anlagen erstellt</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {submissions.map(submission => {
                                        const building = buildings.find(b => b.id === submission.building_id);
                                        return (
                                            <div key={submission.id}
                                                 className="flex items-center justify-between p-4 border rounded-lg">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <Building2 className="w-4 h-4 text-slate-400" />
                                                        <span className="font-medium text-slate-800">
                                                            {building?.name || 'Objekt gelöscht'}
                                                        </span>
                                                        <Badge variant="outline">
                                                            {submission.tax_year}
                                                        </Badge>
                                                        {getStatusBadge(submission.status)}
                                                    </div>
                                                    <p className="text-sm text-slate-600 ml-7">
                                                        Erstellt am {new Date(submission.created_date).toLocaleDateString('de-DE')}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        onClick={async () => {
                                                            try {
                                                                const response = await base44.functions.invoke('exportAnlageVPDF', {
                                                                    submission_id: submission.id
                                                                });
                                                                const blob = new Blob([response.data], { type: 'application/pdf' });
                                                                const url = window.URL.createObjectURL(blob);
                                                                const a = document.createElement('a');
                                                                a.href = url;
                                                                a.download = `Anlage_V_${submission.tax_year}.pdf`;
                                                                a.click();
                                                                window.URL.revokeObjectURL(url);
                                                            } catch (error) {
                                                                console.error('Export error:', error);
                                                            }
                                                        }}
                                                    >
                                                        <Download className="w-4 h-4 mr-2" />
                                                        PDF
                                                    </Button>
                                                    <Button size="sm" variant="outline">
                                                        Bearbeiten
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Wizard */}
            <AnlageVWizard
                open={wizardOpen}
                onOpenChange={setWizardOpen}
                building={selectedBuilding}
                taxYear={selectedYear}
            />
        </div>
    );
}