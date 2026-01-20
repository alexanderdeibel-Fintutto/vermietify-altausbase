import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tantml/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, TrendingUp, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PropertyTaxOverview() {
    const { data: anlageVRecords = [] } = useQuery({
        queryKey: ['anlageV'],
        queryFn: () => base44.entities.AnlageV.list('-tax_year')
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Steuer-Übersicht</h1>
                    <p className="vf-page-subtitle">Anlage V & Steuererklärungen</p>
                </div>
                <div className="vf-page-actions">
                    <Link to={createPageUrl('AnlageVWizardEnhanced')}>
                        <Button className="vf-btn-gradient">
                            Anlage V erstellen
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Tax Years */}
            {anlageVRecords.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center">
                            <FileText className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">Noch keine Steuererklärungen</h3>
                            <p className="text-gray-600 mb-6">Erstellen Sie Ihre erste Anlage V</p>
                            <Link to={createPageUrl('AnlageVWizardEnhanced')}>
                                <Button className="vf-btn-gradient">
                                    Anlage V erstellen
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {anlageVRecords.map((record) => {
                        const building = buildings.find(b => b.id === record.building_id);
                        return (
                            <Card key={record.id} className="vf-card-clickable">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <FileText className="w-10 h-10 text-purple-600" />
                                            <div>
                                                <h3 className="font-semibold text-lg">Anlage V {record.tax_year}</h3>
                                                {building && (
                                                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                                        <Building2 className="w-3 h-3" />
                                                        {building.name}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-lg mb-1">
                                                {record.net_income?.toLocaleString('de-DE')}€
                                            </div>
                                            <div className="text-xs text-gray-500">Netto-Einkünfte</div>
                                            <Button variant="outline" size="sm" className="mt-2">
                                                <Download className="w-3 h-3" />
                                                PDF
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}