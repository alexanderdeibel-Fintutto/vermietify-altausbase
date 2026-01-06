import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, Database } from 'lucide-react';
import { toast } from 'sonner';

export default function InitializeTaxSystem() {
    const [initialized, setInitialized] = useState(false);

    const initMutation = useMutation({
        mutationFn: async () => {
            return await base44.functions.invoke('seedAnlageV2024', {});
        },
        onSuccess: (response) => {
            if (response.data.success) {
                setInitialized(true);
                toast.success('Anlage V 2024 Struktur erfolgreich initialisiert');
            } else {
                toast.info(response.data.message);
            }
        },
        onError: (error) => {
            toast.error('Fehler bei der Initialisierung');
            console.error('Init error:', error);
        }
    });

    return (
        <Card className="border-blue-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    System-Initialisierung
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                    Initialisieren Sie die Anlage V 2024 Formularstruktur, um mit der Erstellung zu beginnen.
                </p>

                {initialized ? (
                    <Alert className="border-emerald-200 bg-emerald-50">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <AlertDescription className="text-emerald-800">
                            System erfolgreich initialisiert - Sie können jetzt Anlagen erstellen
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Button
                        onClick={() => initMutation.mutate()}
                        disabled={initMutation.isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                        {initMutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Initialisiere...
                            </>
                        ) : (
                            'System initialisieren'
                        )}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}