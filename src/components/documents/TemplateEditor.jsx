import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import ReactQuill from 'react-quill';
import { toast } from 'sonner';
import { Code, Eye, Settings } from 'lucide-react';

const PLACEHOLDER_GROUPS = {
    'Gebäude': [
        '{{Gebäude.Name}}', '{{Gebäude.Adresse}}', '{{Gebäude.Stadt}}', 
        '{{Gebäude.PLZ}}', '{{Gebäude.Baujahr}}'
    ],
    'Mieter': [
        '{{Mieter.Name}}', '{{Mieter.Vorname}}', '{{Mieter.Email}}', 
        '{{Mieter.Telefon}}', '{{Mieter.Adresse}}'
    ],
    'Mietvertrag': [
        '{{Vertrag.Beginn}}', '{{Vertrag.Ende}}', '{{Vertrag.Kaltmiete}}', 
        '{{Vertrag.Warmmiete}}', '{{Vertrag.Kaution}}'
    ],
    'Einheit': [
        '{{Einheit.Nummer}}', '{{Einheit.Größe}}', '{{Einheit.Etage}}', 
        '{{Einheit.Zimmer}}'
    ]
};

const DATA_SOURCES = ['building', 'unit', 'tenant', 'contract', 'financing', 'insurance'];

export default function TemplateEditor({ open, onOpenChange, initialData }) {
    const [formData, setFormData] = useState(initialData || {
        name: '',
        category: 'Mietrecht',
        content: '',
        required_data_sources: [],
        page_format: 'A4',
        font_family: 'Arial',
        font_size: 11
    });
    const queryClient = useQueryClient();

    React.useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                name: '',
                category: 'Mietrecht',
                content: '',
                required_data_sources: [],
                page_format: 'A4',
                font_family: 'Arial',
                font_size: 11
            });
        }
    }, [initialData, open]);

    const saveMutation = useMutation({
        mutationFn: (data) => {
            if (initialData?.id) {
                return base44.entities.Template.update(initialData.id, data);
            }
            return base44.entities.Template.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] });
            toast.success(initialData ? 'Vorlage aktualisiert' : 'Vorlage erstellt');
            onOpenChange(false);
        }
    });

    const handleSave = () => {
        if (!formData.name || !formData.content) {
            toast.error('Name und Inhalt sind erforderlich');
            return;
        }
        saveMutation.mutate(formData);
    };

    const insertPlaceholder = (placeholder) => {
        setFormData(prev => ({
            ...prev,
            content: prev.content + ' ' + placeholder + ' '
        }));
    };

    const toggleDataSource = (source) => {
        setFormData(prev => ({
            ...prev,
            required_data_sources: prev.required_data_sources?.includes(source)
                ? prev.required_data_sources.filter(s => s !== source)
                : [...(prev.required_data_sources || []), source]
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'Vorlage bearbeiten' : 'Neue Vorlage erstellen'}
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="editor" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="editor">
                            <Code className="w-4 h-4 mr-2" />
                            Editor
                        </TabsTrigger>
                        <TabsTrigger value="settings">
                            <Settings className="w-4 h-4 mr-2" />
                            Einstellungen
                        </TabsTrigger>
                        <TabsTrigger value="preview">
                            <Eye className="w-4 h-4 mr-2" />
                            Vorschau
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="editor" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Vorlagenname</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="z.B. Mietvertrag Standard"
                                />
                            </div>
                            <div>
                                <Label>Kategorie</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Mietrecht">Mietrecht</SelectItem>
                                        <SelectItem value="Verwaltung">Verwaltung</SelectItem>
                                        <SelectItem value="Finanzen">Finanzen</SelectItem>
                                        <SelectItem value="Sonstiges">Sonstiges</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label>Platzhalter einfügen</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                {Object.entries(PLACEHOLDER_GROUPS).map(([group, placeholders]) => (
                                    <Card key={group} className="p-3">
                                        <h4 className="text-xs font-semibold text-slate-700 mb-2">{group}</h4>
                                        <div className="space-y-1">
                                            {placeholders.map(ph => (
                                                <Button
                                                    key={ph}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full justify-start text-xs h-7"
                                                    onClick={() => insertPlaceholder(ph)}
                                                >
                                                    {ph}
                                                </Button>
                                            ))}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label>Vorlageninhalt</Label>
                            <ReactQuill
                                theme="snow"
                                value={formData.content}
                                onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                                className="bg-white"
                                style={{ height: '400px', marginBottom: '50px' }}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-4">
                        <div>
                            <Label className="mb-3 block">Benötigte Datenquellen</Label>
                            <div className="grid grid-cols-2 gap-3">
                                {DATA_SOURCES.map(source => (
                                    <div key={source} className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={formData.required_data_sources?.includes(source)}
                                            onCheckedChange={() => toggleDataSource(source)}
                                        />
                                        <Label className="capitalize">{source}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Seitenformat</Label>
                                <Select
                                    value={formData.page_format}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, page_format: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="A4">A4</SelectItem>
                                        <SelectItem value="A5">A5</SelectItem>
                                        <SelectItem value="Letter">Letter</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Schriftart</Label>
                                <Select
                                    value={formData.font_family}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, font_family: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Arial">Arial</SelectItem>
                                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                                        <SelectItem value="Calibri">Calibri</SelectItem>
                                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Schriftgröße (pt)</Label>
                                <Input
                                    type="number"
                                    min="8"
                                    max="24"
                                    value={formData.font_size}
                                    onChange={(e) => setFormData(prev => ({ ...prev, font_size: parseInt(e.target.value) }))}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="preview">
                        <Card className="p-8 bg-white">
                            <div 
                                className="prose prose-sm max-w-none"
                                style={{ 
                                    fontFamily: formData.font_family, 
                                    fontSize: `${formData.font_size}pt` 
                                }}
                                dangerouslySetInnerHTML={{ __html: formData.content }}
                            />
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Abbrechen
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        className="bg-emerald-600 hover:bg-emerald-700"
                        disabled={saveMutation.isPending}
                    >
                        {saveMutation.isPending ? 'Speichert...' : 'Speichern'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}