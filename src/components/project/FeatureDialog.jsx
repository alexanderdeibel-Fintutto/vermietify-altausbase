import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function FeatureDialog({ open, onOpenChange, feature }) {
    const [formData, setFormData] = useState(feature || {
        titel: '',
        beschreibung: '',
        typ: 'Feature',
        status: 'Geplant',
        prioritaet: 'Mittel',
        fortschritt_prozent: 0,
        entwickler_email: '',
        eta_datum: '',
        sprint: '',
        story_points: 0,
        kategorie: '',
        betroffene_module: []
    });

    const queryClient = useQueryClient();

    const saveMutation = useMutation({
        mutationFn: async (data) => {
            if (feature?.id) {
                return base44.entities.ProjectFeature.update(feature.id, data);
            } else {
                return base44.entities.ProjectFeature.create(data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-features'] });
            toast.success(feature ? 'Feature aktualisiert' : 'Feature erstellt');
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error('Fehler: ' + error.message);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.titel || !formData.typ) {
            toast.error('Bitte Titel und Typ angeben');
            return;
        }
        saveMutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{feature ? 'Feature bearbeiten' : 'Neues Feature'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Titel *</Label>
                        <Input
                            value={formData.titel}
                            onChange={(e) => setFormData({ ...formData, titel: e.target.value })}
                            placeholder="z.B. Excel-Export für Betriebskosten"
                        />
                    </div>

                    <div>
                        <Label>Beschreibung</Label>
                        <Textarea
                            value={formData.beschreibung}
                            onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
                            placeholder="Detaillierte Beschreibung..."
                            rows={4}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Typ *</Label>
                            <Select
                                value={formData.typ}
                                onValueChange={(value) => setFormData({ ...formData, typ: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Feature">Feature</SelectItem>
                                    <SelectItem value="Bug">Bug</SelectItem>
                                    <SelectItem value="Verbesserung">Verbesserung</SelectItem>
                                    <SelectItem value="Refactoring">Refactoring</SelectItem>
                                    <SelectItem value="Dokumentation">Dokumentation</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Status *</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Geplant">Geplant</SelectItem>
                                    <SelectItem value="In Entwicklung">In Entwicklung</SelectItem>
                                    <SelectItem value="Testing">Testing</SelectItem>
                                    <SelectItem value="Fertig">Fertig</SelectItem>
                                    <SelectItem value="Pausiert">Pausiert</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Priorität *</Label>
                            <Select
                                value={formData.prioritaet}
                                onValueChange={(value) => setFormData({ ...formData, prioritaet: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Kritisch">Kritisch</SelectItem>
                                    <SelectItem value="Hoch">Hoch</SelectItem>
                                    <SelectItem value="Mittel">Mittel</SelectItem>
                                    <SelectItem value="Niedrig">Niedrig</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Kategorie</Label>
                            <Select
                                value={formData.kategorie}
                                onValueChange={(value) => setFormData({ ...formData, kategorie: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Auswählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Backend">Backend</SelectItem>
                                    <SelectItem value="Frontend">Frontend</SelectItem>
                                    <SelectItem value="Datenbank">Datenbank</SelectItem>
                                    <SelectItem value="Integration">Integration</SelectItem>
                                    <SelectItem value="UI/UX">UI/UX</SelectItem>
                                    <SelectItem value="Performance">Performance</SelectItem>
                                    <SelectItem value="Security">Security</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label>Fortschritt %</Label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                value={formData.fortschritt_prozent}
                                onChange={(e) => setFormData({ ...formData, fortschritt_prozent: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        <div>
                            <Label>Story Points</Label>
                            <Input
                                type="number"
                                min="0"
                                value={formData.story_points}
                                onChange={(e) => setFormData({ ...formData, story_points: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        <div>
                            <Label>Sprint</Label>
                            <Input
                                value={formData.sprint}
                                onChange={(e) => setFormData({ ...formData, sprint: e.target.value })}
                                placeholder="Sprint 01/2025"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Entwickler (E-Mail)</Label>
                            <Input
                                type="email"
                                value={formData.entwickler_email}
                                onChange={(e) => setFormData({ ...formData, entwickler_email: e.target.value })}
                                placeholder="dev@example.com"
                            />
                        </div>

                        <div>
                            <Label>ETA Datum</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.eta_datum ? format(new Date(formData.eta_datum), 'dd.MM.yyyy', { locale: de }) : 'Datum wählen'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.eta_datum ? new Date(formData.eta_datum) : undefined}
                                        onSelect={(date) => setFormData({ ...formData, eta_datum: date ? format(date, 'yyyy-MM-dd') : '' })}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Abbrechen
                        </Button>
                        <Button type="submit" disabled={saveMutation.isPending}>
                            {saveMutation.isPending ? 'Speichert...' : 'Speichern'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}