import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, Mail, Phone, Plus, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function VendorManagement() {
    const { data: suppliers = [] } = useQuery({
        queryKey: ['suppliers'],
        queryFn: () => base44.entities.Supplier.list('-created_date')
    });

    const categories = [...new Set(suppliers.map(s => s.kategorie))];

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Lieferantenverwaltung</h1>
                    <p className="vf-page-subtitle">{suppliers.length} Lieferanten</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Plus className="w-4 h-4 mr-2" />
                        Neuer Lieferant
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Wrench className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{suppliers.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Lieferanten</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Star className="w-8 h-8 text-yellow-600" />
                        </div>
                        <div className="text-3xl font-bold">
                            {suppliers.filter(s => s.bewertung >= 4).length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Empfehlungen</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Wrench className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold">{categories.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Kategorien</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">
                            {suppliers.filter(s => s.status === 'aktiv').length}
                        </div>
                        <div className="text-sm opacity-90 mt-1">Aktiv</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Top Lieferanten</h3>
                        <div className="space-y-3">
                            {suppliers.filter(s => s.status === 'aktiv').slice(0, 5).map((supplier) => (
                                <div key={supplier.id} className="p-3 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold text-sm">{supplier.name}</div>
                                            <div className="text-xs text-gray-600 mt-1">{supplier.kategorie}</div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {Array.from({length: 5}).map((_, i) => (
                                                <Star 
                                                    key={i}
                                                    className={`w-4 h-4 ${i < Math.round(supplier.bewertung) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Nach Kategorie</h3>
                        <div className="space-y-2">
                            {categories.map((cat) => (
                                <div key={cat} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between">
                                    <span className="font-semibold">{cat}</span>
                                    <Badge className="vf-badge-primary">
                                        {suppliers.filter(s => s.kategorie === cat).length}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Alle Lieferanten</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {suppliers.map((supplier) => (
                            <div key={supplier.id} className="p-4 bg-gray-50 rounded-lg border">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <div className="font-semibold">{supplier.name}</div>
                                        <div className="text-sm text-gray-600">{supplier.kategorie}</div>
                                    </div>
                                    <Badge className={supplier.status === 'aktiv' ? 'vf-badge-success' : 'vf-badge-default'}>
                                        {supplier.status === 'aktiv' ? 'Aktiv' : 'Inaktiv'}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="flex items-center gap-1 text-sm">
                                        <Phone className="w-4 h-4 text-gray-500" />
                                        {supplier.telefon}
                                    </div>
                                    <div className="flex items-center gap-1 text-sm">
                                        <Mail className="w-4 h-4 text-gray-500" />
                                        {supplier.email}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}