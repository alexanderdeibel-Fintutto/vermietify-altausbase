import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle, Info, TrendingUp, BookOpen, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const CATEGORY_COLORS = {
    ERHALTUNG: 'bg-blue-100 text-blue-800 border-blue-200',
    HERSTELLUNG: 'bg-purple-100 text-purple-800 border-purple-200',
    BETRIEB: 'bg-green-100 text-green-800 border-green-200',
    VERWALTUNG: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    VERSICHERUNG: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    STEUER: 'bg-red-100 text-red-800 border-red-200',
    FINANZIERUNG: 'bg-orange-100 text-orange-800 border-orange-200',
    SONSTIGE: 'bg-slate-100 text-slate-800 border-slate-200'
};

export default function TaxCategoryPicker({ buildingId, value, onChange, amount, className }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');

    // Hole Tax Library
    const { data: library, isLoading } = useQuery({
        queryKey: ['taxLibrary', buildingId],
        queryFn: async () => {
            const { data } = await base44.functions.invoke('getTaxLibrary', { building_id: buildingId });
            return data;
        },
        enabled: !!buildingId
    });

    // Prüfe 15%-Grenze bei Erhaltungsaufwand
    const { data: fifteenPercentCheck } = useQuery({
        queryKey: ['15percentCheck', buildingId, amount, value],
        queryFn: async () => {
            if (!amount || !value) return null;
            
            const category = library?.cost_categories.find(c => c.id === value);
            if (category?.type !== 'ERHALTUNG') return null;
            
            const { data } = await base44.functions.invoke('check15PercentRule', {
                building_id: buildingId,
                new_amount: parseFloat(amount)
            });
            return data;
        },
        enabled: !!buildingId && !!amount && !!value && !!library
    });

    // Filtere und suche Kategorien
    const filteredCategories = useMemo(() => {
        if (!library?.cost_categories) return [];
        
        let filtered = library.cost_categories;
        
        // Filter nach Typ
        if (filterType !== 'ALL') {
            filtered = filtered.filter(cat => cat.type === filterType);
        }
        
        // Suche
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(cat => 
                cat.name.toLowerCase().includes(term) ||
                cat.description.toLowerCase().includes(term) ||
                cat.id.toLowerCase().includes(term)
            );
        }
        
        return filtered;
    }, [library, filterType, searchTerm]);

    // Gruppiere nach Typ
    const groupedCategories = useMemo(() => {
        const groups = {};
        filteredCategories.forEach(cat => {
            if (!groups[cat.type]) {
                groups[cat.type] = [];
            }
            groups[cat.type].push(cat);
        });
        return groups;
    }, [filteredCategories]);

    if (isLoading) {
        return <div className="text-center py-4 text-slate-500">Lade Kategorien...</div>;
    }

    if (!library) {
        return (
            <Alert className="bg-yellow-50 border-yellow-200">
                <BookOpen className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900">
                    <p className="font-medium">Steuerbibliothek noch nicht installiert</p>
                    <p className="text-sm mt-1">
                        Bitte installieren Sie die Steuerbibliothek in den Gebäude-Einstellungen für automatische Kontenzuordnung.
                    </p>
                </AlertDescription>
            </Alert>
        );
    }

    const selectedCategory = library.cost_categories.find(c => c.id === value);
    const selectedMapping = library.account_mappings.find(m => m.cost_category_id === value);

    return (
        <div className={`space-y-4 ${className}`}>
            <Label>Steuerkategorie *</Label>
            
            {/* Ausgewählte Kategorie Info */}
            {selectedCategory && selectedMapping && (
                <Card className="p-3 bg-emerald-50 border-emerald-200">
                    <div className="space-y-2">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="font-semibold text-sm text-slate-800">{selectedCategory.name}</p>
                                <p className="text-xs text-slate-600">{selectedCategory.description}</p>
                            </div>
                            <Badge className={CATEGORY_COLORS[selectedCategory.type]} variant="outline">
                                {selectedCategory.type}
                            </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-emerald-200">
                            <div>
                                <p className="text-slate-500">Konto ({library.account_framework})</p>
                                <p className="font-medium text-slate-800">
                                    {selectedMapping.account_number} - {selectedMapping.account_name}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500">Steuerzeile</p>
                                <p className="font-medium text-slate-800">{selectedMapping.tax_line}</p>
                            </div>
                        </div>

                        {/* Zusatzinfos bei AfA */}
                        {selectedCategory.tax_treatment === 'AFA' && (
                            <Alert className="mt-2 bg-purple-50 border-purple-200">
                                <TrendingUp className="h-3 w-3 text-purple-600" />
                                <AlertDescription className="text-xs text-purple-900">
                                    <p className="font-medium">Abschreibung erforderlich (AfA)</p>
                                    <p className="mt-1">
                                        Standard: {selectedCategory.standard_depreciation_years} Jahre über Konto {selectedMapping.afa_account}
                                    </p>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* 15%-Regel Warnung */}
                        {fifteenPercentCheck?.applies && (
                            <Alert className="mt-2 bg-yellow-50 border-yellow-200">
                                <AlertTriangle className="h-3 w-3 text-yellow-600" />
                                <AlertDescription className="text-xs text-yellow-900">
                                    <p className="font-medium">⚠️ 15%-Grenze überschritten!</p>
                                    <p className="mt-1">
                                        Gesamt: {fifteenPercentCheck.total_expenses.toFixed(2)} € • 
                                        Grenze: {fifteenPercentCheck.limit.toFixed(2)} € • 
                                        Über: {fifteenPercentCheck.exceeded_by.toFixed(2)} €
                                    </p>
                                    <p className="mt-1 text-yellow-800">
                                        Verteilung über 2-5 Jahre möglich (§6b EStG)
                                    </p>
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                </Card>
            )}

            {/* Suche & Filter */}
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Kategorie suchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-md text-sm"
                >
                    <option value="ALL">Alle Typen</option>
                    <option value="ERHALTUNG">Erhaltung</option>
                    <option value="BETRIEB">Betrieb</option>
                    <option value="VERWALTUNG">Verwaltung</option>
                    <option value="VERSICHERUNG">Versicherung</option>
                    <option value="STEUER">Steuern</option>
                    <option value="FINANZIERUNG">Finanzierung</option>
                    <option value="HERSTELLUNG">Herstellung</option>
                    <option value="SONSTIGE">Sonstige</option>
                </select>
            </div>

            {/* Kategorieliste */}
            <div className="border rounded-lg max-h-64 overflow-y-auto">
                {Object.entries(groupedCategories).map(([type, categories]) => (
                    <div key={type} className="border-b last:border-b-0">
                        <div className="sticky top-0 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 border-b">
                            {type} ({categories.length})
                        </div>
                        <div className="divide-y">
                            {categories.map(category => {
                                const mapping = library.account_mappings.find(m => m.cost_category_id === category.id);
                                const isSelected = category.id === value;
                                
                                return (
                                    <button
                                        key={category.id}
                                        type="button"
                                        onClick={() => onChange(category.id)}
                                        className={`w-full text-left p-3 hover:bg-slate-50 transition-colors ${
                                            isSelected ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-medium text-slate-800">{category.name}</span>
                                                    {category.tax_treatment === 'AFA' && (
                                                        <TrendingUp className="w-3 h-3 text-purple-600" title="AfA erforderlich" />
                                                    )}
                                                    {category.tax_treatment === 'NICHT_ABSETZBAR' && (
                                                        <AlertTriangle className="w-3 h-3 text-red-600" title="Nicht absetzbar" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-600">{category.description}</p>
                                                {mapping && (
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        Konto: {mapping.account_number} • {mapping.tax_line}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {filteredCategories.length === 0 && (
                <Card className="p-8 text-center">
                    <Info className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-600">Keine Kategorien gefunden</p>
                    <p className="text-sm text-slate-500 mt-1">
                        Versuchen Sie andere Suchbegriffe oder Filter
                    </p>
                </Card>
            )}

            {/* Library Info */}
            <div className="text-xs text-slate-500 flex items-center gap-2 pt-2 border-t">
                <Info className="w-3 h-3" />
                <span>
                    {library.legal_form} • {library.account_framework} • {library.cost_categories.length} Kategorien
                </span>
            </div>
        </div>
    );
}