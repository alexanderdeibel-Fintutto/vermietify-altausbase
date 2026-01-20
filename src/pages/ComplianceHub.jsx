import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ComplianceHub() {
    const { data: energyPassports = [] } = useQuery({
        queryKey: ['energyPassports'],
        queryFn: () => base44.entities.EnergyPassport.list()
    });

    const { data: insurances = [] } = useQuery({
        queryKey: ['insurances'],
        queryFn: () => base44.entities.InsurancePolicy.list()
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const complianceChecks = [
        {
            name: 'Energieausweise',
            total: buildings.length,
            compliant: energyPassports.length,
            icon: FileText,
            color: 'blue'
        },
        {
            name: 'Versicherungen',
            total: buildings.length,
            compliant: insurances.filter(i => i.status === 'Aktiv').length,
            icon: Shield,
            color: 'green'
        }
    ];

    const overallCompliance = complianceChecks.reduce((sum, c) => 
        sum + (c.compliant / c.total * 100 || 0), 0
    ) / complianceChecks.length;

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Compliance-Center</h1>
                    <p className="vf-page-subtitle">Rechtliche Konformität</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Shield className="w-8 h-8" />
                        </div>
                        <div className="text-3xl font-bold">{overallCompliance.toFixed(0)}%</div>
                        <div className="text-sm opacity-90 mt-1">Compliance-Rate</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">
                            {complianceChecks.reduce((sum, c) => sum + c.compliant, 0)}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Konform</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">
                            {complianceChecks.reduce((sum, c) => sum + (c.total - c.compliant), 0)}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Fehlend</div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-3">
                {complianceChecks.map((check, idx) => {
                    const percentage = (check.compliant / check.total * 100) || 0;
                    const Icon = check.icon;
                    return (
                        <Card key={idx}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Icon className={`w-8 h-8 text-${check.color}-600`} />
                                        <div>
                                            <h3 className="font-semibold text-lg">{check.name}</h3>
                                            <div className="text-sm text-gray-600">
                                                {check.compliant} von {check.total} vollständig
                                            </div>
                                        </div>
                                    </div>
                                    <Badge className={percentage === 100 ? 'vf-badge-success' : 'vf-badge-warning'}>
                                        {percentage.toFixed(0)}%
                                    </Badge>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div 
                                        className={`h-3 rounded-full ${percentage === 100 ? 'bg-green-600' : 'bg-orange-500'}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}