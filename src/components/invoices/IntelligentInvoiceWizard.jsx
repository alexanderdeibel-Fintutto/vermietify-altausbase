import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, AlertTriangle, Upload, Sparkles, FileText, Calculator, Check } from 'lucide-react';
import { toast } from 'sonner';

const STEPS = {
    MASTER_DATA: 1,
    BASIC_INFO: 2,
    CATEGORIZATION: 3,
    ADDITIONAL_QUESTIONS: 4,
    VALIDATION: 5
};

export default function IntelligentInvoiceWizard({ open, onOpenChange, buildingId: initialBuildingId }) {
    const [currentStep, setCurrentStep] = useState(STEPS.BASIC_INFO);
    const [masterDataDialog, setMasterDataDialog] = useState(null);
    const [invoiceData, setInvoiceData] = useState({
        building_id: initialBuildingId || '',
        invoice_date: new Date().toISOString().split('T')[0],
        amount: '',
        recipient: '',
        description: '',
        type: 'expense'
    });
    const [suggestedCategory, setSuggestedCategory] = useState(null);
    const [additionalQuestions, setAdditionalQuestions] = useState([]);
    const [additionalAnswers, setAdditionalAnswers] = useState({});
    const [validationResult, setValidationResult] = useState(null);
    
    const queryClient = useQueryClient();

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const { data: taxLibraries = [] } = useQuery({
        queryKey: ['taxLibraries'],
        queryFn: () => base44.entities.BuildingTaxLibrary.list()
    });

    const createInvoiceMutation = useMutation({
        mutationFn: (data) => base44.entities.Invoice.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            toast.success('Beleg erfolgreich gespeichert');
            onOpenChange(false);
            resetWizard();
        }
    });

    useEffect(() => {
        if (open && invoiceData.building_id) {
            checkMasterData();
        }
    }, [open, invoiceData.building_id]);

    const checkMasterData = async () => {
        const building = buildings.find(b => b.id === invoiceData.building_id);
        if (!building) return;

        const missing = [];
        if (!building.owner_legal_form) {
            missing.push({
                field: 'owner_legal_form',
                question: 'Wer ist Eigentümer dieses Gebäudes?',
                options: [
                    { value: 'PRIVATPERSON', label: 'Privatperson' },
                    { value: 'GBR', label: 'Personengesellschaft (GbR/KG)' },
                    { value: 'GMBH', label: 'Kapitalgesellschaft (GmbH)' }
                ],
                required: true
            });
        }
        
        if (!building.account_framework) {
            missing.push({
                field: 'account_framework',
                question: 'Welcher Kontenrahmen wird verwendet?',
                options: [
                    { value: 'SKR03', label: 'SKR03 (Standard)' },
                    { value: 'SKR04', label: 'SKR04' }
                ],
                required: true
            });
        }
        
        if (!building.usage_type) {
            missing.push({
                field: 'usage_type',
                question: 'Wie wird das Gebäude genutzt?',
                options: [
                    { value: 'WOHNUNG', label: 'Wohnvermietung' },
                    { value: 'GEWERBE', label: 'Gewerbevermietung' },
                    { value: 'GEMISCHT', label: 'Gemischt' },
                    { value: 'SELBSTNUTZUNG', label: 'Selbstnutzung' }
                ],
                required: true
            });
        }
        
        if (!building.vat_option_checked) {
            const suggestion = getVatSuggestion(building.owner_legal_form, building.usage_type);
            missing.push({
                field: 'vat_option',
                question: 'Umsatzsteuer-Option?',
                info: suggestion.reasoning,
                hint: suggestion.hint,
                options: [
                    { value: true, label: 'Ja, zur Umsatzsteuer optieren' },
                    { value: false, label: 'Nein, umsatzsteuerfrei' }
                ],
                suggested: suggestion.recommendation,
                required: true
            });
        }

        if (missing.length > 0) {
            setMasterDataDialog(missing);
            setCurrentStep(STEPS.MASTER_DATA);
        }
    };

    const getVatSuggestion = (legalForm, usageType) => {
        if (usageType === 'WOHNUNG') {
            return {
                recommendation: false,
                reasoning: 'Bei reiner Wohnvermietung ist die USt-Option meist nicht sinnvoll',
                hint: '⚠️ 10 Jahre Bindung bei Wohnungen!'
            };
        }
        if (usageType === 'GEWERBE') {
            return {
                recommendation: true,
                reasoning: 'Bei Gewerbevermietung ist die USt-Option meist vorteilhaft',
                hint: 'Vorsteuerabzug aus Investitionen möglich'
            };
        }
        return {
            recommendation: false,
            reasoning: 'Bitte prüfen Sie mit Ihrem Steuerberater',
            hint: null
        };
    };

    const handleMasterDataSave = async () => {
        const building = buildings.find(b => b.id === invoiceData.building_id);
        const updates = { ...additionalAnswers, vat_option_checked: true };
        
        try {
            await base44.entities.Building.update(building.id, updates);
            queryClient.invalidateQueries({ queryKey: ['buildings'] });
            
            // Install tax library using backend function
            const response = await base44.functions.invoke('loadTaxLibrary', {
                building_id: building.id,
                legal_form: updates.owner_legal_form,
                account_framework: updates.account_framework || 'SKR03'
            });
            
            if (!response.data.already_installed) {
                await base44.entities.Building.update(building.id, {
                    tax_library_installed: true
                });
            }
            
            queryClient.invalidateQueries({ queryKey: ['taxLibraries'] });
            toast.success('Stammdaten gespeichert');
            
            setMasterDataDialog(null);
            setCurrentStep(STEPS.BASIC_INFO);
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Fehler beim Speichern');
        }
    };

    const handleCategorize = async () => {
        if (!invoiceData.description || !invoiceData.amount) {
            toast.error('Bitte Beschreibung und Betrag eingeben');
            return;
        }

        const building = buildings.find(b => b.id === invoiceData.building_id);
        
        // Check if tax library is installed
        const library = taxLibraries.find(lib => lib.building_id === building.id);
        if (!library) {
            toast.error('Steuerbibliothek nicht installiert');
            return;
        }
        
        // Use LLM to suggest category from tax library
        try {
            const categories = library.cost_categories.map(c => 
                `${c.id}: ${c.name} (${c.type}) - ${c.description}`
            );

            const prompt = `
Analysiere diese Rechnung und ordne sie der passendsten Kostenkategorie zu:
Beschreibung: "${invoiceData.description}"
Lieferant: "${invoiceData.recipient}"
Betrag: ${invoiceData.amount}€

Verfügbare Kategorien:
${categories.join('\n')}

Gib NUR die Kategorie-ID zurück (z.B. "PERSONAL_LOEHNE"), nichts anderes.
`;

            const response = await base44.integrations.Core.InvokeLLM({
                prompt,
                add_context_from_internet: false
            });

            const categoryId = response.trim().replace(/['"]/g, '');
            const suggested = library.cost_categories.find(c => c.id === categoryId);

            if (suggested) {
                const mapping = library.account_mappings.find(m => m.cost_category_id === suggested.id);
                
                setSuggestedCategory({
                    ...suggested,
                    accountMapping: mapping
                });

                // Generate additional questions
                const questions = generateAdditionalQuestions(suggested, building, invoiceData);
                setAdditionalQuestions(questions);
                
                setCurrentStep(STEPS.CATEGORIZATION);
            } else {
                toast.error('Keine passende Kategorie gefunden');
            }
        } catch (error) {
            console.error('Categorization error:', error);
            toast.error('Kategorisierung fehlgeschlagen');
        }
    };

    const generateAdditionalQuestions = (category, building, invoice) => {
        const questions = [];
        
        // AfA question
        if (category.tax_treatment === 'AFA') {
            questions.push({
                field: 'afa_duration',
                question: 'Über wie viele Jahre soll abgeschrieben werden?',
                type: 'number',
                unit: 'Jahre',
                suggested: category.standard_depreciation_years,
                required: true
            });
        }

        // VAT question
        if (building.vat_option) {
            const likelyGross = invoice.amount % 1.19 < 0.01;
            questions.push({
                field: 'is_gross_amount',
                question: 'Ist der Betrag bereits mit 19% USt?',
                type: 'select',
                options: [
                    { value: true, label: 'Ja, Brutto inkl. 19% USt' },
                    { value: false, label: 'Nein, Netto ohne USt' }
                ],
                suggested: likelyGross,
                info: likelyGross 
                    ? `Dann sind ${(invoice.amount / 1.19 * 0.19).toFixed(2)}€ Vorsteuer abziehbar`
                    : `Dann kommen noch ${(invoice.amount * 0.19).toFixed(2)}€ USt hinzu`
            });
        }

        // 15% rule for private individuals
        if (building.owner_legal_form === 'PRIVATPERSON' && 
            category.type === 'ERHALTUNG' &&
            building.purchase_price) {
            const limit = building.purchase_price * 0.15;
            if (invoice.amount > limit * 0.5) {
                questions.push({
                    field: 'distribution_years',
                    question: '15%-Grenze könnte überschritten sein. Aufwand verteilen?',
                    type: 'select',
                    options: [
                        { value: null, label: 'Nein, sofort absetzen' },
                        { value: 2, label: 'Ja, auf 2 Jahre verteilen' },
                        { value: 3, label: 'Ja, auf 3 Jahre verteilen' },
                        { value: 5, label: 'Ja, auf 5 Jahre verteilen' }
                    ],
                    info: `Bei Erhaltungsaufwand >15% der Anschaffungskosten (${limit.toFixed(2)}€) kann Verteilung sinnvoll sein (§6b EStG)`,
                    suggested: 2
                });
            }
        }

        return questions;
    };

    const handleValidate = () => {
        const validation = {
            critical: [],
            required: [],
            optional: []
        };

        if (!invoiceData.amount || invoiceData.amount <= 0) {
            validation.critical.push('Betrag muss > 0 sein');
        }
        if (!invoiceData.invoice_date) {
            validation.critical.push('Datum fehlt');
        }
        if (!suggestedCategory) {
            validation.critical.push('Kostenkategorie muss gewählt werden');
        }

        if (!invoiceData.recipient) {
            validation.required.push('Lieferant/Empfänger sollte angegeben werden');
        }

        if (suggestedCategory?.requires_additional_info?.includes('Nutzungsdauer') && 
            !additionalAnswers.afa_duration) {
            validation.required.push('Nutzungsdauer fehlt für AfA-Berechnung');
        }

        if (!invoiceData.reference) {
            validation.optional.push('Rechnungsnummer erleichtert Zuordnung');
        }

        setValidationResult({
            valid: validation.critical.length === 0,
            warnings: validation.required.length + validation.optional.length,
            details: validation
        });

        setCurrentStep(STEPS.VALIDATION);
    };

    const handleSave = () => {
        const finalData = {
            ...invoiceData,
            cost_category_id: suggestedCategory?.id,
            ...additionalAnswers,
            validation_status: validationResult.warnings > 0 ? 'missing_optional' : 'complete',
            status: 'pending'
        };

        // Calculate net/vat if needed
        if (additionalAnswers.is_gross_amount) {
            finalData.amount_net = parseFloat(invoiceData.amount) / 1.19;
            finalData.amount_vat = finalData.amount_net * 0.19;
            finalData.vat_rate = 19;
        } else if (additionalAnswers.is_gross_amount === false) {
            finalData.amount_net = parseFloat(invoiceData.amount);
            finalData.amount_vat = finalData.amount_net * 0.19;
            finalData.vat_rate = 19;
            finalData.amount = finalData.amount_net + finalData.amount_vat;
        }

        createInvoiceMutation.mutate(finalData);
    };

    const resetWizard = () => {
        setCurrentStep(STEPS.BASIC_INFO);
        setInvoiceData({
            building_id: initialBuildingId || '',
            invoice_date: new Date().toISOString().split('T')[0],
            amount: '',
            recipient: '',
            description: '',
            type: 'expense'
        });
        setSuggestedCategory(null);
        setAdditionalQuestions([]);
        setAdditionalAnswers({});
        setValidationResult(null);
    };

    const progress = (currentStep / Object.keys(STEPS).length) * 100;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        Intelligente Belegerfassung
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <Progress value={progress} />

                    {/* Master Data Dialog */}
                    {currentStep === STEPS.MASTER_DATA && masterDataDialog && (
                        <div className="space-y-4">
                            <Card className="p-4 bg-blue-50 border-blue-200">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-blue-900">Stammdaten vervollständigen</h4>
                                        <p className="text-sm text-blue-700">
                                            Für die erste Belegerfassung benötigen wir noch einige Informationen
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            {masterDataDialog.map((q, idx) => (
                                <div key={idx} className="space-y-2">
                                    <Label className="text-base font-semibold">{q.question}</Label>
                                    {q.info && <p className="text-sm text-slate-600">{q.info}</p>}
                                    {q.hint && (
                                        <p className="text-sm text-orange-600 font-medium">{q.hint}</p>
                                    )}
                                    <Select
                                        value={String(additionalAnswers[q.field] ?? '')}
                                        onValueChange={(val) => {
                                            const parsed = val === 'true' ? true : val === 'false' ? false : val;
                                            setAdditionalAnswers(prev => ({
                                                ...prev,
                                                [q.field]: parsed
                                            }));
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Bitte wählen..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {q.options.map(opt => (
                                                <SelectItem key={String(opt.value)} value={String(opt.value)}>
                                                    {opt.label}
                                                    {q.suggested === opt.value && ' ⭐ Empfohlen'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}

                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => onOpenChange(false)}>
                                    Abbrechen
                                </Button>
                                <Button 
                                    onClick={handleMasterDataSave}
                                    disabled={masterDataDialog.some(q => q.required && !additionalAnswers[q.field])}
                                >
                                    Speichern & Fortfahren
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Basic Info */}
                    {currentStep === STEPS.BASIC_INFO && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Schritt 1: Basisinformationen</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Gebäude</Label>
                                    <Select
                                        value={invoiceData.building_id}
                                        onValueChange={(val) => setInvoiceData(prev => ({
                                            ...prev,
                                            building_id: val
                                        }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Gebäude wählen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {buildings.map(b => (
                                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div>
                                    <Label>Datum</Label>
                                    <Input
                                        type="date"
                                        value={invoiceData.invoice_date}
                                        onChange={(e) => setInvoiceData(prev => ({
                                            ...prev,
                                            invoice_date: e.target.value
                                        }))}
                                    />
                                </div>

                                <div>
                                    <Label>Lieferant/Empfänger</Label>
                                    <Input
                                        placeholder="z.B. Heizungsbau Schmidt"
                                        value={invoiceData.recipient}
                                        onChange={(e) => setInvoiceData(prev => ({
                                            ...prev,
                                            recipient: e.target.value
                                        }))}
                                    />
                                </div>

                                <div>
                                    <Label>Betrag (€)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={invoiceData.amount}
                                        onChange={(e) => setInvoiceData(prev => ({
                                            ...prev,
                                            amount: e.target.value
                                        }))}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Beschreibung/Verwendungszweck</Label>
                                <Textarea
                                    placeholder="z.B. Wartung Heizung, Austausch Thermostat"
                                    value={invoiceData.description}
                                    onChange={(e) => setInvoiceData(prev => ({
                                        ...prev,
                                        description: e.target.value
                                    }))}
                                    rows={3}
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => onOpenChange(false)}>
                                    Abbrechen
                                </Button>
                                <Button 
                                    onClick={handleCategorize}
                                    disabled={!invoiceData.building_id || !invoiceData.amount || !invoiceData.description}
                                >
                                    Weiter zur Kategorisierung
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Categorization */}
                    {currentStep === STEPS.CATEGORIZATION && suggestedCategory && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Schritt 2: Kategorisierung</h3>
                            
                            <Card className="p-4 bg-emerald-50 border-emerald-200">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-emerald-900">Vorgeschlagene Kategorie</h4>
                                        <p className="text-lg font-bold text-emerald-800 mt-1">
                                            {suggestedCategory.name}
                                        </p>
                                        <p className="text-sm text-emerald-700">
                                            {suggestedCategory.type} • {suggestedCategory.tax_treatment}
                                        </p>
                                        {suggestedCategory.accountMapping && (
                                            <div className="mt-2 text-sm text-slate-600">
                                                <strong>Konto:</strong> {suggestedCategory.accountMapping.account_number} - {suggestedCategory.accountMapping.account_name}
                                                <br />
                                                <strong>Steuerformular:</strong> {suggestedCategory.accountMapping.tax_line}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>

                            {additionalQuestions.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="font-semibold">Zusatzfragen</h4>
                                    {additionalQuestions.map((q, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <Label>{q.question}</Label>
                                            {q.info && <p className="text-sm text-slate-600">{q.info}</p>}
                                            
                                            {q.type === 'number' && (
                                                <div className="flex gap-2 items-center">
                                                    <Input
                                                        type="number"
                                                        value={additionalAnswers[q.field] || q.suggested || ''}
                                                        onChange={(e) => setAdditionalAnswers(prev => ({
                                                            ...prev,
                                                            [q.field]: parseFloat(e.target.value)
                                                        }))}
                                                        className="w-32"
                                                    />
                                                    <span className="text-sm text-slate-600">{q.unit}</span>
                                                </div>
                                            )}

                                            {q.type === 'select' && (
                                                <Select
                                                    value={String(additionalAnswers[q.field] ?? q.suggested ?? '')}
                                                    onValueChange={(val) => {
                                                        const parsed = val === 'true' ? true : val === 'false' ? false : val === 'null' ? null : val;
                                                        setAdditionalAnswers(prev => ({
                                                            ...prev,
                                                            [q.field]: parsed
                                                        }));
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {q.options.map(opt => (
                                                            <SelectItem key={String(opt.value)} value={String(opt.value)}>
                                                                {opt.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-between">
                                <Button variant="outline" onClick={() => setCurrentStep(STEPS.BASIC_INFO)}>
                                    Zurück
                                </Button>
                                <Button onClick={handleValidate}>
                                    Zur Prüfung
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Validation */}
                    {currentStep === STEPS.VALIDATION && validationResult && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Schritt 3: Prüfung</h3>
                            
                            {validationResult.valid && validationResult.warnings === 0 && (
                                <Card className="p-4 bg-emerald-50 border-emerald-200">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                                        <span className="font-semibold text-emerald-900">
                                            Alle Pflichtfelder vorhanden
                                        </span>
                                    </div>
                                </Card>
                            )}

                            {validationResult.details.critical.length > 0 && (
                                <Card className="p-4 bg-red-50 border-red-200">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-red-900">Kritische Fehler</h4>
                                            <ul className="mt-2 space-y-1">
                                                {validationResult.details.critical.map((err, idx) => (
                                                    <li key={idx} className="text-sm text-red-700">• {err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {validationResult.details.required.length > 0 && (
                                <Card className="p-4 bg-yellow-50 border-yellow-200">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-yellow-900">Empfohlene Felder fehlen</h4>
                                            <ul className="mt-2 space-y-1">
                                                {validationResult.details.required.map((err, idx) => (
                                                    <li key={idx} className="text-sm text-yellow-700">• {err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {validationResult.details.optional.length > 0 && (
                                <Card className="p-4 bg-slate-50 border-slate-200">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-5 h-5 text-slate-500 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-slate-900">Optionale Felder</h4>
                                            <ul className="mt-2 space-y-1">
                                                {validationResult.details.optional.map((err, idx) => (
                                                    <li key={idx} className="text-sm text-slate-600">• {err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            <div className="flex justify-between">
                                <Button variant="outline" onClick={() => setCurrentStep(STEPS.CATEGORIZATION)}>
                                    Zurück
                                </Button>
                                <Button 
                                    onClick={handleSave}
                                    disabled={!validationResult.valid || createInvoiceMutation.isPending}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    {createInvoiceMutation.isPending ? 'Speichert...' : '✓ Beleg speichern'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}