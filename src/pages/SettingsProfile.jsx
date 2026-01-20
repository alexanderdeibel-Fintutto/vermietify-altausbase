import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { showSuccess, showError } from '@/components/notifications/ToastNotification';
import { User, Mail, Building2, Save } from 'lucide-react';

export default function SettingsProfile() {
    const queryClient = useQueryClient();
    
    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me()
    });

    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        email: user?.email || '',
        company: user?.company || '',
        phone: user?.phone || ''
    });

    const updateProfileMutation = useMutation({
        mutationFn: (data) => base44.auth.updateMe(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            showSuccess('Profil aktualisiert');
        },
        onError: () => {
            showError('Fehler beim Speichern');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        updateProfileMutation.mutate(formData);
    };

    return (
        <div className="p-6 max-w-2xl">
            <div className="vf-page-header mb-6">
                <div>
                    <h1 className="vf-page-title">Profil bearbeiten</h1>
                    <p className="vf-page-subtitle">Verwalten Sie Ihre persönlichen Informationen</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Persönliche Daten</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <VfInput
                            label="Name"
                            leftIcon={User}
                            value={formData.full_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                            required
                        />
                        
                        <VfInput
                            label="E-Mail"
                            type="email"
                            leftIcon={Mail}
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            disabled
                            hint="E-Mail kann nicht geändert werden"
                        />
                        
                        <VfInput
                            label="Firma"
                            leftIcon={Building2}
                            value={formData.company}
                            onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                        />
                        
                        <VfInput
                            label="Telefon"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="submit" className="vf-btn-gradient">
                                <Save className="w-4 h-4" />
                                Speichern
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}