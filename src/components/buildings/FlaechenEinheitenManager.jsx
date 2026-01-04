import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from 'lucide-react';

export default function FlaechenEinheitenManager({ einheiten, onChange, gebaeude }) {
    const handleAdd = () => {
        onChange([...einheiten, { 
            art: 'wohneinheit', 
            gebaeude_index: gebaeude.length > 0 ? 0 : null, 
            etage: 0, 
            lage: 'mitte' 
        }]);
    };

    const handleRemove = (index) => {
        onChange(einheiten.filter((_, i) => i !== index));
    };

    const handleUpdate = (index, field, value) => {
        const updated = [...einheiten];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    return (
        <div className="space-y-3">
            {einheiten.map((einheit, index) => (
                <Card key={index} className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs">Art</Label>
                                <Select 
                                    value={einheit.art} 
                                    onValueChange={(value) => handleUpdate(index, 'art', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="wohneinheit">Wohneinheit</SelectItem>
                                        <SelectItem value="gewerbeeinheit">Gewerbeeinheit</SelectItem>
                                        <SelectItem value="anlegen">Anlegen</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs">Gebäude</Label>
                                <Select 
                                    value={einheit.gebaeude_index !== null ? String(einheit.gebaeude_index) : undefined}
                                    onValueChange={(value) => handleUpdate(index, 'gebaeude_index', parseInt(value))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Gebäude wählen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {gebaeude.map((geb, gIndex) => (
                                            <SelectItem key={gIndex} value={String(gIndex)}>
                                                {geb.bezeichnung}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs">Etage</Label>
                                <Input 
                                    type="number"
                                    value={einheit.etage} 
                                    onChange={(e) => handleUpdate(index, 'etage', parseInt(e.target.value) || 0)}
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Lage</Label>
                                <Select 
                                    value={einheit.lage} 
                                    onValueChange={(value) => handleUpdate(index, 'lage', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="links">Links</SelectItem>
                                        <SelectItem value="mitte">Mitte</SelectItem>
                                        <SelectItem value="rechts">Rechts</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button 
                            type="button"
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemove(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </Card>
            ))}
            
            <Button 
                type="button"
                variant="outline" 
                onClick={handleAdd}
                className="w-full"
                disabled={gebaeude.length === 0}
            >
                <Plus className="w-4 h-4 mr-2" />
                Fläche/Einheit hinzufügen
            </Button>
            {gebaeude.length === 0 && (
                <p className="text-xs text-slate-500 text-center">
                    Bitte legen Sie zuerst Gebäude an
                </p>
            )}
        </div>
    );
}