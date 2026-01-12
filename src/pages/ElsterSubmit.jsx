import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Send, FileText, Shield, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import PinInputSecure from '@/components/elster/PinInputSecure';
import ElsterErrorDisplay from '@/components/elster/ElsterErrorDisplay';

export default function ElsterSubmit() {
    const queryClient = useQueryClient();
    const urlParams = new URLSearchParams(window.location.search);
    const taxReturnId = urlParams.get('tax_return_id');

    const [currentStep, setCurrentStep] = useState(1);
    const [pin, setPin] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [validationResult, setValidationResult] = useState(null);
    const [submission, setSubmission] = useState(null);

    const { data: taxReturn } = useQuery({
        queryKey: ['taxReturn', taxReturnId],
        queryFn: async () => {
            const returns = await base44.entities.TaxReturn.filter({ id: taxReturnId });
            return returns[0];
        }
    });

    const { data: settings } = useQuery({
        queryKey: ['elsterSettings'],
        queryFn: async () => {
            const user = await base44.auth.me();
            const s = await base44.entities.ElsterSettings.filter({ user_email: user.email });
            return s[0];
        }
    });

    const { data: certificate } = useQuery({
        queryKey: ['certificate', settings?.default_certificate_id],
        queryFn: async () => {
            if (!settings?.default_certificate_id) return null;
            const certs = await base44.entities.ElsterCertificate.filter({ id: settings.default_certificate_id });
            return certs[0];
        },
        enabled: !!settings?.default_certificate_id
    });

    const generateXMLMutation = useMutation({
        mutationFn: () => base44.functions.invoke('generateElsterXML', { tax_return_id: taxReturnId }),
        onSuccess: (response) => {
            setSubmission(response.data.submission);
            setCurrentStep(3);
        }
    });

    const validateMutation = useMutation({
        mutationFn: (submissionId) => base44.functions.invoke('validateElsterSubmission', { submission_id: submissionId }),
        onSuccess: (response) => {
            setValidationResult(response.data);
            if (response.data.valid) {
                setCurrentStep(4);
            }
        }
    });

    const submitMutation = useMutation({
        mutationFn: () => base44.functions.invoke('submitToElster', { 
            submission_id: submission.id,
            certificate_id: settings.default_certificate_id,
            pin
        }),
        onSuccess: (response) => {
            setCurrentStep(5);
            setPin(''); // PIN sofort löschen
            queryClient.invalidateQueries(['taxReturn']);
            toast.success('Steuererklärung erfolgreich übermittelt!');
        },
        onError: (error) => {
            toast.error('Übermittlung fehlgeschlagen: ' + error.message);
        }
    });

    if (!taxReturn) return <div className="p-6">Laden...</div>;

    const steps = [
        { number: 1, label: 'Vorbereitung', icon: CheckCircle2 },
        { number: 2, label: 'XML-Generierung', icon: FileText },
        { number: 3, label: 'Validierung', icon: CheckCircle2 },
        { number: 4, label: 'PIN-Eingabe', icon: Shield },
        { number: 5, label: 'Übermittlung', icon: Send }
    ];

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-light text-slate-900">ELSTER-Übermittlung</h1>
                <p className="text-slate-500 mt-1">Steuererklärung {taxReturn.tax_year}</p>
            </div>

            {/* Progress */}
            <div className="mb-8">
                <Progress value={(currentStep / steps.length) * 100} className="h-2 mb-6" />
                <div className="flex justify-between">
                    {steps.map(step => (
                        <div key={step.number} className="flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                currentStep > step.number ? 'bg-green-500' :
                                currentStep === step.number ? 'bg-blue-500' : 'bg-slate-200'
                            }`}>
                                <step.icon className={`h-5 w-5 ${currentStep >= step.number ? 'text-white' : 'text-slate-400'}`} />
                            </div>
                            <span className="text-xs text-slate-600 text-center">{step.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Step 1: Vorbereitung */}
            {currentStep === 1 && (
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <h2 className="text-lg font-medium mb-4">Checkliste</h2>
                        <div className="space-y-3">
                            <ChecklistItem checked label="Alle Anlagen vollständig" />
                            <ChecklistItem checked={!taxReturn.validation_errors?.length} label="Keine Validierungsfehler" />
                            <ChecklistItem checked={!!certificate && new Date(certificate.valid_until) > new Date()} label="Zertifikat gültig" />
                        </div>
                        <Button 
                            className="w-full mt-6"
                            onClick={() => setCurrentStep(2)}
                            disabled={!certificate}
                        >
                            Weiter
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Step 2: XML-Generierung */}
            {currentStep === 2 && (
                <Card>
                    <CardContent className="pt-6 text-center">
                        {generateXMLMutation.isPending ? (
                            <div className="py-12">
                                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
                                <p className="text-slate-600">XML wird generiert...</p>
                            </div>
                        ) : (
                            <div className="py-8">
                                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                                <p className="text-slate-600 mb-4">Bereit zur XML-Generierung</p>
                                <Button onClick={() => generateXMLMutation.mutate()}>
                                    XML generieren
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Validierung */}
            {currentStep === 3 && (
                <Card>
                    <CardContent className="pt-6">
                        {validateMutation.isPending ? (
                            <div className="text-center py-12">
                                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
                                <p className="text-slate-600">Wird bei ELSTER validiert...</p>
                            </div>
                        ) : validationResult ? (
                            <div className="space-y-4">
                                <ElsterErrorDisplay 
                                    errors={validationResult.errors || []}
                                    warnings={validationResult.warnings || []}
                                />
                                {validationResult.valid && (
                                    <Button className="w-full" onClick={() => setCurrentStep(4)}>
                                        Weiter zur PIN-Eingabe
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Button onClick={() => validateMutation.mutate(submission.id)}>
                                    Validierung starten
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Step 4: PIN-Eingabe */}
            {currentStep === 4 && (
                <Card>
                    <CardContent className="pt-6 space-y-6">
                        {certificate && (
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <p className="text-sm text-slate-600 mb-2">Verwendetes Zertifikat</p>
                                <p className="font-medium">{certificate.holder_name}</p>
                                <p className="text-xs text-slate-500">Gültig bis: {new Date(certificate.valid_until).toLocaleDateString('de-DE')}</p>
                            </div>
                        )}

                        <PinInputSecure 
                            value={pin}
                            onChange={setPin}
                            onSubmit={() => confirmed && pin && submitMutation.mutate()}
                        />

                        <div className="flex items-start gap-2">
                            <Checkbox 
                                checked={confirmed}
                                onCheckedChange={setConfirmed}
                                id="confirm"
                            />
                            <label htmlFor="confirm" className="text-sm text-slate-700 leading-tight">
                                Ich bestätige, dass alle Angaben in meiner Steuererklärung nach bestem 
                                Wissen und Gewissen korrekt und vollständig sind.
                            </label>
                        </div>

                        {settings?.test_mode && (
                            <Alert className="border-yellow-200 bg-yellow-50">
                                <AlertDescription className="text-yellow-900 text-sm">
                                    ⚠️ <strong>Testmodus aktiv:</strong> Die Übermittlung erfolgt an den ELSTER-Testserver 
                                    und wird nicht an das echte Finanzamt gesendet.
                                </AlertDescription>
                            </Alert>
                        )}

                        <Button 
                            className="w-full gap-2"
                            onClick={() => submitMutation.mutate()}
                            disabled={!pin || !confirmed || submitMutation.isPending}
                        >
                            {submitMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Wird übermittelt...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Jetzt übermitteln
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Step 5: Erfolg */}
            {currentStep === 5 && (
                <Card className="border-green-200">
                    <CardContent className="pt-6 text-center py-12">
                        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-medium text-green-900 mb-2">Erfolgreich übermittelt!</h2>
                        <p className="text-slate-600 mb-6">Ihre Steuererklärung wurde an ELSTER übermittelt</p>
                        
                        {submission?.transfer_ticket && (
                            <div className="bg-slate-50 p-4 rounded-lg mb-6 max-w-md mx-auto">
                                <p className="text-sm text-slate-600 mb-2">Transferticket</p>
                                <p className="font-mono text-sm font-medium">{submission.transfer_ticket}</p>
                            </div>
                        )}

                        {submission?.protocol_file_uri && (
                            <Button variant="outline" className="gap-2">
                                <Download className="h-4 w-4" />
                                Protokoll herunterladen
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function ChecklistItem({ checked, label }) {
    return (
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                checked ? 'bg-green-500 border-green-500' : 'border-slate-300'
            }`}>
                {checked && <CheckCircle2 className="h-4 w-4 text-white" />}
            </div>
            <span className="text-sm text-slate-700">{label}</span>
        </div>
    );
}