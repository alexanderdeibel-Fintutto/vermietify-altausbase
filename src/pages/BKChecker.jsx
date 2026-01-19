import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { Calculator, FileCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BKChecker() {
    const [inputs, setInputs] = useState({
        wohnflaeche: '',
        gesamtkosten: '',
        vorauszahlung: ''
    });
    const [result, setResult] = useState(null);

    const handleCheck = () => {
        const flaeche = parseFloat(inputs.wohnflaeche);
        const kosten = parseFloat(inputs.gesamtkosten);
        const vorauszahlung = parseFloat(inputs.vorauszahlung);

        const kosten_pro_qm = kosten / flaeche;
        const vorauszahlung_pro_qm = vorauszahlung / flaeche;
        const nachzahlung = kosten - vorauszahlung;
        const nachzahlung_pro_qm = nachzahlung / flaeche;

        // Plausibility check (typical range: 2-4 EUR/qm per month)
        const monatlich_pro_qm = kosten_pro_qm / 12;
        let plausibel = true;
        let warnung = '';

        if (monatlich_pro_qm < 1.5) {
            plausibel = false;
            warnung = 'Ungewöhnlich niedrig - bitte prüfen Sie die Eingaben';
        } else if (monatlich_pro_qm > 5) {
            plausibel = false;
            warnung = 'Ungewöhnlich hoch - möglicherweise fehlerhafte Eingaben';
        }

        setResult({
            kosten_pro_qm: Math.round(kosten_pro_qm * 100) / 100,
            monatlich_pro_qm: Math.round(monatlich_pro_qm * 100) / 100,
            nachzahlung: Math.round(nachzahlung * 100) / 100,
            nachzahlung_pro_qm: Math.round(nachzahlung_pro_qm * 100) / 100,
            plausibel,
            warnung
        });
    };

    return (
        <div className="vf-calculator">
            <div className="vf-calculator-input-panel">
                <div className="flex items-center gap-3 mb-6">
                    <div className="vf-tool-icon w-12 h-12">
                        <FileCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Betriebskosten-Checker</h1>
                        <p className="text-sm text-muted-foreground">Prüfen Sie Ihre Nebenkostenabrechnung</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <VfInput
                        label="Wohnfläche"
                        type="number"
                        step="0.01"
                        value={inputs.wohnflaeche}
                        onChange={(e) => setInputs(prev => ({ ...prev, wohnflaeche: e.target.value }))}
                        rightAddon="m²"
                        required
                    />
                    <VfInput
                        label="Gesamtkosten (jährlich)"
                        type="number"
                        value={inputs.gesamtkosten}
                        onChange={(e) => setInputs(prev => ({ ...prev, gesamtkosten: e.target.value }))}
                        rightAddon="€"
                        required
                        hint="Summe aller Betriebskosten laut Abrechnung"
                    />
                    <VfInput
                        label="Vorauszahlung (jährlich)"
                        type="number"
                        value={inputs.vorauszahlung}
                        onChange={(e) => setInputs(prev => ({ ...prev, vorauszahlung: e.target.value }))}
                        rightAddon="€"
                        required
                    />

                    <Button 
                        onClick={handleCheck} 
                        disabled={!inputs.wohnflaeche || !inputs.gesamtkosten || !inputs.vorauszahlung} 
                        className="vf-btn-gradient w-full"
                    >
                        <Calculator className="w-4 h-4" />
                        Prüfen
                    </Button>
                </div>
            </div>

            <div className="vf-calculator-result-panel">
                {!result ? (
                    <div className="vf-calculator-result-empty">
                        <FileCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm">Prüfen Sie Ihre Betriebskosten</p>
                    </div>
                ) : (
                    <>
                        {!result.plausibel && (
                            <div className="vf-alert vf-alert-warning mb-4">
                                <div className="vf-alert-content">
                                    <div className="vf-alert-title">Warnung</div>
                                    <div className="vf-alert-description">{result.warnung}</div>
                                </div>
                            </div>
                        )}

                        <div className="vf-calculator-primary-result">
                            <div className="vf-calculator-primary-label">
                                {result.nachzahlung >= 0 ? 'Nachzahlung' : 'Guthaben'}
                            </div>
                            <div className={`vf-calculator-primary-value ${result.nachzahlung >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {Math.abs(result.nachzahlung).toLocaleString('de-DE')} €
                            </div>
                        </div>

                        <div className="vf-calculator-secondary-results">
                            <div className="vf-calculator-secondary-item">
                                <div className="vf-calculator-secondary-label">Pro m²</div>
                                <div className="vf-calculator-secondary-value">{result.nachzahlung_pro_qm.toLocaleString('de-DE')} €</div>
                            </div>
                            <div className="vf-calculator-secondary-item">
                                <div className="vf-calculator-secondary-label">Status</div>
                                <div className="vf-calculator-secondary-value">
                                    {result.plausibel ? (
                                        <Badge className="vf-badge-success">Plausibel</Badge>
                                    ) : (
                                        <Badge className="vf-badge-warning">Prüfen!</Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="vf-calculator-breakdown">
                            <div className="vf-calculator-breakdown-title">Details pro m²</div>
                            <div className="vf-calculator-breakdown-item">
                                <span>Kosten/Jahr</span>
                                <span>{result.kosten_pro_qm.toLocaleString('de-DE')} €</span>
                            </div>
                            <div className="vf-calculator-breakdown-item">
                                <span>Kosten/Monat</span>
                                <span>{result.monatlich_pro_qm.toLocaleString('de-DE')} €</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}