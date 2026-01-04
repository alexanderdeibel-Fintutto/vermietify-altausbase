import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from 'lucide-react';

export default function FlaechenEinheitenManager({ einheiten, onChange, gebaeude }) {
    const [artTypes, setArtTypes] = React.useState(['Wohn', 'Gewerbe', 'Neben']);
    const [newArtType, setNewArtType] = React.useState('');
    const [showAddArt, setShowAddArt] = React.useState(null);

    const handleAddArtType = (index) => {
        if (newArtType.trim() && !artTypes.includes(newArtType.trim())) {
            setArtTypes([...artTypes, newArtType.trim()]);
            handleUpdate(index, 'art', newArtType.trim());
            setNewArtType('');
            setShowAddArt(null);
        }
    };

    const handleAdd = () => {
        onChange([...einheiten, { 
            art: 'Wohn', 
            gebaeude_index: gebaeude.length > 0 ? 0 : null, 
            etage: 0, 
            lage: 'mitte',
            bezeichnung: '',
            anzahl_wohnzimmer: 0,
            bad: false,
            kueche: false,
            keller: false,
            sat_tv: false,
            internet: 'wlan'
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
                        <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs">Art</Label>
                                    {showAddArt === index ? (
                                        <div className="flex gap-1">
                                            <Input 
                                                value={newArtType} 
                                                onChange={(e) => setNewArtType(e.target.value)}
                                                placeholder="Neue Art..."
                                                className="h-8"
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddArtType(index)}
                                            />
                                            <Button 
                                                type="button"
                                                size="sm"
                                                onClick={() => handleAddArtType(index)}
                                                className="h-8 px-2"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </Button>
                                            <Button 
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setShowAddArt(null);
                                                    setNewArtType('');
                                                }}
                                                className="h-8 px-2"
                                            >
                                                ✕
                                            </Button>
                                        </div>
                                    ) : (
                                        <Select 
                                            value={einheit.art} 
                                            onValueChange={(value) => {
                                                if (value === '__add_new__') {
                                                    setShowAddArt(index);
                                                } else {
                                                    handleUpdate(index, 'art', value);
                                                }
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {artTypes.map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                                <SelectItem value="__add_new__" className="text-emerald-600 font-medium">
                                                    + Neue Art hinzufügen
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-xs">Bezeichnung</Label>
                                    <Input 
                                        value={einheit.bezeichnung || ''} 
                                        onChange={(e) => handleUpdate(index, 'bezeichnung', e.target.value)}
                                        placeholder="z.B. Wohnung 1"
                                    />
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
                                <div>
                                    <Label className="text-xs">Anzahl Wohnzimmer</Label>
                                    <Input 
                                        type="number"
                                        value={einheit.anzahl_wohnzimmer || 0} 
                                        onChange={(e) => handleUpdate(index, 'anzahl_wohnzimmer', parseInt(e.target.value) || 0)}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`bad-${index}`}
                                        checked={einheit.bad || false}
                                        onCheckedChange={(checked) => handleUpdate(index, 'bad', checked)}
                                    />
                                    <Label htmlFor={`bad-${index}`} className="text-xs">Bad</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`kueche-${index}`}
                                        checked={einheit.kueche || false}
                                        onCheckedChange={(checked) => handleUpdate(index, 'kueche', checked)}
                                    />
                                    <Label htmlFor={`kueche-${index}`} className="text-xs">Küche</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`keller-${index}`}
                                        checked={einheit.keller || false}
                                        onCheckedChange={(checked) => handleUpdate(index, 'keller', checked)}
                                    />
                                    <Label htmlFor={`keller-${index}`} className="text-xs">Keller</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`sat-${index}`}
                                        checked={einheit.sat_tv || false}
                                        onCheckedChange={(checked) => handleUpdate(index, 'sat_tv', checked)}
                                    />
                                    <Label htmlFor={`sat-${index}`} className="text-xs">Sat/TV</Label>
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-xs">Internet</Label>
                                    <Select 
                                        value={einheit.internet || 'wlan'} 
                                        onValueChange={(value) => handleUpdate(index, 'internet', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="wlan">W-LAN</SelectItem>
                                            <SelectItem value="glasfaser">Glasfaser</SelectItem>
                                            <SelectItem value="telefon">Telefon</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
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