import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { VfSelect } from '@/components/shared/VfSelect';
import { FileText, Download, Eye } from 'lucide-react';
import { showSuccess, showError } from '@/components/notifications/ToastNotification';

const vertragsarten = [
    { value: 'unbefristet', label: 'Unbefristeter Mietvertrag' },
    { value: 'befristet', label: 'Befristeter Mietvertrag' },
    { value: 'gewerblich', label: 'Gewerbemietvertrag' }
];

export default function MietvertragGeneratorEnhanced() {
    const [inputs, setInputs] = useState({
        vertragsart: 'unbefristet',
        vermieter_name: '',
        vermieter_adresse: '',
        mieter_name: '',
        mieter_adresse: '',
        objekt_adresse: '',
        wohnflaeche: '',
        kaltmiete: '',
        betriebskosten: '',
        kaution: '',
        mietbeginn: '',
        mietende: '',
        besondere_vereinbarungen: ''
    });
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const { data } = await base44.functions.invoke('generatePdf', {
                template_type: 'mietvertrag',
                data: inputs
            });
            
            setPreview(data.html_preview);
            showSuccess('Vertrag wurde generiert');
        } catch (error) {
            showError('Fehler beim Generieren');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="vf-generator">
            {/* Input Form */}
            <div className="vf-generator-form">
                <div className="flex items-center gap-3 mb-6">
                    <div className="vf-tool-icon w-12 h-12">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Mietvertrag-Generator</h1>
                        <p className="text-sm text-muted-foreground">Erstellen Sie rechtssichere Mietverträge</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold mb-3">Vertragsart</h3>
                        <VfSelect
                            value={inputs.vertragsart}
                            onChange={(value) => setInputs(prev => ({ ...prev, vertragsart: value }))}
                            options={vertragsarten}
                        />
                    </div>

                    <div>
                        <h3 className="font-semibold mb-3">Vermieter</h3>
                        <div className="space-y-3">
                            <VfInput
                                label="Name"
                                value={inputs.vermieter_name}
                                onChange={(e) => setInputs(prev => ({ ...prev, vermieter_name: e.target.value }))}
                                required
                            />
                            <VfTextarea
                                label="Adresse"
                                value={inputs.vermieter_adresse}
                                onChange={(e) => setInputs(prev => ({ ...prev, vermieter_adresse: e.target.value }))}
                                rows={3}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-3">Mieter</h3>
                        <div className="space-y-3">
                            <VfInput
                                label="Name"
                                value={inputs.mieter_name}
                                onChange={(e) => setInputs(prev => ({ ...prev, mieter_name: e.target.value }))}
                                required
                            />
                            <VfTextarea
                                label="Adresse"
                                value={inputs.mieter_adresse}
                                onChange={(e) => setInputs(prev => ({ ...prev, mieter_adresse: e.target.value }))}
                                rows={3}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-3">Mietobjekt</h3>
                        <div className="space-y-3">
                            <VfTextarea
                                label="Adresse"
                                value={inputs.objekt_adresse}
                                onChange={(e) => setInputs(prev => ({ ...prev, objekt_adresse: e.target.value }))}
                                rows={3}
                                required
                            />
                            <VfInput
                                label="Wohnfläche"
                                type="number"
                                value={inputs.wohnflaeche}
                                onChange={(e) => setInputs(prev => ({ ...prev, wohnflaeche: e.target.value }))}
                                rightAddon="m²"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-3">Konditionen</h3>
                        <div className="space-y-3">
                            <VfInput
                                label="Kaltmiete (monatlich)"
                                type="number"
                                value={inputs.kaltmiete}
                                onChange={(e) => setInputs(prev => ({ ...prev, kaltmiete: e.target.value }))}
                                rightAddon="€"
                                required
                            />
                            <VfInput
                                label="Betriebskosten (monatlich)"
                                type="number"
                                value={inputs.betriebskosten}
                                onChange={(e) => setInputs(prev => ({ ...prev, betriebskosten: e.target.value }))}
                                rightAddon="€"
                                required
                            />
                            <VfInput
                                label="Kaution"
                                type="number"
                                value={inputs.kaution}
                                onChange={(e) => setInputs(prev => ({ ...prev, kaution: e.target.value }))}
                                rightAddon="€"
                                required
                            />
                            <VfInput
                                label="Mietbeginn"
                                type="date"
                                value={inputs.mietbeginn}
                                onChange={(e) => setInputs(prev => ({ ...prev, mietbeginn: e.target.value }))}
                                required
                            />
                            {inputs.vertragsart === 'befristet' && (
                                <VfInput
                                    label="Mietende"
                                    type="date"
                                    value={inputs.mietende}
                                    onChange={(e) => setInputs(prev => ({ ...prev, mietende: e.target.value }))}
                                    required
                                />
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-3">Besondere Vereinbarungen</h3>
                        <VfTextarea
                            value={inputs.besondere_vereinbarungen}
                            onChange={(e) => setInputs(prev => ({ ...prev, besondere_vereinbarungen: e.target.value }))}
                            rows={4}
                            placeholder="z.B. Tierhaltung erlaubt, Gartenmitbenutzung, etc."
                        />
                    </div>

                    <Button 
                        onClick={handleGenerate} 
                        disabled={loading || !inputs.vermieter_name || !inputs.mieter_name}
                        className="vf-btn-gradient w-full"
                    >
                        <Eye className="w-4 h-4" />
                        {loading ? 'Wird generiert...' : 'Vorschau erstellen'}
                    </Button>
                </div>
            </div>

            {/* Preview */}
            <div className="vf-generator-preview">
                <div className="vf-generator-preview-header">
                    <h3 className="font-semibold">Vorschau</h3>
                    {preview && (
                        <Button size="sm" variant="outline">
                            <Download className="w-4 h-4" />
                            PDF herunterladen
                        </Button>
                    )}
                </div>

                <div className="vf-generator-preview-content">
                    {!preview ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <FileText className="w-16 h-16 mb-4" />
                            <p>Füllen Sie das Formular aus, um eine Vorschau zu sehen</p>
                        </div>
                    ) : (
                        <div dangerouslySetInnerHTML={{ __html: preview }} />
                    )}
                </div>
            </div>
        </div>
    );
}