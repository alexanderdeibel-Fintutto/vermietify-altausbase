import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VfSelect } from '@/components/shared/VfSelect';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, CheckCircle, Clock, Mail, UserPlus } from 'lucide-react';
import { showSuccess, showError } from '@/components/notifications/ToastNotification';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function AdminLeadDashboardEnhanced() {
    const [selectedStatus, setSelectedStatus] = useState('all');
    const queryClient = useQueryClient();

    const { data: leads = [], isLoading } = useQuery({
        queryKey: ['leads'],
        queryFn: () => base44.entities.Lead.list('-lead_score')
    });

    const convertLeadMutation = useMutation({
        mutationFn: (leadId) => base44.functions.invoke('convertLeadToUser', { lead_id: leadId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            showSuccess('Lead erfolgreich konvertiert');
        },
        onError: () => showError('Fehler beim Konvertieren')
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ leadId, status }) => base44.entities.Lead.update(leadId, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            showSuccess('Status aktualisiert');
        }
    });

    const filteredLeads = selectedStatus === 'all' 
        ? leads 
        : leads.filter(l => l.status === selectedStatus);

    const stats = {
        total: leads.length,
        new: leads.filter(l => l.status === 'new').length,
        qualified: leads.filter(l => l.status === 'qualified').length,
        converted: leads.filter(l => l.status === 'converted').length,
        avgScore: leads.length > 0 ? Math.round(leads.reduce((sum, l) => sum + (l.lead_score || 0), 0) / leads.length) : 0
    };

    const getScoreColor = (score) => {
        if (score >= 70) return 'text-green-600 bg-green-100';
        if (score >= 40) return 'text-yellow-600 bg-yellow-100';
        return 'text-gray-600 bg-gray-100';
    };

    const getStatusBadge = (status) => {
        const variants = {
            new: 'vf-badge-info',
            contacted: 'vf-badge-warning',
            qualified: 'vf-badge-primary',
            converted: 'vf-badge-success',
            lost: 'vf-badge-error'
        };
        return variants[status] || 'vf-badge-default';
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Lead Management</h1>
                    <p className="vf-page-subtitle">Verwalten Sie Ihre Interessenten</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Gesamt</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <Users className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Neu</p>
                                <p className="text-2xl font-bold">{stats.new}</p>
                            </div>
                            <Clock className="w-8 h-8 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Qualifiziert</p>
                                <p className="text-2xl font-bold">{stats.qualified}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Konvertiert</p>
                                <p className="text-2xl font-bold">{stats.converted}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Ø Score</p>
                                <p className="text-2xl font-bold">{stats.avgScore}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter */}
            <div className="flex gap-4 items-center">
                <VfSelect
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    options={[
                        { value: 'all', label: 'Alle Status' },
                        { value: 'new', label: 'Neu' },
                        { value: 'contacted', label: 'Kontaktiert' },
                        { value: 'qualified', label: 'Qualifiziert' },
                        { value: 'converted', label: 'Konvertiert' },
                        { value: 'lost', label: 'Verloren' }
                    ]}
                />
            </div>

            {/* Leads Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Leads ({filteredLeads.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="vf-table-container">
                        <table className="vf-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>E-Mail</th>
                                    <th>Quelle</th>
                                    <th>Score</th>
                                    <th>Status</th>
                                    <th>Letzte Aktivität</th>
                                    <th className="text-right">Aktionen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeads.map((lead) => (
                                    <tr key={lead.id}>
                                        <td>
                                            <div className="font-medium">{lead.full_name || 'Unbekannt'}</div>
                                            {lead.company && <div className="text-xs text-gray-500">{lead.company}</div>}
                                        </td>
                                        <td>{lead.email}</td>
                                        <td>
                                            <Badge className="vf-badge-default">{lead.source}</Badge>
                                        </td>
                                        <td>
                                            <span className={`px-2 py-1 rounded-full text-sm font-semibold ${getScoreColor(lead.lead_score || 0)}`}>
                                                {lead.lead_score || 0}
                                            </span>
                                        </td>
                                        <td>
                                            <Badge className={getStatusBadge(lead.status)}>{lead.status}</Badge>
                                        </td>
                                        <td className="text-sm text-gray-600">
                                            {lead.last_activity_date ? format(new Date(lead.last_activity_date), 'dd.MM.yyyy', { locale: de }) : '-'}
                                        </td>
                                        <td className="text-right space-x-2">
                                            {lead.status !== 'converted' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => updateStatusMutation.mutate({ leadId: lead.id, status: 'qualified' })}
                                                    >
                                                        Qualifizieren
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="vf-btn-gradient"
                                                        onClick={() => convertLeadMutation.mutate(lead.id)}
                                                    >
                                                        <UserPlus className="w-3 h-3" />
                                                        Konvertieren
                                                    </Button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}