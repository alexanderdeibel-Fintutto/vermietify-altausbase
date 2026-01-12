import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Briefcase } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';

export default function PortfolioManagement() {
    const [formOpen, setFormOpen] = useState(false);

    const { data: portfolios = [] } = useQuery({
        queryKey: ['portfolios'],
        queryFn: () => base44.entities.Portfolio.list('-updated_date')
    });

    return (
        <div className="space-y-8">
            <PageHeader 
                title="Depots & Portfolios"
                subtitle={`${portfolios.length} Depots`}
            />

            <motion.div className="flex justify-end">
                <Button 
                    onClick={() => setFormOpen(true)}
                    className="gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Depot hinzufügen
                </Button>
            </motion.div>

            <AnimatePresence mode="wait">
                {portfolios.length === 0 ? (
                    <EmptyState
                        icon={Briefcase}
                        title="Keine Depots erfasst"
                        description="Erstellen Sie Ihr erstes Depot."
                        action={() => setFormOpen(true)}
                        actionLabel="Erstes Depot erstellen"
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {portfolios.map((portfolio, idx) => (
                            <motion.div
                                key={portfolio.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Card className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-slate-800">{portfolio.name}</h3>
                                                <p className="text-sm text-slate-500">{portfolio.broker_name}</p>
                                                <p className="text-xs text-slate-400 mt-1">{portfolio.portfolio_type}</p>
                                            </div>
                                            <Briefcase className="w-5 h-5 text-blue-600" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}