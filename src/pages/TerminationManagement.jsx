import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileX, Plus, Calendar, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TerminationManagement() {
    const { data: terminations = [] } = useQuery({
        queryKey: ['terminations'],
        queryFn: () => base44.entities.ContractTermination.list('-kuendigungsdatum')
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const pendingTerminations = terminations.filter(t => t.status === 'pending');
    const confirmedTerminations = terminations.filter(t => t.status === 'confirmed');

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Kündigungsverwaltung</h1>
                    <p className="vf-page-subtitle">{terminations.length} Kündigungen</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Plus className="w-4 h-4 mr-2" />
                        Neue Kündigung
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FileX className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{terminations.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Kündigungen</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Calendar className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="text-3xl font-bold text-orange-700">{pendingTerminations.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Ausstehend</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{confirmedTerminations.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Bestätigt</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">
                            {terminations.filter(t => t.reason === 'tenant').length}
                        </div>
                        <div className="text-sm opacity-90 mt-1">Mieter-Kündigung</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Kündigungen im Detail</h3>
                    <div className="space-y-2">
                        {terminations.map((termination) => {
                            const contract = contracts.find(c => c.id === termination.contract_id);
                            return (
                                <div key={termination.id} className="p-4 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <div className="font-semibold">{contract?.einheit || 'Unbekannt'}</div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                Kündigungsdatum: {new Date(termination.kuendigungsdatum).toLocaleDateString('de-DE')}
                                            </div>
                                        </div>
                                        <Badge className={termination.status === 'confirmed' ? 'vf-badge-success' : 'vf-badge-warning'}>
                                            {termination.status === 'confirmed' ? 'Bestätigt' : 'Ausstehend'}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-gray-600 mt-2">
                                        Grund: {termination.reason === 'tenant' ? 'Mieter' : 'Vermieter'}
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