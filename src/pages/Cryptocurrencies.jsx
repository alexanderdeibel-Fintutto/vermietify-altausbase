import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Coins } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import CryptoFormDialog from '@/components/wealth/CryptoFormDialog';
import { formatCurrency } from '@/lib/utils';

export default function Cryptocurrencies() {
    const [formOpen, setFormOpen] = useState(false);
    const [editingCrypto, setEditingCrypto] = useState(null);

    const { data: cryptos = [] } = useQuery({
        queryKey: ['cryptos'],
        queryFn: () => base44.entities.Crypto.list('-updated_date')
    });

    const totalValue = cryptos.reduce((sum, c) => sum + (c.current_price_eur * 1 || 0), 0);

    return (
        <div className="space-y-8">
            <PageHeader 
                title="Kryptowährungen"
                subtitle={`${cryptos.length} Assets · Gesamtwert: ${formatCurrency(totalValue)}`}
            />

            <motion.div className="flex justify-end">
                <Button 
                    onClick={() => setFormOpen(true)}
                    className="gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Krypto hinzufügen
                </Button>
            </motion.div>

            <AnimatePresence mode="wait">
                {cryptos.length === 0 ? (
                    <EmptyState
                        icon={Coins}
                        title="Keine Kryptowährungen erfasst"
                        description="Fügen Sie Ihre erste Kryptoposition hinzu."
                        action={() => setFormOpen(true)}
                        actionLabel="Erste Position erstellen"
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cryptos.map((crypto, idx) => (
                            <motion.div
                                key={crypto.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Card 
                                    className="cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => { setEditingCrypto(crypto); setFormOpen(true); }}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-slate-800">{crypto.name}</h3>
                                                <p className="text-sm text-slate-500">{crypto.symbol}</p>
                                                {crypto.wallet_type && (
                                                    <p className="text-xs text-slate-400 mt-1">{crypto.wallet_type}</p>
                                                )}
                                            </div>
                                            <Coins className="w-5 h-5 text-yellow-600" />
                                        </div>
                                        {crypto.current_price_eur && (
                                            <div className="mt-4">
                                                <p className="text-sm font-semibold text-slate-700">
                                                    {crypto.current_price_eur.toFixed(2)} EUR
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

            <CryptoFormDialog
                open={formOpen}
                onOpenChange={(open) => {
                    setFormOpen(open);
                    if (!open) setEditingCrypto(null);
                }}
                crypto={editingCrypto}
            />
        </div>
    );
}