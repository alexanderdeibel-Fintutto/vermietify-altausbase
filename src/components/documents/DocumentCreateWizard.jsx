import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft, Check, FileText, Building2, Home, Users, FileSignature } from 'lucide-react';
import { toast } from 'sonner';

const STEPS = [
    { id: 1, title: 'Vorlage auswählen', icon: FileText },
    { id: 2, title: 'Datenquellen', icon: Building2 },
    { id: 3, title: 'Textbausteine', icon: FileSignature },
    { id: 4, title: 'Vorschau', icon: Check }
];

export default function DocumentCreateWizard({ open, onOpenChange }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [dataSources, setDataSources] = useState({});
    const [selectedTextBlocks, setSelectedTextBlocks] = useState([]);
    const [documentName, setDocumentName] = useState('');
    const queryClient = useQueryClient();

    const { data: templates = [] } = useQuery({
        queryKey: ['templates'],
        queryFn: () => base44.entities.Template.list(),
        enabled: open
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list(),
        enabled: open && currentStep >= 2
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list(),
        enabled: open && currentStep >= 2
    });

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list(),
        enabled: open && currentStep >= 2
    });

    const { data: textBlocks = [] } = useQuery({
        queryKey: ['textBlocks'],
        queryFn: () => base44.entities.TextBlock.list(),
        enabled: open && currentStep === 3 && selectedTemplate
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.Document.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            toast.success('Dokument erfolgreich erstellt');
            handleClose();
        }
    });

    const handleClose = () => {
        setCurrentStep(1);
        setSelectedTemplate(null);
        setDataSources({});
        setSelectedTextBlocks([]);
        setDocumentName('');
        onOpenChange(false);
    };

    const handleNext = () => {
        if (currentStep === 1 && !selectedTemplate) {
            toast.error('Bitte wählen Sie eine Vorlage');
            return;
        }
        setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleFinish = () => {
        if (!documentName) {
            toast.error('Bitte geben Sie einen Dokumentennamen ein');
            return;
        }

        const documentData = {
            name: documentName,
            template_id: selectedTemplate.id,
            category: selectedTemplate.category,
            status: 'erstellt',
            content: generateDocumentContent(),
            building_id: dataSources.building,
            unit_id: dataSources.unit,
            contract_id: dataSources.contract,
            tenant_id: dataSources.tenant,
            selected_text_blocks: selectedTextBlocks,
            data_snapshot: {
                ...dataSources,
                created_at: new Date().toISOString()
            }
        };

        createMutation.mutate(documentData);
    };

    const generateDocumentContent = () => {
        let content = selectedTemplate?.content || '';
        
        // Platzhalter ersetzen (vereinfachte Version)
        const buildingData = buildings.find(b => b.id === dataSources.building);
        const tenantData = tenants.find(t => t.id === dataSources.tenant);
        
        if (buildingData) {
            content = content.replace(/{{Gebäude\.Name}}/g, buildingData.name || '');
            content = content.replace(/{{Gebäude\.Adresse}}/g, buildingData.address || '');
            content = content.replace(/{{Gebäude\.Stadt}}/g, buildingData.city || '');
        }
        
        if (tenantData) {
            content = content.replace(/{{Mieter\.Name}}/g, `${tenantData.first_name} ${tenantData.last_name}`);
            content = content.replace(/{{Mieter\.Email}}/g, tenantData.email || '');
        }

        // Textbausteine einfügen
        const selectedBlocks = textBlocks.filter(tb => selectedTextBlocks.includes(tb.id));
        if (selectedBlocks.length > 0) {
            const blocksHtml = selectedBlocks.map(b => b.content).join('<br><br>');
            content = content.replace(/{{TEXTBAUSTEINE}}/g, blocksHtml);
        }

        return content;
    };

    const availableTextBlocks = textBlocks.filter(tb => 
        !tb.usable_in_templates?.length || 
        tb.usable_in_templates.includes(selectedTemplate?.id)
    );

    const progress = (currentStep / STEPS.length) * 100;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Neues Dokument erstellen</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Progress */}
                    <div>
                        <div className="flex justify-between mb-2">
                            {STEPS.map((step, idx) => {
                                const StepIcon = step.icon;
                                const isActive = currentStep === step.id;
                                const isComplete = currentStep > step.id;
                                
                                return (
                                    <div key={step.id} className="flex items-center">
                                        <div className={`flex items-center gap-2 ${isActive ? 'text-emerald-600' : isComplete ? 'text-emerald-500' : 'text-slate-400'}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-emerald-100' : isComplete ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                                                {isComplete ? (
                                                    <Check className="w-4 h-4" />
                                                ) : (
                                                    <StepIcon className="w-4 h-4" />
                                                )}
                                            </div>
                                            <span className="text-sm font-medium hidden md:inline">{step.title}</span>
                                        </div>
                                        {idx < STEPS.length - 1 && (
                                            <ChevronRight className="w-5 h-5 text-slate-300 mx-2" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>

                    {/* Step Content */}
                    <div className="min-h-[400px]">
                        {currentStep === 1 && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-slate-800">Vorlage auswählen</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {templates.map((template) => (
                                        <Card
                                            key={template.id}
                                            className={`p-4 cursor-pointer transition-all ${
                                                selectedTemplate?.id === template.id
                                                    ? 'border-2 border-emerald-500 bg-emerald-50'
                                                    : 'hover:border-emerald-300'
                                            }`}
                                            onClick={() => setSelectedTemplate(template)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <FileText className="w-5 h-5 text-emerald-600 mt-1" />
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-slate-800">{template.name}</h4>
                                                    <Badge variant="outline" className="mt-1">{template.category}</Badge>
                                                    {template.required_data_sources && (
                                                        <p className="text-xs text-slate-500 mt-2">
                                                            Benötigt: {template.required_data_sources.join(', ')}
                                                        </p>
                                                    )}
                                                </div>
                                                {selectedTemplate?.id === template.id && (
                                                    <Check className="w-5 h-5 text-emerald-600" />
                                                )}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                                {templates.length === 0 && (
                                    <div className="text-center py-12 text-slate-500">
                                        Noch keine Vorlagen vorhanden. Erstellen Sie zuerst eine Vorlage im Tab "Vorlagen".
                                    </div>
                                )}
                            </div>
                        )}

                        {currentStep === 2 && selectedTemplate && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-slate-800">Datenquellen festlegen</h3>
                                
                                {selectedTemplate.required_data_sources?.includes('building') && (
                                    <div>
                                        <Label>Gebäude</Label>
                                        <Select
                                            value={dataSources.building || ''}
                                            onValueChange={(value) => setDataSources(prev => ({ ...prev, building: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Gebäude auswählen" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {buildings.map(b => (
                                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {selectedTemplate.required_data_sources?.includes('tenant') && (
                                    <div>
                                        <Label>Mieter</Label>
                                        <Select
                                            value={dataSources.tenant || ''}
                                            onValueChange={(value) => setDataSources(prev => ({ ...prev, tenant: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Mieter auswählen" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {tenants.map(t => (
                                                    <SelectItem key={t.id} value={t.id}>
                                                        {t.first_name} {t.last_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {selectedTemplate.required_data_sources?.includes('contract') && (
                                    <div>
                                        <Label>Mietvertrag</Label>
                                        <Select
                                            value={dataSources.contract || ''}
                                            onValueChange={(value) => setDataSources(prev => ({ ...prev, contract: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Mietvertrag auswählen" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {contracts.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        Vertrag {format(new Date(c.start_date), 'dd.MM.yyyy')}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-slate-800">Textbausteine auswählen (optional)</h3>
                                <div className="space-y-2">
                                    {availableTextBlocks.map((block) => (
                                        <Card key={block.id} className="p-4">
                                            <div className="flex items-start gap-3">
                                                <Checkbox
                                                    checked={selectedTextBlocks.includes(block.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedTextBlocks(prev => [...prev, block.id]);
                                                        } else {
                                                            setSelectedTextBlocks(prev => prev.filter(id => id !== block.id));
                                                        }
                                                    }}
                                                />
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-slate-800">{block.name}</h4>
                                                    <Badge variant="outline" className="mt-1">{block.category}</Badge>
                                                    <div 
                                                        className="text-sm text-slate-600 mt-2 line-clamp-2"
                                                        dangerouslySetInnerHTML={{ __html: block.content }}
                                                    />
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                    {availableTextBlocks.length === 0 && (
                                        <div className="text-center py-12 text-slate-500">
                                            Keine Textbausteine für diese Vorlage verfügbar
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-slate-800">Vorschau und Fertigstellung</h3>
                                
                                <div>
                                    <Label>Dokumentenname</Label>
                                    <Input
                                        value={documentName}
                                        onChange={(e) => setDocumentName(e.target.value)}
                                        placeholder="z.B. Mietvertrag Mustermann 2024"
                                    />
                                </div>

                                <Card className="p-4 bg-slate-50">
                                    <h4 className="font-medium text-slate-800 mb-3">Zusammenfassung</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Vorlage:</span>
                                            <span className="font-medium">{selectedTemplate?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Kategorie:</span>
                                            <span className="font-medium">{selectedTemplate?.category}</span>
                                        </div>
                                        {dataSources.building && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Gebäude:</span>
                                                <span className="font-medium">
                                                    {buildings.find(b => b.id === dataSources.building)?.name}
                                                </span>
                                            </div>
                                        )}
                                        {dataSources.tenant && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Mieter:</span>
                                                <span className="font-medium">
                                                    {(() => {
                                                        const t = tenants.find(t => t.id === dataSources.tenant);
                                                        return t ? `${t.first_name} ${t.last_name}` : '';
                                                    })()}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Textbausteine:</span>
                                            <span className="font-medium">{selectedTextBlocks.length} ausgewählt</span>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-6 max-h-96 overflow-y-auto">
                                    <div 
                                        className="prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: generateDocumentContent() }}
                                    />
                                </Card>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={currentStep === 1 ? handleClose : handleBack}
                        >
                            {currentStep === 1 ? 'Abbrechen' : (
                                <>
                                    <ChevronLeft className="w-4 h-4 mr-2" />
                                    Zurück
                                </>
                            )}
                        </Button>
                        
                        {currentStep < STEPS.length ? (
                            <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700">
                                Weiter
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button 
                                onClick={handleFinish} 
                                className="bg-emerald-600 hover:bg-emerald-700"
                                disabled={createMutation.isPending}
                            >
                                {createMutation.isPending ? 'Erstellt...' : 'Dokument erstellen'}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}