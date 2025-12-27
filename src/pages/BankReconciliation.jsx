import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Landmark, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Sparkles, Settings, Zap, Filter, X, Search } from 'lucide-react';
import { parseISO, parse } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import TransactionCategoryCard from '@/components/banking/TransactionCategoryCard';
import RuleManager from '@/components/banking/RuleManager';
import RulePreviewDialog from '@/components/banking/RulePreviewDialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";

const CATEGORY_LABELS = {
    rent_income: 'Mieteinnahmen',
    other_income: 'Sonstige Einnahmen',
    personnel_wages: 'Löhne und Gehälter',
    personnel_social: 'Soziale Aufwendungen',
    room_utilities: 'Gas, Strom, Wasser',
    room_other: 'Sonstige Raumkosten',
    tax_insurance: 'Steuern, Versicherungen, Beiträge',
    marketing_travel: 'Werbe- und Reisekosten',
    maintenance: 'Instandhaltung und Werkzeuge',
    depreciation_assets: 'Abschreibungen Anlagevermögen',
    depreciation_minor: 'Abschreibungen geringwertige Güter',
    other_costs: 'Verschiedene Kosten'
};

const INCOME_CATEGORIES = ['rent_income', 'other_income'];
const EXPENSE_CATEGORIES = [
    'personnel_wages', 'personnel_social', 'room_utilities', 'room_other',
    'tax_insurance', 'marketing_travel', 'maintenance', 
    'depreciation_assets', 'depreciation_minor', 'other_costs'
];

