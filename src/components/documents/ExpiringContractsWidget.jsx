import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CONTRACT_TYPE_LABELS = {
    lease: 'Mietvertrag',
    employment: 'Arbeitsvertrag',
    service: 'Servicevertrag',
    purchase: 'Kaufvertrag',
    partnership: 'Partnerschaftsvertrag',
    other: 'Sonstiges'
};

export default function ExpiringContractsWidget({ limit = 5, onViewDetails }) {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadExpiringContracts();

        // Subscribe to updates
        const unsubscribe = base44.entities.ContractAnalysis.subscribe((event) => {
            if (event.type === 'create' || event.type === 'update') {
                loadExpiringContracts();
            }
        });

        return unsubscribe;
    }, [limit]);

    async function loadExpiringContracts() {
        try {
            // Lade Verträge mit Ablaufdatum
            const allContracts = await base44.entities.ContractAnalysis.filter({
                analysis_status: 'completed',
                contract_end_date: { $ne: null }
            });

            // Filter und sortiere nach Ablaufdatum
            const now = new Date();
            const expiringContracts = allContracts
                .map(contract => {
                    const endDate = new Date(contract.contract_end_date);
                    const daysUntil = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                    return { ...contract, daysUntil };
                })
                .filter(c => c.daysUntil >= 0 && c.daysUntil <= 90) // Nächste 90 Tage
                .sort((a, b) => a.daysUntil - b.daysUntil)
                .slice(0, limit);

            setContracts(expiringContracts);
        } catch (error) {
            console.error('Failed to load expiring contracts:', error);
        } finally {
            setLoading(false);
        }
    }

    const getDaysUntilColor = (days) => {
        if (days <= 7) return 'text-red-600 bg-red-50 border-red-300';
        if (days <= 30) return 'text-orange-600 bg-orange-50 border-orange-300';
        return 'text-yellow-600 bg-yellow-50 border-yellow-300';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    Bald endende Verträge
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Lädt...</div>
                ) : contracts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        Keine ablaufenden Verträge in den nächsten 90 Tagen
                    </div>
                ) : (
                    <div className="space-y-3">
                        {contracts.map(contract => (
                            <div
                                key={contract.id}
                                className={`p-4 border rounded-lg ${getDaysUntilColor(contract.daysUntil)}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className="w-4 h-4" />
                                            <h4 className="font-semibold text-sm">{contract.document_name}</h4>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs mb-2">
                                            <Badge variant="outline" className="text-xs">
                                                {CONTRACT_TYPE_LABELS[contract.contract_type]}
                                            </Badge>
                                            {contract.auto_renewal && (
                                                <Badge className="bg-orange-100 text-orange-800">
                                                    Auto-Verlängerung
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4" />
                                            <span>
                                                Endet: {new Date(contract.contract_end_date).toLocaleDateString('de-DE')}
                                            </span>
                                        </div>
                                        {contract.termination_notice_period && (
                                            <div className="text-xs text-gray-600 mt-1">
                                                Kündigungsfrist: {contract.termination_notice_period}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-bold text-lg ${
                                            contract.daysUntil <= 7 ? 'text-red-600' :
                                            contract.daysUntil <= 30 ? 'text-orange-600' :
                                            'text-yellow-600'
                                        }`}>
                                            {contract.daysUntil}
                                        </div>
                                        <div className="text-xs text-gray-600">Tage</div>
                                    </div>
                                </div>
                                {onViewDetails && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full mt-3"
                                        onClick={() => onViewDetails(contract.id)}
                                    >
                                        Details ansehen
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}