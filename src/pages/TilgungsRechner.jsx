import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { Calculator, PiggyBank } from 'lucide-react';

export default function TilgungsRechner() {
    const [inputs, setInputs] = useState({
        darlehensbetrag: '',
        zinssatz: '3',
        tilgung: '2',
        sondertilgung_jaehrlich: '0'
    });
    const [result, setResult] = useState(null);

    const handleCalculate = () => {
        const betrag = parseFloat(inputs.darlehensbetrag);
        const zins = parseFloat(inputs.zinssatz) / 100;
        const tilgung = parseFloat(inputs.tilgung) / 100;
        const sondertilgung = parseFloat(inputs.sondertilgung_jaehrlich);

        const jaehrliche_rate = betrag * (zins + tilgung);
        const monatliche_rate = jaehrliche_rate / 12;
        
        // Simplified calculation for time until paid off
        let restschuld = betrag;
        let jahre = 0;
        let gesamtzinsen = 0;

        while (restschuld > 0 && jahre < 100) {
            const zinsen = restschuld * zins;
            const tilgungsbetrag = jaehrliche_rate - zinsen + sondertilgung;
            gesamtzinsen += zinsen;
            restschuld -= tilgungsbetrag;
            jahre++;
        }

        setResult({
            monatliche_rate: Math.round(monatliche_rate),
            jaehrliche_rate: Math.round(jaehrliche_rate),
            laufzeit_jahre: jahre,
            gesamtzinsen: Math.round(gesamtzinsen),
            gesamtkosten: Math.round(betrag + gesamtzinsen)
        });
    };

    return (
        <div className="vf-calculator">
            <div className="vf-calculator-input-panel">
                <div className="flex items-center gap-3 mb-6">
                    <div className="vf-tool-icon w-12 h-12">
                        <PiggyBank className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Tilgungs-Rechner</h1>
                        <p className="text-sm text-muted-foreground">Berechnen Sie Rate und Laufzeit Ihres Darlehens</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <VfInput
                        label="Darlehensbetrag"
                        type="number"
                        value={inputs.darlehensbetrag}
                        onChange={(e) => setInputs(prev => ({ ...prev, darlehensbetrag: e.target.value }))}
                        rightAddon="€"
                        required
                    />
                    <VfInput
                        label="Zinssatz"
                        type="number"
                        step="0.1"
                        value={inputs.zinssatz}
                        onChange={(e) => setInputs(prev => ({ ...prev, zinssatz: e.target.value }))}
                        rightAddon="%"
                    />
                    <VfInput
                        label="Tilgung"
                        type="number"
                        step="0.1"
                        value={inputs.tilgung}
                        onChange={(e) => setInputs(prev => ({ ...prev, tilgung: e.target.value }))}
                        rightAddon="%"
                    />
                    <VfInput
                        label="Sondertilgung (jährlich)"
                        type="number"
                        value={inputs.sondertilgung_jaehrlich}
                        onChange={(e) => setInputs(prev => ({ ...prev, sondertilgung_jaehrlich: e.target.value }))}
                        rightAddon="€"
                    />

                    <Button onClick={handleCalculate} disabled={!inputs.darlehensbetrag} className="vf-btn-gradient w-full">
                        <Calculator className="w-4 h-4" />
                        Berechnen
                    </Button>
                </div>
            </div>

            <div className="vf-calculator-result-panel">
                {!result ? (
                    <div className="vf-calculator-result-empty">
                        <PiggyBank className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm">Berechnen Sie Ihre Tilgung</p>
                    </div>
                ) : (
                    <>
                        <div className="vf-calculator-primary-result">
                            <div className="vf-calculator-primary-label">Monatliche Rate</div>
                            <div className="vf-calculator-primary-value">{result.monatliche_rate.toLocaleString('de-DE')} €</div>
                        </div>

                        <div className="vf-calculator-secondary-results">
                            <div className="vf-calculator-secondary-item">
                                <div className="vf-calculator-secondary-label">Jährliche Rate</div>
                                <div className="vf-calculator-secondary-value">{result.jaehrliche_rate.toLocaleString('de-DE')} €</div>
                            </div>
                            <div className="vf-calculator-secondary-item">
                                <div className="vf-calculator-secondary-label">Laufzeit</div>
                                <div className="vf-calculator-secondary-value">{result.laufzeit_jahre} Jahre</div>
                            </div>
                        </div>

                        <div className="vf-calculator-breakdown">
                            <div className="vf-calculator-breakdown-title">Gesamtkosten</div>
                            <div className="vf-calculator-breakdown-item">
                                <span>Darlehensbetrag</span>
                                <span>{parseFloat(inputs.darlehensbetrag).toLocaleString('de-DE')} €</span>
                            </div>
                            <div className="vf-calculator-breakdown-item">
                                <span>Gesamte Zinsen</span>
                                <span className="text-red-600">{result.gesamtzinsen.toLocaleString('de-DE')} €</span>
                            </div>
                            <div className="vf-calculator-breakdown-item font-semibold">
                                <span>Gesamtkosten</span>
                                <span>{result.gesamtkosten.toLocaleString('de-DE')} €</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}