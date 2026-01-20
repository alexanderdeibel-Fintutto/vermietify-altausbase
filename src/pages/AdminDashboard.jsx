import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Users, Building2, FileText, Euro, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminDashboard() {
    const { data: currentUser } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me()
    });

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => base44.entities.User.list(),
        enabled: currentUser?.role === 'admin'
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const { data: auditLogs = [] } = useQuery({
        queryKey: ['auditLogs'],
        queryFn: () => base44.entities.AuditLog.list('-timestamp', 10)
    });

    if (currentUser?.role !== 'admin') {
        return (
            <Card>
                <CardContent className="py-16 text-center">
                    <Shield className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold mb-2">Keine Berechtigung</h3>
                    <p className="text-gray-600">Diese Seite ist nur für Administratoren zugänglich</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Admin Dashboard</h1>
                    <p className="vf-page-subtitle">Systemverwaltung & Übersicht</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{users.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Benutzer</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Building2 className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold">{buildings.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Gebäude</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FileText className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold">{auditLogs.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Letzte Aktivitäten</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Shield className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">Admin</div>
                        <div className="text-sm opacity-90 mt-1">Vollzugriff</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link to={createPageUrl('UserManagement')}>
                    <Card className="vf-card-clickable h-full">
                        <CardContent className="p-8 text-center">
                            <Users className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                            <h3 className="text-xl font-semibold mb-2">Benutzerverwaltung</h3>
                            <p className="text-gray-600 text-sm">Benutzer einladen & verwalten</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link to={createPageUrl('AuditLog')}>
                    <Card className="vf-card-clickable h-full">
                        <CardContent className="p-8 text-center">
                            <FileText className="w-16 h-16 mx-auto mb-4 text-purple-600" />
                            <h3 className="text-xl font-semibold mb-2">Audit Log</h3>
                            <p className="text-gray-600 text-sm">Systemaktivitäten einsehen</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link to={createPageUrl('SystemSettings')}>
                    <Card className="vf-card-clickable h-full">
                        <CardContent className="p-8 text-center">
                            <Shield className="w-16 h-16 mx-auto mb-4 text-orange-600" />
                            <h3 className="text-xl font-semibold mb-2">Systemeinstellungen</h3>
                            <p className="text-gray-600 text-sm">System konfigurieren</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Letzte Systemaktivitäten</h3>
                    <div className="space-y-2">
                        {auditLogs.slice(0, 5).map((log) => (
                            <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <Badge className="vf-badge-default text-xs">{log.action}</Badge>
                                        <span className="text-sm font-medium">{log.entity_type}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">{log.user_email}</div>
                                </div>
                                <div className="text-xs text-gray-500">
                                    {new Date(log.timestamp || log.created_date).toLocaleString('de-DE')}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}