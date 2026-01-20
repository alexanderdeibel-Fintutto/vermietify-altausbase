import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Mail, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function UserManagement() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        role: 'user'
    });

    const queryClient = useQueryClient();

    const { data: currentUser } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me()
    });

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => base44.entities.User.list(),
        enabled: currentUser?.role === 'admin'
    });

    const inviteUserMutation = useMutation({
        mutationFn: ({ email, role }) => base44.users.inviteUser(email, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setDialogOpen(false);
            setFormData({ email: '', role: 'user' });
            showSuccess('Einladung versendet');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        inviteUserMutation.mutate(formData);
    };

    if (currentUser?.role !== 'admin') {
        return (
            <Card>
                <CardContent className="py-16 text-center">
                    <Shield className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold mb-2">Keine Berechtigung</h3>
                    <p className="text-gray-600">Nur Administratoren können Benutzer verwalten</p>
                </CardContent>
            </Card>
        );
    }

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Benutzerverwaltung</h1>
                    <p className="vf-page-subtitle">{users.length} Benutzer</p>
                </div>
                <div className="vf-page-actions">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="vf-btn-gradient">
                                <Plus className="w-4 h-4" />
                                Benutzer einladen
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Benutzer einladen</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <VfInput
                                    label="E-Mail-Adresse"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="benutzer@example.com"
                                    required
                                />
                                <VfSelect
                                    label="Rolle"
                                    value={formData.role}
                                    onChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                                    options={[
                                        { value: 'user', label: 'Benutzer' },
                                        { value: 'admin', label: 'Administrator' }
                                    ]}
                                />
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                        Abbrechen
                                    </Button>
                                    <Button type="submit" className="vf-btn-gradient">
                                        Einladung senden
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="space-y-3">
                {users.map((user) => (
                    <Card key={user.id}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        {user.full_name?.charAt(0) || user.email?.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-semibold">{user.full_name || 'Unbenannt'}</div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Mail className="w-3 h-3" />
                                            {user.email}
                                        </div>
                                    </div>
                                </div>
                                <Badge className={user.role === 'admin' ? 'vf-badge-gradient' : 'vf-badge-default'}>
                                    {user.role === 'admin' ? (
                                        <>
                                            <Shield className="w-3 h-3 mr-1" />
                                            Admin
                                        </>
                                    ) : 'Benutzer'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}