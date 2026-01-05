import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Copy, Code } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomCategoryManager({ buildingId }) {
    const [formOpen, setFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [codeGenOpen, setCodeGenOpen] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');
    const queryClient = useQueryClient();

    const { data: customCategories = [] } = useQuery({
        queryKey: ['customCategories', buildingId],
        queryFn: () => base44.entities.CustomCostCategory.filter({ 
            building_id: buildingId,
            is_active: true 
        })
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.CustomCostCategory.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customCategories'] });
            queryClient.invalidateQueries({ queryKey: ['taxLibraries'] });
            toast.success('Kategorie erstellt');
            setFormOpen(false);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.CustomCostCategory.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customCategories'] });
            queryClient.invalidateQueries({ queryKey: ['taxLibraries'] });
            toast.success('Kategorie aktualisiert');
            setFormOpen(false);
            setEditingCategory(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.CustomCostCategory.update(id, { is_active: false }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customCategories'] });
            toast.success('Kategorie gelöscht');
        }
    });

    const generateCode = (cat) => {
        const code = `// Füge dies in loadTaxLibrary.js ein:

// In COST_CATEGORIES Array:
{
  name: "${cat.name}",
  name_short: "${cat.name_short}",
  description: "${cat.description}",
  category_type: "${cat.category_type}",
  applicable_for_legal_form: ${JSON.stringify(cat.applicable_for_legal_form)},
  applicable_for_usage: ${JSON.stringify(cat.applicable_for_usage)},
  tax_treatment: "${cat.tax_treatment}",
  default_afa_duration: ${cat.default_afa_duration || 'null'},
  allocatable: ${cat.allocatable},
  requires_additional_info: ${JSON.stringify(cat.requires_additional_info || [])}
}

// In COST_TAX_LINKS Array:
{
  cost_name: "${cat.name}",
  tax_line_privatperson: "${cat.tax_line_privatperson || 'Zeile 33'}",
  tax_line_gmbh: "${cat.tax_line_gmbh || 'Position 5a'}",
  tax_line_gbr: "${cat.tax_line_gbr || 'Zeile 20'}",
  condition: null
}

// SKR03/04 Konten:
PRIVATPERSON SKR03: ${cat.skr03_privatperson}
PRIVATPERSON SKR04: ${cat.skr04_privatperson}
GBR SKR03: ${cat.skr03_gbr}
GBR SKR04: ${cat.skr04_gbr}
GMBH SKR03: ${cat.skr03_gmbh}
GMBH SKR04: ${cat.skr04_gmbh}`;

        setGeneratedCode(code);
        setCodeGenOpen(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Eigene Kostenkategorien</h3>
                <Button onClick={() => setFormOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Neue Kategorie
                </Button>
            </div>

            <div className="grid gap-4">
                {customCategories.map(cat => (
                    <Card key={cat.id} className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold">{cat.name}</h4>
                                <p className="text-sm text-slate-600">{cat.description}</p>
                                <div className="flex gap-2 mt-2">
                                    <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                                        {cat.category_type}
                                    </span>
                                    <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                                        {cat.tax_treatment}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => generateCode(cat)}
                                >
                                    <Code className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setEditingCategory(cat);
                                        setFormOpen(true);
                                    }}
                                >
                                    <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        if (confirm('Kategorie wirklich löschen?')) {
                                            deleteMutation.mutate(cat.id);
                                        }
                                    }}
                                >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}

                {customCategories.length === 0 && (
                    <Card className="p-8 text-center text-slate-500">
                        Noch keine eigenen Kategorien erstellt
                    </Card>
                )}
            </div>

            <CategoryForm
                open={formOpen}
                onOpenChange={setFormOpen}
                buildingId={buildingId}
                category={editingCategory}
                onSave={(data) => {
                    if (editingCategory) {
                        updateMutation.mutate({ id: editingCategory.id, data });
                    } else {
                        createMutation.mutate(data);
                    }
                }}
            />

            <Dialog open={codeGenOpen} onOpenChange={setCodeGenOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Code für loadTaxLibrary.js</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">
                            Kopiere diesen Code und füge ihn in <code>functions/loadTaxLibrary.js</code> ein:
                        </p>
                        <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
                            <pre className="text-xs">{generatedCode}</pre>
                        </div>
                        <Button
                            onClick={() => {
                                navigator.clipboard.writeText(generatedCode);
                                toast.success('Code kopiert');
                            }}
                            className="w-full"
                        >
                            <Copy className="w-4 h-4 mr-2" />
                            In Zwischenablage kopieren
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function CategoryForm({ open, onOpenChange, buildingId, category, onSave }) {
    const [formData, setFormData] = useState({
        building_id: buildingId,
        name: '',
        name_short: '',
        description: '',
        category_type: 'ERHALTUNG',
        applicable_for_legal_form: ['ALLE'],
        applicable_for_usage: ['ALLE'],
        tax_treatment: 'SOFORT',
        default_afa_duration: null,
        allocatable: false,
        requires_additional_info: [],
        skr03_privatperson: '4120',
        skr04_privatperson: '6340',
        skr03_gbr: '4120',
        skr04_gbr: '6340',
        skr03_gmbh: '4120',
        skr04_gmbh: '6340',
        tax_line_privatperson: 'Zeile 33',
        tax_line_gbr: 'Zeile 20',
        tax_line_gmbh: 'Position 5a',
        is_active: true
    });

    React.useEffect(() => {
        if (category) {
            setFormData(category);
        } else {
            setFormData({
                building_id: buildingId,
                name: '',
                name_short: '',
                description: '',
                category_type: 'ERHALTUNG',
                applicable_for_legal_form: ['ALLE'],
                applicable_for_usage: ['ALLE'],
                tax_treatment: 'SOFORT',
                default_afa_duration: null,
                allocatable: false,
                requires_additional_info: [],
                skr03_privatperson: '4120',
                skr04_privatperson: '6340',
                skr03_gbr: '4120',
                skr04_gbr: '6340',
                skr03_gmbh: '4120',
                skr04_gmbh: '6340',
                tax_line_privatperson: 'Zeile 33',
                tax_line_gbr: 'Zeile 20',
                tax_line_gmbh: 'Position 5a',
                is_active: true
            });
        }
    }, [category, buildingId, open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {category ? 'Kategorie bearbeiten' : 'Neue Kategorie erstellen'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Name</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="z.B. Wallbox-Installation"
                            />
                        </div>
                        <div>
                            <Label>Kurzbezeichnung</Label>
                            <Input
                                value={formData.name_short}
                                onChange={(e) => setFormData({ ...formData, name_short: e.target.value })}
                                placeholder="z.B. Wallbox"
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Beschreibung</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Kurze Beschreibung der Kostenkategorie"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label>Kategorie-Typ</Label>
                            <Select
                                value={formData.category_type}
                                onValueChange={(val) => setFormData({ ...formData, category_type: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ERHALTUNG">Erhaltung</SelectItem>
                                    <SelectItem value="HERSTELLUNG">Herstellung</SelectItem>
                                    <SelectItem value="BETRIEB">Betrieb</SelectItem>
                                    <SelectItem value="FINANZIERUNG">Finanzierung</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Steuerliche Behandlung</Label>
                            <Select
                                value={formData.tax_treatment}
                                onValueChange={(val) => setFormData({ ...formData, tax_treatment: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SOFORT">Sofort absetzbar</SelectItem>
                                    <SelectItem value="AFA">AfA (Abschreibung)</SelectItem>
                                    <SelectItem value="VERTEILT">Verteilt (§6b)</SelectItem>
                                    <SelectItem value="NICHT_ABSETZBAR">Nicht absetzbar</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.tax_treatment === 'AFA' && (
                            <div>
                                <Label>AfA-Dauer (Jahre)</Label>
                                <Input
                                    type="number"
                                    value={formData.default_afa_duration || ''}
                                    onChange={(e) => setFormData({ ...formData, default_afa_duration: parseInt(e.target.value) })}
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-base font-semibold">SKR03 Konten</Label>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label className="text-sm">Privatperson</Label>
                                <Input
                                    value={formData.skr03_privatperson}
                                    onChange={(e) => setFormData({ ...formData, skr03_privatperson: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-sm">GbR</Label>
                                <Input
                                    value={formData.skr03_gbr}
                                    onChange={(e) => setFormData({ ...formData, skr03_gbr: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-sm">GmbH</Label>
                                <Input
                                    value={formData.skr03_gmbh}
                                    onChange={(e) => setFormData({ ...formData, skr03_gmbh: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-base font-semibold">SKR04 Konten</Label>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label className="text-sm">Privatperson</Label>
                                <Input
                                    value={formData.skr04_privatperson}
                                    onChange={(e) => setFormData({ ...formData, skr04_privatperson: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-sm">GbR</Label>
                                <Input
                                    value={formData.skr04_gbr}
                                    onChange={(e) => setFormData({ ...formData, skr04_gbr: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-sm">GmbH</Label>
                                <Input
                                    value={formData.skr04_gmbh}
                                    onChange={(e) => setFormData({ ...formData, skr04_gmbh: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Abbrechen
                        </Button>
                        <Button
                            onClick={() => onSave(formData)}
                            disabled={!formData.name || !formData.category_type}
                        >
                            Speichern
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}