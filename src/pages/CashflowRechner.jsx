import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { Calculator, DollarSign } from 'lucide-react';

export default function CashflowRechner() {
    const [inputs, setInputs] = useState({
        jahresmiete: '',
        bewirtschaftungskosten: '',
        instandhaltung: '',
        grundsteuer: '',
        versicherung: '',
        hausverwaltung: '',
        zinsen: '',
        tilgung: ''
    });
    const [result, setResult] = useState(null);

    const handleCalculate = () => {
        const miete = parseFloat(inputs.jahresmiete) || 0;
        const kosten = 
            (parseFloat(inputs.bewirtschaftungskosten) || 0) +
            (parseFloat(inputs.instandhaltung) || 0) +
            (parseFloat(inputs.grundsteuer) || 0) +
            (parseFloat(inputs.versicherung) || 0) +
            (parseFloat(inputs.hausverwaltung) || 0);
        const kapitaldienst = 
            (parseFloat(inputs.zinsen) || 0) +
            (parseFloat(inputs.tilgung) || 0);

        const cashflow_vor_steuern = miete - kosten - kapitaldienst;
        const cashflow_monatlich = cashflow_vor_steuern / 12;

        setResult({
            einnahmen: miete,
            ausgaben: kosten + kapitaldienst,
            cashflow_jaehrlich: Math.round(cashflow_vor_steuern),
            cashflow_monatlich: Math.round(cashflow_monatlich),
            betriebskosten: Math.round(kosten),
            kapitaldienst: Math.round(kapitaldienst)
        });
    };

    return (
        <div className="vf-calculator">
            <div className="vf-calculator-input-panel">
                <div className="flex items-center gap-3 mb-6">
                    <div className="vf-tool-icon w-12 h-12">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Cashflow-Rechner</h1>
                        <p className="text-sm text-muted-foreground">Ermitteln Sie den monatlichen Cashflow</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="vf-calculator-input-group">
                        <h3 className="vf-calculator-input-group-title">Einnahmen</h3>
                        <VfInput
                            label="Jahresmiete (Kalt)"
                            type="number"
                            value={inputs.jahresmiete}
                            onChange={(e) => setInputs(prev => ({ ...prev, jahresmiete: e.target.value }))}
                            rightAddon="€"
                        />
                    </div>

                    <div className="vf-calculator-input-group">
                        <h3 className="vf-calculator-input-group-title">Betriebskosten</h3>
                        <div className="space-y-3">
                            <VfInput
                                label="Bewirtschaftungskosten"
                                type="number"
                                value={inputs.bewirtschaftungskosten}
                                onChange={(e) => setInputs(prev => ({ ...prev, bewirtschaftungskosten: e.target.value }))}
                                rightAddon="€"
                            />
                            <VfInput
                                label="Instandhaltung"
                                type="number"
                                value={inputs.instandhaltung}
                                onChange={(e) => setInputs(prev => ({ ...prev, instandhaltung: e.target.value }))}
                                rightAddon="€"
                            />
                            <VfInput
                                label="Grundsteuer"
                                type="number"
                                value={inputs.grundsteuer}
                                onChange={(e) => setInputs(prev => ({ ...prev, grundsteuer: e.target.value }))}
                                rightAddon="€"
                            />
                            <VfInput
                                label="Versicherung"
                                type="number"
                                value={inputs.versicherung}
                                onChange={(e) => setInputs(prev => ({ ...prev, versicherung: e.target.value }))}
                                rightAddon="€"
                            />
                            <VfInput
                                label="Hausverwaltung"
                                type="number"
                                value={inputs.hausverwaltung}
                                onChange={(e) => setInputs(prev => ({ ...prev, hausverwaltung: e.target.value }))}
                                rightAddon="€"
                            />
                        </div>
                    </div>

                    <div className="vf-calculator-input-group">
                        <h3 className="vf-calculator-input-group-title">Kapitaldienst</h3>
                        <div className="space-y-3">
                            <VfInput
                                label="Zinsen (jährlich)"
                                type="number"
                                value={inputs.zinsen}
                                onChange={(e) => setInputs(prev => ({ ...prev, zinsen: e.target.value }))}
                                rightAddon="€"
                            />
                            <VfInput
                                label="Tilgung (jährlich)"
                                type="number"
                                value={inputs.tilgung}
                                onChange={(e) => setInputs(prev => ({ ...prev, tilgung: e.target.value }))}
                                rightAddon="€"
                            />
                        </div>
                    </div>

                    <Button onClick={handleCalculate} className="vf-btn-gradient w-full">
                        <Calculator className="w-4 h-4" />
                        Berechnen
                    </Button>
                </div>
            </div>

            <div className="vf-calculator-result-panel">
                {!result ? (
                    <div className="vf-calculator-result-empty">
                        <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm">Berechnen Sie Ihren Cashflow</p>
                    </div>
                ) : (
                    <>
                        <div className="vf-calculator-primary-result">
                            <div className="vf-calculator-primary-label">Cashflow (monatlich)</div>
                            <div className={`vf-calculator-primary-value ${result.cashflow_monatlich < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {result.cashflow_monatlich.toLocaleString('de-DE')} €
                            </div>
                        </div>

                        <div className="vf-calculator-secondary-results">
                            <div className="vf-calculator-secondary-item">
                                <div className="vf-calculator-secondary-label">Cashflow (jährlich)</div>
                                <div className={`vf-calculator-secondary-value ${result.cashflow_jaehrlich < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {result.cashflow_jaehrlich.toLocaleString('de-DE')} €
                                </div>
                            </div>
                            <div className="vf-calculator-secondary-item">
                                <div className="vf-calculator-secondary-label">Einnahmen</div>
                                <div className="vf-calculator-secondary-value text-green-600">{result.einnahmen.toLocaleString('de-DE')} €</div>
                            </div>
                        </div>

                        <div className="vf-calculator-breakdown">
                            <div className="vf-calculator-breakdown-title">Ausgaben</div>
                            <div className="vf-calculator-breakdown-item">
                                <span>Betriebskosten</span>
                                <span className="text-red-600">{result.betriebskosten.toLocaleString('de-DE')} €</span>
                            </div>
                            <div className="vf-calculator-breakdown-item">
                                <span>Kapitaldienst</span>
                                <span className="text-red-600">{result.kapitaldienst.toLocaleString('de-DE')} €</span>
                            </div>
                            <div className="vf-calculator-breakdown-item font-semibold">
                                <span>Gesamtausgaben</span>
                                <span className="text-red-600">{result.ausgaben.toLocaleString('de-DE')} €</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}