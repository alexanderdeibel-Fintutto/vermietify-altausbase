import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Gem } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import PreciousMetalFormDialog from '@/components/wealth/PreciousMetalFormDialog';
import { formatCurrency } from '@/lib/utils';

export default function PreciousMetals() {
    const [formOpen, setFormOpen] = useState(false);
    const [editingMetal, setEditingMetal] = useState(null);

    const { data: metals = [] } = useQuery({
        queryKey: ['precious-metals'],
        queryFn: () => base44.entities.PreciousMetal.list('-updated_date')
    });

    const totalValue = metals.reduce((sum, m) => {
        const weight = m.weight_grams || 0;
        const price = m.current_price_per_gram || 0;
        return sum + (weight * price);
    }, 0);

    return (
        <div className="space-y-8">
            <PageHeader 
                title="Edelmetalle"
                subtitle={`${metals.length} Positionen · Gesamtwert: ${formatCurrency(totalValue)}`}
            />

            <motion.div className="flex justify-end">
                <Button 
                    onClick={() => setFormOpen(true)}
                    className="gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Edelmetall hinzufügen
                </Button>
            </motion.div>

            <AnimatePresence mode="wait">
                {metals.length === 0 ? (
                    <EmptyState
                        icon={Gem}
                        title="Keine Edelmetalle erfasst"
                        description="Fügen Sie Ihre erste Edelmetallposition hinzu."
                        action={() => setFormOpen(true)}
                        actionLabel="Erste Position erstellen"
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {metals.map((metal, idx) => (
                            <motion.div
                                key={metal.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Card 
                                    className="cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => { setEditingMetal(metal); setFormOpen(true); }}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-slate-800">{metal.name}</h3>
                                                <p className="text-sm text-slate-500">{metal.metal_type}</p>
                                                <p className="text-xs text-slate-400 mt-1">{metal.form}</p>
                                            </div>
                                            <Gem className="w-5 h-5 text-yellow-700" />
                                        </div>
                                        {metal.weight_grams && metal.current_price_per_gram && (
                                            <div className="mt-4">
                                                <p className="text-sm text-slate-600">
                                                    {metal.weight_grams}g · {formatCurrency(metal.weight_grams * metal.current_price_per_gram)}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            <PreciousMetalFormDialog
                open={formOpen}
                onOpenChange={(open) => {
                    setFormOpen(open);
                    if (!open) setEditingMetal(null);
                }}
                metal={editingMetal}
            />
        </div>
    );
}