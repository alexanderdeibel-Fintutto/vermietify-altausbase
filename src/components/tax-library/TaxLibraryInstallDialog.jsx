import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { CheckCircle, AlertCircle, BookOpen, Loader2 } from 'lucide-react';

export default function TaxLibraryInstallDialog({ building, open, onOpenChange }) {
    const [legalForm, setLegalForm] = useState(building?.owner_legal_form || 'PRIVATPERSON');
    const [accountFramework, setAccountFramework] = useState(building?.account_framework || 'SKR03');
    const queryClient = useQueryClient();

    const installMutation = useMutation({
        mutationFn: async () => {
            return await base44.functions.invoke('loadTaxLibrary', {
                building_id: building.id,
                legal_form: legalForm,
                account_framework: accountFramework
            });
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['taxLibrary', building.id] });
            queryClient.invalidateQueries({ queryKey: ['buildings'] });
            onOpenChange(false);
        }
    });

    const handleInstall = async () => {
        installMutation.mutate();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-emerald-600" />
                        Steuerbibliothek installieren
                    </DialogTitle>
                    <DialogDescription>
                        Installieren Sie die Steuerbibliothek für korrekte Kontenzuordnung und steuerliche Behandlung
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Info Card */}
                    <Card className="p-4 bg-blue-50 border-blue-200">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="text-sm text-blue-900">
                                <p className="font-medium mb-1">Was wird installiert?</p>
                                <ul className="list-disc list-inside space-y-1 text-blue-800">
                                    <li>45+ Kostenkategorien (Erhaltung, Betrieb, Verwaltung, etc.)</li>
                                    <li>Automatische Kontenzuordnung (SKR03/SKR04)</li>
                                    <li>Zuordnung zu Anlage V bzw. GuV-Positionen</li>
                                    <li>AfA-Regelungen und 15%-Grenze</li>
                                </ul>
                            </div>
                        </div>
                    </Card>

                    {/* Rechtsform */}
                    <div className="space-y-2">
                        <Label>Rechtsform des Eigentümers</Label>
                        <Select value={legalForm} onValueChange={setLegalForm}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PRIVATPERSON">Privatperson (Anlage V)</SelectItem>
                                <SelectItem value="GBR">GbR (Anlage V)</SelectItem>
                                <SelectItem value="GMBH">GmbH (Bilanz/GuV)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-600">
                            Bestimmt die steuerliche Behandlung und Kontenzuordnung
                        </p>
                    </div>

                    {/* Kontenrahmen */}
                    <div className="space-y-2">
                        <Label>Kontenrahmen</Label>
                        <Select value={accountFramework} onValueChange={setAccountFramework}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SKR03">SKR03 (Prozessgliederung)</SelectItem>
                                <SelectItem value="SKR04">SKR04 (Abschlussgliederung)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-600">
                            Ihr Steuerberater kann Ihnen sagen, welcher Kontenrahmen verwendet wird
                        </p>
                    </div>

                    {/* Error Display */}
                    {installMutation.isError && (
                        <Card className="p-4 bg-red-50 border-red-200">
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-red-900">Fehler bei der Installation</p>
                                    <p className="text-sm text-red-800 mt-1">{installMutation.error?.message}</p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Success Display */}
                    {installMutation.isSuccess && (
                        <Card className="p-4 bg-green-50 border-green-200">
                            <div className="flex gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-green-900">Erfolgreich installiert!</p>
                                    <p className="text-sm text-green-800 mt-1">
                                        {installMutation.data.installed_categories} Kategorien verfügbar
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button 
                            variant="outline" 
                            onClick={() => onOpenChange(false)}
                            disabled={installMutation.isPending}
                        >
                            Abbrechen
                        </Button>
                        <Button 
                            onClick={handleInstall}
                            disabled={installMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {installMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Installiere...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Bibliothek installieren
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}