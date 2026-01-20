import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Home, Euro, FileText, MessageSquare, Wrench } from 'lucide-react';

export default function TenantPortal() {
    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me()
    });

    const { data: tenant } = useQuery({
        queryKey: ['currentTenant'],
        queryFn: async () => {
            const tenants = await base44.entities.Tenant.filter({ email: user?.email });
            return tenants[0];
        },
        enabled: !!user?.email
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['myContracts'],
        queryFn: () => base44.entities.LeaseContract.filter({ tenant_id: tenant?.id }),
        enabled: !!tenant?.id
    });

    return (
        <div className="space-y-6">
            <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {user?.full_name?.charAt(0) || 'M'}
                </div>
                <h1 className="text-3xl font-bold">Willkommen, {user?.full_name}</h1>
                <p className="text-gray-600 mt-2">Ihr Mieterportal</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="vf-card-clickable">
                    <CardContent className="p-8 text-center">
                        <Home className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                        <h3 className="text-xl font-semibold mb-2">Mein Mietvertrag</h3>
                        <p className="text-gray-600 text-sm">{contracts.length} aktive Verträge</p>
                    </CardContent>
                </Card>

                <Card className="vf-card-clickable">
                    <CardContent className="p-8 text-center">
                        <Euro className="w-16 h-16 mx-auto mb-4 text-green-600" />
                        <h3 className="text-xl font-semibold mb-2">Zahlungen</h3>
                        <p className="text-gray-600 text-sm">Übersicht & Belege</p>
                    </CardContent>
                </Card>

                <Card className="vf-card-clickable">
                    <CardContent className="p-8 text-center">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-purple-600" />
                        <h3 className="text-xl font-semibold mb-2">Dokumente</h3>
                        <p className="text-gray-600 text-sm">Verträge & Abrechnungen</p>
                    </CardContent>
                </Card>

                <Card className="vf-card-clickable">
                    <CardContent className="p-8 text-center">
                        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-orange-600" />
                        <h3 className="text-xl font-semibold mb-2">Nachrichten</h3>
                        <p className="text-gray-600 text-sm">Kontakt zum Vermieter</p>
                    </CardContent>
                </Card>

                <Card className="vf-card-clickable">
                    <CardContent className="p-8 text-center">
                        <Wrench className="w-16 h-16 mx-auto mb-4 text-red-600" />
                        <h3 className="text-xl font-semibold mb-2">Schadensmeldung</h3>
                        <p className="text-gray-600 text-sm">Mängel melden</p>
                    </CardContent>
                </Card>

                <Card className="vf-card-clickable">
                    <CardContent className="p-8 text-center">
                        <User className="w-16 h-16 mx-auto mb-4 text-indigo-600" />
                        <h3 className="text-xl font-semibold mb-2">Mein Profil</h3>
                        <p className="text-gray-600 text-sm">Daten bearbeiten</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}