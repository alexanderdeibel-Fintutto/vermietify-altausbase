import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Building2, Users, FileText, Euro, TrendingUp, AlertCircle, Plus } from 'lucide-react';

export default function Dashboard() {
    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me()
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: tasks = [] } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => base44.entities.Task.filter({ status: 'Offen' })
    });

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Willkommen zurück, {user?.full_name}!</h1>
                    <p className="vf-page-subtitle">Hier ist Ihre Übersicht</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Building2 className="w-8 h-8 text-blue-600" />
                            <TrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="vf-stat-card__value">{buildings.length}</div>
                        <div className="vf-stat-card__label">Gebäude</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="vf-stat-card__value">{tenants.length}</div>
                        <div className="vf-stat-card__label">Mieter</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FileText className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="vf-stat-card__value">{contracts.length}</div>
                        <div className="vf-stat-card__label">Verträge</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertCircle className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="vf-stat-card__value">{tasks.length}</div>
                        <div className="vf-stat-card__label">Offene Aufgaben</div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Schnellzugriff</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Link to={createPageUrl('Buildings')}>
                            <Button variant="outline" className="w-full h-20 flex-col gap-2">
                                <Building2 className="w-6 h-6" />
                                <span>Gebäude</span>
                            </Button>
                        </Link>
                        <Link to={createPageUrl('Tenants')}>
                            <Button variant="outline" className="w-full h-20 flex-col gap-2">
                                <Users className="w-6 h-6" />
                                <span>Mieter</span>
                            </Button>
                        </Link>
                        <Link to={createPageUrl('Contracts')}>
                            <Button variant="outline" className="w-full h-20 flex-col gap-2">
                                <FileText className="w-6 h-6" />
                                <span>Verträge</span>
                            </Button>
                        </Link>
                        <Link to={createPageUrl('Invoices')}>
                            <Button variant="outline" className="w-full h-20 flex-col gap-2">
                                <Euro className="w-6 h-6" />
                                <span>Rechnungen</span>
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Buildings */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Ihre Gebäude</CardTitle>
                        <Link to={createPageUrl('Buildings')}>
                            <Button variant="outline" size="sm">
                                <Plus className="w-4 h-4" />
                                Hinzufügen
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {buildings.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Noch keine Gebäude erfasst</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {buildings.slice(0, 5).map((building) => (
                                <Link key={building.id} to={createPageUrl('BuildingDetail') + `?id=${building.id}`}>
                                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Building2 className="w-5 h-5 text-blue-600" />
                                            <div>
                                                <div className="font-medium">{building.name}</div>
                                                <div className="text-sm text-gray-500">{building.strasse}, {building.ort}</div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Open Tasks */}
            {tasks.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Offene Aufgaben</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {tasks.slice(0, 5).map((task) => (
                                <div key={task.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5 text-orange-600" />
                                        <div>
                                            <div className="font-medium">{task.titel}</div>
                                            {task.faelligkeitsdatum && (
                                                <div className="text-sm text-gray-500">
                                                    Fällig: {new Date(task.faelligkeitsdatum).toLocaleDateString('de-DE')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}