import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Landmark, Plus, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function BankAccounts() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        kontoinhaber: '',
        iban: '',
        bic: '',
        bank_name: ''
    });

    const queryClient = useQueryClient();

    const { data: accounts = [], isLoading } = useQuery({
        queryKey: ['bankAccounts'],
        queryFn: () => base44.entities.BankAccount.list('-created_date')
    });

    const createAccountMutation = useMutation({
        mutationFn: (data) => base44.entities.BankAccount.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
            setDialogOpen(false);
            setFormData({ kontoinhaber: '', iban: '', bic: '', bank_name: '' });
            showSuccess('Bankkonto erstellt');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createAccountMutation.mutate(formData);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Bankkonten</h1>
                    <p className="vf-page-subtitle">{accounts.length} Konten verwaltet</p>
                </div>
                <div className="vf-page-actions">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="vf-btn-gradient">
                                <Plus className="w-4 h-4" />
                                Konto hinzufügen
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Neues Bankkonto</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <VfInput
                                    label="Kontoinhaber"
                                    value={formData.kontoinhaber}
                                    onChange={(e) => setFormData(prev => ({ ...prev, kontoinhaber: e.target.value }))}
                                    required
                                />
                                <VfInput
                                    label="IBAN"
                                    value={formData.iban}
                                    onChange={(e) => setFormData(prev => ({ ...prev, iban: e.target.value }))}
                                    placeholder="DE89 3704 0044 0532 0130 00"
                                    required
                                />
                                <VfInput
                                    label="BIC"
                                    value={formData.bic}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bic: e.target.value }))}
                                />
                                <VfInput
                                    label="Bank"
                                    value={formData.bank_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                                />
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                        Abbrechen
                                    </Button>
                                    <Button type="submit" className="vf-btn-gradient">
                                        Erstellen
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {accounts.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center">
                            <Landmark className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">Noch keine Bankkonten</h3>
                            <p className="text-gray-600 mb-6">Fügen Sie Ihr erstes Bankkonto hinzu</p>
                            <Button className="vf-btn-gradient" onClick={() => setDialogOpen(true)}>
                                <Plus className="w-4 h-4" />
                                Erstes Konto hinzufügen
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {accounts.map((account) => (
                        <Card key={account.id} className="vf-card-clickable">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                                        <Landmark className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-2">{account.kontoinhaber}</h3>
                                        <div className="text-sm text-gray-600 mb-1 font-mono">
                                            {account.iban}
                                        </div>
                                        {account.bank_name && (
                                            <div className="text-sm text-gray-500">{account.bank_name}</div>
                                        )}
                                        <Badge className="vf-badge-success mt-2">Aktiv</Badge>
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