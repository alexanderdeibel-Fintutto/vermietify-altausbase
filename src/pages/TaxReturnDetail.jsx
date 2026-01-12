import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Send, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import ElsterStatusBadge from '@/components/elster/ElsterStatusBadge';

export default function TaxReturnDetail() {
    const queryClient = useQueryClient();
    const urlParams = new URLSearchParams(window.location.search);
    const taxReturnId = urlParams.get('id');

    const { data: taxReturn } = useQuery({
        queryKey: ['taxReturn', taxReturnId],
        queryFn: async () => {
            const returns = await base44.entities.TaxReturn.filter({ id: taxReturnId });
            return returns[0];
        },
        enabled: !!taxReturnId
    });

    const { data: mantelbogen } = useQuery({
        queryKey: ['mantelbogen', taxReturnId],
        queryFn: async () => {
            const mb = await base44.entities.EstMantelbogen.filter({ tax_return_id: taxReturnId });
            return mb[0];
        },
        enabled: !!taxReturnId
    });

    const { data: anlageKAPs = [] } = useQuery({
        queryKey: ['anlageKAP', taxReturnId],
        queryFn: () => base44.entities.AnlageKAP.filter({ tax_return_id: taxReturnId }),
        enabled: !!taxReturnId
    });

    const { data: anlageSOs = [] } = useQuery({
        queryKey: ['anlageSO', taxReturnId],
        queryFn: () => base44.entities.AnlageSO.filter({ tax_return_id: taxReturnId }),
        enabled: !!taxReturnId
    });

    const { data: anlageVs = [] } = useQuery({
        queryKey: ['anlageV', taxReturnId],
        queryFn: () => base44.entities.AnlageVSubmission.filter({ tax_return_id: taxReturnId }),
        enabled: !!taxReturnId
    });

    const { data: attachments = [] } = useQuery({
        queryKey: ['attachments', taxReturnId],
        queryFn: () => base44.entities.TaxFormAttachment.filter({ tax_return_id: taxReturnId }),
        enabled: !!taxReturnId
    });

    const generateAllMutation = useMutation({
        mutationFn: () => base44.functions.invoke('generateAllTaxForms', { tax_return_id: taxReturnId }),
        onSuccess: () => {
            queryClient.invalidateQueries(['taxReturn']);
            queryClient.invalidateQueries(['mantelbogen']);
            queryClient.invalidateQueries(['anlageKAP']);
            queryClient.invalidateQueries(['anlageSO']);
            toast.success('Alle Formulare generiert');
        }
    });

    if (!taxReturn) {
        return <div className="p-6">Laden...</div>;
    }

    const steps = [
        { label: 'Stammdaten', status: taxReturn.taxpayer_name ? 'complete' : 'pending' },
        { label: 'Anlagen generieren', status: mantelbogen ? 'complete' : 'pending' },
        { label: 'Prüfen & Korrigieren', status: taxReturn.status === 'ready_for_review' ? 'complete' : 'pending' },
        { label: 'Belege anhängen', status: attachments.length > 0 ? 'complete' : 'pending' },
        { label: 'Abgabe', status: taxReturn.status === 'submitted' ? 'complete' : 'pending' }
    ];

    const currentStep = steps.findIndex(s => s.status === 'pending');
    const progressPercent = ((currentStep === -1 ? steps.length : currentStep) / steps.length) * 100;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-light text-slate-900">Steuererklärung {taxReturn.tax_year}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <ElsterStatusBadge status={taxReturn.status} />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline"
                        onClick={() => generateAllMutation.mutate()}
                        disabled={generateAllMutation.isPending}
                        className="gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Formulare generieren
                    </Button>
                    {taxReturn.status === 'ready_for_review' && (
                        <Link to={`${createPageUrl('ElsterSubmit')}?tax_return_id=${taxReturnId}`}>
                            <Button className="gap-2">
                                <Send className="h-4 w-4" />
                                An ELSTER übermitteln
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Fortschrittsanzeige */}
            <Card>
                <CardContent className="pt-6">
                    <div className="mb-4">
                        <Progress value={progressPercent} className="h-2" />
                    </div>
                    <div className="flex justify-between">
                        {steps.map((step, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    step.status === 'complete' ? 'bg-green-500' : 'bg-slate-200'
                                }`}>
                                    {step.status === 'complete' ? (
                                        <CheckCircle2 className="h-5 w-5 text-white" />
                                    ) : (
                                        <span className="text-slate-600 font-medium">{idx + 1}</span>
                                    )}
                                </div>
                                <span className="text-xs text-slate-600 text-center">{step.label}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Tabs für Anlagen */}
            <Tabs defaultValue="mantelbogen">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="mantelbogen">Mantelbogen</TabsTrigger>
                    <TabsTrigger value="kap">Anlage KAP</TabsTrigger>
                    <TabsTrigger value="so">Anlage SO</TabsTrigger>
                    <TabsTrigger value="v">Anlage V</TabsTrigger>
                    <TabsTrigger value="vorsorge">Vorsorge</TabsTrigger>
                    <TabsTrigger value="attachments">Belege</TabsTrigger>
                </TabsList>

                <TabsContent value="mantelbogen">
                    <Card>
                        <CardContent className="pt-6">
                            {mantelbogen ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-slate-600">Name</p>
                                            <p className="font-medium">{mantelbogen.zeile_7_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600">Steuer-ID</p>
                                            <p className="font-medium">{mantelbogen.zeile_12_steuerid}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600">Steuernummer</p>
                                            <p className="font-medium">{mantelbogen.zeile_1_steuernummer || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600">Finanzamt</p>
                                            <p className="font-medium">{mantelbogen.zeile_2_finanzamt || '-'}</p>
                                        </div>
                                    </div>

                                    {mantelbogen.summe_einkuenfte && (
                                        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                                            <h3 className="font-medium text-slate-900 mb-3">Zusammenfassung Einkünfte</h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span>Einkünfte aus Kapitalvermögen:</span>
                                                    <span className="font-medium">{formatCurrency(mantelbogen.summe_einkuenfte.einkuenfte_kapitalvermoegen)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Einkünfte aus Vermietung:</span>
                                                    <span className="font-medium">{formatCurrency(mantelbogen.summe_einkuenfte.einkuenfte_vermietung)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Sonstige Einkünfte:</span>
                                                    <span className="font-medium">{formatCurrency(mantelbogen.summe_einkuenfte.sonstige_einkuenfte)}</span>
                                                </div>
                                                <div className="flex justify-between pt-2 border-t">
                                                    <span className="font-medium">Gesamtbetrag der Einkünfte:</span>
                                                    <span className="font-bold">{formatCurrency(mantelbogen.summe_einkuenfte.gesamtbetrag_einkuenfte)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500">Mantelbogen noch nicht generiert</p>
                                    <Button 
                                        className="mt-4"
                                        onClick={() => generateAllMutation.mutate()}
                                    >
                                        Jetzt generieren
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="kap">
                    {anlageKAPs.length > 0 ? (
                        <Link to={`${createPageUrl('AnlageKAPEditor')}?id=${anlageKAPs[0].id}`}>
                            <Card className="cursor-pointer hover:shadow-md transition-shadow">
                                <CardContent className="pt-6">
                                    <p className="text-slate-600 mb-4">Anlage KAP - Einkünfte aus Kapitalvermögen</p>
                                    <Button variant="outline">Editor öffnen →</Button>
                                </CardContent>
                            </Card>
                        </Link>
                    ) : (
                        <Card>
                            <CardContent className="py-12 text-center text-slate-400">
                                Noch nicht generiert
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="so">
                    {anlageSOs.length > 0 ? (
                        <Link to={`${createPageUrl('AnlageSOEditor')}?id=${anlageSOs[0].id}`}>
                            <Card className="cursor-pointer hover:shadow-md transition-shadow">
                                <CardContent className="pt-6">
                                    <p className="text-slate-600 mb-4">Anlage SO - Sonstige Einkünfte (Krypto, Edelmetalle)</p>
                                    <Button variant="outline">Editor öffnen →</Button>
                                </CardContent>
                            </Card>
                        </Link>
                    ) : (
                        <Card>
                            <CardContent className="py-12 text-center text-slate-400">
                                Noch nicht generiert
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="v">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-slate-600 mb-4">Anlage V - Vermietung und Verpachtung</p>
                            <Link to={createPageUrl('AnlageVGDE')}>
                                <Button variant="outline">Zu Anlage V →</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="vorsorge">
                    <Card>
                        <CardContent className="pt-6 text-center text-slate-400">
                            Anlage Vorsorgeaufwand - Wird automatisch aus Versicherungen generiert
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="attachments">
                    <Link to={`${createPageUrl('TaxReturnAttachments')}?tax_return_id=${taxReturnId}`}>
                        <Card className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <p className="text-slate-600 mb-4">Belege und Anhänge ({attachments.length})</p>
                                <Button variant="outline">Belege verwalten →</Button>
                            </CardContent>
                        </Card>
                    </Link>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}