import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tantml:react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Target, DollarSign, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function RentOptimization() {
    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const avgRent = contracts.length > 0 
        ? contracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0) / contracts.length 
        : 0;

    const suggestions = contracts.map(contract => {
        const unit = units.find(u => u.id === contract.unit_id);
        const tenant = tenants.find(t => t.id === contract.tenant_id);
        const currentRent = parseFloat(contract.kaltmiete) || 0;
        const marketRent = currentRent * 1.15;
        const potential = marketRent - currentRent;

        return {
            contract,
            tenant,
            unit,
            currentRent,
            marketRent,
            potential
        };
    }).filter(s => s.potential > 50).sort((a, b) => b.potential - a.potential);

    const totalPotential = suggestions.reduce((sum, s) => sum + s.potential, 0);

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Mietoptimierung</h1>
                    <p className="vf-page-subtitle">KI-basierte Empfehlungen</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Target className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{avgRent.toFixed(0)}€</div>
                        <div className="text-sm text-gray-600 mt-1">Ø Miete</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Sparkles className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold">{suggestions.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Empfehlungen</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">+{totalPotential.toFixed(0)}€</div>
                        <div className="text-sm opacity-90 mt-1">Potenzial/Monat</div>
                    </CardContent>
                </Card>
            </div>

            {suggestions.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Sparkles className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-xl font-semibold mb-2">Keine Empfehlungen</h3>
                        <p className="text-gray-600">Ihre Mieten sind bereits optimal</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {suggestions.map((suggestion, idx) => (
                        <Card key={idx} className="border-blue-300 bg-blue-50/50">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-1">
                                                {suggestion.tenant ? `${suggestion.tenant.vorname} ${suggestion.tenant.nachname}` : 'Unbekannt'}
                                            </h3>
                                            <div className="text-sm text-gray-700 mb-2">
                                                Einheit: {suggestion.unit?.nummer || 'Unbekannt'}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-600">
                                                <span>Aktuell: {suggestion.currentRent.toFixed(0)}€</span>
                                                <span>→</span>
                                                <span className="font-semibold text-blue-700">Markt: {suggestion.marketRent.toFixed(0)}€</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-green-700">+{suggestion.potential.toFixed(0)}€</div>
                                        <Button variant="outline" size="sm" className="mt-2">Anpassen</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}