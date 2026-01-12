import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Download, Info, Save } from 'lucide-react';
import { toast } from 'sonner';
import TaxFormField from '@/components/elster/TaxFormField';
import TaxFormValidationSummary from '@/components/elster/TaxFormValidationSummary';

export default function AnlageKAPEditor() {
    const queryClient = useQueryClient();
    const urlParams = new URLSearchParams(window.location.search);
    const anlageId = urlParams.get('id');

    const { data: anlage, isLoading } = useQuery({
        queryKey: ['anlageKAP', anlageId],
        queryFn: async () => {
            const anlagen = await base44.entities.AnlageKAP.filter({ id: anlageId });
            return anlagen[0];
        },
        enabled: !!anlageId
    });

    const [formData, setFormData] = useState(anlage || {});

    React.useEffect(() => {
        if (anlage) setFormData(anlage);
    }, [anlage]);

    const saveMutation = useMutation({
        mutationFn: (data) => base44.entities.AnlageKAP.update(anlageId, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['anlageKAP']);
            toast.success('Änderungen gespeichert');
        }
    });

    const regenerateMutation = useMutation({
        mutationFn: () => base44.functions.invoke('generateAnlageKAP', { 
            tax_return_id: anlage.tax_return_id,
            person: anlage.person
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['anlageKAP']);
            toast.success('Anlage KAP neu generiert');
        }
    });

    const exportPDFMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch('/api/functions/exportTaxFormPDF', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await base44.auth.getToken()}`
                },
                body: JSON.stringify({ form_type: 'anlage_kap', form_id: anlageId })
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Anlage_KAP_${anlage.tax_year}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        },
        onSuccess: () => {
            toast.success('PDF exportiert');
        }
    });

    const updateField = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    if (isLoading) return <div className="p-6">Laden...</div>;
    if (!anlage) return <div className="p-6">Anlage nicht gefunden</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-light text-slate-900">Anlage KAP {anlage.tax_year}</h1>
                    <p className="text-slate-500 mt-1">Einkünfte aus Kapitalvermögen</p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline"
                        onClick={() => exportPDFMutation.mutate()}
                        disabled={exportPDFMutation.isPending}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        PDF Export
                    </Button>
                    <Button 
                        onClick={() => saveMutation.mutate(formData)}
                        disabled={saveMutation.isPending}
                        className="gap-2"
                    >
                        <Save className="h-4 w-4" />
                        Speichern
                    </Button>
                </div>
            </div>

            {anlage.is_auto_generated && (
                <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-900">
                        <div className="flex items-center justify-between">
                            <p>Dieses Formular wurde automatisch aus Ihren Kapitalerträgen generiert</p>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => regenerateMutation.mutate()}
                                disabled={regenerateMutation.isPending}
                            >
                                <RefreshCw className="h-3 w-3 mr-2" />
                                Neu generieren
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            <TaxFormValidationSummary 
                errors={anlage.validation_errors || []} 
                warnings={anlage.hints || []}
            />

            {/* Kapitalerträge */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium">Kapitalerträge</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <TaxFormField 
                        zeile="7"
                        label="Kapitalerträge (inländisch)"
                        value={formData.zeile_7_kapitalertraege_inland}
                        onChange={(v) => updateField('zeile_7_kapitalertraege_inland', v)}
                        help="Summe aller inländischen Kapitalerträge"
                    />
                    <TaxFormField 
                        zeile="8"
                        label="Kapitalerträge (ausländisch)"
                        value={formData.zeile_8_kapitalertraege_ausland}
                        onChange={(v) => updateField('zeile_8_kapitalertraege_ausland', v)}
                        help="Summe aller ausländischen Kapitalerträge"
                    />
                    <TaxFormField 
                        zeile="14"
                        label="Dividenden"
                        value={formData.zeile_14_dividenden}
                        onChange={(v) => updateField('zeile_14_dividenden', v)}
                    />
                    <TaxFormField 
                        zeile="15"
                        label="Zinsen"
                        value={formData.zeile_15_zinsen}
                        onChange={(v) => updateField('zeile_15_zinsen', v)}
                    />
                    <TaxFormField 
                        zeile="16"
                        label="Investmenterträge"
                        value={formData.zeile_16_investmentertraege}
                        onChange={(v) => updateField('zeile_16_investmentertraege', v)}
                        help="Erträge aus Investmentfonds (ETFs)"
                    />
                    <TaxFormField 
                        zeile="17"
                        label="Teilfreistellung"
                        value={formData.zeile_17_teilfreistellung}
                        onChange={(v) => updateField('zeile_17_teilfreistellung', v)}
                        help="Steuerfreier Anteil bei Investmentfonds"
                    />
                </CardContent>
            </Card>

            {/* Veräußerungen */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium">Veräußerungen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <TaxFormField 
                        zeile="18"
                        label="Gewinne aus Veräußerung"
                        value={formData.zeile_18_gewinne_veraeusserung}
                        onChange={(v) => updateField('zeile_18_gewinne_veraeusserung', v)}
                    />
                    <TaxFormField 
                        zeile="19"
                        label="Verluste (ohne Aktien)"
                        value={formData.zeile_19_verluste_veraeusserung}
                        onChange={(v) => updateField('zeile_19_verluste_veraeusserung', v)}
                    />
                    <TaxFormField 
                        zeile="20"
                        label="Verluste Aktien"
                        value={formData.zeile_20_verluste_aktien}
                        onChange={(v) => updateField('zeile_20_verluste_aktien', v)}
                        help="Verluste aus Aktienveräußerungen (separate Verlustverrechnungstopf)"
                    />
                    <TaxFormField 
                        zeile="21"
                        label="Verlustvortrag Aktien"
                        value={formData.zeile_21_verlustvortrag_aktien}
                        onChange={(v) => updateField('zeile_21_verlustvortrag_aktien', v)}
                        help="Verlustvortrag aus Vorjahren"
                    />
                    <TaxFormField 
                        zeile="22"
                        label="Verlustvortrag Sonstige"
                        value={formData.zeile_22_verlustvortrag_sonstige}
                        onChange={(v) => updateField('zeile_22_verlustvortrag_sonstige', v)}
                    />
                </CardContent>
            </Card>

            {/* Steuern */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium">Steuern</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <TaxFormField 
                        zeile="37"
                        label="Anrechenbare Quellensteuer"
                        value={formData.zeile_37_anrechenbare_quellensteuer}
                        onChange={(v) => updateField('zeile_37_anrechenbare_quellensteuer', v)}
                        help="Ausländische Quellensteuer, die angerechnet werden kann"
                    />
                    <TaxFormField 
                        zeile="48"
                        label="Einbehaltene Kapitalertragsteuer"
                        value={formData.zeile_48_kapest_einbehalten}
                        onChange={(v) => updateField('zeile_48_kapest_einbehalten', v)}
                    />
                    <TaxFormField 
                        zeile="49"
                        label="Einbehaltener Solidaritätszuschlag"
                        value={formData.zeile_49_soli_einbehalten}
                        onChange={(v) => updateField('zeile_49_soli_einbehalten', v)}
                    />
                    <TaxFormField 
                        zeile="50"
                        label="Einbehaltene Kirchensteuer"
                        value={formData.zeile_50_kirchensteuer_einbehalten}
                        onChange={(v) => updateField('zeile_50_kirchensteuer_einbehalten', v)}
                    />
                </CardContent>
            </Card>
        </div>
    );
}