import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, Info, Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import TaxFormValidationSummary from '@/components/elster/TaxFormValidationSummary';

export default function AnlageSOEditor() {
    const queryClient = useQueryClient();
    const urlParams = new URLSearchParams(window.location.search);
    const anlageId = urlParams.get('id');

    const { data: anlage, isLoading } = useQuery({
        queryKey: ['anlageSO', anlageId],
        queryFn: async () => {
            const anlagen = await base44.entities.AnlageSO.filter({ id: anlageId });
            return anlagen[0];
        },
        enabled: !!anlageId
    });

    const saveMutation = useMutation({
        mutationFn: (data) => base44.entities.AnlageSO.update(anlageId, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['anlageSO']);
            toast.success('Änderungen gespeichert');
        }
    });

    const regenerateMutation = useMutation({
        mutationFn: () => base44.functions.invoke('generateAnlageSO', { 
            tax_return_id: anlage.tax_return_id,
            person: anlage.person
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['anlageSO']);
            toast.success('Anlage SO neu generiert');
        }
    });

    if (isLoading) return <div className="p-6">Laden...</div>;
    if (!anlage) return <div className="p-6">Anlage nicht gefunden</div>;

    const nettoGewinn = (anlage.summe_gewinne || 0) + (anlage.summe_verluste || 0);
    const freigrenze = 600;
    const isUnderFreigrenze = nettoGewinn > 0 && nettoGewinn <= freigrenze;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-light text-slate-900">Anlage SO {anlage.tax_year}</h1>
                    <p className="text-slate-500 mt-1">Private Veräußerungsgeschäfte</p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline"
                        onClick={() => regenerateMutation.mutate()}
                        disabled={regenerateMutation.isPending}
                        className="gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Neu generieren
                    </Button>
                    <Button 
                        onClick={() => saveMutation.mutate(anlage)}
                        disabled={saveMutation.isPending}
                        className="gap-2"
                    >
                        <Save className="h-4 w-4" />
                        Speichern
                    </Button>
                </div>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                    <p className="font-medium mb-2">Private Veräußerungsgeschäfte (§ 23 EStG)</p>
                    <p className="text-sm text-blue-700">
                        Kryptowährungen und Edelmetalle, die innerhalb eines Jahres nach Anschaffung 
                        wieder verkauft werden, unterliegen der Einkommensteuer. 
                        <strong> Freigrenze: {formatCurrency(freigrenze)}</strong> - 
                        Bei Überschreitung sind alle Gewinne steuerpflichtig!
                    </p>
                </AlertDescription>
            </Alert>

            <TaxFormValidationSummary 
                errors={anlage.validation_errors || []} 
            />

            {/* Tabelle mit Veräußerungen */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium">Veräußerungsgeschäfte</CardTitle>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Manuell hinzufügen
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {anlage.private_veraeusserungen && anlage.private_veraeusserungen.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Art</TableHead>
                                    <TableHead>Bezeichnung</TableHead>
                                    <TableHead>Anschaffung</TableHead>
                                    <TableHead>Veräußerung</TableHead>
                                    <TableHead className="text-right">Gewinn/Verlust</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {anlage.private_veraeusserungen.map((v, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>
                                            <Badge variant="outline">{v.art}</Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">{v.bezeichnung}</TableCell>
                                        <TableCell>{new Date(v.anschaffungsdatum).toLocaleDateString('de-DE')}</TableCell>
                                        <TableCell>{new Date(v.veraeusserungsdatum).toLocaleDateString('de-DE')}</TableCell>
                                        <TableCell className={`text-right font-medium ${v.gewinn_verlust >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(v.gewinn_verlust)}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-12 text-slate-400">
                            Keine privaten Veräußerungsgeschäfte
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Summen */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium">Zusammenfassung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-slate-600 mb-2">Summe Gewinne</p>
                            <p className="text-2xl font-light text-green-600">{formatCurrency(anlage.summe_gewinne)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 mb-2">Summe Verluste</p>
                            <p className="text-2xl font-light text-red-600">{formatCurrency(anlage.summe_verluste)}</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-slate-600">Steuerpflichtige Einkünfte</p>
                            {isUnderFreigrenze && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Freigrenze nicht überschritten
                                </Badge>
                            )}
                        </div>
                        <p className="text-3xl font-light text-slate-900">
                            {formatCurrency(anlage.steuerpflichtige_einkuenfte)}
                        </p>
                    </div>

                    {isUnderFreigrenze && (
                        <Alert className="border-green-200 bg-green-50">
                            <Info className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-900 text-sm">
                                Da Ihr Gesamtgewinn {formatCurrency(nettoGewinn)} beträgt und 
                                die Freigrenze von {formatCurrency(freigrenze)} nicht überschreitet, 
                                sind die Gewinne steuerfrei.
                            </AlertDescription>
                        </Alert>
                    )}

                    {nettoGewinn > freigrenze && (
                        <Alert className="border-yellow-200 bg-yellow-50">
                            <Info className="h-4 w-4 text-yellow-600" />
                            <AlertDescription className="text-yellow-900 text-sm">
                                Die Freigrenze von {formatCurrency(freigrenze)} wurde überschritten. 
                                Alle Gewinne sind steuerpflichtig (keine Freibetragsregelung!).
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}