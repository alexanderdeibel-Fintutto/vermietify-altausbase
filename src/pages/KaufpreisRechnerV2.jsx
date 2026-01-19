import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { Calculator, Home } from 'lucide-react';

export default function KaufpreisRechnerV2() {
    const [inputs, setInputs] = useState({
        jahresmiete: '',
        gewuenschte_rendite: '5',
        nebenkosten_prozent: '10'
    });
    const [result, setResult] = useState(null);

    const handleCalculate = () => {
        const jahresmiete = parseFloat(inputs.jahresmiete);
        const gewuenschte_rendite = parseFloat(inputs.gewuenschte_rendite) / 100;
        const nebenkosten_prozent = parseFloat(inputs.nebenkosten_prozent) / 100;

        const max_kaufpreis = jahresmiete / gewuenschte_rendite;
        const kaufpreis_netto = max_kaufpreis / (1 + nebenkosten_prozent);
        const nebenkosten = kaufpreis_netto * nebenkosten_prozent;

        setResult({
            max_kaufpreis: Math.round(max_kaufpreis),
            kaufpreis_netto: Math.round(kaufpreis_netto),
            nebenkosten: Math.round(nebenkosten),
            monatliche_miete: Math.round(jahresmiete / 12)
        });
    };

    return (
        <div className="vf-calculator">
            <div className="vf-calculator-input-panel">
                <div className="flex items-center gap-3 mb-6">
                    <div className="vf-tool-icon w-12 h-12">
                        <Home className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Kaufpreis-Rechner</h1>
                        <p className="text-sm text-muted-foreground">Ermitteln Sie den maximalen Kaufpreis bei gewünschter Rendite</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <VfInput
                        label="Jahresmiete (Kaltmiete)"
                        type="number"
                        value={inputs.jahresmiete}
                        onChange={(e) => setInputs(prev => ({ ...prev, jahresmiete: e.target.value }))}
                        rightAddon="€"
                        required
                    />
                    <VfInput
                        label="Gewünschte Rendite"
                        type="number"
                        value={inputs.gewuenschte_rendite}
                        onChange={(e) => setInputs(prev => ({ ...prev, gewuenschte_rendite: e.target.value }))}
                        rightAddon="%"
                        hint="Ziel-Bruttorendite"
                    />
                    <VfInput
                        label="Nebenkosten"
                        type="number"
                        value={inputs.nebenkosten_prozent}
                        onChange={(e) => setInputs(prev => ({ ...prev, nebenkosten_prozent: e.target.value }))}
                        rightAddon="%"
                        hint="Kaufnebenkosten (10-15%)"
                    />

                    <Button onClick={handleCalculate} disabled={!inputs.jahresmiete} className="vf-btn-gradient w-full">
                        <Calculator className="w-4 h-4" />
                        Berechnen
                    </Button>
                </div>
            </div>

            <div className="vf-calculator-result-panel">
                {!result ? (
                    <div className="vf-calculator-result-empty">
                        <Home className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm">Berechnen Sie den maximalen Kaufpreis</p>
                    </div>
                ) : (
                    <>
                        <div className="vf-calculator-primary-result">
                            <div className="vf-calculator-primary-label">Max. Kaufpreis (brutto)</div>
                            <div className="vf-calculator-primary-value">{result.max_kaufpreis.toLocaleString('de-DE')} €</div>
                        </div>

                        <div className="vf-calculator-secondary-results">
                            <div className="vf-calculator-secondary-item">
                                <div className="vf-calculator-secondary-label">Kaufpreis (netto)</div>
                                <div className="vf-calculator-secondary-value">{result.kaufpreis_netto.toLocaleString('de-DE')} €</div>
                            </div>
                            <div className="vf-calculator-secondary-item">
                                <div className="vf-calculator-secondary-label">Nebenkosten</div>
                                <div className="vf-calculator-secondary-value">{result.nebenkosten.toLocaleString('de-DE')} €</div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}