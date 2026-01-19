import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Calculator, Building2 } from 'lucide-react';

const nutzungsarten = [
    { value: '50', label: 'Wohngebäude (50 Jahre)' },
    { value: '33', label: 'Gewerbeimmobilie (33 Jahre)' },
    { value: '25', label: 'Fabrikgebäude (25 Jahre)' },
    { value: '10', label: 'Betriebsvorrichtung (10 Jahre)' }
];

export default function AfACalculator() {
    const [inputs, setInputs] = useState({
        anschaffungskosten: '',
        nutzungsdauer: '50',
        inbetriebnahme_jahr: new Date().getFullYear().toString(),
        inbetriebnahme_monat: '1'
    });
    const [result, setResult] = useState(null);

    const handleCalculate = () => {
        const kosten = parseFloat(inputs.anschaffungskosten);
        const nutzungsdauer = parseInt(inputs.nutzungsdauer);
        const jahr = parseInt(inputs.inbetriebnahme_jahr);
        const monat = parseInt(inputs.inbetriebnahme_monat);

        const jaehrliche_afa = kosten / nutzungsdauer;
        const monatliche_afa = jaehrliche_afa / 12;
        
        // First year calculation (pro-rata based on months)
        const monate_im_ersten_jahr = 13 - monat;
        const afa_erstes_jahr = monatliche_afa * monate_im_ersten_jahr;

        // Schedule for next 5 years
        const schedule = [];
        for (let i = 0; i < 5; i++) {
            const yearNum = jahr + i;
            let afa = jaehrliche_afa;
            
            if (i === 0) {
                afa = afa_erstes_jahr;
            }
            
            schedule.push({
                jahr: yearNum,
                afa: Math.round(afa),
                restwert: Math.round(kosten - (jaehrliche_afa * i) - afa_erstes_jahr)
            });
        }

        setResult({
            jaehrliche_afa: Math.round(jaehrliche_afa),
            monatliche_afa: Math.round(monatliche_afa),
            afa_erstes_jahr: Math.round(afa_erstes_jahr),
            gesamte_afa: Math.round(kosten),
            restwert_nach_5_jahren: schedule[4]?.restwert || 0,
            schedule
        });
    };

    return (
        <div className="vf-calculator">
            <div className="vf-calculator-input-panel">
                <div className="flex items-center gap-3 mb-6">
                    <div className="vf-tool-icon w-12 h-12">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">AfA-Rechner</h1>
                        <p className="text-sm text-muted-foreground">Abschreibung für Abnutzung berechnen</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <VfInput
                        label="Anschaffungskosten"
                        type="number"
                        value={inputs.anschaffungskosten}
                        onChange={(e) => setInputs(prev => ({ ...prev, anschaffungskosten: e.target.value }))}
                        rightAddon="€"
                        required
                        hint="Kaufpreis des Gebäudes (ohne Grundstück)"
                    />
                    <VfSelect
                        label="Nutzungsart"
                        value={inputs.nutzungsdauer}
                        onChange={(value) => setInputs(prev => ({ ...prev, nutzungsdauer: value }))}
                        options={nutzungsarten}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <VfSelect
                            label="Monat"
                            value={inputs.inbetriebnahme_monat}
                            onChange={(value) => setInputs(prev => ({ ...prev, inbetriebnahme_monat: value }))}
                            options={Array.from({ length: 12 }, (_, i) => ({ 
                                value: (i + 1).toString(), 
                                label: new Date(2000, i).toLocaleString('de', { month: 'long' }) 
                            }))}
                        />
                        <VfInput
                            label="Jahr"
                            type="number"
                            value={inputs.inbetriebnahme_jahr}
                            onChange={(e) => setInputs(prev => ({ ...prev, inbetriebnahme_jahr: e.target.value }))}
                        />
                    </div>

                    <Button onClick={handleCalculate} disabled={!inputs.anschaffungskosten} className="vf-btn-gradient w-full">
                        <Calculator className="w-4 h-4" />
                        Berechnen
                    </Button>
                </div>
            </div>

            <div className="vf-calculator-result-panel">
                {!result ? (
                    <div className="vf-calculator-result-empty">
                        <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm">Berechnen Sie die AfA</p>
                    </div>
                ) : (
                    <>
                        <div className="vf-calculator-primary-result">
                            <div className="vf-calculator-primary-label">Jährliche AfA</div>
                            <div className="vf-calculator-primary-value">{result.jaehrliche_afa.toLocaleString('de-DE')} €</div>
                        </div>

                        <div className="vf-calculator-secondary-results">
                            <div className="vf-calculator-secondary-item">
                                <div className="vf-calculator-secondary-label">Monatlich</div>
                                <div className="vf-calculator-secondary-value">{result.monatliche_afa.toLocaleString('de-DE')} €</div>
                            </div>
                            <div className="vf-calculator-secondary-item">
                                <div className="vf-calculator-secondary-label">Erstes Jahr</div>
                                <div className="vf-calculator-secondary-value">{result.afa_erstes_jahr.toLocaleString('de-DE')} €</div>
                            </div>
                        </div>

                        <div className="vf-calculator-breakdown">
                            <div className="vf-calculator-breakdown-title">5-Jahres-Plan</div>
                            {result.schedule.map((item) => (
                                <div key={item.jahr} className="vf-calculator-breakdown-item text-sm">
                                    <span>{item.jahr}</span>
                                    <div className="text-right">
                                        <div className="font-semibold">{item.afa.toLocaleString('de-DE')} €</div>
                                        <div className="text-xs text-gray-500">RW: {item.restwert.toLocaleString('de-DE')} €</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}