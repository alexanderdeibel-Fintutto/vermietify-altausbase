import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export default function KubaturForm({ kubatur, onChange, register }) {
    const [localKubatur, setLocalKubatur] = React.useState(kubatur || {});

    const handleUpdate = (field, value) => {
        const updated = { ...localKubatur, [field]: value };
        setLocalKubatur(updated);
        onChange(updated);
    };

    React.useEffect(() => {
        setLocalKubatur(kubatur || {});
    }, [kubatur]);

    return (
        <div className="space-y-4">
            {/* Basisgeometrie */}
            <div>
                <h4 className="font-medium text-slate-700 mb-3">Basisgeometrie</h4>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label htmlFor="grundriss_laenge">Grundriss Länge (m)</Label>
                        <Input 
                            id="grundriss_laenge"
                            type="number"
                            step="0.01"
                            value={localKubatur.grundriss_laenge || ''}
                            onChange={(e) => handleUpdate('grundriss_laenge', parseFloat(e.target.value) || null)}
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <Label htmlFor="grundriss_breite">Grundriss Breite (m)</Label>
                        <Input 
                            id="grundriss_breite"
                            type="number"
                            step="0.01"
                            value={localKubatur.grundriss_breite || ''}
                            onChange={(e) => handleUpdate('grundriss_breite', parseFloat(e.target.value) || null)}
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <Label htmlFor="anzahl_vollgeschosse">Anzahl Vollgeschosse</Label>
                        <Input 
                            id="anzahl_vollgeschosse"
                            type="number"
                            value={localKubatur.anzahl_vollgeschosse || ''}
                            onChange={(e) => handleUpdate('anzahl_vollgeschosse', parseInt(e.target.value) || null)}
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <Label htmlFor="geschosshoehe_standard">Geschosshöhe Standard (m)</Label>
                        <Input 
                            id="geschosshoehe_standard"
                            type="number"
                            step="0.01"
                            value={localKubatur.geschosshoehe_standard || ''}
                            onChange={(e) => handleUpdate('geschosshoehe_standard', parseFloat(e.target.value) || null)}
                            placeholder="2.5"
                        />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="kellergeschoss"
                                checked={localKubatur.kellergeschoss || false}
                                onCheckedChange={(checked) => handleUpdate('kellergeschoss', checked)}
                            />
                            <Label htmlFor="kellergeschoss">Kellergeschoss</Label>
                        </div>
                        {localKubatur.kellergeschoss && (
                            <Input 
                                type="number"
                                step="0.01"
                                value={localKubatur.kellergeschoss_flaeche || ''}
                                onChange={(e) => handleUpdate('kellergeschoss_flaeche', parseFloat(e.target.value) || null)}
                                placeholder="Fläche in m²"
                            />
                        )}
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="dachgeschoss_ausgebaut"
                                checked={localKubatur.dachgeschoss_ausgebaut || false}
                                onCheckedChange={(checked) => handleUpdate('dachgeschoss_ausgebaut', checked)}
                            />
                            <Label htmlFor="dachgeschoss_ausgebaut">Dachgeschoss ausgebaut</Label>
                        </div>
                        {localKubatur.dachgeschoss_ausgebaut && (
                            <Input 
                                type="number"
                                step="0.01"
                                value={localKubatur.dachgeschoss_flaeche || ''}
                                onChange={(e) => handleUpdate('dachgeschoss_flaeche', parseFloat(e.target.value) || null)}
                                placeholder="Fläche in m²"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Dach */}
            <div className="pt-3 border-t border-slate-200">
                <h4 className="font-medium text-slate-700 mb-3">Dach</h4>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label htmlFor="dachform">Dachform</Label>
                        <Input 
                            id="dachform"
                            value={localKubatur.dachform || ''}
                            onChange={(e) => handleUpdate('dachform', e.target.value || null)}
                            placeholder="z.B. Flach, Sattel, Walm"
                        />
                    </div>
                    <div>
                        <Label htmlFor="dachneigung_grad">Dachneigung (Grad)</Label>
                        <Input 
                            id="dachneigung_grad"
                            type="number"
                            step="0.1"
                            value={localKubatur.dachneigung_grad || ''}
                            onChange={(e) => handleUpdate('dachneigung_grad', parseFloat(e.target.value) || null)}
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <Label htmlFor="dachueberstang_m">Dachüberstand (m)</Label>
                        <Input 
                            id="dachueberstang_m"
                            type="number"
                            step="0.01"
                            value={localKubatur.dachueberstang_m || ''}
                            onChange={(e) => handleUpdate('dachueberstang_m', parseFloat(e.target.value) || null)}
                            placeholder="0"
                        />
                    </div>
                </div>
            </div>

            {/* Nutzungsverteilung */}
            <div className="pt-3 border-t border-slate-200">
                <h4 className="font-medium text-slate-700 mb-3">Nutzungsverteilung</h4>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <Label htmlFor="wohnflaeche_anteil">Wohnfläche Anteil (%)</Label>
                        <Input 
                            id="wohnflaeche_anteil"
                            type="number"
                            step="0.1"
                            value={localKubatur.wohnflaeche_anteil_prozent || ''}
                            onChange={(e) => handleUpdate('wohnflaeche_anteil_prozent', parseFloat(e.target.value) || null)}
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <Label htmlFor="gewerbeflaeche_anteil">Gewerbefläche Anteil (%)</Label>
                        <Input 
                            id="gewerbeflaeche_anteil"
                            type="number"
                            step="0.1"
                            value={localKubatur.gewerbeflaeche_anteil_prozent || ''}
                            onChange={(e) => handleUpdate('gewerbeflaeche_anteil_prozent', parseFloat(e.target.value) || null)}
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <Label htmlFor="gemeinschaftsflaeche_anteil">Gemeinschaftsfläche Anteil (%)</Label>
                        <Input 
                            id="gemeinschaftsflaeche_anteil"
                            type="number"
                            step="0.1"
                            value={localKubatur.gemeinschaftsflaeche_anteil_prozent || ''}
                            onChange={(e) => handleUpdate('gemeinschaftsflaeche_anteil_prozent', parseFloat(e.target.value) || null)}
                            placeholder="0"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}