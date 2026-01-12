import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxEvents() {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const { data: taxEvents = [] } = useQuery({
        queryKey: ['taxEvents', selectedYear],
        queryFn: async () => {
            const events = await base44.entities.TaxEvent.list();
            return events.filter(e => e.tax_year === selectedYear);
        }
    });

    const { data: assets = [] } = useQuery({
        queryKey: ['assets'],
        queryFn: () => base44.entities.Asset.list()
    });

    const filteredEvents = taxEvents.filter(event => {
        const matchesCategory = selectedCategory === 'all' || event.tax_category === selectedCategory;
        const asset = assets.find(a => a.id === event.asset_id);
        const matchesSearch = !searchTerm || 
            (asset?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (asset?.symbol || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleExportCSV = () => {
        const headers = ['Datum', 'Asset', 'Typ', 'Brutto', 'Kosten', 'Gewinn/Verlust', 'Steuerpflichtig', 'Steuerfrei', 'Kategorie'];
        const rows = filteredEvents.map(event => {
            const asset = assets.find(a => a.id === event.asset_id);
            return [
                new Date(event.event_date).toLocaleDateString('de-DE'),
                asset?.name || '-',
                event.event_type,
                event.gross_amount.toFixed(2),
                (event.cost_basis || 0).toFixed(2),
                event.gain_loss.toFixed(2),
                event.taxable_amount.toFixed(2),
                event.is_tax_exempt ? 'Ja' : 'Nein',
                event.tax_category
            ];
        });

        const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `steuer-events-${selectedYear}.csv`;
        link.click();
        
        toast.success('Export erfolgreich erstellt');
    };

    const getCategoryLabel = (category) => {
        const labels = {
            'capital_gains_stocks': 'Aktiengewinne',
            'capital_gains_funds': 'Fondsgewinne',
            'capital_gains_crypto': 'Kryptogewinne',
            'capital_gains_precious_metals': 'Edelmetalle',
            'dividends': 'Dividenden',
            'interest': 'Zinsen',
            'other': 'Sonstige'
        };
        return labels[category] || category;
    };

    const getEventTypeLabel = (type) => {
        const labels = {
            'sale': 'Verkauf',
            'dividend': 'Dividende',
            'interest': 'Zinsen',
            'crypto_sale': 'Krypto-Verkauf',
            'precious_metal_sale': 'Edelmetall-Verkauf',
            'real_estate_sale': 'Immobilien-Verkauf',
            'other': 'Sonstige'
        };
        return labels[type] || type;
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-light text-slate-900">Steuer-Events</h1>
                    <p className="text-slate-500 mt-1">Alle steuerlich relevanten Ereignisse</p>
                </div>
                <Button onClick={handleExportCSV} className="gap-2">
                    <Download className="h-4 w-4" />
                    CSV Export
                </Button>
            </div>

            {/* Filter */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filter
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm text-slate-600 mb-2 block">Jahr</label>
                            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(year => (
                                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm text-slate-600 mb-2 block">Kategorie</label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Alle Kategorien</SelectItem>
                                    <SelectItem value="capital_gains_stocks">Aktiengewinne</SelectItem>
                                    <SelectItem value="capital_gains_funds">Fondsgewinne</SelectItem>
                                    <SelectItem value="capital_gains_crypto">Kryptogewinne</SelectItem>
                                    <SelectItem value="dividends">Dividenden</SelectItem>
                                    <SelectItem value="interest">Zinsen</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm text-slate-600 mb-2 block">Suche</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                    placeholder="Asset suchen..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabelle */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">Datum</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">Asset</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">Typ</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500">Brutto</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500">Gewinn/Verlust</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500">Steuerpflichtig</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">Kategorie</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredEvents.map(event => {
                                    const asset = assets.find(a => a.id === event.asset_id);
                                    return (
                                        <tr key={event.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 text-sm text-slate-900">
                                                {new Date(event.event_date).toLocaleDateString('de-DE')}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="font-medium text-slate-900">{asset?.name || '-'}</div>
                                                <div className="text-slate-500">{asset?.symbol || ''}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {getEventTypeLabel(event.event_type)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right text-slate-900">
                                                {event.gross_amount.toFixed(2)} €
                                            </td>
                                            <td className={`px-6 py-4 text-sm text-right font-medium ${
                                                event.gain_loss >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {event.gain_loss >= 0 ? '+' : ''}{event.gain_loss.toFixed(2)} €
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right text-slate-900">
                                                {event.taxable_amount.toFixed(2)} €
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {event.is_tax_exempt ? (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                        Steuerfrei
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline">Steuerpflichtig</Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {getCategoryLabel(event.tax_category)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredEvents.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
                                Keine Steuer-Events gefunden
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}