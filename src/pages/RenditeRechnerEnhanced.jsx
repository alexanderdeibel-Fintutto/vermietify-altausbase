import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { Calculator, Download, Save, TrendingUp, Home } from 'lucide-react';
import { showSuccess, showError } from '@/components/notifications/ToastNotification';
import VfLeadCapturePage from '@/components/lead-capture/VfLeadCapturePage';

export default function RenditeRechnerEnhanced() {
    const [showLeadGate, setShowLeadGate] = useState(false);
    const [inputs, setInputs] = useState({
        kaufpreis: '',
        nebenkosten_prozent: '10',
        eigenkapital: '',
        zinssatz: '3',
        tilgung: '2',
        jahresmiete: '',
        bewirtschaftungskosten_prozent: '20',
        instandhaltung_prozent: '1'
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleInputChange = (field, value) => {
        setInputs(prev => ({ ...prev, [field]: value }));
    };

    const handleCalculate = async () => {
        setLoading(true);
        try {
            const { data } = await base44.functions.invoke('calculateRendite', {
                kaufpreis: parseFloat(inputs.kaufpreis),
                nebenkosten_prozent: parseFloat(inputs.nebenkosten_prozent),
                eigenkapital: parseFloat(inputs.eigenkapital) || 0,
                zinssatz: parseFloat(inputs.zinssatz),
                tilgung: parseFloat(inputs.tilgung),
                jahresmiete: parseFloat(inputs.jahresmiete),
                bewirtschaftungskosten_prozent: parseFloat(inputs.bewirtschaftungskosten_prozent),
                instandhaltung_prozent: parseFloat(inputs.instandhaltung_prozent)
            });

            setResult(data.result);
            setShowLeadGate(true);
        } catch (error) {
            showError('Fehler bei der Berechnung');
        } finally {
            setLoading(false);
        }
    };

    const handleLeadCaptured = async (leadData) => {
        try {
            // Track calculation
            await base44.functions.invoke('trackCalculation', {
                calculator_type: 'rendite',
                user_email: leadData.email,
                input_data: inputs,
                result_data: result,
                result_summary: `Eigenkapitalrendite: ${result.eigenkapitalrendite}%`
            });

            setShowLeadGate(false);
            showSuccess('Berechnung gespeichert! Prüfen Sie Ihre Emails.');
        } catch (error) {
            showError('Fehler beim Speichern');
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const response = await base44.functions.invoke('generatePdf', {
                type: 'calculation',
                title: 'Rendite-Berechnung',
                data: result
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rendite_berechnung_${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            
            showSuccess('PDF heruntergeladen');
        } catch (error) {
            showError('Fehler beim PDF-Export');
        }
    };

    if (showLeadGate && result) {
        return (
            <VfLeadCapturePage
                toolName="Rendite-Rechner"
                toolIcon={TrendingUp}
                headline="Speichern Sie Ihre Berechnung"
                subheadline="Erhalten Sie Ihr detailliertes Ergebnis per E-Mail und behalten Sie den Überblick über Ihre Investitionen."
                onLeadCaptured={handleLeadCaptured}
                onSkip={() => setShowLeadGate(false)}
            />
        );
    }

    return (
        <div className="vf-calculator">
            {/* Input Panel */}
            <div className="vf-calculator-input-panel">
                <div className="flex items-center gap-3 mb-6">
                    <div className="vf-tool-icon w-12 h-12">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Rendite-Rechner</h1>
                        <p className="text-sm text-muted-foreground">Berechnen Sie die Rendite Ihrer Immobilien-Investition</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="vf-calculator-input-group">
                        <h3 className="vf-calculator-input-group-title">Kaufpreis & Finanzierung</h3>
                        <div className="space-y-4">
                            <VfInput
                                label="Kaufpreis"
                                type="number"
                                value={inputs.kaufpreis}
                                onChange={(e) => handleInputChange('kaufpreis', e.target.value)}
                                rightAddon="€"
                                required
                            />
                            <VfInput
                                label="Nebenkosten"
                                type="number"
                                value={inputs.nebenkosten_prozent}
                                onChange={(e) => handleInputChange('nebenkosten_prozent', e.target.value)}
                                rightAddon="%"
                                hint="Grunderwerbsteuer, Notar, Makler (ca. 10-15%)"
                            />
                            <VfInput
                                label="Eigenkapital"
                                type="number"
                                value={inputs.eigenkapital}
                                onChange={(e) => handleInputChange('eigenkapital', e.target.value)}
                                rightAddon="€"
                            />
                            <VfInput
                                label="Zinssatz"
                                type="number"
                                value={inputs.zinssatz}
                                onChange={(e) => handleInputChange('zinssatz', e.target.value)}
                                rightAddon="%"
                            />
                            <VfInput
                                label="Tilgung"
                                type="number"
                                value={inputs.tilgung}
                                onChange={(e) => handleInputChange('tilgung', e.target.value)}
                                rightAddon="%"
                            />
                        </div>
                    </div>

                    <div className="vf-calculator-input-group">
                        <h3 className="vf-calculator-input-group-title">Einnahmen & Kosten</h3>
                        <div className="space-y-4">
                            <VfInput
                                label="Jahresmiete (Kaltmiete)"
                                type="number"
                                value={inputs.jahresmiete}
                                onChange={(e) => handleInputChange('jahresmiete', e.target.value)}
                                rightAddon="€"
                                required
                            />
                            <VfInput
                                label="Bewirtschaftungskosten"
                                type="number"
                                value={inputs.bewirtschaftungskosten_prozent}
                                onChange={(e) => handleInputChange('bewirtschaftungskosten_prozent', e.target.value)}
                                rightAddon="%"
                                hint="Verwaltung, Versicherung, etc. (ca. 15-25%)"
                            />
                            <VfInput
                                label="Instandhaltungsrücklage"
                                type="number"
                                value={inputs.instandhaltung_prozent}
                                onChange={(e) => handleInputChange('instandhaltung_prozent', e.target.value)}
                                rightAddon="%"
                                hint="Vom Kaufpreis (ca. 1-1.5%)"
                            />
                        </div>
                    </div>

                    <div className="vf-calculator-actions">
                        <Button 
                            onClick={handleCalculate} 
                            disabled={!inputs.kaufpreis || !inputs.jahresmiete || loading}
                            className="vf-btn-gradient w-full"
                        >
                            <Calculator className="w-4 h-4" />
                            {loading ? 'Berechne...' : 'Rendite berechnen'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Result Panel */}
            <div className="vf-calculator-result-panel">
                {!result ? (
                    <div className="vf-calculator-result-empty">
                        <Home className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm">Geben Sie Ihre Daten ein und berechnen Sie die Rendite</p>
                    </div>
                ) : (
                    <>
                        <div className="vf-calculator-primary-result">
                            <div className="vf-calculator-primary-label">Eigenkapitalrendite</div>
                            <div className="vf-calculator-primary-value">{result.eigenkapitalrendite}%</div>
                        </div>

                        <div className="vf-calculator-secondary-results">
                            <div className="vf-calculator-secondary-item">
                                <div className="vf-calculator-secondary-label">Brutto-Mietrendite</div>
                                <div className="vf-calculator-secondary-value">{result.brutto_mietrendite}%</div>
                            </div>
                            <div className="vf-calculator-secondary-item">
                                <div className="vf-calculator-secondary-label">Netto-Mietrendite</div>
                                <div className="vf-calculator-secondary-value">{result.netto_mietrendite}%</div>
                            </div>
                            <div className="vf-calculator-secondary-item">
                                <div className="vf-calculator-secondary-label">Monatlicher Cashflow</div>
                                <div className="vf-calculator-secondary-value">{result.monatlicher_cashflow.toLocaleString('de-DE')} €</div>
                            </div>
                            <div className="vf-calculator-secondary-item">
                                <div className="vf-calculator-secondary-label">Jährlicher Cashflow</div>
                                <div className="vf-calculator-secondary-value">{result.netto_cashflow.toLocaleString('de-DE')} €</div>
                            </div>
                        </div>

                        <div className="vf-calculator-breakdown">
                            <div className="vf-calculator-breakdown-title">Details</div>
                            <div className="vf-calculator-breakdown-item">
                                <span>Gesamtinvestition</span>
                                <span>{result.gesamtinvestition.toLocaleString('de-DE')} €</span>
                            </div>
                            <div className="vf-calculator-breakdown-item">
                                <span>Darlehensbetrag</span>
                                <span>{result.darlehensbetrag.toLocaleString('de-DE')} €</span>
                            </div>
                            <div className="vf-calculator-breakdown-item">
                                <span>Jährl. Kapitaldienst</span>
                                <span className="text-red-600">{result.jaehrlicher_kapitaldienst.toLocaleString('de-DE')} €</span>
                            </div>
                        </div>

                        <div className="vf-calculator-result-actions">
                            <Button onClick={handleDownloadPDF} variant="outline" className="flex-1">
                                <Download className="w-4 h-4" />
                                PDF
                            </Button>
                            <Button onClick={() => setShowLeadGate(true)} variant="gradient" className="flex-1">
                                <Save className="w-4 h-4" />
                                Speichern
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}