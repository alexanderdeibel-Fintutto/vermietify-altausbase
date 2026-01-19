import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Calculator, Download, TrendingUp } from 'lucide-react';
import { showSuccess, showError } from '@/components/notifications/ToastNotification';
import VfLeadCapturePage from '@/components/lead-capture/VfLeadCapturePage';

export default function IndexmietenRechnerV2() {
    const [showLeadGate, setShowLeadGate] = useState(false);
    const [inputs, setInputs] = useState({
        aktuelle_miete: '',
        start_year: '2020',
        start_month: '1',
        end_year: new Date().getFullYear().toString(),
        end_month: new Date().getMonth() + 1,
        country: 'AT'
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const years = Array.from({ length: 10 }, (_, i) => 2020 + i);
    const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(2000, i).toLocaleString('de', { month: 'long' }) }));

    const handleCalculate = async () => {
        setLoading(true);
        try {
            const { data } = await base44.functions.invoke('calculateIndexmiete', {
                aktuelle_miete: parseFloat(inputs.aktuelle_miete),
                start_year: parseInt(inputs.start_year),
                start_month: parseInt(inputs.start_month),
                end_year: parseInt(inputs.end_year),
                end_month: parseInt(inputs.end_month),
                country: inputs.country
            });

            setResult(data.result);
            setShowLeadGate(true);
        } catch (error) {
            showError(error.response?.data?.error || 'Fehler bei der Berechnung');
        } finally {
            setLoading(false);
        }
    };

    if (showLeadGate && result) {
        return (
            <VfLeadCapturePage
                toolName="Indexmieten-Rechner"
                toolIcon={TrendingUp}
                headline="Speichern Sie Ihre Berechnung"
                subheadline="Erhalten Sie Ihr Ergebnis per E-Mail für Ihre Unterlagen."
                onLeadCaptured={async (leadData) => {
                    await base44.functions.invoke('trackCalculation', {
                        calculator_type: 'indexmiete',
                        user_email: leadData.email,
                        input_data: inputs,
                        result_data: result
                    });
                    setShowLeadGate(false);
                    showSuccess('Gespeichert!');
                }}
                onSkip={() => setShowLeadGate(false)}
            />
        );
    }

    return (
        <div className="vf-calculator">
            <div className="vf-calculator-input-panel">
                <div className="flex items-center gap-3 mb-6">
                    <div className="vf-tool-icon w-12 h-12">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Indexmieten-Rechner</h1>
                        <p className="text-sm text-muted-foreground">Berechnen Sie die Mieterhöhung nach VPI</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <VfInput
                        label="Aktuelle Miete (monatlich)"
                        type="number"
                        value={inputs.aktuelle_miete}
                        onChange={(e) => setInputs(prev => ({ ...prev, aktuelle_miete: e.target.value }))}
                        rightAddon="€"
                        required
                    />

                    <div>
                        <h3 className="vf-calculator-input-group-title">Basis-Zeitpunkt</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <VfSelect
                                label="Monat"
                                value={inputs.start_month}
                                onChange={(value) => setInputs(prev => ({ ...prev, start_month: value }))}
                                options={months.map(m => ({ value: m.value.toString(), label: m.label }))}
                            />
                            <VfSelect
                                label="Jahr"
                                value={inputs.start_year}
                                onChange={(value) => setInputs(prev => ({ ...prev, start_year: value }))}
                                options={years.map(y => ({ value: y.toString(), label: y.toString() }))}
                            />
                        </div>
                    </div>

                    <div>
                        <h3 className="vf-calculator-input-group-title">Aktueller Zeitpunkt</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <VfSelect
                                label="Monat"
                                value={inputs.end_month.toString()}
                                onChange={(value) => setInputs(prev => ({ ...prev, end_month: value }))}
                                options={months.map(m => ({ value: m.value.toString(), label: m.label }))}
                            />
                            <VfSelect
                                label="Jahr"
                                value={inputs.end_year}
                                onChange={(value) => setInputs(prev => ({ ...prev, end_year: value }))}
                                options={years.map(y => ({ value: y.toString(), label: y.toString() }))}
                            />
                        </div>
                    </div>

                    <Button 
                        onClick={handleCalculate} 
                        disabled={!inputs.aktuelle_miete || loading}
                        className="vf-btn-gradient w-full"
                    >
                        <Calculator className="w-4 h-4" />
                        {loading ? 'Berechne...' : 'Berechnen'}
                    </Button>
                </div>
            </div>

            <div className="vf-calculator-result-panel">
                {!result ? (
                    <div className="vf-calculator-result-empty">
                        <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm">Starten Sie die Berechnung</p>
                    </div>
                ) : (
                    <>
                        <div className="vf-calculator-primary-result">
                            <div className="vf-calculator-primary-label">Neue Miete</div>
                            <div className="vf-calculator-primary-value">{result.neue_miete.toLocaleString('de-DE')} €</div>
                        </div>

                        <div className="vf-calculator-secondary-results">
                            <div className="vf-calculator-secondary-item">
                                <div className="vf-calculator-secondary-label">Erhöhung</div>
                                <div className="vf-calculator-secondary-value">+{result.erhoehung_absolut.toLocaleString('de-DE')} €</div>
                            </div>
                            <div className="vf-calculator-secondary-item">
                                <div className="vf-calculator-secondary-label">Prozent</div>
                                <div className="vf-calculator-secondary-value">+{result.erhoehung_prozent}%</div>
                            </div>
                        </div>

                        <div className="vf-calculator-breakdown">
                            <div className="vf-calculator-breakdown-title">VPI-Entwicklung</div>
                            <div className="vf-calculator-breakdown-item">
                                <span>VPI Start ({result.start_period})</span>
                                <span>{result.vpi_start}</span>
                            </div>
                            <div className="vf-calculator-breakdown-item">
                                <span>VPI Ende ({result.end_period})</span>
                                <span>{result.vpi_end}</span>
                            </div>
                            <div className="vf-calculator-breakdown-item">
                                <span>Indexänderung</span>
                                <span>+{result.indexaenderung}%</span>
                            </div>
                        </div>

                        <div className="vf-calculator-result-actions">
                            <Button variant="gradient" className="w-full" onClick={() => setShowLeadGate(true)}>
                                <Download className="w-4 h-4" />
                                Ergebnis speichern
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}