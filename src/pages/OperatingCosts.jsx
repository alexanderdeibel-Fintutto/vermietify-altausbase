import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FileText, Calendar, Euro, Building2, HelpCircle } from 'lucide-react';
import InfoTooltip from '@/components/shared/InfoTooltip';
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
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
            <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extralight text-slate-700 tracking-wide">Betriebskosten</h1>
                  <InfoTooltip text="Nur Kosten mit Status 'Umlagefähig' werden hier berücksichtigt. Fehlende Kosten? Prüfe die Kategorisierung deiner Rechnungen." />
                </div>
                <p className="text-sm font-extralight text-slate-400 mt-1">{statements.length} Abrechnungen</p>
            </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex justify-end"
            >
                <Button 
                    onClick={() => setFormOpen(true)}
                    className="bg-slate-700 hover:bg-slate-800 font-extralight gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Neue Betriebskostenabrechnung
                </Button>
            </motion.div>

            <AnimatePresence mode="wait">
            {statements.length === 0 ? (
                <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                >
                <EmptyState
                    icon={FileText}
                    title="Noch keine Betriebskostenabrechnungen"
                    description="Erstellen Sie Ihre erste Betriebskostenabrechnung für Ihre Mieter."
                    action={() => setFormOpen(true)}
                    actionLabel="Erste Abrechnung erstellen"
                />
                </motion.div>
            ) : (
                <motion.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {statements.map((statement, idx) => {
                        const building = getBuilding(statement.building_id);
                        const isDraft = statement.status === 'draft';
                        
                        return (
                            <motion.div
                                key={statement.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                            <Card 
                                key={statement.id} 
                                className={`border-slate-100 shadow-none hover:shadow-sm transition-shadow cursor-pointer ${isDraft ? 'border-slate-200 bg-slate-50' : ''}`}
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
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDraft ? 'bg-slate-100' : 'bg-slate-50'}`}>
                                                <FileText className={`w-5 h-5 ${isDraft ? 'text-slate-500' : 'text-slate-400'}`} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-light text-slate-700">
                                                        Abrechnung {new Date(statement.period_start).getFullYear()}
                                                    </h3>
                                                    {isDraft && (
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-extralight rounded">
                                                            Entwurf
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-400 font-extralight">
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
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
            </AnimatePresence>

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