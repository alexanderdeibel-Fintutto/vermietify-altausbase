import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Calendar, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function OperatingCosts() {
    const { data: statements = [], isLoading } = useQuery({
        queryKey: ['operatingCostStatements'],
        queryFn: () => base44.entities.OperatingCostStatement.list('-abrechnungsjahr')
    });

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Betriebskostenabrechnungen</h1>
                    <p className="vf-page-subtitle">{statements.length} Abrechnungen</p>
                </div>
                <div className="vf-page-actions">
                    <Link to={createPageUrl('BKAbrechnungWizardEnhanced')}>
                        <Button className="vf-btn-gradient">
                            <Plus className="w-4 h-4" />
                            Neue Abrechnung
                        </Button>
                    </Link>
                </div>
            </div>

            {statements.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center">
                            <FileText className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">Noch keine Abrechnungen</h3>
                            <p className="text-gray-600 mb-6">Erstellen Sie Ihre erste Betriebskostenabrechnung</p>
                            <Link to={createPageUrl('BKAbrechnungWizardEnhanced')}>
                                <Button className="vf-btn-gradient">
                                    <Plus className="w-4 h-4" />
                                    Erste Abrechnung erstellen
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {statements.map((statement) => (
                        <Card key={statement.id} className="vf-card-clickable">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <FileText className="w-10 h-10 text-purple-600" />
                                        <div>
                                            <h3 className="font-semibold text-lg">Abrechnung {statement.abrechnungsjahr}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(statement.zeitraum_von).toLocaleDateString('de-DE')} - {new Date(statement.zeitraum_bis).toLocaleDateString('de-DE')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge className={
                                            statement.status === 'Versendet' ? 'vf-badge-success' :
                                            statement.status === 'Geprüft' ? 'vf-badge-info' :
                                            'vf-badge-warning'
                                        }>
                                            {statement.status === 'Versendet' && <CheckCircle className="w-3 h-3 mr-1" />}
                                            {statement.status === 'Entwurf' && <Clock className="w-3 h-3 mr-1" />}
                                            {statement.status}
                                        </Badge>
                                        {statement.gesamtkosten && (
                                            <div className="mt-2 font-semibold text-lg">{statement.gesamtkosten.toLocaleString('de-DE')}€</div>
                                        )}
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