import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCheck, Mail, Phone, Plus, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function OwnersManagement() {
    const { data: owners = [] } = useQuery({
        queryKey: ['owners'],
        queryFn: () => base44.entities.Owner.list('-created_date')
    });

    const { data: ownerships = [] } = useQuery({
        queryKey: ['buildingOwnerships'],
        queryFn: () => base44.entities.BuildingOwnership.list()
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Eigentümerverwaltung</h1>
                    <p className="vf-page-subtitle">{owners.length} Eigentümer</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Plus className="w-4 h-4 mr-2" />
                        Neuer Eigentümer
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <UserCheck className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{owners.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Eigentümer</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Building2 className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold">{ownerships.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Beteiligungen</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">
                            {owners.filter(o => o.typ === 'Natürliche Person').length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Privatpersonen</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">
                            {owners.filter(o => o.typ === 'Juristische Person').length}
                        </div>
                        <div className="text-sm opacity-90 mt-1">Unternehmen</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Alle Eigentümer</h3>
                    <div className="space-y-2">
                        {owners.map((owner) => {
                            const ownerBuildings = ownerships.filter(o => o.owner_id === owner.id);
                            return (
                                <div key={owner.id} className="p-4 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <div className="font-semibold">{owner.name}</div>
                                            <Badge className="mt-1 vf-badge-primary text-xs">{owner.typ}</Badge>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {ownerBuildings.length} {ownerBuildings.length === 1 ? 'Gebäude' : 'Gebäude'}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="w-4 h-4 text-gray-500" />
                                            <span className="text-gray-700">{owner.email || '-'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone className="w-4 h-4 text-gray-500" />
                                            <span className="text-gray-700">{owner.telefon || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}