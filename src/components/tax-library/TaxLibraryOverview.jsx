import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function TaxLibraryOverview({ buildingId }) {
    const { data: library, isLoading } = useQuery({
        queryKey: ['taxLibrary', buildingId],
        queryFn: async () => {
            const { data } = await base44.functions.invoke('getTaxLibrary', { building_id: buildingId });
            return data;
        },
        enabled: !!buildingId,
        retry: false
    });

    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list()
    });

    if (isLoading) {
        return <div className="text-center py-4 text-slate-500">Lädt...</div>;
    }

    if (!library) {
        return (
            <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                            <p className="font-medium text-yellow-900">Steuerbibliothek nicht installiert</p>
                            <p className="text-sm text-yellow-800 mt-1">
                                Installieren Sie die Steuerbibliothek für automatische Kontenzuordnung
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Statistiken
    const categoryUsage = {};
    invoices
        .filter(inv => inv.building_id === buildingId && inv.cost_category_id)
        .forEach(inv => {
            if (!categoryUsage[inv.cost_category_id]) {
                categoryUsage[inv.cost_category_id] = { count: 0, total: 0 };
            }
            categoryUsage[inv.cost_category_id].count++;
            categoryUsage[inv.cost_category_id].total += inv.amount || 0;
        });

    const topCategories = Object.entries(categoryUsage)
        .map(([catId, data]) => {
            const category = library.cost_categories.find(c => c.id === catId);
            const mapping = library.account_mappings.find(m => m.cost_category_id === catId);
            return { category, mapping, ...data };
        })
        .filter(item => item.category)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

    const categoryTypeCount = library.cost_categories.reduce((acc, cat) => {
        acc[cat.type] = (acc[cat.type] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {/* Bibliotheks-Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-emerald-600" />
                        Steuerbibliothek
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-slate-600">Rechtsform</p>
                            <p className="font-semibold text-slate-800">{library.legal_form}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Kontenrahmen</p>
                            <p className="font-semibold text-slate-800">{library.account_framework}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Kategorien</p>
                            <p className="font-semibold text-slate-800">{library.cost_categories.length}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Konten</p>
                            <p className="font-semibold text-slate-800">{Object.keys(library.accounts).length}</p>
                        </div>
                    </div>

                    {/* Kategorien nach Typ */}
                    <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-slate-700 mb-2">Kategorien nach Typ</p>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(categoryTypeCount).map(([type, count]) => (
                                <Badge key={type} variant="outline">
                                    {type}: {count}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Top verwendete Kategorien */}
            {topCategories.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Top 10 verwendete Kategorien</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kategorie</TableHead>
                                    <TableHead>Typ</TableHead>
                                    <TableHead>Konto</TableHead>
                                    <TableHead className="text-right">Anzahl</TableHead>
                                    <TableHead className="text-right">Summe</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topCategories.map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-sm">{item.category.name}</p>
                                                <p className="text-xs text-slate-500">{item.mapping?.tax_line}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                {item.category.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {item.mapping?.account_number} - {item.mapping?.account_name}
                                        </TableCell>
                                        <TableCell className="text-right">{item.count}</TableCell>
                                        <TableCell className="text-right font-semibold">
                                            €{item.total.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}