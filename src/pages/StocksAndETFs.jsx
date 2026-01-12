import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, TrendingUp, DollarSign } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import StockFormDialog from '@/components/wealth/StockFormDialog';
import { formatCurrency } from '@/lib/utils';

export default function StocksAndETFs() {
    const [formOpen, setFormOpen] = useState(false);
    const [editingStock, setEditingStock] = useState(null);

    const { data: stocks = [], isLoading } = useQuery({
        queryKey: ['stocks'],
        queryFn: () => base44.entities.Stock.list('-updated_date')
    });

    const totalValue = stocks.reduce((sum, s) => sum + (s.current_price * 1 || 0), 0);

    return (
        <div className="space-y-8">
            <PageHeader 
                title="Aktien & ETFs"
                subtitle={`${stocks.length} Positionen · Gesamtwert: ${formatCurrency(totalValue)}`}
            />

            <motion.div className="flex justify-end">
                <Button 
                    onClick={() => setFormOpen(true)}
                    className="gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Position hinzufügen
                </Button>
            </motion.div>

            <AnimatePresence mode="wait">
                {stocks.length === 0 ? (
                    <EmptyState
                        icon={TrendingUp}
                        title="Keine Aktien/ETFs erfasst"
                        description="Fügen Sie Ihre erste Wertpapierposition hinzu."
                        action={() => setFormOpen(true)}
                        actionLabel="Erste Position erstellen"
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stocks.map((stock, idx) => (
                            <motion.div
                                key={stock.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Card 
                                    className="cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => { setEditingStock(stock); setFormOpen(true); }}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-slate-800">{stock.name}</h3>
                                                <p className="text-sm text-slate-500">{stock.isin}</p>
                                                <p className="text-xs text-slate-400 mt-1">{stock.type}</p>
                                            </div>
                                            <TrendingUp className="w-5 h-5 text-blue-600" />
                                        </div>
                                        {stock.current_price && (
                                            <div className="mt-4 flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-slate-400" />
                                                <span className="font-semibold">{stock.current_price.toFixed(2)} EUR</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            <StockFormDialog
                open={formOpen}
                onOpenChange={(open) => {
                    setFormOpen(open);
                    if (!open) setEditingStock(null);
                }}
                stock={editingStock}
            />
        </div>
    );
}