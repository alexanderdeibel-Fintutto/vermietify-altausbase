import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Home } from 'lucide-react';

export default function LocationTreeSelect({ building, value, onChange }) {
    const formatLocationValue = (type, index) => `${type}:${index ?? ''}`;
    
    const parseLocationValue = (val) => {
        if (!val) return { type: null, index: null };
        const [type, index] = val.split(':');
        return { type, index: index ? parseInt(index) : null };
    };

    const handleChange = (val) => {
        const { type, index } = parseLocationValue(val);
        onChange({ type, index });
    };

    const getDisplayValue = () => {
        if (!value?.type) return '';
        if (value.type === 'building') return 'building:';
        if (value.type === 'gebaeude') return `gebaeude:${value.index ?? ''}`;
        if (value.type === 'unit') return `unit:${value.index ?? ''}`;
        return '';
    };

    return (
        <div>
            <Label>Ort</Label>
            <Select value={getDisplayValue()} onValueChange={handleChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Ort wählen" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="building:">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span>Gesamtes Objekt: {building?.name}</span>
                        </div>
                    </SelectItem>
                    
                    {building?.gebaeude_data?.map((geb, idx) => (
                        <SelectItem key={`geb-${idx}`} value={formatLocationValue('gebaeude', idx)}>
                            <div className="flex items-center gap-2 pl-4">
                                <Building2 className="w-4 h-4 text-slate-400" />
                                <span>{geb.bezeichnung}</span>
                            </div>
                        </SelectItem>
                    ))}

                    {building?.flaechen_einheiten?.map((einheit, idx) => {
                        const gebaeudeBezeichnung = building.gebaeude_data?.[einheit.gebaeude_index]?.bezeichnung || 'Gebäude';
                        return (
                            <SelectItem key={`unit-${idx}`} value={formatLocationValue('unit', idx)}>
                                <div className="flex items-center gap-2 pl-8">
                                    <Home className="w-4 h-4 text-slate-400" />
                                    <span>{gebaeudeBezeichnung} → {einheit.bezeichnung || `Einheit ${idx + 1}`}</span>
                                </div>
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>
        </div>
    );
}