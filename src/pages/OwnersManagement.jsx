import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Building2, DollarSign, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function OwnersManagement() {
    const { data: owners = [] } = useQuery({
        queryKey: ['owners'],
        queryFn: () => base44.entities.Owner.list()
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
                <Button className="vf-btn-gradient">
                    <Plus className="w-4 h-4 mr-2" />
                    Neuer Eigentümer
                </Button>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{owners.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Eigentümer</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{buildings.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Immobilien</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">
                            {owners.filter(o => o.owner_type === 'person').length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Privatpersonen</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">
                            {owners.filter(o => o.owner_type === 'company').length}
                        </div>
                        <div className="text-sm opacity-90 mt-1">Gesellschaften</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Eigentümerliste</h3>
                    <div className="space-y-2">
                        {owners.map(owner => (
                            <div key={owner.id} className="p-4 bg-gray-50 rounded-lg border">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-semibold">{owner.name}</div>
                                        <div className="text-sm text-gray-600">{owner.email}</div>
                                    </div>
                                    <Badge className={owner.owner_type === 'person' ? 'vf-badge-primary' : 'vf-badge-accent'}>
                                        {owner.owner_type === 'person' ? 'Privatperson' : 'Gesellschaft'}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                        {owners.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                Noch keine Eigentümer angelegt
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}