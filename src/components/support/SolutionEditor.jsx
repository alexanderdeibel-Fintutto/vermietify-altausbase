import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, X, Upload, Check } from 'lucide-react';
import { Switch } from "@/components/ui/switch";

export default function SolutionEditor({ open, onOpenChange, solution, problemId }) {
    const [formData, setFormData] = useState(solution || {
        titel: '',
        beschreibung: '',
        schritte: [],
        screenshots: [],
        video_url: '',
        tags: [],
        gilt_fuer_kategorien: [],
        schwierigkeitsgrad: 'Mittel',
        geschaetzte_dauer_minuten: 5,
        is_published: false
    });
    const [newStep, setNewStep] = useState('');
    const [newTag, setNewTag] = useState('');

    const queryClient = useQueryClient();

    const saveMutation = useMutation({
        mutationFn: async (data) => {
            if (solution?.id) {
                return base44.entities.ProblemSolution.update(solution.id, data);
            } else {
                return base44.entities.ProblemSolution.create(data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['problem-solutions'] });
            toast.success(solution ? 'Lösung aktualisiert' : 'Lösung erstellt');
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error('Fehler: ' + error.message);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.titel || !formData.beschreibung) {
            toast.error('Titel und Beschreibung sind erforderlich');
            return;
        }
        saveMutation.mutate(formData);
    };

    const addStep = () => {
        if (!newStep.trim()) return;
        const steps = formData.schritte || [];
        setFormData({
            ...formData,
            schritte: [...steps, { nummer: steps.length + 1, text: newStep }]
        });
        setNewStep('');
    };

    const removeStep = (index) => {
        const steps = [...(formData.schritte || [])];
        steps.splice(index, 1);
        const renumbered = steps.map((step, i) => ({ ...step, nummer: i + 1 }));
        setFormData({ ...formData, schritte: renumbered });
    };

    const addTag = () => {
        if (!newTag.trim()) return;
        const tags = formData.tags || [];
        if (tags.includes(newTag)) {
            toast.info('Tag bereits vorhanden');
            return;
        }
        setFormData({ ...formData, tags: [...tags, newTag] });
        setNewTag('');
    };

    const removeTag = (tag) => {
        setFormData({
            ...formData,
            tags: (formData.tags || []).filter(t => t !== tag)
        });
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
        setFormData({
            ...formData,
            screenshots: [...(formData.screenshots || []), ...validUrls]
        });
        toast.success(`${validUrls.length} Datei(en) hochgeladen`);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {solution ? 'Lösung bearbeiten' : 'Neue Lösung erstellen'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Titel *</Label>
                        <Input
                            value={formData.titel}
                            onChange={(e) => setFormData({ ...formData, titel: e.target.value })}
                            placeholder="z.B. Wie erstelle ich eine Betriebskostenabrechnung?"
                        />
                    </div>

                    <div>
                        <Label>Kurzbeschreibung *</Label>
                        <Textarea
                            value={formData.beschreibung}
                            onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
                            placeholder="Kurze Zusammenfassung der Lösung..."
                            rows={3}
                        />
                    </div>

                    <div>
                        <Label>Schritt-für-Schritt Anleitung</Label>
                        <div className="space-y-2">
                            {(formData.schritte || []).map((step, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Badge>{step.nummer}</Badge>
                                    <div className="flex-1 p-2 bg-slate-50 rounded">{step.text}</div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeStep(index)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            <div className="flex gap-2">
                                <Input
                                    value={newStep}
                                    onChange={(e) => setNewStep(e.target.value)}
                                    placeholder="Neuer Schritt..."
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStep())}
                                />
                                <Button type="button" onClick={addStep} size="sm">
                                    <Plus className="w-4 h-4 mr-1" />
                                    Hinzufügen
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label>Screenshots</Label>
                        <div className="border-2 border-dashed rounded-lg p-4">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="screenshot-upload"
                            />
                            <label htmlFor="screenshot-upload" className="cursor-pointer flex flex-col items-center">
                                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                <p className="text-sm text-slate-600">Screenshots hochladen</p>
                            </label>
                            {(formData.screenshots || []).length > 0 && (
                                <div className="mt-3">
                                    <p className="text-sm text-slate-600">{formData.screenshots.length} Datei(en) hochgeladen</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <Label>Video-URL (optional)</Label>
                        <Input
                            value={formData.video_url}
                            onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                            placeholder="https://youtube.com/..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Schwierigkeitsgrad</Label>
                            <select
                                value={formData.schwierigkeitsgrad}
                                onChange={(e) => setFormData({ ...formData, schwierigkeitsgrad: e.target.value })}
                                className="w-full p-2 border rounded"
                            >
                                <option value="Einfach">Einfach</option>
                                <option value="Mittel">Mittel</option>
                                <option value="Fortgeschritten">Fortgeschritten</option>
                            </select>
                        </div>

                        <div>
                            <Label>Geschätzte Dauer (Minuten)</Label>
                            <Input
                                type="number"
                                value={formData.geschaetzte_dauer_minuten}
                                onChange={(e) => setFormData({ ...formData, geschaetzte_dauer_minuten: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Tags (für Suche)</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {(formData.tags || []).map(tag => (
                                <Badge key={tag} className="gap-1">
                                    {tag}
                                    <X
                                        className="w-3 h-3 cursor-pointer"
                                        onClick={() => removeTag(tag)}
                                    />
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                placeholder="Neuer Tag..."
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            />
                            <Button type="button" onClick={addTag} size="sm">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                            <Label className="text-base">Für User veröffentlichen</Label>
                            <p className="text-sm text-slate-600">Lösung wird im Hilfe-Center angezeigt</p>
                        </div>
                        <Switch
                            checked={formData.is_published}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                        />
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