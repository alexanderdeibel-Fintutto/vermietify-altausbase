import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Upload, Video, HelpCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function ReportProblemDialog({ open, onOpenChange }) {
    const [problemData, setProblemData] = useState({
        problem_titel: '',
        problem_beschreibung: '',
        kategorie: '',
        schweregrad: 'Mittel',
        screenshots: [],
        browser_info: {}
    });
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [ticketNumber, setTicketNumber] = useState('');

    const queryClient = useQueryClient();

    const createProblemMutation = useMutation({
        mutationFn: async (data) => {
            // Browser-Info sammeln
            const browserInfo = {
                browser: navigator.userAgent.includes('Chrome') ? 'Chrome' :
                         navigator.userAgent.includes('Firefox') ? 'Firefox' :
                         navigator.userAgent.includes('Safari') ? 'Safari' : 'Unbekannt',
                version: navigator.appVersion,
                os: navigator.platform,
                screen_resolution: `${window.screen.width}x${window.screen.height}`
            };

            const problemToCreate = {
                ...data,
                browser_info: browserInfo,
                betroffene_seite_url: window.location.href,
                status: 'Neu',
                anzahl_duplikate: 1
            };

            return base44.entities.UserProblem.create(problemToCreate);
        },
        onSuccess: (data) => {
            setTicketNumber('#' + (data.id.substring(0, 8).toUpperCase()));
            setSubmitted(true);
            queryClient.invalidateQueries({ queryKey: ['user-problems'] });
            toast.success('Problem gemeldet!');
        },
        onError: (error) => {
            toast.error('Fehler beim Melden: ' + error.message);
        }
    });

    const handleSubmit = () => {
        if (!problemData.problem_titel || !problemData.problem_beschreibung || !problemData.kategorie) {
            toast.error('Bitte alle Pflichtfelder ausfüllen');
            return;
        }

        createProblemMutation.mutate(problemData);
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        const uploadPromises = files.map(async (file) => {
            try {
                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                return file_url;
            } catch (error) {
                toast.error('Upload fehlgeschlagen: ' + error.message);
                return null;
            }
        });

        const urls = await Promise.all(uploadPromises);
        const validUrls = urls.filter(url => url !== null);
        setUploadedFiles([...uploadedFiles, ...validUrls]);
        setProblemData({
            ...problemData,
            screenshots: [...(problemData.screenshots || []), ...validUrls]
        });
        toast.success(`${validUrls.length} Datei(en) hochgeladen`);
    };

    const handleClose = () => {
        setProblemData({
            problem_titel: '',
            problem_beschreibung: '',
            kategorie: '',
            schweregrad: 'Mittel',
            screenshots: []
        });
        setUploadedFiles([]);
        setSubmitted(false);
        setTicketNumber('');
        onOpenChange(false);
    };

    if (submitted) {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-[500px]">
                    <div className="flex flex-col items-center text-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <DialogTitle className="text-2xl mb-2">Problem gemeldet!</DialogTitle>
                        <DialogDescription className="mb-6">
                            <div className="space-y-2">
                                <p className="font-semibold text-lg">Ticket-Nummer: {ticketNumber}</p>
                                <p>Status: In Bearbeitung</p>
                                <p className="text-sm mt-4">
                                    Wir melden uns innerhalb von 4 Stunden.<br />
                                    Du erhältst Updates per E-Mail.
                                </p>
                            </div>
                        </DialogDescription>
                        <div className="flex gap-3">
                            <Button onClick={handleClose}>Schließen</Button>
                            <Button variant="outline" onClick={() => setSubmitted(false)}>
                                Weiteres Problem melden
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <HelpCircle className="w-5 h-5" />
                        Wie können wir helfen?
                    </DialogTitle>
                    <DialogDescription>
                        Melden Sie ein Problem oder suchen Sie nach Hilfe-Artikeln
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="report" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="search">Hilfe finden</TabsTrigger>
                        <TabsTrigger value="report">Problem melden</TabsTrigger>
                    </TabsList>

                    <TabsContent value="search" className="space-y-4">
                        <div className="space-y-4">
                            <div>
                                <Label>Suche in Hilfe-Artikeln</Label>
                                <Input placeholder="Nach was suchen Sie?" />
                            </div>

                            <div>
                                <h4 className="font-semibold mb-2">💡 Häufigste Fragen:</h4>
                                <div className="space-y-2">
                                    <Button variant="ghost" className="w-full justify-start h-auto py-2 px-3">
                                        <span className="text-left">Wie erstelle ich eine Betriebskostenabrechnung?</span>
                                    </Button>
                                    <Button variant="ghost" className="w-full justify-start h-auto py-2 px-3">
                                        <span className="text-left">Wo finde ich die Anlage V?</span>
                                    </Button>
                                    <Button variant="ghost" className="w-full justify-start h-auto py-2 px-3">
                                        <span className="text-left">Wie importiere ich Belege?</span>
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-2">📚 Kategorien:</h4>
                                <div className="flex flex-wrap gap-2">
                                    <Button variant="outline" size="sm">Bedienung</Button>
                                    <Button variant="outline" size="sm">Datenimport</Button>
                                    <Button variant="outline" size="sm">Dokumente</Button>
                                    <Button variant="outline" size="sm">Steuern</Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="report" className="space-y-4">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="titel">Problem kurz beschreiben *</Label>
                                <Input
                                    id="titel"
                                    placeholder="z.B. PDF-Export funktioniert nicht"
                                    value={problemData.problem_titel}
                                    onChange={(e) => setProblemData({ ...problemData, problem_titel: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="kategorie">Kategorie *</Label>
                                <Select
                                    value={problemData.kategorie}
                                    onValueChange={(value) => setProblemData({ ...problemData, kategorie: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Kategorie wählen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Bedienung">Bedienung</SelectItem>
                                        <SelectItem value="Bug">Bug / Fehler</SelectItem>
                                        <SelectItem value="Datenimport">Datenimport</SelectItem>
                                        <SelectItem value="Performance">Performance</SelectItem>
                                        <SelectItem value="Dokumentenerstellung">Dokumentenerstellung</SelectItem>
                                        <SelectItem value="Berechtigungen">Berechtigungen</SelectItem>
                                        <SelectItem value="Feature-Request">Feature-Request</SelectItem>
                                        <SelectItem value="Sonstiges">Sonstiges</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="schweregrad">Schweregrad *</Label>
                                <Select
                                    value={problemData.schweregrad}
                                    onValueChange={(value) => setProblemData({ ...problemData, schweregrad: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Kritisch">
                                            🔴 Kritisch - Kann nicht arbeiten
                                        </SelectItem>
                                        <SelectItem value="Hoch">
                                            🟠 Hoch - Arbeit stark erschwert
                                        </SelectItem>
                                        <SelectItem value="Mittel">
                                            🟡 Mittel - Unannehmlichkeit
                                        </SelectItem>
                                        <SelectItem value="Niedrig">
                                            🟢 Niedrig - Kleinigkeit
                                        </SelectItem>
                                        <SelectItem value="Kosmetisch">
                                            ⚪ Kosmetisch - Optik
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="beschreibung">Detaillierte Beschreibung *</Label>
                                <Textarea
                                    id="beschreibung"
                                    placeholder="Beschreiben Sie das Problem so genau wie möglich..."
                                    rows={6}
                                    value={problemData.problem_beschreibung}
                                    onChange={(e) => setProblemData({ ...problemData, problem_beschreibung: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="betroffenes_modul">Betroffenes Modul (optional)</Label>
                                <Input
                                    id="betroffenes_modul"
                                    placeholder="z.B. Betriebskostenabrechnung"
                                    value={problemData.betroffenes_modul || ''}
                                    onChange={(e) => setProblemData({ ...problemData, betroffenes_modul: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Screenshots (optional)</Label>
                                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer">
                                        <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                                        <p className="text-sm text-slate-600">
                                            Klicken zum Upload oder Drag & Drop
                                        </p>
                                    </label>
                                    {uploadedFiles.length > 0 && (
                                        <div className="mt-2 text-sm text-slate-600">
                                            {uploadedFiles.length} Datei(en) hochgeladen
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                <AlertCircle className="w-4 h-4" />
                                <span>Technische Infos (Browser, OS, Fehlerlogs) werden automatisch mitgesendet</span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={handleClose}>Abbrechen</Button>
                            <Button 
                                onClick={handleSubmit}
                                disabled={createProblemMutation.isPending}
                            >
                                {createProblemMutation.isPending ? 'Wird gemeldet...' : 'Problem melden'}
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}