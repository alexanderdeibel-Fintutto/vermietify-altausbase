import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FileText, Calendar, Euro } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';

export default function OperatingCosts() {
    const [formOpen, setFormOpen] = useState(false);

    // Placeholder - wird später mit echter Entity ersetzt
    const { data: statements = [], isLoading } = useQuery({
        queryKey: ['operating-cost-statements'],
        queryFn: async () => {
            // Platzhalter für zukünftige Entity
            return [];
        }
    });

    return (
        <div className="space-y-8">
            <PageHeader 
                title="Betriebskosten"
                subtitle={`${statements.length} Abrechnungen`}
            />

            <div className="flex justify-end">
                <Button 
                    onClick={() => setFormOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Neue Betriebskostenabrechnung
                </Button>
            </div>

            {statements.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="Noch keine Betriebskostenabrechnungen"
                    description="Erstellen Sie Ihre erste Betriebskostenabrechnung für Ihre Mieter."
                    action={() => setFormOpen(true)}
                    actionLabel="Erste Abrechnung erstellen"
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {statements.map((statement) => (
                        <Card key={statement.id} className="border-slate-200/50 hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-800">
                                                {statement.year}
                                            </h3>
                                            <p className="text-sm text-slate-500">
                                                {statement.building_name}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <span>Abrechnungszeitraum: {statement.period}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Euro className="w-4 h-4 text-slate-400" />
                                        <span>Gesamtkosten: €{statement.total_costs?.toFixed(2)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Formular Dialog - wird später hinzugefügt */}
        </div>
    );
}