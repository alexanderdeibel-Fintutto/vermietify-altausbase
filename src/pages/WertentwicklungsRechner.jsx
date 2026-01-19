import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { Calculator, TrendingUp } from 'lucide-react';

export default function WertentwicklungsRechner() {
    const [inputs, setInputs] = useState({
        kaufpreis: '',
        wertsteigerung_prozent: '2',
        jahre: '10'
    });
    const [result, setResult] = useState(null);

    const handleCalculate = () => {
        const kaufpreis = parseFloat(inputs.kaufpreis);
        const wertsteigerung = parseFloat(inputs.wertsteigerung_prozent) / 100;
        const jahre = parseInt(inputs.jahre);

        const wert_nach_jahren = kaufpreis * Math.pow(1 + wertsteigerung, jahre);
        const wertsteigerung_absolut = wert_nach_jahren - kaufpreis;
        const wertsteigerung_gesamt_prozent = ((wert_nach_jahren - kaufpreis) / kaufpreis) * 100;

        // Yearly breakdown
        const breakdown = [];
        for (let i = 1; i <= Math.min(jahre, 10); i++) {
            const wert = kaufpreis * Math.pow(1 + wertsteigerung, i);
            breakdown.push({
                jahr: i,
                wert: Math.round(wert),
                steigerung: Math.round(wert - kaufpreis)
            });
        }

        setResult({
            wert_nach_jahren: Math.round(wert_nach_jahren),
            wertsteigerung_absolut: Math.round(wertsteigerung_absolut),
            wertsteigerung_gesamt_prozent: Math.round(wertsteigerung_gesamt_prozent * 100) / 100,
            breakdown
        });
    };

    return (
        <div className="vf-calculator">
            <div className="vf-calculator-input-panel">
                <div className="flex items-center gap-3 mb-6">
                    <div className="vf-tool-icon w-12 h-12">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Wertentwicklungs-Rechner</h1>
                        <p className="text-sm text-muted-foreground">Prognostizieren Sie die Wertsteigerung</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <VfInput
                        label="Aktueller Kaufpreis"
                        type="number"
                        value={inputs.kaufpreis}
                        onChange={(e) => setInputs(prev => ({ ...prev, kaufpreis: e.target.value }))}
                        rightAddon="€"
                        required
                    />
                    <VfInput
                        label="Jährliche Wertsteigerung"
                        type="number"
                        step="0.1"
                        value={inputs.wertsteigerung_prozent}
                        onChange={(e) => setInputs(prev => ({ ...prev, wertsteigerung_prozent: e.target.value }))}
                        rightAddon="%"
                        hint="Historisch ca. 2-3% p.a."
                    />
                    <VfInput
                        label="Zeitraum"
                        type="number"
                        value={inputs.jahre}
                        onChange={(e) => setInputs(prev => ({ ...prev, jahre: e.target.value }))}
                        rightAddon="Jahre"
                    />

                    <Button onClick={handleCalculate} disabled={!inputs.kaufpreis} className="vf-btn-gradient w-full">
                        <Calculator className="w-4 h-4" />
                        Berechnen
                    </Button>
                </div>
            </div>

            <div className="vf-calculator-result-panel">
                {!result ? (
                    <div className="vf-calculator-result-empty">
                        <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm">Berechnen Sie die Wertentwicklung</p>
                    </div>
                ) : (
                    <>
                        <div className="vf-calculator-primary-result">
                            <div className="vf-calculator-primary-label">Wert nach {inputs.jahre} Jahren</div>
                            <div className="vf-calculator-primary-value">{result.wert_nach_jahren.toLocaleString('de-DE')} €</div>
                        </div>

                        <div className="vf-calculator-secondary-results">
                            <div className="vf-calculator-secondary-item">
                                <div className="vf-calculator-secondary-label">Wertsteigerung</div>
                                <div className="vf-calculator-secondary-value text-green-600">+{result.wertsteigerung_absolut.toLocaleString('de-DE')} €</div>
                            </div>
                            <div className="vf-calculator-secondary-item">
                                <div className="vf-calculator-secondary-label">Steigerung %</div>
                                <div className="vf-calculator-secondary-value text-green-600">+{result.wertsteigerung_gesamt_prozent}%</div>
                            </div>
                        </div>

                        {result.breakdown && result.breakdown.length > 0 && (
                            <div className="vf-calculator-breakdown">
                                <div className="vf-calculator-breakdown-title">Entwicklung</div>
                                {result.breakdown.map((item) => (
                                    <div key={item.jahr} className="vf-calculator-breakdown-item text-xs">
                                        <span>Jahr {item.jahr}</span>
                                        <span>{item.wert.toLocaleString('de-DE')} €</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}