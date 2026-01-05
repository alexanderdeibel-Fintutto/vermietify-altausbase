import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, AlertTriangle, Info, TrendingUp } from 'lucide-react';
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

export default function CostCategorySelector({ buildingId, selectedCategoryId, onSelect, amount }) {
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
        queryKey: ['15percentCheck', buildingId, amount, selectedCategoryId],
        queryFn: async () => {
            if (!amount || !selectedCategoryId) return null;
            
            const category = library?.cost_categories.find(c => c.id === selectedCategoryId);
            if (category?.type !== 'ERHALTUNG') return null;
            
            const { data } = await base44.functions.invoke('check15PercentRule', {
                building_id: buildingId,
                new_amount: amount
            });
            return data;
        },
        enabled: !!buildingId && !!amount && !!selectedCategoryId && !!library
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
        return <div className="text-center py-8 text-slate-500">Lade Kategorien...</div>;
    }

    if (!library) {
        return (
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    Steuerbibliothek noch nicht installiert. Bitte installieren Sie sie zuerst in den Gebäude-Einstellungen.
                </AlertDescription>
            </Alert>
        );
    }

    const selectedCategory = library.cost_categories.find(c => c.id === selectedCategoryId);
    const selectedMapping = library.account_mappings.find(m => m.cost_category_id === selectedCategoryId);

    return (
        <div className="space-y-4">
            {/* Filter & Suche */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Kategorie suchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {['ALL', 'ERHALTUNG', 'BETRIEB', 'VERWALTUNG', 'VERSICHERUNG'].map(type => (
                        <Button
                            key={type}
                            variant={filterType === type ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterType(type)}
                            className="whitespace-nowrap"
                        >
                            {type === 'ALL' ? 'Alle' : type}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Ausgewählte Kategorie Info */}
            {selectedCategory && selectedMapping && (
                <Card className="p-4 bg-emerald-50 border-emerald-200">
                    <div className="space-y-2">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-semibold text-slate-800">{selectedCategory.name}</p>
                                <p className="text-sm text-slate-600">{selectedCategory.description}</p>
                            </div>
                            <Badge className={CATEGORY_COLORS[selectedCategory.type]}>
                                {selectedCategory.type}
                            </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t border-emerald-200">
                            <div>
                                <p className="text-slate-500">Konto</p>
                                <p className="font-medium text-slate-800">
                                    {selectedMapping.account_number} - {selectedMapping.account_name}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500">Steuerzeile</p>
                                <p className="font-medium text-slate-800">{selectedMapping.tax_line}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Behandlung</p>
                                <p className="font-medium text-slate-800">
                                    {selectedCategory.tax_treatment === 'SOFORT' ? 'Sofort absetzbar' :
                                     selectedCategory.tax_treatment === 'AFA' ? 'AfA erforderlich' :
                                     selectedCategory.tax_treatment === 'NICHT_ABSETZBAR' ? 'Nicht absetzbar' :
                                     'Verteilt absetzbar'}
                                </p>
                            </div>
                            {selectedCategory.standard_depreciation_years && (
                                <div>
                                    <p className="text-slate-500">AfA-Dauer</p>
                                    <p className="font-medium text-slate-800">
                                        {selectedCategory.standard_depreciation_years} Jahre
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* 15%-Regel Warnung */}
                        {fifteenPercentCheck?.applies && (
                            <Alert className="bg-yellow-50 border-yellow-200">
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                <AlertDescription className="text-yellow-900">
                                    <p className="font-medium">15%-Grenze überschritten!</p>
                                    <p className="text-sm mt-1">
                                        Gesamtkosten: {fifteenPercentCheck.total_expenses.toFixed(2)} € <br />
                                        Grenze: {fifteenPercentCheck.limit.toFixed(2)} € <br />
                                        Überschreitung: {fifteenPercentCheck.exceeded_by.toFixed(2)} €
                                    </p>
                                    <p className="text-sm mt-2">
                                        Sie können den Aufwand über 2-5 Jahre verteilen (§6b EStG).
                                    </p>
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                </Card>
            )}

            {/* Kategorieliste */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(groupedCategories).map(([type, categories]) => (
                    <div key={type}>
                        <h3 className="text-sm font-semibold text-slate-700 mb-2 sticky top-0 bg-white py-1">
                            {type} ({categories.length})
                        </h3>
                        <div className="grid gap-2">
                            {categories.map(category => {
                                const mapping = library.account_mappings.find(m => m.cost_category_id === category.id);
                                const isSelected = category.id === selectedCategoryId;
                                
                                return (
                                    <button
                                        key={category.id}
                                        onClick={() => onSelect(category.id)}
                                        className={`text-left p-3 rounded-lg border transition-all ${
                                            isSelected
                                                ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-slate-800">{category.name}</span>
                                                    <Badge 
                                                        variant="outline" 
                                                        className={`${CATEGORY_COLORS[category.type]} text-xs`}
                                                    >
                                                        {category.name_short}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-slate-600">{category.description}</p>
                                                {mapping && (
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        Konto: {mapping.account_number} • {mapping.tax_line}
                                                    </p>
                                                )}
                                            </div>
                                            {category.tax_treatment === 'AFA' && (
                                                <TrendingUp className="w-4 h-4 text-purple-600" title="AfA erforderlich" />
                                            )}
                                            {category.tax_treatment === 'NICHT_ABSETZBAR' && (
                                                <AlertTriangle className="w-4 h-4 text-red-600" title="Nicht absetzbar" />
                                            )}
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
        </div>
    );
}