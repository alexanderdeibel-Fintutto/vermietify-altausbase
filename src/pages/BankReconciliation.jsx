import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Landmark, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Sparkles, Settings, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import TransactionCategoryCard from '@/components/banking/TransactionCategoryCard';
import RuleManager from '@/components/banking/RuleManager';

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
    const [applyingRules, setApplyingRules] = useState(false);
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

    const { data: rules = [] } = useQuery({
        queryKey: ['categorization-rules'],
        queryFn: () => base44.entities.CategorizationRule.list('-priority')
    });

    const categorizeMutation = useMutation({
        mutationFn: ({ transactionId, category, paymentId }) => 
            base44.entities.BankTransaction.update(transactionId, {
                is_categorized: true,
                category,
                matched_payment_id: paymentId || null
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
                matched_payment_id: null
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            toast.success('Kategorisierung aufgehoben');
        }
    });

    const applyRules = async () => {
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

        setApplyingRules(true);
        let matched = 0;

        try {
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
                        await categorizeMutation.mutateAsync({
                            transactionId: tx.id,
                            category: rule.target_category,
                            paymentId: null
                        });
                        await base44.entities.CategorizationRule.update(rule.id, {
                            match_count: (rule.match_count || 0) + 1
                        });
                        matched++;
                        break;
                    }
                }
            }

            queryClient.invalidateQueries({ queryKey: ['categorization-rules'] });
            toast.success(`${matched} Transaktionen durch Regeln kategorisiert`);
        } catch (error) {
            console.error('Rule application error:', error);
            toast.error('Fehler beim Anwenden der Regeln');
        } finally {
            setApplyingRules(false);
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

    const uncategorizedTransactions = transactions.filter(t => !t.is_categorized);
    const categorizedTransactions = transactions.filter(t => t.is_categorized);
    const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'partial');

    const totalUncategorized = uncategorizedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalCategorized = categorizedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalIncome = categorizedTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = categorizedTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    if (loadingTransactions || loadingPayments) {
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
                        Regeln verwalten
                    </Button>
                    <Button 
                        onClick={applyRules}
                        disabled={applyingRules || uncategorizedTransactions.length === 0}
                        variant="outline"
                        className="gap-2"
                    >
                        <Zap className="w-4 h-4" />
                        {applyingRules ? 'Wende an...' : 'Regeln anwenden'}
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
                                onCategorize={({ category, paymentId }) => 
                                    categorizeMutation.mutate({ 
                                        transactionId: transaction.id, 
                                        category,
                                        paymentId 
                                    })
                                }
                                tenants={tenants}
                                units={units}
                                buildings={buildings}
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
        </div>
    );
}