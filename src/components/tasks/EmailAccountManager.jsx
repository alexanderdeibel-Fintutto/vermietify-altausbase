import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Mail, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import IMAPAccountForm from './IMAPAccountForm';

export default function EmailAccountManager() {
    const [formOpen, setFormOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [syncing, setSyncing] = useState(null);
    const queryClient = useQueryClient();

    const { data: accounts = [], isLoading } = useQuery({
        queryKey: ['imapAccounts'],
        queryFn: () => base44.entities.IMAPAccount.list()
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.IMAPAccount.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['imapAccounts'] });
            setFormOpen(false);
            toast.success('IMAP-Konto erstellt');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.IMAPAccount.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['imapAccounts'] });
            setFormOpen(false);
            setEditingAccount(null);
            toast.success('IMAP-Konto aktualisiert');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.IMAPAccount.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['imapAccounts'] });
            toast.success('IMAP-Konto gelöscht');
        }
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, isActive }) => 
            base44.entities.IMAPAccount.update(id, { is_active: !isActive }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['imapAccounts'] });
        }
    });

    const syncMutation = useMutation({
        mutationFn: async (accountId) => {
            setSyncing(accountId);
            const response = await base44.functions.invoke('syncEmails', { account_id: accountId });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['imapAccounts'] });
            queryClient.invalidateQueries({ queryKey: ['emails'] });
            toast.success(`${data.count || 0} neue Emails synchronisiert`);
            setSyncing(null);
        },
        onError: (error) => {
            toast.error('Synchronisation fehlgeschlagen: ' + error.message);
            setSyncing(null);
        }
    });

    const handleSubmit = (data) => {
        if (editingAccount) {
            updateMutation.mutate({ id: editingAccount.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (account) => {
        setEditingAccount(account);
        setFormOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Möchten Sie dieses IMAP-Konto wirklich löschen?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleSync = (accountId) => {
        syncMutation.mutate(accountId);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">Email-Konten</h2>
                    <p className="text-sm text-slate-600">IMAP-Konten für Email-Synchronisation</p>
                </div>
                <Button
                    onClick={() => {
                        setEditingAccount(null);
                        setFormOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Neues Konto
                </Button>
            </div>

            {accounts.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <Mail className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Noch keine Email-Konten</h3>
                        <p className="text-slate-600 mb-4">Fügen Sie ein IMAP-Konto hinzu</p>
                        <Button onClick={() => setFormOpen(true)} variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            Erstes Konto anlegen
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {accounts.map((account) => (
                        <Card key={account.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CardTitle className="text-lg">{account.name}</CardTitle>
                                            {!account.is_active && (
                                                <Badge variant="outline" className="text-slate-500">
                                                    Inaktiv
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600">{account.email_address}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="text-sm">
                                        <p className="text-slate-500">Server</p>
                                        <p className="font-medium text-slate-800">
                                            {account.imap_server}:{account.imap_port}
                                        </p>
                                    </div>
                                    {account.last_sync && (
                                        <div className="text-sm">
                                            <p className="text-slate-500">Letzte Synchronisation</p>
                                            <p className="font-medium text-slate-800">
                                                {format(parseISO(account.last_sync), 'dd.MM.yyyy HH:mm', { locale: de })}
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between pt-2 border-t">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={account.is_active}
                                                onCheckedChange={() => 
                                                    toggleMutation.mutate({ 
                                                        id: account.id, 
                                                        isActive: account.is_active 
                                                    })
                                                }
                                            />
                                            <span className="text-sm text-slate-600">Aktiv</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSync(account.id)}
                                                disabled={syncing === account.id}
                                            >
                                                <RefreshCw className={`w-4 h-4 ${syncing === account.id ? 'animate-spin' : ''}`} />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(account)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(account.id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <IMAPAccountForm
                open={formOpen}
                onOpenChange={setFormOpen}
                onSubmit={handleSubmit}
                initialData={editingAccount}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
}