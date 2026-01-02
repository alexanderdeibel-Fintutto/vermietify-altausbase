import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FileText, Calendar, Euro, Building2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import OperatingCostStatementDialog from '@/components/operating-costs/OperatingCostStatementDialog';
import StatementDetailDialog from '@/components/operating-costs/StatementDetailDialog';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function OperatingCosts() {
    const [formOpen, setFormOpen] = useState(false);
    const [selectedStatement, setSelectedStatement] = useState(null);
    const [editingStatement, setEditingStatement] = useState(null);

    const { data: statements = [], isLoading } = useQuery({
        queryKey: ['operating-cost-statements'],
        queryFn: () => base44.entities.OperatingCostStatement.list()
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const getBuilding = (buildingId) => buildings.find(b => b.id === buildingId);

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
                    {statements.map((statement) => {
                        const building = getBuilding(statement.building_id);
                        const isDraft = statement.status === 'draft';
                        
                        return (
                            <Card 
                                key={statement.id} 
                                className={`border-slate-200/50 hover:shadow-md transition-shadow cursor-pointer ${isDraft ? 'border-amber-300 bg-amber-50/30' : ''}`}
                                onClick={() => {
                                    if (isDraft) {
                                        setEditingStatement(statement);
                                        setFormOpen(true);
                                    } else {
                                        setSelectedStatement(statement);
                                    }
                                }}
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDraft ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                                                <FileText className={`w-5 h-5 ${isDraft ? 'text-amber-600' : 'text-emerald-600'}`} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-slate-800">
                                                        Abrechnung {new Date(statement.period_start).getFullYear()}
                                                    </h3>
                                                    {isDraft && (
                                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                                                            Entwurf
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-500">
                                                    {building?.name || 'Unbekanntes Gebäude'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Building2 className="w-4 h-4 text-slate-400" />
                                            <span>{building?.address || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <span>{statement.period_start} - {statement.period_end}</span>
                                        </div>
                                        {!isDraft && (
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Euro className="w-4 h-4 text-slate-400" />
                                                <span>Gesamtkosten: €{statement.total_costs?.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <OperatingCostStatementDialog
                open={formOpen}
                onOpenChange={(open) => {
                    setFormOpen(open);
                    if (!open) {
                        setEditingStatement(null);
                    }
                }}
                onSuccess={() => {
                    setFormOpen(false);
                    setEditingStatement(null);
                }}
                existingStatement={editingStatement}
            />

            <StatementDetailDialog
                open={!!selectedStatement}
                onOpenChange={(open) => !open && setSelectedStatement(null)}
                statement={selectedStatement}
            />
        </div>
    );
}