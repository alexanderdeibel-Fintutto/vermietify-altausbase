import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FileImage, Table, Type, Layout, Save, Eye, Plus, Trash2 } from 'lucide-react';
import TemplatePreview from './TemplatePreview';
import TableBuilder from './TableBuilder';
import LogoUploader from './LogoUploader';

const PLACEHOLDER_GROUPS = {
    building: {
        label: 'Gebäude',
        placeholders: [
            { key: '{{building.name}}', label: 'Name' },
            { key: '{{building.address}}', label: 'Straße' },
            { key: '{{building.postal_code}}', label: 'PLZ' },
            { key: '{{building.city}}', label: 'Stadt' }
        ]
    },
    unit: {
        label: 'Wohnung',
        placeholders: [
            { key: '{{unit.unit_number}}', label: 'Wohnungsnummer' },
            { key: '{{unit.floor}}', label: 'Etage' },
            { key: '{{unit.sqm}}', label: 'Quadratmeter' },
            { key: '{{unit.rooms}}', label: 'Zimmer' }
        ]
    },
    tenant: {
        label: 'Mieter',
        placeholders: [
            { key: '{{tenant.first_name}}', label: 'Vorname' },
            { key: '{{tenant.last_name}}', label: 'Nachname' },
            { key: '{{tenant.email}}', label: 'E-Mail' },
            { key: '{{tenant.phone}}', label: 'Telefon' }
        ]
    },
    contract: {
        label: 'Mietvertrag',
        placeholders: [
            { key: '{{contract.start_date}}', label: 'Mietbeginn' },
            { key: '{{contract.base_rent}}', label: 'Kaltmiete' },
            { key: '{{contract.total_rent}}', label: 'Warmmiete' },
            { key: '{{contract.deposit}}', label: 'Kaution' }
        ]
    },
    meter: {
        label: 'Zähler',
        placeholders: [
            { key: '{{table:meters}}', label: 'Zählerstand-Tabelle' }
        ]
    },
    system: {
        label: 'System',
        placeholders: [
            { key: '{{date.today}}', label: 'Heutiges Datum' },
            { key: '{{date.now}}', label: 'Datum & Uhrzeit' },
            { key: '{{user.name}}', label: 'Benutzer' }
        ]
    }
};

