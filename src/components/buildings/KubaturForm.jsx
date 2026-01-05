import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, FileDown, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import Building3DVisualization from './Building3DVisualization';

export default function KubaturForm({ kubatur, onChange, register, building }) {
    const [localKubatur, setLocalKubatur] = React.useState(kubatur || {});
    const [calculatedValues, setCalculatedValues] = React.useState({});

    const handleUpdate = (field, value) => {
        const updated = { ...localKubatur, [field]: value };
        setLocalKubatur(updated);
        onChange(updated);
    };

    React.useEffect(() => {
        setLocalKubatur(kubatur || {});
    }, [kubatur]);

    // Automatische Berechnungen
    React.useEffect(() => {
        calculateValues();
    }, [localKubatur, building]);
    
    // Berechnung auch bei Änderung triggern
    React.useEffect(() => {
        const timer = setTimeout(() => {
            calculateValues();
        }, 100);
        return () => clearTimeout(timer);
    }, [localKubatur]);

    const calculateValues = () => {
        const l = localKubatur.grundriss_laenge || 0;
        const b = localKubatur.grundriss_breite || 0;
        const floors = localKubatur.anzahl_vollgeschosse || 0;
        const floorHeight = localKubatur.geschosshoehe_standard || 2.5;
        
        // Grundfläche pro Geschoss
        const grundflaeche = l * b;
        // Brutto-Grundfläche = Grundfläche * Anzahl Geschosse
        const bruttoGrundflaeche = grundflaeche * floors;
        
        // Volumen Geschosse
        const geschossVolumen = grundflaeche * floorHeight * floors;
        
        // Kellervolumen
        const kellerVolumen = localKubatur.kellergeschoss ? (localKubatur.kellergeschoss_flaeche || grundflaeche) * 2.5 : 0;
        
        // Dachvolumen
        let dachVolumen = 0;
        const dachform = localKubatur.dachform?.toLowerCase();
        if (dachform === 'sattel') {
            const dachneigung = localKubatur.dachneigung_grad || 35;
            const dachhoehe = (b / 2) * Math.tan((dachneigung * Math.PI) / 180);
            dachVolumen = (grundflaeche * dachhoehe) / 2;
        } else if (dachform === 'walm') {
            dachVolumen = grundflaeche * 0.4;
        } else {
            dachVolumen = grundflaeche * 0.3;
        }
        
        // Brutto-Rauminhalt
        const bruttoRauminhalt = geschossVolumen + kellerVolumen + dachVolumen;
        
        // IST-WERTE aus erfassten Einheiten (PRIMÄR)
        const erfassteEinheiten = building?.flaechen_einheiten || [];
        const wohneinheiten = erfassteEinheiten.filter(e => {
            const art = e.art?.toLowerCase() || '';
            return art.includes('wohn') || art === 'wohneinheit';
        });
        const gewerbeeinheiten = erfassteEinheiten.filter(e => {
            const art = e.art?.toLowerCase() || '';
            return art.includes('gewerb');
        });
        
        const erfassteAnzahl = wohneinheiten.length;
        const erfassteWohnQm = wohneinheiten.reduce((sum, e) => sum + (parseFloat(e.qm) || 0), 0);
        const erfassteGewerbeQm = gewerbeeinheiten.reduce((sum, e) => sum + (parseFloat(e.qm) || 0), 0);
        const erfassteGesamtQm = erfassteEinheiten.reduce((sum, e) => sum + (parseFloat(e.qm) || 0), 0);
        
        // SOLL-WERTE: Theoretisch nutzbare Fläche basierend auf Kubatur
        // Netto-Nutzfläche = Brutto-Grundfläche minus Abzüge für Wände, Treppen, Flure (ca. 20-25%)
        const nettoNutzflaeche = bruttoGrundflaeche * 0.78; // 78% der Brutto-Fläche ist realistisch nutzbar
        
        // Wenn Nutzungsanteile angegeben sind, berechne SOLL-Werte
        const wohnflaecheAnteil = localKubatur.wohnflaeche_anteil_prozent || 0;
        const gewerbeflaecheAnteil = localKubatur.gewerbeflaeche_anteil_prozent || 0;
        const gemeinschaftsflaecheAnteil = localKubatur.gemeinschaftsflaeche_anteil_prozent || 0;
        
        const sollWohnflaeche = nettoNutzflaeche * (wohnflaecheAnteil / 100);
        const sollGewerbeflaeche = nettoNutzflaeche * (gewerbeflaecheAnteil / 100);
        
        // Plausibilitätsprüfung: Vergleiche erfasste Wohnfläche mit theoretisch verfügbarer Fläche
        let plausibilitaet = { status: 'ok', text: 'Daten fehlen', color: 'slate' };
        let abweichung = 0;
        
        if (bruttoGrundflaeche > 0 && erfassteWohnQm > 0 && wohnflaecheAnteil > 0) {
            // Abweichung zwischen erfasster Wohnfläche und SOLL-Wohnfläche
            abweichung = ((erfassteWohnQm - sollWohnflaeche) / sollWohnflaeche) * 100;
            const abwAbs = Math.abs(abweichung);
            
            if (abwAbs <= 5) {
                plausibilitaet = { status: 'ok', text: 'Plausibel', color: 'emerald' };
            } else if (abwAbs <= 15) {
                plausibilitaet = { status: 'warn', text: 'Prüfen empfohlen', color: 'orange' };
            } else {
                plausibilitaet = { status: 'error', text: 'Unplausibel', color: 'red' };
            }
            
            // Prüfe auch, ob erfasste Gesamtfläche die Netto-Nutzfläche überschreitet
            if (erfassteGesamtQm > nettoNutzflaeche * 1.05) {
                plausibilitaet = { status: 'error', text: 'Zu viel Fläche erfasst', color: 'red' };
            }
        }
        
        setCalculatedValues({
            bruttoRauminhalt,
            bruttoGrundflaeche,
            nettoNutzflaeche,
            sollWohnflaeche,
            sollGewerbeflaeche,
            erfassteAnzahl,
            erfassteWohnQm,
            erfassteGewerbeQm,
            erfassteGesamtQm,
            abweichung,
            plausibilitaet
        });
    };

    const handleRefresh = () => {
        calculateValues();
    };

    const handleExportPDF = () => {
        // Einfacher Export als Text-Datei (für echtes PDF würde man jsPDF nutzen)
        const data = {
            kubatur: localKubatur,
            berechnungen: calculatedValues,
            datum: new Date().toLocaleDateString('de-DE')
        };
        
        const content = `
KUBATUR-DATEN - ${building?.name || 'Gebäude'}
Erstellt am: ${data.datum}

GEOMETRIE:
- Grundriss: ${localKubatur.grundriss_laenge || '?'} x ${localKubatur.grundriss_breite || '?'} m
- Geschosse: ${localKubatur.anzahl_vollgeschosse || '?'}
- Geschosshöhe: ${localKubatur.geschosshoehe_standard || '?'} m
- Dachform: ${localKubatur.dachform || 'Nicht angegeben'}

BERECHNUNGEN:
- Brutto-Rauminhalt: ${calculatedValues.bruttoRauminhalt?.toFixed(2) || '?'} m³
- Brutto-Grundfläche: ${calculatedValues.bruttoGrundflaeche?.toFixed(2) || '?'} m²
- Wohnfläche (berechnet): ${calculatedValues.wohnflaecheBerechnet?.toFixed(2) || '?'} m²
- Gewerbefläche (berechnet): ${calculatedValues.gewerbeflaecheBerechnet?.toFixed(2) || '?'} m²

ABGLEICH:
- Erfasste Wohnungen: ${calculatedValues.erfassteAnzahl || 0}
- Erfasste Gesamtfläche: ${calculatedValues.erfassteQm?.toFixed(2) || '?'} m²
- Abweichung: ${calculatedValues.abweichung?.toFixed(1) || '?'}%
- Plausibilität: ${calculatedValues.plausibilitaet?.text || '?'}
        `;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kubatur-${building?.name || 'gebaeude'}-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* 3D Visualisierung */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-slate-700">3D-Ansicht</h4>
                    <div className="flex gap-2">
                        <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={handleRefresh}
                            className="gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Aktualisieren
                        </Button>
                        <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={handleExportPDF}
                            className="gap-2"
                        >
                            <FileDown className="w-4 h-4" />
                            Export
                        </Button>
                    </div>
                </div>
                <Building3DVisualization kubatur={localKubatur} />
            </div>

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

            {/* Berechnungen */}
            <div className="pt-3 border-t border-slate-200">
                <h4 className="font-medium text-slate-700 mb-3">Kubatur-Berechnungen</h4>
                <div className="grid grid-cols-2 gap-3">
                    <Card className="p-3 bg-slate-50">
                        <Label className="text-xs text-slate-500">Brutto-Rauminhalt</Label>
                        <p className="text-lg font-semibold text-slate-800">
                            {calculatedValues.bruttoRauminhalt?.toFixed(2) || '0.00'} m³
                        </p>
                    </Card>
                    <Card className="p-3 bg-slate-50">
                        <Label className="text-xs text-slate-500">Brutto-Grundfläche (BGF)</Label>
                        <p className="text-lg font-semibold text-slate-800">
                            {calculatedValues.bruttoGrundflaeche?.toFixed(2) || '0.00'} m²
                        </p>
                        <p className="text-xs text-slate-500 mt-1">= Grundfläche × Geschosse</p>
                    </Card>
                    <Card className="p-3 bg-blue-50">
                        <Label className="text-xs text-slate-500">Netto-Nutzfläche (ca.)</Label>
                        <p className="text-lg font-semibold text-blue-800">
                            {calculatedValues.nettoNutzflaeche?.toFixed(2) || '0.00'} m²
                        </p>
                        <p className="text-xs text-slate-500 mt-1">≈ 78% der BGF (abzgl. Wände, Treppen)</p>
                    </Card>
                    <Card className="p-3 bg-slate-50">
                        <Label className="text-xs text-slate-500">Theoretisch verfügbar</Label>
                        <p className="text-sm font-medium text-slate-700">
                            {calculatedValues.sollWohnflaeche > 0 && (
                                <span>Wohn: {calculatedValues.sollWohnflaeche?.toFixed(1)} m²</span>
                            )}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Basierend auf Nutzungsanteilen</p>
                    </Card>
                </div>
            </div>

            {/* Abgleich mit Wohneinheiten */}
            <div className="pt-3 border-t border-slate-200">
                <h4 className="font-medium text-slate-700 mb-3">Abgleich mit erfassten Wohneinheiten</h4>
                
                {/* Fehlende Daten für Berechnung */}
                {(!localKubatur.wohnflaeche_anteil_prozent || localKubatur.wohnflaeche_anteil_prozent === 0) && (
                    <Card className="p-4 mb-4 border-2 border-orange-200 bg-orange-50">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                            <div className="flex-1">
                                <h5 className="font-semibold text-slate-800 mb-1">Wohnflächenanteil erforderlich</h5>
                                <p className="text-sm text-slate-600">
                                    Für den automatischen Abgleich benötigen Sie den <strong>Wohnfläche Anteil (%)</strong> unter "Nutzungsverteilung" oben. 
                                    Dieser gibt an, wie viel Prozent der Brutto-Grundfläche als Wohnfläche genutzt wird (typischerweise 75-85%).
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Card className="p-3 bg-emerald-50 border-emerald-200">
                            <Label className="text-xs text-slate-500">Erfasste Wohneinheiten</Label>
                            <p className="text-lg font-semibold text-emerald-700">
                                {calculatedValues.erfassteAnzahl || 0} WE
                            </p>
                        </Card>
                        <Card className="p-3 bg-emerald-50 border-emerald-200">
                            <Label className="text-xs text-slate-500">Erfasste Wohnfläche</Label>
                            <p className="text-lg font-semibold text-emerald-700">
                                {calculatedValues.erfassteWohnQm?.toFixed(2) || '0.00'} m²
                            </p>
                        </Card>
                        <Card className="p-3 bg-slate-50">
                            <Label className="text-xs text-slate-500">Erfasste Gewerbefläche</Label>
                            <p className="text-lg font-semibold text-slate-700">
                                {calculatedValues.erfassteGewerbeQm?.toFixed(2) || '0.00'} m²
                            </p>
                        </Card>
                        <Card className="p-3 bg-slate-50">
                            <Label className="text-xs text-slate-500">Alle Flächen gesamt</Label>
                            <p className="text-lg font-semibold text-slate-800">
                                {calculatedValues.erfassteGesamtQm?.toFixed(2) || '0.00'} m²
                            </p>
                        </Card>
                    </div>
                    
                    {calculatedValues.sollWohnflaeche > 0 && calculatedValues.erfassteWohnQm > 0 && (
                        <Card className="p-3 bg-blue-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-xs text-slate-500">Abweichung SOLL vs. IST</Label>
                                    <p className={`text-lg font-semibold ${
                                        Math.abs(calculatedValues.abweichung || 0) > 15 ? 'text-red-600' :
                                        Math.abs(calculatedValues.abweichung || 0) > 5 ? 'text-orange-600' :
                                        'text-emerald-600'
                                    }`}>
                                        {calculatedValues.abweichung > 0 ? '+' : ''}{calculatedValues.abweichung?.toFixed(1) || '0.0'}%
                                    </p>
                                </div>
                                <div className="text-right">
                                    <Label className="text-xs text-slate-500">SOLL-Wohnfläche</Label>
                                    <p className="text-sm font-medium text-slate-700">
                                        {calculatedValues.sollWohnflaeche?.toFixed(2)} m²
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Plausibilitätsprüfung */}
                    {calculatedValues.plausibilitaet && Math.abs(calculatedValues.abweichung || 0) > 0 && localKubatur.wohnflaeche_anteil_prozent > 0 && (
                        <Card className={`p-4 border-2 ${
                            calculatedValues.plausibilitaet.status === 'error' ? 'border-red-200 bg-red-50' :
                            calculatedValues.plausibilitaet.status === 'warn' ? 'border-orange-200 bg-orange-50' :
                            'border-emerald-200 bg-emerald-50'
                        }`}>
                            <div className="flex items-start gap-3">
                                {calculatedValues.plausibilitaet.status === 'error' ? (
                                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                ) : calculatedValues.plausibilitaet.status === 'warn' ? (
                                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                                ) : (
                                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                                )}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h5 className="font-semibold text-slate-800">Plausibilitätsprüfung</h5>
                                        <Badge className={`bg-${calculatedValues.plausibilitaet.color}-100 text-${calculatedValues.plausibilitaet.color}-700`}>
                                            {calculatedValues.plausibilitaet.text}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-slate-600">
                                        {calculatedValues.plausibilitaet.status === 'error' && calculatedValues.plausibilitaet.text === 'Zu viel Fläche erfasst'
                                            ? `Die erfasste Gesamtfläche (${calculatedValues.erfassteGesamtQm?.toFixed(1)} m²) überschreitet die theoretisch nutzbare Fläche (${calculatedValues.nettoNutzflaeche?.toFixed(1)} m²). Bitte prüfen Sie die Kubatur-Maße oder die Flächenangaben der Einheiten.`
                                            : Math.abs(calculatedValues.abweichung || 0) > 15
                                            ? `Die erfasste Wohnfläche (${calculatedValues.erfassteWohnQm?.toFixed(1)} m²) weicht stark von der theoretisch verfügbaren Wohnfläche (${calculatedValues.sollWohnflaeche?.toFixed(1)} m²) ab. Bitte überprüfen Sie die Eingaben bei Kubatur, Nutzungsanteilen und Wohneinheiten.`
                                            : Math.abs(calculatedValues.abweichung || 0) > 5
                                            ? `Moderate Abweichung zwischen erfasster und theoretischer Wohnfläche. Eine Überprüfung wird empfohlen.`
                                            : 'Die erfasste Wohnfläche entspricht der theoretisch verfügbaren Fläche. Die Werte sind plausibel.'}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
            </div>
        </div>
    );
}