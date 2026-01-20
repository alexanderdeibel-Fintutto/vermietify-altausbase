import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Building2, Calendar, Crown, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MyAccount() {
    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me()
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const handleLogout = () => {
        base44.auth.logout();
    };

    return (
        <div className="max-w-4xl space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Mein Account</h1>
                    <p className="vf-page-subtitle">Verwalten Sie Ihr Profil und Ihre Einstellungen</p>
                </div>
                <div className="vf-page-actions">
                    <Button variant="outline" onClick={handleLogout}>
                        <LogOut className="w-4 h-4" />
                        Abmelden
                    </Button>
                </div>
            </div>

            {/* Profile Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Profil</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-900 to-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                            {user?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="font-semibold">{user?.full_name}</span>
                                {user?.role === 'admin' && (
                                    <Badge className="vf-badge-gradient">
                                        <Crown className="w-3 h-3 mr-1" />
                                        Admin
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <Mail className="w-4 h-4" />
                                {user?.email}
                            </div>
                            {user?.company && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Building2 className="w-4 h-4" />
                                    {user.company}
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="w-4 h-4" />
                                Mitglied seit {new Date(user?.created_date).toLocaleDateString('de-DE')}
                            </div>
                        </div>
                        <Link to={createPageUrl('SettingsProfile')}>
                            <Button variant="outline">Bearbeiten</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <Card>
                <CardHeader>
                    <CardTitle>Ihre Statistiken</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-900">{buildings.length}</div>
                            <div className="text-sm text-gray-600 mt-1">Gebäude</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-600">-</div>
                            <div className="text-sm text-gray-600 mt-1">Mieter</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-purple-600">-</div>
                            <div className="text-sm text-gray-600 mt-1">Verträge</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-orange-600">-</div>
                            <div className="text-sm text-gray-600 mt-1">Dokumente</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
                <CardHeader>
                    <CardTitle>Schnellzugriff</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-3">
                        <Link to={createPageUrl('SettingsProfile')}>
                            <Button variant="outline" className="w-full justify-start">
                                <User className="w-4 h-4" />
                                Profil bearbeiten
                            </Button>
                        </Link>
                        <Link to={createPageUrl('SettingsAppearance')}>
                            <Button variant="outline" className="w-full justify-start">
                                Darstellung anpassen
                            </Button>
                        </Link>
                        <Link to={createPageUrl('SettingsIntegrations')}>
                            <Button variant="outline" className="w-full justify-start">
                                Integrationen
                            </Button>
                        </Link>
                        <Link to={createPageUrl('MySubscription')}>
                            <Button variant="outline" className="w-full justify-start">
                                Abonnement verwalten
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}