export default function AdvancedTemplateEditor({ open, onOpenChange, initialData }) {
    const [templateData, setTemplateData] = useState(initialData || {
        name: '',
        category: 'Mietrecht',
        header_html: '',
        content: '',
        footer_html: '',
        required_data_sources: [],
        page_format: 'A4',
        margins: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
        styles: {
            font_family: 'Arial, sans-serif',
            font_size: '11pt',
            primary_color: '#000000',
            secondary_color: '#666666'
        },
        tables: []
    });

    const [activeTab, setActiveTab] = useState('layout');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [currentEditor, setCurrentEditor] = useState('content');
    const [tableBuilderOpen, setTableBuilderOpen] = useState(false);

    const queryClient = useQueryClient();

    React.useEffect(() => {
        if (initialData) {
            setTemplateData({
                ...initialData,
                margins: initialData.margins || { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
                styles: initialData.styles || {
                    font_family: 'Arial, sans-serif',
                    font_size: '11pt',
                    primary_color: '#000000',
                    secondary_color: '#666666'
                },
                tables: initialData.tables || []
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
            onOpenChange(false);
        }
    });

    const handleSave = () => {
        saveMutation.mutate(templateData);
    };

    const insertPlaceholder = (placeholder) => {
        const editors = {
            header: 'header_html',
            content: 'content',
            footer: 'footer_html'
        };
        
        const field = editors[currentEditor];
        const currentContent = templateData[field] || '';
        setTemplateData({
            ...templateData,
            [field]: currentContent + placeholder
        });
    };

    const insertTable = (tableConfig) => {
        const tableHtml = `<div class="table-placeholder" data-table-id="${tableConfig.id}">{{table:${tableConfig.id}}}</div>`;
        setTemplateData({
            ...templateData,
            content: (templateData.content || '') + tableHtml,
            tables: [...(templateData.tables || []), tableConfig]
        });
        setTableBuilderOpen(false);
    };

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link'],
            ['clean']
        ]
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {initialData ? 'Vorlage bearbeiten' : 'Neue Vorlage erstellen'}
                        </DialogTitle>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid grid-cols-4 w-full">
                            <TabsTrigger value="layout">
                                <Layout className="w-4 h-4 mr-2" />
                                Layout
                            </TabsTrigger>
                            <TabsTrigger value="content">
                                <Type className="w-4 h-4 mr-2" />
                                Inhalt
                            </TabsTrigger>
                            <TabsTrigger value="tables">
                                <Table className="w-4 h-4 mr-2" />
                                Tabellen
                            </TabsTrigger>
                            <TabsTrigger value="settings">
                                <FileImage className="w-4 h-4 mr-2" />
                                Einstellungen
                            </TabsTrigger>
                        </TabsList>

                        {/* Layout Tab */}
                        <TabsContent value="layout" className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Vorlagenname</Label>
                                    <Input
                                        value={templateData.name}
                                        onChange={(e) => setTemplateData({...templateData, name: e.target.value})}
                                        placeholder="z.B. Wohnungsübergabeprotokoll"
                                    />
                                </div>
                                <div>
                                    <Label>Kategorie</Label>
                                    <Select
                                        value={templateData.category}
                                        onValueChange={(value) => setTemplateData({...templateData, category: value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Mietrecht">Mietrecht</SelectItem>
                                            <SelectItem value="Verwaltung">Verwaltung</SelectItem>
                                            <SelectItem value="Finanzen">Finanzen</SelectItem>
                                            <SelectItem value="Übergabeprotokolle">Übergabeprotokolle</SelectItem>
                                            <SelectItem value="Sonstiges">Sonstiges</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Header Editor */}
                            <Card className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <Label className="text-base font-semibold">Kopfbereich (Header)</Label>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setCurrentEditor('header')}
                                    >
                                        Aktiv
                                    </Button>
                                </div>
                                <ReactQuill
                                    value={templateData.header_html}
                                    onChange={(value) => setTemplateData({...templateData, header_html: value})}
                                    modules={quillModules}
                                    className="h-32 mb-12"
                                />
                            </Card>

                            {/* Footer Editor */}
                            <Card className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <Label className="text-base font-semibold">Fußbereich (Footer)</Label>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setCurrentEditor('footer')}
                                    >
                                        Aktiv
                                    </Button>
                                </div>
                                <ReactQuill
                                    value={templateData.footer_html}
                                    onChange={(value) => setTemplateData({...templateData, footer_html: value})}
                                    modules={quillModules}
                                    className="h-32 mb-12"
                                />
                            </Card>
                        </TabsContent>

                        {/* Content Tab */}
                        <TabsContent value="content" className="space-y-6">
                            <div className="grid grid-cols-4 gap-4">
                                {/* Platzhalter-Palette */}
                                <Card className="col-span-1 p-4 h-[600px] overflow-y-auto">
                                    <h3 className="font-semibold mb-3">Platzhalter</h3>
                                    {Object.entries(PLACEHOLDER_GROUPS).map(([key, group]) => (
                                        <div key={key} className="mb-4">
                                            <p className="text-xs font-medium text-slate-500 mb-2">{group.label}</p>
                                            <div className="space-y-1">
                                                {group.placeholders.map((ph) => (
                                                    <Button
                                                        key={ph.key}
                                                        size="sm"
                                                        variant="ghost"
                                                        className="w-full justify-start text-xs"
                                                        onClick={() => insertPlaceholder(ph.key)}
                                                    >
                                                        <Plus className="w-3 h-3 mr-1" />
                                                        {ph.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </Card>

                                {/* Content Editor */}
                                <Card className="col-span-3 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <Label className="text-base font-semibold">Hauptinhalt</Label>
                                        <Button
                                            size="sm"
                                            onClick={() => setCurrentEditor('content')}
                                            variant={currentEditor === 'content' ? 'default' : 'outline'}
                                        >
                                            Aktiver Editor
                                        </Button>
                                    </div>
                                    <ReactQuill
                                        value={templateData.content}
                                        onChange={(value) => setTemplateData({...templateData, content: value})}
                                        modules={quillModules}
                                        className="h-[500px] mb-12"
                                    />
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Tables Tab */}
                        <TabsContent value="tables" className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold">Tabellen</h3>
                                    <p className="text-sm text-slate-600">Erstellen Sie dynamische Tabellen für Zählerstände, etc.</p>
                                </div>
                                <Button onClick={() => setTableBuilderOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Neue Tabelle
                                </Button>
                            </div>

                            <div className="grid gap-4">
                                {(templateData.tables || []).map((table, index) => (
                                    <Card key={index} className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-medium">{table.title}</h4>
                                                <p className="text-sm text-slate-600">Datenquelle: {table.data_source}</p>
                                                <div className="flex gap-2 mt-2">
                                                    {table.columns.map((col, i) => (
                                                        <Badge key={i} variant="outline">{col.label}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => {
                                                    const newTables = [...templateData.tables];
                                                    newTables.splice(index, 1);
                                                    setTemplateData({...templateData, tables: newTables});
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </Card>
                                ))}

                                {(!templateData.tables || templateData.tables.length === 0) && (
                                    <Card className="p-12 text-center">
                                        <Table className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                        <p className="text-slate-600">Noch keine Tabellen definiert</p>
                                    </Card>
                                )}
                            </div>
                        </TabsContent>

                        {/* Settings Tab */}
                        <TabsContent value="settings" className="space-y-6">
                            <Card className="p-4">
                                <h3 className="font-semibold mb-4">Logo & Briefkopf</h3>
                                <LogoUploader
                                    logoUrl={templateData.logo_url}
                                    onLogoChange={(url) => setTemplateData({...templateData, logo_url: url})}
                                />
                            </Card>

                            <Card className="p-4">
                                <h3 className="font-semibold mb-4">Seitenformat & Ränder</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Format</Label>
                                        <Select
                                            value={templateData.page_format}
                                            onValueChange={(value) => setTemplateData({...templateData, page_format: value})}
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
                                </div>
                                <div className="grid grid-cols-4 gap-4 mt-4">
                                    <div>
                                        <Label>Oben</Label>
                                        <Input
                                            value={templateData.margins?.top || '20mm'}
                                            onChange={(e) => setTemplateData({
                                                ...templateData,
                                                margins: {...templateData.margins, top: e.target.value}
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Unten</Label>
                                        <Input
                                            value={templateData.margins?.bottom || '20mm'}
                                            onChange={(e) => setTemplateData({
                                                ...templateData,
                                                margins: {...templateData.margins, bottom: e.target.value}
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Links</Label>
                                        <Input
                                            value={templateData.margins?.left || '20mm'}
                                            onChange={(e) => setTemplateData({
                                                ...templateData,
                                                margins: {...templateData.margins, left: e.target.value}
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Rechts</Label>
                                        <Input
                                            value={templateData.margins?.right || '20mm'}
                                            onChange={(e) => setTemplateData({
                                                ...templateData,
                                                margins: {...templateData.margins, right: e.target.value}
                                            })}
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-4">
                                <h3 className="font-semibold mb-4">Styling</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Schriftart</Label>
                                        <Input
                                            value={templateData.styles?.font_family || 'Arial, sans-serif'}
                                            onChange={(e) => setTemplateData({
                                                ...templateData,
                                                styles: {...templateData.styles, font_family: e.target.value}
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Schriftgröße</Label>
                                        <Input
                                            value={templateData.styles?.font_size || '11pt'}
                                            onChange={(e) => setTemplateData({
                                                ...templateData,
                                                styles: {...templateData.styles, font_size: e.target.value}
                                            })}
                                        />
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Abbrechen
                        </Button>
                        <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Vorschau
                        </Button>
                        <Button onClick={handleSave} disabled={saveMutation.isPending}>
                            <Save className="w-4 h-4 mr-2" />
                            {saveMutation.isPending ? 'Speichert...' : 'Speichern'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <TableBuilder
                open={tableBuilderOpen}
                onOpenChange={setTableBuilderOpen}
                onSave={insertTable}
            />

            <TemplatePreview
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                template={templateData}
            />
        </>
    );
}