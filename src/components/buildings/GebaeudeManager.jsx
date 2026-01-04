import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Building, DoorOpen } from 'lucide-react';

export default function GebaeudeManager({ gebaeude, onChange }) {
    const [anzahl, setAnzahl] = useState(gebaeude?.length || 1);
    const [gebaeudeTyp, setGebaeudeTyp] = useState('gebaeude');

    const handleAnzahlChange = (newAnzahl) => {
        const num = parseInt(newAnzahl) || 1;
        setAnzahl(num);
        
        const currentGebaeude = gebaeude || [];
        if (num > currentGebaeude.length) {
            // Add new buildings
            const newGebaeude = [...currentGebaeude];
            for (let i = currentGebaeude.length; i < num; i++) {
                newGebaeude.push({
                    bezeichnung: `Gebäude ${i + 1}`,
                    lage_auf_grundstueck: '',
                    eigene_hausnummer: '',
                    gebaeude_standard: 'mittel'
                });
            }
            onChange(newGebaeude);
        } else if (num < currentGebaeude.length) {
            // Remove buildings
            onChange(currentGebaeude.slice(0, num));
        }
    };

    const handleGebaeudeChange = (index, field, value) => {
        const updated = [...(gebaeude || [])];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    const typLabel = gebaeudeTyp === 'aufgaenge' ? 'Aufgang' : 'Gebäude';
    const typLabelPlural = gebaeudeTyp === 'aufgaenge' ? 'Aufgänge' : 'Gebäude';

    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="gebaeude_typ">Unterteilung nach</Label>
                <Select value={gebaeudeTyp} onValueChange={setGebaeudeTyp}>
                    <SelectTrigger className="max-w-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="gebaeude">
                            <div className="flex items-center gap-2">
                                <Building className="w-4 h-4" />
                                Mehrere Gebäude
                            </div>
                        </SelectItem>
                        <SelectItem value="aufgaenge">
                            <div className="flex items-center gap-2">
                                <DoorOpen className="w-4 h-4" />
                                Aufgänge/Eingänge/Hausnummern
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">
                    {gebaeudeTyp === 'gebaeude' 
                        ? 'Für Grundstücke mit mehreren separaten Gebäuden' 
                        : 'Für ein Gebäude mit mehreren Eingängen oder Hausnummern'}
                </p>
            </div>

            <div>
                <Label htmlFor="gebaeude_anzahl">Anzahl {typLabelPlural}</Label>
                <Input
                    id="gebaeude_anzahl"
                    type="number"
                    min="1"
                    value={anzahl}
                    onChange={(e) => handleAnzahlChange(e.target.value)}
                    className="max-w-xs"
                />
            </div>

            <div className="space-y-3">
                {(gebaeude || []).map((geb, index) => (
                    <Card key={index}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                {gebaeudeTyp === 'aufgaenge' ? (
                                    <DoorOpen className="w-4 h-4 text-emerald-600" />
                                ) : (
                                    <Building className="w-4 h-4 text-emerald-600" />
                                )}
                                <CardTitle className="text-sm">{typLabel} {index + 1}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <Label>Bezeichnung *</Label>
                                <Input
                                    value={geb.bezeichnung || ''}
                                    onChange={(e) => handleGebaeudeChange(index, 'bezeichnung', e.target.value)}
                                    placeholder={gebaeudeTyp === 'aufgaenge' ? 'z.B. Aufgang A' : 'z.B. Vorderhaus'}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>{gebaeudeTyp === 'aufgaenge' ? 'Lage' : 'Lage auf Grundstück'}</Label>
                                    <Input
                                        value={geb.lage_auf_grundstueck || ''}
                                        onChange={(e) => handleGebaeudeChange(index, 'lage_auf_grundstueck', e.target.value)}
                                        placeholder={gebaeudeTyp === 'aufgaenge' ? 'z.B. Linker Eingang' : 'z.B. Vorne links'}
                                    />
                                </div>
                                <div>
                                    <Label>Hausnummer</Label>
                                    <Input
                                        value={geb.eigene_hausnummer || ''}
                                        onChange={(e) => handleGebaeudeChange(index, 'eigene_hausnummer', e.target.value)}
                                        placeholder="z.B. 10a"
                                    />
                                </div>
                            </div>
                            {gebaeudeTyp === 'gebaeude' && (
                                <div>
                                    <Label>Gebäude-Standard</Label>
                                    <Select
                                        value={geb.gebaeude_standard || 'mittel'}
                                        onValueChange={(value) => handleGebaeudeChange(index, 'gebaeude_standard', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="einfach">Einfach</SelectItem>
                                            <SelectItem value="mittel">Mittel</SelectItem>
                                            <SelectItem value="gehoben">Gehoben</SelectItem>
                                            <SelectItem value="luxus">Luxus</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}