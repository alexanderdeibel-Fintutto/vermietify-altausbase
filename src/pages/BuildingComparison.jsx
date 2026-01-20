import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { VfSelect } from '@/components/shared/VfSelect';
import { Building2, Home, Euro, TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function BuildingComparison() {
    const [selectedBuildings, setSelectedBuildings] = useState([]);

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const comparisonData = selectedBuildings.map(buildingId => {
        const building = buildings.find(b => b.id === buildingId);
        const buildingUnits = units.filter(u => u.building_id === buildingId);
        const buildingContracts = contracts.filter(c => 
            buildingUnits.some(u => u.id === c.unit_id)
        );
        const totalRent = buildingContracts.reduce((sum, c) => sum + (parseFloat(c.kaltmiete) || 0), 0);
        const occupancy = buildingUnits.length > 0 ? (buildingContracts.length / buildingUnits.length * 100) : 0;

        return {
            name: building?.name || 'Unbekannt',
            einheiten: buildingUnits.length,
            miete: totalRent,
            auslastung: occupancy
        };
    });

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Objektvergleich</h1>
                    <p className="vf-page-subtitle">Vergleichen Sie Ihre Immobilien</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {[0, 1, 2].map((index) => (
                            <VfSelect
                                key={index}
                                label={`Objekt ${index + 1}`}
                                value={selectedBuildings[index] || ''}
                                onChange={(value) => {
                                    const newSelection = [...selectedBuildings];
                                    newSelection[index] = value;
                                    setSelectedBuildings(newSelection.filter(Boolean));
                                }}
                                options={buildings.map(b => ({ value: b.id, label: b.name }))}
                                placeholder="Objekt wählen..."
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>

            {comparisonData.length > 0 && (
                <>
                    <div className="grid md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <Home className="w-5 h-5 text-blue-600" />
                                    Einheiten
                                </h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={comparisonData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="einheiten" fill="#1E3A8A" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <Euro className="w-5 h-5 text-green-600" />
                                    Mieteinnahmen
                                </h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={comparisonData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="miete" fill="#10B981" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-purple-600" />
                                    Auslastung
                                </h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={comparisonData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="auslastung" fill="#8B5CF6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-lg mb-4">Detailvergleich</h3>
                            <div className="overflow-x-auto">
                                <table className="vf-table">
                                    <thead>
                                        <tr>
                                            <th>Objekt</th>
                                            <th>Einheiten</th>
                                            <th>Miete/Monat</th>
                                            <th>Auslastung</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {comparisonData.map((data, idx) => (
                                            <tr key={idx}>
                                                <td className="font-semibold">{data.name}</td>
                                                <td>{data.einheiten}</td>
                                                <td className="vf-table-cell-currency">{data.miete.toLocaleString('de-DE')}€</td>
                                                <td>{data.auslastung.toFixed(0)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}