export default function BankReconciliation() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [rulesOpen, setRulesOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [ruleSuggestions, setRuleSuggestions] = useState([]);
    const [filters, setFilters] = useState({
        search: '',
        selectedUnits: [],
        selectedTenants: [],
        amountMin: '',
        amountMax: '',
        dateFrom: '',
        dateTo: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const queryClient = useQueryClient();

    const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
        queryKey: ['bank-transactions'],
        queryFn: () => base44.entities.BankTransaction.list('-transaction_date')
    });

    const { data: payments = [], isLoading: loadingPayments } = useQuery({
        queryKey: ['payments'],
        queryFn: () => base44.entities.Payment.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const { data: contracts = [], isLoading: loadingContracts } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: rules = [] } = useQuery({
        queryKey: ['categorization-rules'],
        queryFn: () => base44.entities.CategorizationRule.list('-priority')
    });

    const categorizeMutation = useMutation({
        mutationFn: ({ transactionId, category, paymentId, unitId, contractId }) => 
            base44.entities.BankTransaction.update(transactionId, {
                is_categorized: true,
                category,
                matched_payment_id: paymentId || null,
                unit_id: unitId || null,
                contract_id: contractId || null
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
            if (categorizeMutation.variables.paymentId) {
                queryClient.invalidateQueries({ queryKey: ['payments'] });
            }
            toast.success('Transaktion kategorisiert');
        }
    });

    const uncategorizeMutation = useMutation({
        mutationFn: (transactionId) => 
            base44.entities.BankTransaction.update(transactionId, {
                is_categorized: false,
                category: null,
                matched_payment_id: null,
                unit_id: null,
                contract_id: null
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            toast.success('Kategorisierung aufgehoben');
        }
    });

    const previewRuleApplication = async () => {
        const uncategorizedTxs = transactions.filter(t => !t.is_categorized);
        const activeRules = rules.filter(r => r.is_active && r.auto_apply);
        
        if (uncategorizedTxs.length === 0) {
            toast.info('Alle Transaktionen sind bereits kategorisiert');
            return;
        }
        
        if (activeRules.length === 0) {
            toast.info('Keine aktiven Regeln definiert');
            return;
        }

        const suggestions = [];

        for (const tx of uncategorizedTxs) {
            for (const rule of activeRules) {
                const conditions = rule.conditions || {};
                let matches = true;

                if (conditions.sender_receiver_contains && 
                    !tx.sender_receiver?.toLowerCase().includes(conditions.sender_receiver_contains.toLowerCase())) {
                    matches = false;
                }
                if (conditions.description_contains && 
                    !tx.description?.toLowerCase().includes(conditions.description_contains.toLowerCase())) {
                    matches = false;
                }
                if (conditions.reference_contains && 
                    !tx.reference?.toLowerCase().includes(conditions.reference_contains.toLowerCase())) {
                    matches = false;
                }
                if (conditions.iban_contains && 
                    !tx.iban?.toLowerCase().includes(conditions.iban_contains.toLowerCase())) {
                    matches = false;
                }
                if (conditions.amount_min !== undefined && tx.amount < conditions.amount_min) {
                    matches = false;
                }
                if (conditions.amount_max !== undefined && tx.amount > conditions.amount_max) {
                    matches = false;
                }
                if (conditions.is_income !== undefined && (tx.amount > 0) !== conditions.is_income) {
                    matches = false;
                }

                if (matches) {
                    suggestions.push({
                        transaction: tx,
                        category: rule.target_category,
                        rule: rule
                    });
                    break;
                }
            }
        }

        if (suggestions.length === 0) {
            toast.info('Keine passenden Transaktionen für bestehende Regeln gefunden');
            return;
        }

        setRuleSuggestions(suggestions);
        setPreviewOpen(true);
    };

    const confirmRuleSuggestions = async (confirmedSuggestions) => {
        try {
            for (const suggestion of confirmedSuggestions) {
                await categorizeMutation.mutateAsync({
                    transactionId: suggestion.transaction.id,
                    category: suggestion.category,
                    paymentId: null
                });
                
                // Update rule match count
                await base44.entities.CategorizationRule.update(suggestion.rule.id, {
                    match_count: (suggestion.rule.match_count || 0) + 1
                });
            }

            queryClient.invalidateQueries({ queryKey: ['categorization-rules'] });
            toast.success(`${confirmedSuggestions.length} Transaktionen kategorisiert`);
            setPreviewOpen(false);
        } catch (error) {
            console.error('Rule application error:', error);
            toast.error('Fehler beim Kategorisieren');
        }
    };

    const handleAIAnalysis = async () => {
        const uncategorizedTxs = transactions.filter(t => !t.is_categorized);
        
        if (uncategorizedTxs.length === 0) {
            toast.info('Alle Transaktionen sind bereits kategorisiert');
            return;
        }

        setIsAnalyzing(true);
        try {
            const txsToAnalyze = uncategorizedTxs.slice(0, 20);
            
            // Get historical categorizations for learning
            const historicalTxs = transactions
                .filter(t => t.is_categorized && t.category)
                .slice(0, 50);
            
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `Analysiere diese Banktransaktionen und ordne sie den passenden Kategorien zu.

WICHTIG: Lerne aus den historischen Kategorisierungen und wende ähnliche Muster an!

Historische Kategorisierungen (bereits vom Nutzer bestätigt):
${JSON.stringify(historicalTxs.map(t => ({
    sender: t.sender_receiver,
    description: t.description,
    amount: t.amount,
    category: t.category
})), null, 2)}

Zu analysierende Transaktionen:

Verfügbare Kategorien für EINNAHMEN (amount > 0):
- rent_income: Mieteinnahmen (Mietzahlungen von Mietern)
- other_income: Sonstige Einnahmen

Verfügbare Kategorien für AUSGABEN (amount < 0):
- personnel_wages: Löhne und Gehälter
- personnel_social: Gesetzliche soziale Aufwendungen
- room_utilities: Gas, Strom und Wasser
- room_other: Sonstige Raumkosten
- tax_insurance: Steuern, Versicherungen und Beiträge
- marketing_travel: Werbe- und Reisekosten
- maintenance: Instandhaltung und Werkzeuge
- depreciation_assets: Abschreibungen auf Anlagevermögen
- depreciation_minor: Abschreibungen auf geringwertige Anlagegüter
- other_costs: Verschiedene Kosten

Transaktionen:
${JSON.stringify(txsToAnalyze.map(t => ({
    id: t.id,
    date: t.transaction_date,
    amount: t.amount,
    description: t.description,
    sender_receiver: t.sender_receiver,
    reference: t.reference
})), null, 2)}

Mieter (für rent_income):
${JSON.stringify(tenants.map(t => ({ id: t.id, name: `${t.first_name} ${t.last_name}` })), null, 2)}

Offene Zahlungen (für rent_income):
${JSON.stringify(payments.filter(p => p.status === 'pending' || p.status === 'partial').map(p => ({
    id: p.id,
    tenant_id: p.tenant_id,
    amount: p.expected_amount,
    month: p.payment_month
})), null, 2)}`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        suggestions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    transaction_id: { type: "string" },
                                    category: { type: "string" },
                                    payment_id: { type: "string" },
                                    confidence: { type: "number" },
                                    reason: { type: "string" }
                                },
                                required: ["transaction_id", "category", "confidence", "reason"]
                            }
                        }
                    }
                }
            });

            // Auto-apply high confidence suggestions
            let applied = 0;
            for (const suggestion of response.suggestions || []) {
                if (suggestion.confidence >= 80) {
                    await categorizeMutation.mutateAsync({
                        transactionId: suggestion.transaction_id,
                        category: suggestion.category,
                        paymentId: suggestion.payment_id
                    });
                    applied++;
                }
            }

            toast.success(`${applied} Transaktionen automatisch kategorisiert`);
        } catch (error) {
            console.error('AI analysis error:', error);
            toast.error('KI-Analyse fehlgeschlagen');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Apply filters
    const applyFilters = (txList) => {
        return txList.filter(tx => {
            // Search filter (sender, description, reference, IBAN)
            if (filters.search) {
                const search = filters.search.toLowerCase();
                const matchesSearch = 
                    tx.sender_receiver?.toLowerCase().includes(search) ||
                    tx.description?.toLowerCase().includes(search) ||
                    tx.reference?.toLowerCase().includes(search) ||
                    tx.iban?.toLowerCase().includes(search);
                if (!matchesSearch) return false;
            }

            // Amount range filter
            if (filters.amountMin !== '' && Math.abs(tx.amount) < parseFloat(filters.amountMin)) {
                return false;
            }
            if (filters.amountMax !== '' && Math.abs(tx.amount) > parseFloat(filters.amountMax)) {
                return false;
            }

            // Date range filter
            if (filters.dateFrom && tx.transaction_date < filters.dateFrom) {
                return false;
            }
            if (filters.dateTo && tx.transaction_date > filters.dateTo) {
                return false;
            }

            // Unit filter
            if (filters.selectedUnits.length > 0) {
                const payment = payments.find(p => p.id === tx.matched_payment_id);
                if (!payment || !filters.selectedUnits.includes(payment.unit_id)) {
                    return false;
                }
            }

            // Tenant filter
            if (filters.selectedTenants.length > 0) {
                const payment = payments.find(p => p.id === tx.matched_payment_id);
                if (!payment || !filters.selectedTenants.includes(payment.tenant_id)) {
                    return false;
                }
            }

            return true;
        });
    };

    const parseDateSafely = (dateStr) => {
        if (!dateStr) return new Date(0);
        try {
            // Versuche ISO-Format (YYYY-MM-DD)
            if (dateStr.includes('-')) {
                return parseISO(dateStr);
            }
            // Versuche deutsches Format (DD.MM.YYYY)
            if (dateStr.includes('.')) {
                return parse(dateStr, 'dd.MM.yyyy', new Date());
            }
            return new Date(dateStr);
        } catch {
            return new Date(0);
        }
    };

    const uncategorizedTransactions = applyFilters(transactions.filter(t => !t.is_categorized))
        .sort((a, b) => parseDateSafely(b.transaction_date).getTime() - parseDateSafely(a.transaction_date).getTime());
    
    const categorizedTransactions = applyFilters(transactions.filter(t => t.is_categorized))
        .sort((a, b) => parseDateSafely(b.transaction_date).getTime() - parseDateSafely(a.transaction_date).getTime());
    const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'partial');

    const totalUncategorized = uncategorizedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalCategorized = categorizedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalIncome = categorizedTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = categorizedTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    if (loadingTransactions || loadingPayments || loadingContracts) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">
                        Bankenabgleich
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Kategorisieren Sie Ihre Transaktionen
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        onClick={() => setRulesOpen(true)}
                        variant="outline"
                        className="gap-2"
                    >
                        <Settings className="w-4 h-4" />
                        Regeln
                    </Button>
                    <Button 
                        onClick={previewRuleApplication}
                        disabled={uncategorizedTransactions.length === 0}
                        variant="outline"
                        className="gap-2"
                    >
                        <Zap className="w-4 h-4" />
                        Zuordnungsregeln anwenden
                    </Button>
                    <Button 
                        onClick={handleAIAnalysis}
                        disabled={isAnalyzing || uncategorizedTransactions.length === 0}
                        className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                    >
                        <Sparkles className="w-4 h-4" />
                        {isAnalyzing ? 'Analysiere...' : 'KI-Kategorisierung'}
                    </Button>
                </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 flex-1">
                            <Search className="w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Suche nach Empfänger, Buchungstext, IBAN..."
                                value={filters.search}
                                onChange={(e) => setFilters({...filters, search: e.target.value})}
                                className="flex-1"
                            />
                            {filters.search && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFilters({...filters, search: ''})}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className="ml-3"
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Erweiterte Filter
                        </Button>
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
                            {/* Wohneinheiten */}
                            <div>
                                <Label className="text-xs mb-2">Wohneinheiten</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                                            {filters.selectedUnits.length > 0 
                                                ? `${filters.selectedUnits.length} ausgewählt`
                                                : 'Alle Einheiten'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-0">
                                        <Command>
                                            <CommandInput placeholder="Einheit suchen..." />
                                            <CommandEmpty>Keine Einheiten gefunden</CommandEmpty>
                                            <CommandGroup className="max-h-64 overflow-y-auto">
                                                {units.map(unit => {
                                                    const building = buildings.find(b => b.id === unit.building_id);
                                                    const isSelected = filters.selectedUnits.includes(unit.id);
                                                    return (
                                                        <CommandItem
                                                            key={unit.id}
                                                            onSelect={() => {
                                                                setFilters({
                                                                    ...filters,
                                                                    selectedUnits: isSelected
                                                                        ? filters.selectedUnits.filter(id => id !== unit.id)
                                                                        : [...filters.selectedUnits, unit.id]
                                                                });
                                                            }}
                                                        >
                                                            <div className={`mr-2 h-4 w-4 border rounded ${isSelected ? 'bg-emerald-600' : ''}`} />
                                                            <span className="text-sm">
                                                                {building?.name} - {unit.unit_number}
                                                            </span>
                                                        </CommandItem>
                                                    );
                                                })}
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Mieter */}
                            <div>
                                <Label className="text-xs mb-2">Mieter</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                                            {filters.selectedTenants.length > 0 
                                                ? `${filters.selectedTenants.length} ausgewählt`
                                                : 'Alle Mieter'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-0">
                                        <Command>
                                            <CommandInput placeholder="Mieter suchen..." />
                                            <CommandEmpty>Keine Mieter gefunden</CommandEmpty>
                                            <CommandGroup className="max-h-64 overflow-y-auto">
                                                {tenants.map(tenant => {
                                                    const isSelected = filters.selectedTenants.includes(tenant.id);
                                                    return (
                                                        <CommandItem
                                                            key={tenant.id}
                                                            onSelect={() => {
                                                                setFilters({
                                                                    ...filters,
                                                                    selectedTenants: isSelected
                                                                        ? filters.selectedTenants.filter(id => id !== tenant.id)
                                                                        : [...filters.selectedTenants, tenant.id]
                                                                });
                                                            }}
                                                        >
                                                            <div className={`mr-2 h-4 w-4 border rounded ${isSelected ? 'bg-emerald-600' : ''}`} />
                                                            <span className="text-sm">
                                                                {tenant.first_name} {tenant.last_name}
                                                            </span>
                                                        </CommandItem>
                                                    );
                                                })}
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Betragsspektrum */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs mb-2">Betrag von (€)</Label>
                                    <Input
                                        type="number"
                                        placeholder="Min"
                                        value={filters.amountMin}
                                        onChange={(e) => setFilters({...filters, amountMin: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs mb-2">Betrag bis (€)</Label>
                                    <Input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.amountMax}
                                        onChange={(e) => setFilters({...filters, amountMax: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Zeitraum */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs mb-2">Datum von</Label>
                                    <Input
                                        type="date"
                                        value={filters.dateFrom}
                                        onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs mb-2">Datum bis</Label>
                                    <Input
                                        type="date"
                                        value={filters.dateTo}
                                        onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Reset Button */}
                            <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setFilters({
                                        search: '',
                                        selectedUnits: [],
                                        selectedTenants: [],
                                        amountMin: '',
                                        amountMax: '',
                                        dateFrom: '',
                                        dateTo: ''
                                    })}
                                    className="w-full"
                                >
                                    Filter zurücksetzen
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Active filters display */}
                    {(filters.selectedUnits.length > 0 || filters.selectedTenants.length > 0 || filters.amountMin || filters.amountMax || filters.dateFrom || filters.dateTo) && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                            {filters.selectedUnits.map(unitId => {
                                const unit = units.find(u => u.id === unitId);
                                const building = buildings.find(b => b.id === unit?.building_id);
                                return (
                                    <Badge key={unitId} variant="secondary" className="gap-1">
                                        {building?.name} {unit?.unit_number}
                                        <X 
                                            className="w-3 h-3 cursor-pointer" 
                                            onClick={() => setFilters({
                                                ...filters,
                                                selectedUnits: filters.selectedUnits.filter(id => id !== unitId)
                                            })}
                                        />
                                    </Badge>
                                );
                            })}
                            {filters.selectedTenants.map(tenantId => {
                                const tenant = tenants.find(t => t.id === tenantId);
                                return (
                                    <Badge key={tenantId} variant="secondary" className="gap-1">
                                        {tenant?.first_name} {tenant?.last_name}
                                        <X 
                                            className="w-3 h-3 cursor-pointer" 
                                            onClick={() => setFilters({
                                                ...filters,
                                                selectedTenants: filters.selectedTenants.filter(id => id !== tenantId)
                                            })}
                                        />
                                    </Badge>
                                );
                            })}
                            {(filters.amountMin || filters.amountMax) && (
                                <Badge variant="secondary" className="gap-1">
                                    Betrag: {filters.amountMin || '0'}€ - {filters.amountMax || '∞'}€
                                    <X 
                                        className="w-3 h-3 cursor-pointer" 
                                        onClick={() => setFilters({...filters, amountMin: '', amountMax: ''})}
                                    />
                                </Badge>
                            )}
                            {(filters.dateFrom || filters.dateTo) && (
                                <Badge variant="secondary" className="gap-1">
                                    Zeitraum: {filters.dateFrom || '...'} - {filters.dateTo || '...'}
                                    <X 
                                        className="w-3 h-3 cursor-pointer" 
                                        onClick={() => setFilters({...filters, dateFrom: '', dateTo: ''})}
                                    />
                                </Badge>
                            )}
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Nicht kategorisiert</p>
                            <p className="text-2xl font-bold text-slate-800">
                                {uncategorizedTransactions.length}
                            </p>
                            <p className="text-xs text-slate-400">€{totalUncategorized.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Kategorisiert</p>
                            <p className="text-2xl font-bold text-slate-800">
                                {categorizedTransactions.length}
                            </p>
                            <p className="text-xs text-slate-400">€{totalCategorized.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Einnahmen</p>
                            <p className="text-2xl font-bold text-slate-800">
                                €{totalIncome.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                            <TrendingDown className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Ausgaben</p>
                            <p className="text-2xl font-bold text-slate-800">
                                €{totalExpenses.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="uncategorized" className="space-y-6">
                <TabsList className="bg-white border border-slate-200">
                    <TabsTrigger value="uncategorized">
                        Nicht kategorisiert ({uncategorizedTransactions.length})
                    </TabsTrigger>
                    <TabsTrigger value="categorized">
                        Kategorisiert ({categorizedTransactions.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="uncategorized" className="space-y-4">
                    {uncategorizedTransactions.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">
                                Alle Transaktionen kategorisiert
                            </h3>
                            <p className="text-slate-500">
                                Es gibt keine offenen Transaktionen mehr.
                            </p>
                        </div>
                    ) : (
                        uncategorizedTransactions.map(transaction => (
                            <TransactionCategoryCard
                                key={transaction.id}
                                transaction={transaction}
                                availableCategories={transaction.amount > 0 ? INCOME_CATEGORIES : EXPENSE_CATEGORIES}
                                categoryLabels={CATEGORY_LABELS}
                                availablePayments={transaction.amount > 0 ? pendingPayments : []}
                                onCategorize={({ category, paymentId, unitId, contractId }) => 
                                    categorizeMutation.mutate({ 
                                        transactionId: transaction.id, 
                                        category,
                                        paymentId,
                                        unitId,
                                        contractId
                                    })
                                }
                                tenants={tenants}
                                units={units}
                                buildings={buildings}
                                contracts={contracts}
                            />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="categorized" className="space-y-4">
                    {categorizedTransactions.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                            <Landmark className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">
                                Noch keine kategorisierten Transaktionen
                            </h3>
                            <p className="text-slate-500">
                                Kategorisierte Transaktionen werden hier angezeigt.
                            </p>
                        </div>
                    ) : (
                        categorizedTransactions.map(transaction => (
                            <TransactionCategoryCard
                                key={transaction.id}
                                transaction={transaction}
                                categoryLabels={CATEGORY_LABELS}
                                onUncategorize={() => uncategorizeMutation.mutate(transaction.id)}
                                tenants={tenants}
                                units={units}
                                buildings={buildings}
                                contracts={contracts}
                            />
                        ))
                    )}
                </TabsContent>
            </Tabs>

            <RuleManager 
                categoryLabels={CATEGORY_LABELS}
                open={rulesOpen}
                onOpenChange={setRulesOpen}
            />

            <RulePreviewDialog
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                suggestions={ruleSuggestions}
                availableCategories={[...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]}
                categoryLabels={CATEGORY_LABELS}
                onConfirm={confirmRuleSuggestions}
            />
            </div>
            );
            }