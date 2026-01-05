import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2 } from 'lucide-react';

export default function SimpleShareholderForm({ ownerId, ownerName, onSuccess, onCancel }) {
    const [shareholders, setShareholders] = useState([{
        eigentuemer_typ: 'natuerliche_person',
        vorname: '',
        nachname: '',
        anteil_prozent: '',
        gueltig_von: new Date().toISOString().split('T')[0]
    }]);
    const [saving, setSaving] = useState(false);

    const addShareholder = () => {
        setShareholders([...shareholders, {
            eigentuemer_typ: 'natuerliche_person',
            vorname: '',
            nachname: '',
            anteil_prozent: '',
            gueltig_von: new Date().toISOString().split('T')[0]
        }]);
    };

    const removeShareholder = (index) => {
        setShareholders(shareholders.filter((_, i) => i !== index));
    };

    const updateShareholder = (index, field, value) => {
        const updated = [...shareholders];
        updated[index] = { ...updated[index], [field]: value };
        setShareholders(updated);
    };

    const totalPercent = shareholders.reduce((sum, s) => sum + (parseFloat(s.anteil_prozent) || 0), 0);

    const handleSave = async () => {
        // Validierung
        for (const shareholder of shareholders) {
            if (!shareholder.nachname || shareholder.nachname.trim() === '') {
                alert('Bitte Name/Firmenname bei allen Gesellschaftern angeben');
                return;
            }
            if (!shareholder.anteil_prozent || parseFloat(shareholder.anteil_prozent) <= 0) {
                alert('Bitte Anteil in % bei allen Gesellschaftern angeben');
                return;
            }
        }

        if (Math.abs(totalPercent - 100) > 0.01) {
            alert('Die Anteile müssen zusammen 100% ergeben');
            return;
        }

        setSaving(true);
        onSuccess(shareholders);
    };

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                    <strong>Gesellschafter von:</strong> {ownerName}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                    Die Anteile aller Gesellschafter müssen zusammen 100% ergeben
                </p>
            </div>

            {shareholders.map((shareholder, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-slate-800">Gesellschafter {index + 1}</h4>
                        {shareholders.length > 1 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeShareholder(index)}
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
                            value={shareholder.eigentuemer_typ}
                            onChange={(e) => updateShareholder(index, 'eigentuemer_typ', e.target.value)}
                        >
                            <option value="natuerliche_person">Natürliche Person</option>
                            <option value="gbr">GbR</option>
                            <option value="kg">KG</option>
                            <option value="gmbh">GmbH</option>
                            <option value="ug">UG</option>
                            <option value="ag">AG</option>
                        </select>
                    </div>

                    {shareholder.eigentuemer_typ === 'natuerliche_person' && (
                        <div>
                            <Label>Vorname</Label>
                            <Input
                                value={shareholder.vorname}
                                onChange={(e) => updateShareholder(index, 'vorname', e.target.value)}
                                placeholder="Max"
                            />
                        </div>
                    )}

                    <div>
                        <Label>{shareholder.eigentuemer_typ === 'natuerliche_person' ? 'Nachname' : 'Firmenname'} *</Label>
                        <Input
                            value={shareholder.nachname}
                            onChange={(e) => updateShareholder(index, 'nachname', e.target.value)}
                            placeholder={shareholder.eigentuemer_typ === 'natuerliche_person' ? 'Mustermann' : 'Musterfirma GmbH'}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>Anteil am Eigentümer (%) *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={shareholder.anteil_prozent}
                                onChange={(e) => updateShareholder(index, 'anteil_prozent', e.target.value)}
                                placeholder="100"
                                required
                            />
                        </div>
                        <div>
                            <Label>Gültig von</Label>
                            <Input
                                type="date"
                                value={shareholder.gueltig_von}
                                onChange={(e) => updateShareholder(index, 'gueltig_von', e.target.value)}
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
                        onClick={addShareholder}
                        size="sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Weiterer Gesellschafter
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        size="sm"
                    >
                        Abbrechen
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