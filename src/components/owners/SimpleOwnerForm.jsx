import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2 } from 'lucide-react';

export default function SimpleOwnerForm({ buildingId, onSuccess }) {
    const [owners, setOwners] = useState([{
        eigentuemer_typ: 'natuerliche_person',
        vorname: '',
        nachname: '',
        anteil_prozent: '',
        gueltig_von: new Date().toISOString().split('T')[0]
    }]);
    const [saving, setSaving] = useState(false);

    const addOwner = () => {
        setOwners([...owners, {
            eigentuemer_typ: 'natuerliche_person',
            vorname: '',
            nachname: '',
            anteil_prozent: '',
            gueltig_von: new Date().toISOString().split('T')[0]
        }]);
    };

    const removeOwner = (index) => {
        setOwners(owners.filter((_, i) => i !== index));
    };

    const updateOwner = (index, field, value) => {
        const updated = [...owners];
        updated[index] = { ...updated[index], [field]: value };
        setOwners(updated);
    };

    const totalPercent = owners.reduce((sum, o) => sum + (parseFloat(o.anteil_prozent) || 0), 0);

    const handleSave = async () => {
        // Validierung
        for (const owner of owners) {
            if (!owner.nachname || owner.nachname.trim() === '') {
                alert('Bitte Name/Firmenname bei allen Eigentümern angeben');
                return;
            }
            if (!owner.anteil_prozent || parseFloat(owner.anteil_prozent) <= 0) {
                alert('Bitte Anteil in % bei allen Eigentümern angeben');
                return;
            }
        }

        if (Math.abs(totalPercent - 100) > 0.01) {
            alert('Die Anteile müssen zusammen 100% ergeben');
            return;
        }

        setSaving(true);
        onSuccess(owners);
    };

    return (
        <div className="space-y-4">
            {owners.map((owner, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-slate-800">Eigentümer {index + 1}</h4>
                        {owners.length > 1 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOwner(index)}
                                className="text-red-600"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                    </div>

                    <div>
                        <Label>Typ</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                            value={owner.eigentuemer_typ}
                            onChange={(e) => updateOwner(index, 'eigentuemer_typ', e.target.value)}
                        >
                            <option value="natuerliche_person">Natürliche Person</option>
                            <option value="gbr">GbR</option>
                            <option value="kg">KG</option>
                            <option value="gmbh">GmbH</option>
                            <option value="ug">UG</option>
                            <option value="ag">AG</option>
                        </select>
                    </div>

                    {owner.eigentuemer_typ === 'natuerliche_person' && (
                        <div>
                            <Label>Vorname</Label>
                            <Input
                                value={owner.vorname}
                                onChange={(e) => updateOwner(index, 'vorname', e.target.value)}
                                placeholder="Max"
                            />
                        </div>
                    )}

                    <div>
                        <Label>{owner.eigentuemer_typ === 'natuerliche_person' ? 'Nachname' : 'Firmenname'} *</Label>
                        <Input
                            value={owner.nachname}
                            onChange={(e) => updateOwner(index, 'nachname', e.target.value)}
                            placeholder={owner.eigentuemer_typ === 'natuerliche_person' ? 'Mustermann' : 'Musterfirma GmbH'}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>Anteil am Objekt (%) *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={owner.anteil_prozent}
                                onChange={(e) => updateOwner(index, 'anteil_prozent', e.target.value)}
                                placeholder="100"
                                required
                            />
                        </div>
                        <div>
                            <Label>Gültig von</Label>
                            <Input
                                type="date"
                                value={owner.gueltig_von}
                                onChange={(e) => updateOwner(index, 'gueltig_von', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            ))}

            <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-sm">
                    <span className="text-slate-600">Gesamt: </span>
                    <span className={`font-semibold ${Math.abs(totalPercent - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                        {totalPercent.toFixed(2)}%
                    </span>
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={addOwner}
                        size="sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Weiterer Eigentümer
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-emerald-600 hover:bg-emerald-700"
                        size="sm"
                    >
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Speichern
                    </Button>
                </div>
            </div>
        </div>
    );
}