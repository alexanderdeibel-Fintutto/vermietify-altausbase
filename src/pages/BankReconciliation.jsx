import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Landmark, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Sparkles, Settings, Zap, Filter, X, Search, Tag, Check, Building2, User, Calendar, CreditCard } from 'lucide-react';
import { parseISO, parse, format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import TransactionCategoryCard from '@/components/banking/TransactionCategoryCard';
import TransactionAllocationDialog from '@/components/banking/TransactionAllocationDialog';
import RuleManager from '@/components/banking/RuleManager';
import RulePreviewDialog from '@/components/banking/RulePreviewDialog';
import CreateInvoiceFromTransactionDialog from '@/components/banking/CreateInvoiceFromTransactionDialog';
import CreateMultipleInvoicesDialog from '@/components/banking/CreateMultipleInvoicesDialog';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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
        selectedCategories: [],
        categorizationStatus: 'all', // all, categorized, uncategorized
        amountMin: '',
        amountMax: '',
        dateFrom: '',
        dateTo: ''
    });
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [savedFilters, setSavedFilters] = useState([]);
    const [filterName, setFilterName] = useState('');
    const [showSaveFilter, setShowSaveFilter] = useState(false);
    const [selectedTransactions, setSelectedTransactions] = useState([]);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [bulkCategory, setBulkCategory] = useState('');
    const [bulkUnitId, setBulkUnitId] = useState('');
    const [bulkContractId, setBulkContractId] = useState('');
    const [bulkAllocations, setBulkAllocations] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [createInvoiceDialogOpen, setCreateInvoiceDialogOpen] = useState(false);
    const [selectedTransactionForInvoice, setSelectedTransactionForInvoice] = useState(null);
    const [createMultipleInvoicesDialogOpen, setCreateMultipleInvoicesDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
        queryKey: ['bank-transactions'],
        queryFn: () => base44.entities.BankTransaction.list('-transaction_date'),
        staleTime: 30000
    });

    const { data: financialItems = [], isLoading: loadingFinancialItems } = useQuery({
        queryKey: ['financial-items'],
        queryFn: () => base44.entities.FinancialItem.list(),
        staleTime: 30000
    });

    const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list(),
        staleTime: 30000
    });

    const { data: tenants = [], isLoading: loadingTenants } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list(),
        staleTime: 60000
    });

    const { data: units = [], isLoading: loadingUnits } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list(),
        staleTime: 60000
    });

    const { data: buildings = [], isLoading: loadingBuildings } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list(),
        staleTime: 60000
    });

    const { data: contracts = [], isLoading: loadingContracts } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list(),
        staleTime: 60000
    });

    const { data: rules = [] } = useQuery({
        queryKey: ['categorization-rules'],
        queryFn: () => base44.entities.CategorizationRule.list('-priority'),
        staleTime: 60000
    });

    const { data: costTypes = [], isLoading: loadingCostTypes } = useQuery({
        queryKey: ['cost-types'],
        queryFn: () => base44.entities.CostType.list(),
        staleTime: 60000
    });

    // Debounce search input
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(filters.search);
        }, 300);
        return () => clearTimeout(timer);
    }, [filters.search]);

    // Load saved filters from localStorage
    React.useEffect(() => {
        try {
            const saved = localStorage.getItem('transaction_filters');
            if (saved) {
                setSavedFilters(JSON.parse(saved));
            }
        } catch (error) {
            console.warn('Could not load saved filters:', error);
        }
    }, []);

    // Reset to page 1 when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, filters.selectedUnits, filters.selectedTenants, filters.selectedCategories, filters.categorizationStatus, filters.amountMin, filters.amountMax, filters.dateFrom, filters.dateTo]);

    const categorizeMutation = useMutation({
        mutationFn: async ({ transactionId, category, financialItemId, unitId, contractId, skipUpdate }) => {
            if (skipUpdate) return; // Already handled by backend function
            
            // Simple categorization without financial item linking
            await base44.entities.BankTransaction.update(transactionId, {
                is_categorized: true,
                category,
                unit_id: unitId || null,
                contract_id: contractId || null
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
            queryClient.invalidateQueries({ queryKey: ['financial-items'] });
        }
    });

    const bulkCategorizeMutation = useMutation({
        mutationFn: async ({ transactionIds, category, unitId, contractId, allocations }) => {
            const result = await base44.functions.invoke('bulkAllocateTransactions', {
                transactionIds,
                category,
                unitId: unitId || null,
                contractId: contractId || null,
                allocations: allocations || []
            });
            
            return result.data;
        },
        onSuccess: async (result) => {
            // Force refetch all related data
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['bank-transactions'] }),
                queryClient.invalidateQueries({ queryKey: ['financial-items'] }),
                queryClient.invalidateQueries({ queryKey: ['financial-item-transaction-links'] })
            ]);

            // Wait for refetch to complete
            await new Promise(resolve => setTimeout(resolve, 500));

            setSelectedTransactions([]);
            setShowBulkActions(false);
            setBulkCategory('');
            setBulkUnitId('');
            setBulkContractId('');
            setBulkAllocations([]);

            if (result.success > 0) {
                toast.success(`${result.success} Transaktionen kategorisiert`);
            }
            if (result.errors > 0) {
                const errorDetails = result.details?.map(d => `${d.error || 'Unbekannt'} (TX: ${d.transactionId || 'N/A'})`).join('; ') || 'Keine Details verfügbar';
                toast.error(`Fehler bei ${result.errors} Transaktionen: ${errorDetails}`, { duration: 10000 });
            }

            console.log('Bulk-Zuordnung Ergebnis:', result);
        },
        onError: (error) => {
            toast.error('SCHWERWIEGENDER FEHLER bei der Bulk-Zuordnung: ' + (error.message || 'Unbekannter Fehler'), { duration: Infinity });
            console.error('Bulk-Zuordnung Fehler:', error);
        }
    });

    const uncategorizeMutation = useMutation({
        mutationFn: async ({ transactionId, skipUpdate }) => {
            if (skipUpdate) return; // Already handled by backend function
            
            // This shouldn't be called anymore, but kept for compatibility
            await base44.entities.BankTransaction.update(transactionId, {
                is_categorized: false,
                category: null,
                unit_id: null,
                contract_id: null
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
            queryClient.invalidateQueries({ queryKey: ['financial-items'] });
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
                    financialItemId: null
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

Offene Forderungen (für rent_income):
${JSON.stringify(financialItems.filter(item => item.type === 'receivable' && (item.status === 'pending' || item.status === 'partial')).map(item => ({
    id: item.id,
    tenant_id: item.related_to_tenant_id,
    amount: item.expected_amount,
    month: item.payment_month
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
                        financialItemId: suggestion.financial_item_id
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

    // Apply filters - memoized for performance
    const applyFilters = useMemo(() => {
        return (txList) => {
            if (debouncedSearch === '' && 
                filters.selectedUnits.length === 0 && 
                filters.selectedTenants.length === 0 &&
                filters.selectedCategories.length === 0 &&
                filters.categorizationStatus === 'all' &&
                filters.amountMin === '' && 
                filters.amountMax === '' &&
                filters.dateFrom === '' && 
                filters.dateTo === '') {
                return txList;
            }

            return txList.filter(tx => {
                // Search filter (sender, description, reference, IBAN)
                if (debouncedSearch) {
                    const search = debouncedSearch.toLowerCase();
                    const matchesSearch = 
                        tx.sender_receiver?.toLowerCase().includes(search) ||
                        tx.description?.toLowerCase().includes(search) ||
                        tx.reference?.toLowerCase().includes(search) ||
                        tx.iban?.toLowerCase().includes(search);
                    if (!matchesSearch) return false;
                }

                // Categorization status filter
                if (filters.categorizationStatus === 'categorized' && !tx.is_categorized) {
                    return false;
                }
                if (filters.categorizationStatus === 'uncategorized' && tx.is_categorized) {
                    return false;
                }

                // Category filter
                if (filters.selectedCategories.length > 0) {
                    if (!tx.category || !filters.selectedCategories.includes(tx.category)) {
                        return false;
                    }
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
                    if (!tx.unit_id || !filters.selectedUnits.includes(tx.unit_id)) {
                        return false;
                    }
                }

                // Tenant filter
                if (filters.selectedTenants.length > 0) {
                    // Find related financial items for this transaction
                    const relatedItem = financialItems.find(item => item.related_to_unit_id === tx.unit_id);
                    if (!relatedItem || !filters.selectedTenants.includes(relatedItem.related_to_tenant_id)) {
                        return false;
                    }
                }

                return true;
            });
        };
    }, [debouncedSearch, filters.selectedUnits, filters.selectedTenants, filters.selectedCategories, filters.categorizationStatus, filters.amountMin, filters.amountMax, filters.dateFrom, filters.dateTo, financialItems]);

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

    const { data: allTransactionLinks = [] } = useQuery({
        queryKey: ['financial-item-transaction-links'],
        queryFn: () => base44.entities.FinancialItemTransactionLink.list(),
        staleTime: 30000
    });

    // Helper to check if transaction has any allocations
    const hasAllocations = (transactionId) => {
        return allTransactionLinks.some(link => link.transaction_id === transactionId);
    };

    const uncategorizedTransactions = useMemo(() => 
        applyFilters(transactions.filter(t => !t.is_categorized))
            .sort((a, b) => parseDateSafely(b.transaction_date).getTime() - parseDateSafely(a.transaction_date).getTime()),
        [transactions, applyFilters]
    );
    
    const categorizedTransactions = useMemo(() =>
        applyFilters(transactions.filter(t => t.is_categorized || hasAllocations(t.id)))
            .sort((a, b) => parseDateSafely(b.transaction_date).getTime() - parseDateSafely(a.transaction_date).getTime()),
        [transactions, applyFilters, allTransactionLinks]
    );

    // Pagination for uncategorized
    const paginatedUncategorized = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return uncategorizedTransactions.slice(start, start + itemsPerPage);
    }, [uncategorizedTransactions, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(uncategorizedTransactions.length / itemsPerPage);

    const pendingFinancialItems = useMemo(() => 
        financialItems.filter(item => item.type === 'receivable' && (item.status === 'pending' || item.status === 'partial' || item.status === 'overdue')),
        [financialItems]
    );

    const totalUncategorized = useMemo(() => 
        uncategorizedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
        [uncategorizedTransactions]
    );

    const totalCategorized = useMemo(() =>
        categorizedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
        [categorizedTransactions]
    );
    
    const totalIncome = useMemo(() =>
        categorizedTransactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0),
        [categorizedTransactions]
    );
    
    const totalExpenses = useMemo(() =>
        categorizedTransactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0),
        [categorizedTransactions]
    );

    const handleBulkCategorize = () => {
        if (!bulkCategory || selectedTransactions.length === 0) return;
        
        const selectedUnit = units.find(u => u.id === bulkUnitId);
        const actualUnitId = selectedUnit ? bulkUnitId : null;
        
        // Prepare allocations: ONE link per financial item, using available transactions
        const preparedAllocations = [];
        const transactionsToAllocate = [...selectedTransactions];
        
        if (bulkAllocations.length > 0) {
            // For each financial item, create ONE link to ONE transaction
            bulkAllocations
                .filter(a => a.financialItemId && parseFloat(a.amount) > 0)
                .forEach(alloc => {
                    const txIdForLink = transactionsToAllocate.shift();
                    
                    if (txIdForLink) {
                        preparedAllocations.push({
                            transactionId: txIdForLink,
                            financialItemId: alloc.financialItemId,
                            linkedAmount: parseFloat(alloc.amount),
                            unitId: actualUnitId,
                            contractId: bulkContractId || null
                        });
                    } else {
                        console.warn(`Keine Transaktions-ID verfügbar für Finanzposition ${alloc.financialItemId}`);
                    }
                });
        }
        
        bulkCategorizeMutation.mutate({
            transactionIds: selectedTransactions,
            category: bulkCategory,
            unitId: actualUnitId,
            contractId: bulkContractId || null,
            allocations: preparedAllocations
        });
    };

    const handleSelectTransaction = (txId) => {
        setSelectedTransactions(prev => 
            prev.includes(txId) 
                ? prev.filter(id => id !== txId)
                : [...prev, txId]
        );
    };

    const handleSelectAll = () => {
        if (selectedTransactions.length === uncategorizedTransactions.length) {
            setSelectedTransactions([]);
        } else {
            setSelectedTransactions(uncategorizedTransactions.map(t => t.id));
        }
    };

    // Helper functions for bulk allocation
    const getTenant = (tenantId) => tenants.find(t => t.id === tenantId);
    const getUnit = (unitId) => units.find(u => u.id === unitId);
    const getBuilding = (buildingId) => buildings.find(b => b.id === buildingId);

    // Smart contract suggestions for bulk allocation
    const bulkSuggestedContracts = useMemo(() => {
        if (bulkCategory !== 'rent_income' || selectedTransactions.length === 0) return [];
        
        const selectedTxs = transactions.filter(t => selectedTransactions.includes(t.id));
        const activeContracts = contracts.filter(c => c.status === 'active');
        
        // Score each contract based on ALL selected transactions
        const scored = activeContracts.map(contract => {
            let score = 0;
            const tenant = getTenant(contract.tenant_id);
            const secondTenant = contract.second_tenant_id ? getTenant(contract.second_tenant_id) : null;
            
            selectedTxs.forEach(tx => {
                // Match sender name with tenant names
                if (tenant && tx.sender_receiver) {
                    const senderLower = tx.sender_receiver.toLowerCase();
                    const firstNameMatch = tenant.first_name?.toLowerCase();
                    const lastNameMatch = tenant.last_name?.toLowerCase();
                    
                    if (firstNameMatch && senderLower.includes(firstNameMatch)) score += 10;
                    if (lastNameMatch && senderLower.includes(lastNameMatch)) score += 10;
                    
                    if (secondTenant) {
                        const secondFirstMatch = secondTenant.first_name?.toLowerCase();
                        const secondLastMatch = secondTenant.last_name?.toLowerCase();
                        if (secondFirstMatch && senderLower.includes(secondFirstMatch)) score += 10;
                        if (secondLastMatch && senderLower.includes(secondLastMatch)) score += 10;
                    }
                }
                
                // Match amount with rent
                if (Math.abs(tx.amount) === contract.total_rent) score += 20;
                else if (Math.abs(Math.abs(tx.amount) - contract.total_rent) < 10) score += 10;
                
                // Match reference with unit
                const unit = getUnit(contract.unit_id);
                if (unit && tx.reference?.includes(unit.unit_number)) score += 15;
            });
            
            return { contract, score };
        });
        
        return scored.sort((a, b) => b.score - a.score).map(s => s.contract);
    }, [bulkCategory, selectedTransactions, transactions, contracts]);

    const filteredBulkContracts = useMemo(() => {
        if (bulkCategory === 'rent_income') {
            if (bulkUnitId) {
                return contracts.filter(c => c.unit_id === bulkUnitId && c.status === 'active');
            }
            return bulkSuggestedContracts;
        }
        return contracts.filter(c => c.status === 'active');
    }, [bulkUnitId, contracts, bulkCategory, bulkSuggestedContracts]);

    // Filter financial items for bulk allocation - only up to current date
    const filteredBulkFinancialItems = useMemo(() => {
        if (bulkCategory === 'rent_income' && bulkContractId) {
            const today = format(new Date(), 'yyyy-MM');
            const items = financialItems.filter(item => 
                item.related_to_contract_id === bulkContractId && 
                (item.status === 'pending' || item.status === 'partial' || item.status === 'overdue') &&
                item.payment_month && item.payment_month <= today
            );
            
            // Sort by payment_month descending (most recent first, but consider transaction dates)
            return items.sort((a, b) => {
                return (b.payment_month || '').localeCompare(a.payment_month || '');
            });
        }
        return [];
    }, [bulkContractId, financialItems, bulkCategory]);

    // Calculate total allocated amount for bulk
    const bulkTransactionAmount = useMemo(() => {
        return transactions
            .filter(t => selectedTransactions.includes(t.id))
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    }, [transactions, selectedTransactions]);

    const bulkTotalAllocated = useMemo(() => {
        return bulkAllocations.reduce((sum, alloc) => sum + (parseFloat(alloc.amount) || 0), 0);
    }, [bulkAllocations]);

    const bulkRemaining = bulkTransactionAmount - bulkTotalAllocated;

    if (loadingTransactions || loadingFinancialItems || loadingInvoices || loadingContracts || loadingTenants || loadingUnits || loadingBuildings || loadingCostTypes) {
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
                        {selectedTransactions.length > 0 
                            ? `${selectedTransactions.length} Transaktionen ausgewählt`
                            : 'Kategorisieren Sie Ihre Transaktionen'}
                    </p>
                </div>
                <div className="flex gap-2">
                    {selectedTransactions.length > 0 && (
                        <>
                            <Button 
                                onClick={() => setShowBulkActions(!showBulkActions)}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Tag className="w-4 h-4 mr-2" />
                                Bulk-Zuordnung ({selectedTransactions.length})
                            </Button>
                            <Button 
                                onClick={() => setCreateMultipleInvoicesDialogOpen(true)}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Mehrere Rechnungen erstellen
                            </Button>
                        </>
                    )}
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

                {/* Bulk Actions */}
                {showBulkActions && selectedTransactions.length > 0 && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-slate-800 text-lg">
                                Bulk-Zuordnung für {selectedTransactions.length} Transaktionen
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setShowBulkActions(false);
                                    setBulkCategory('');
                                    setBulkUnitId('');
                                    setBulkContractId('');
                                    setBulkAllocations([]);
                                }}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Selected Transactions Summary */}
                        <div className="mb-6 space-y-2">
                            <Label className="text-sm font-medium mb-2 block">Ausgewählte Transaktionen:</Label>
                            <div className="max-h-48 overflow-y-auto space-y-2">
                                {transactions.filter(t => selectedTransactions.includes(t.id)).map(tx => (
                                    <div key={tx.id} className="bg-white rounded-lg p-3 border border-slate-200">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                                    <p className="font-medium text-sm text-slate-800 truncate">{tx.sender_receiver}</p>
                                                </div>
                                                <p className="text-xs text-slate-600 truncate">{tx.description}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Calendar className="w-3 h-3 text-slate-400" />
                                                    <span className="text-xs text-slate-500">
                                                        {tx.transaction_date ? (() => {
                                                            try {
                                                                return format(parseISO(tx.transaction_date), 'dd.MM.yyyy', { locale: de });
                                                            } catch {
                                                                return tx.transaction_date;
                                                            }
                                                        })() : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className={`text-lg font-bold ml-3 flex-shrink-0 ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {tx.amount > 0 ? '+' : ''}{tx.amount?.toFixed(2)} €
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Step 1: Category */}
                        <div className="mb-6">
                            <Label className="text-sm font-medium mb-2 block">1. Kategorie wählen *</Label>
                            <Select value={bulkCategory} onValueChange={(value) => {
                                setBulkCategory(value);
                                setBulkAllocations([]);
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Kategorie auswählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {[...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].map(cat => (
                                        <SelectItem key={cat} value={cat}>
                                            {CATEGORY_LABELS[cat] || cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Step 2: Object/Unit - Only show for rent_income */}
                        {bulkCategory === 'rent_income' && (
                            <div className="mb-6">
                                <Label className="text-sm font-medium mb-2 block">2. Mietobjekt wählen (optional)</Label>
                                <Select value={bulkUnitId} onValueChange={(value) => {
                                    setBulkUnitId(value);
                                    setBulkContractId('');
                                    setBulkAllocations([]);
                                }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Objekt/Wohnung auswählen..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-80">
                                        {buildings.flatMap(building => {
                                            const buildingUnits = units.filter(u => u.building_id === building.id);
                                            return [
                                                <SelectItem key={building.id} value={building.id}>
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="w-4 h-4 text-slate-400" />
                                                        <span className="font-semibold">{building.name}</span>
                                                    </div>
                                                </SelectItem>,
                                                ...buildingUnits.map(unit => (
                                                    <SelectItem key={unit.id} value={unit.id}>
                                                        <div className="flex items-center gap-2 pl-6">
                                                            <span className="text-slate-400">└</span>
                                                            <span>{unit.unit_number}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            ];
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Step 3: Contract - Show when category is rent_income */}
                        {bulkCategory === 'rent_income' && filteredBulkContracts.length > 0 && (
                            <div className="mb-6">
                                <Label className="text-sm font-medium mb-2 block">
                                    3. Mietvertrag wählen *
                                    {!bulkUnitId && bulkSuggestedContracts.length > 0 && (
                                        <span className="ml-2 text-xs text-blue-600 font-normal">
                                            (Nach Relevanz sortiert)
                                        </span>
                                    )}
                                </Label>
                                <Select value={bulkContractId} onValueChange={(value) => {
                                    setBulkContractId(value);
                                    setBulkAllocations([]);
                                    // Automatisch das Mietobjekt setzen
                                    const contract = contracts.find(c => c.id === value);
                                    if (contract?.unit_id) {
                                        setBulkUnitId(contract.unit_id);
                                    }
                                }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Vertrag auswählen..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredBulkContracts.map((contract, idx) => {
                                            const tenant = getTenant(contract.tenant_id);
                                            const secondTenant = contract.second_tenant_id ? getTenant(contract.second_tenant_id) : null;
                                            const unit = getUnit(contract.unit_id);
                                            const building = unit ? getBuilding(unit.building_id) : null;
                                            const isTopSuggestion = !bulkUnitId && idx === 0 && bulkSuggestedContracts.length > 0;
                                            
                                            return (
                                                <SelectItem key={contract.id} value={contract.id}>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">
                                                                {tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt'}
                                                                {secondTenant && ` & ${secondTenant.first_name} ${secondTenant.last_name}`}
                                                            </span>
                                                            {isTopSuggestion && (
                                                                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                                                    Empfohlen
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-slate-500">
                                                            {building?.name} {unit?.unit_number} • €{contract.total_rent?.toFixed(2)}/Monat
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Step 4: Financial Item Selection (for rent_income) */}
                        {bulkCategory === 'rent_income' && bulkContractId && (
                            <div className="border-t pt-6">
                                <Label className="text-sm font-medium mb-3 block">
                                    4. Forderungen zuordnen
                                    <span className="ml-2 text-xs text-slate-500 font-normal">
                                        (Nach Relevanz sortiert • Bis aktuelles Datum)
                                    </span>
                                </Label>

                                {/* Select All Checkbox */}
                                {filteredBulkFinancialItems.length > 0 && (
                                    <div className="flex items-center gap-3 mb-4">
                                        <input
                                            type="checkbox"
                                            checked={filteredBulkFinancialItems.length > 0 && filteredBulkFinancialItems.every(item => 
                                                bulkAllocations.some(a => a.financialItemId === item.id)
                                            )}
                                            onChange={() => {
                                                if (filteredBulkFinancialItems.every(item => bulkAllocations.some(a => a.financialItemId === item.id))) {
                                                    // Deselect all
                                                    setBulkAllocations([]);
                                                } else {
                                                    // Select all with their open amounts
                                                    const newAllocations = filteredBulkFinancialItems.map(item => {
                                                        const openAmount = (item.expected_amount || 0) - (item.amount || 0);
                                                        return {
                                                            financialItemId: item.id,
                                                            amount: openAmount.toFixed(2)
                                                        };
                                                    });
                                                    setBulkAllocations(newAllocations);
                                                }
                                            }}
                                            className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span className="text-sm text-slate-600 font-medium">
                                            {filteredBulkFinancialItems.every(item => bulkAllocations.some(a => a.financialItemId === item.id))
                                                ? 'Alle abwählen' 
                                                : 'Alle auswählen'}
                                        </span>
                                    </div>
                                )}

                                {/* Balance Display */}
                                <div className="bg-white rounded-lg p-3 mb-4 border border-slate-200">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600">Gesamt Transaktionsbetrag:</span>
                                        <span className="font-semibold">€{bulkTransactionAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm mt-1">
                                        <span className="text-slate-600">Zugeordnet:</span>
                                        <span className="font-semibold">€{bulkTotalAllocated.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm mt-1 pt-2 border-t">
                                        <span className="text-slate-600">Verbleibend:</span>
                                        <span className={`font-bold ${bulkRemaining < 0 ? 'text-red-600' : bulkRemaining > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            €{bulkRemaining.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* Available Financial Items */}
                                {filteredBulkFinancialItems.length > 0 ? (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {filteredBulkFinancialItems.map((item, idx) => {
                                            const isSelected = bulkAllocations.some(a => a.financialItemId === item.id);
                                            const allocation = bulkAllocations.find(a => a.financialItemId === item.id);
                                            const openAmount = (item.expected_amount || 0) - (item.amount || 0);
                                            const isTopMatch = idx === 0;

                                            return (
                                                <div 
                                                    key={item.id} 
                                                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                                                        isSelected 
                                                            ? 'border-emerald-500 bg-white' 
                                                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                                    }`}
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setBulkAllocations(bulkAllocations.filter(a => a.financialItemId !== item.id));
                                                        } else {
                                                            const suggestedAmount = Math.min(openAmount, bulkRemaining);
                                                            setBulkAllocations([...bulkAllocations, { 
                                                                financialItemId: item.id, 
                                                                amount: suggestedAmount.toFixed(2) 
                                                            }]);
                                                        }
                                                    }}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                                            isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                                                        }`}>
                                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-medium text-slate-800">
                                                                    {item.payment_month ? (() => {
                                                                        try {
                                                                            return format(parseISO(item.payment_month + '-01'), 'MMM yyyy', { locale: de });
                                                                        } catch {
                                                                            return item.payment_month;
                                                                        }
                                                                    })() : item.description}
                                                                </span>
                                                                {isTopMatch && (
                                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                                                        Passt am besten
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-500">
                                                                {item.category === 'rent' ? 'Miete' : item.category === 'deposit' ? 'Kaution' : item.category}
                                                            </p>
                                                            <div className="flex items-center gap-4 mt-2 text-sm">
                                                                <span className="text-slate-600">
                                                                    Erwartet: <span className="font-medium">€{item.expected_amount?.toFixed(2)}</span>
                                                                </span>
                                                                <span className="text-emerald-600">
                                                                    Offen: <span className="font-medium">€{openAmount.toFixed(2)}</span>
                                                                </span>
                                                            </div>
                                                            {isSelected && (
                                                                <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                                                                    <Label className="text-xs text-slate-600 mb-1 block">Zuzuordnender Betrag:</Label>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        placeholder="Betrag"
                                                                        value={allocation?.amount || ''}
                                                                        onChange={(e) => {
                                                                            const newValue = e.target.value;
                                                                            const updated = bulkAllocations.map(a => 
                                                                                a.financialItemId === item.id 
                                                                                    ? { ...a, amount: newValue }
                                                                                    : a
                                                                            );
                                                                            setBulkAllocations(updated);
                                                                        }}
                                                                        className="w-40"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-500 bg-white rounded-lg border border-slate-200">
                                        Keine offenen Forderungen bis zum aktuellen Datum gefunden
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedTransactions([]);
                                    setShowBulkActions(false);
                                    setBulkCategory('');
                                    setBulkUnitId('');
                                    setBulkContractId('');
                                    setBulkAllocations([]);
                                }}
                            >
                                Abbrechen
                            </Button>
                            <Button
                                onClick={handleBulkCategorize}
                                disabled={!bulkCategory || bulkCategorizeMutation.isPending || (bulkCategory === 'rent_income' && !bulkContractId)}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                {bulkCategorizeMutation.isPending ? 'Wird verarbeitet...' : `${selectedTransactions.length} Transaktionen zuordnen`}
                            </Button>
                        </div>
                    </div>
                )}

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
                        <div className="space-y-4 pt-4 border-t">
                            {/* Saved Filters */}
                            {savedFilters.length > 0 && (
                                <div>
                                    <Label className="text-xs mb-2">Gespeicherte Filter</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {savedFilters.map((saved, idx) => (
                                            <div key={idx} className="flex items-center gap-1 bg-slate-100 rounded-lg px-3 py-1.5">
                                                <button
                                                    onClick={() => setFilters(saved.filters)}
                                                    className="text-sm text-slate-700 hover:text-slate-900"
                                                >
                                                    {saved.name}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const updated = savedFilters.filter((_, i) => i !== idx);
                                                        setSavedFilters(updated);
                                                        localStorage.setItem('transaction_filters', JSON.stringify(updated));
                                                    }}
                                                    className="text-slate-400 hover:text-red-600 ml-1"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Categorization Status */}
                            <div>
                                <Label className="text-xs mb-2">Kategorisierungsstatus</Label>
                                <Select value={filters.categorizationStatus} onValueChange={(value) => setFilters({...filters, categorizationStatus: value})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Alle</SelectItem>
                                        <SelectItem value="categorized">Kategorisiert</SelectItem>
                                        <SelectItem value="uncategorized">Nicht kategorisiert</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Categories */}
                            <div>
                                <Label className="text-xs mb-2">Kategorien</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                                            {filters.selectedCategories.length > 0 
                                                ? `${filters.selectedCategories.length} ausgewählt`
                                                : 'Alle Kategorien'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-0">
                                        <Command>
                                            <CommandInput placeholder="Kategorie suchen..." />
                                            <CommandEmpty>Keine Kategorien gefunden</CommandEmpty>
                                            <CommandGroup className="max-h-64 overflow-y-auto">
                                                {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                                                    const isSelected = filters.selectedCategories.includes(key);
                                                    return (
                                                        <CommandItem
                                                            key={key}
                                                            onSelect={() => {
                                                                setFilters({
                                                                    ...filters,
                                                                    selectedCategories: isSelected
                                                                        ? filters.selectedCategories.filter(c => c !== key)
                                                                        : [...filters.selectedCategories, key]
                                                                });
                                                            }}
                                                        >
                                                            <div className={`mr-2 h-4 w-4 border rounded ${isSelected ? 'bg-emerald-600' : ''}`} />
                                                            <span className="text-sm">{label}</span>
                                                        </CommandItem>
                                                    );
                                                })}
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

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

                            {/* Reset and Save Buttons */}
                            <div className="flex items-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setFilters({
                                        search: '',
                                        selectedUnits: [],
                                        selectedTenants: [],
                                        selectedCategories: [],
                                        categorizationStatus: 'all',
                                        amountMin: '',
                                        amountMax: '',
                                        dateFrom: '',
                                        dateTo: ''
                                    })}
                                    className="flex-1"
                                >
                                    Filter zurücksetzen
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowSaveFilter(true)}
                                    className="flex-1"
                                >
                                    Filter speichern
                                </Button>
                            </div>
                            </div>

                            {/* Save Filter Dialog */}
                            {showSaveFilter && (
                            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <Label className="text-sm mb-2">Filtername</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="z.B. Mieteinnahmen 2024"
                                        value={filterName}
                                        onChange={(e) => setFilterName(e.target.value)}
                                    />
                                    <Button
                                        onClick={() => {
                                            if (!filterName.trim()) {
                                                toast.error('Bitte einen Namen eingeben');
                                                return;
                                            }
                                            const newFilter = { name: filterName, filters };
                                            const updated = [...savedFilters, newFilter];
                                            setSavedFilters(updated);
                                            localStorage.setItem('transaction_filters', JSON.stringify(updated));
                                            setFilterName('');
                                            setShowSaveFilter(false);
                                            toast.success('Filter gespeichert');
                                        }}
                                    >
                                        Speichern
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setFilterName('');
                                            setShowSaveFilter(false);
                                        }}
                                    >
                                        Abbrechen
                                    </Button>
                                </div>
                            </div>
                            )}
                            </div>
                            )}

                    {/* Active filters display */}
                    {(filters.selectedUnits.length > 0 || filters.selectedTenants.length > 0 || filters.selectedCategories.length > 0 || filters.categorizationStatus !== 'all' || filters.amountMin || filters.amountMax || filters.dateFrom || filters.dateTo) && (
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
                            {filters.categorizationStatus !== 'all' && (
                                <Badge variant="secondary" className="gap-1">
                                    {filters.categorizationStatus === 'categorized' ? 'Kategorisiert' : 'Nicht kategorisiert'}
                                    <X 
                                        className="w-3 h-3 cursor-pointer" 
                                        onClick={() => setFilters({...filters, categorizationStatus: 'all'})}
                                    />
                                </Badge>
                            )}
                            {filters.selectedCategories.map(cat => (
                                <Badge key={cat} variant="secondary" className="gap-1">
                                    {CATEGORY_LABELS[cat]}
                                    <X 
                                        className="w-3 h-3 cursor-pointer" 
                                        onClick={() => setFilters({
                                            ...filters,
                                            selectedCategories: filters.selectedCategories.filter(c => c !== cat)
                                        })}
                                    />
                                </Badge>
                            ))}
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
                        <>
                            <div className="flex items-center gap-3 px-4">
                                <input
                                    type="checkbox"
                                    checked={selectedTransactions.length === uncategorizedTransactions.length}
                                    onChange={handleSelectAll}
                                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-600 font-medium">
                                    {selectedTransactions.length === uncategorizedTransactions.length 
                                        ? 'Alle abwählen' 
                                        : 'Alle auf dieser Seite auswählen'}
                                </span>
                            </div>
                        {paginatedUncategorized.map(transaction => (
                            <TransactionCategoryCard
                                key={transaction.id}
                                transaction={transaction}
                                availableCategories={transaction.amount > 0 ? INCOME_CATEGORIES : EXPENSE_CATEGORIES}
                                categoryLabels={CATEGORY_LABELS}
                                availableFinancialItems={transaction.amount > 0 ? pendingFinancialItems : financialItems.filter(i => i.type === 'payable')}
                                onCategorize={() => {
                                    setSelectedTransaction(transaction);
                                    setAllocationDialogOpen(true);
                                }}
                                onCreateInvoice={() => {
                                    setSelectedTransactionForInvoice(transaction);
                                    setCreateInvoiceDialogOpen(true);
                                }}
                                tenants={tenants}
                                units={units}
                                buildings={buildings}
                                contracts={contracts}
                                isSelected={selectedTransactions.includes(transaction.id)}
                                onSelect={handleSelectTransaction}
                                allTransactionLinks={allTransactionLinks}
                            />
                        ))}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-6">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Zurück
                                </Button>
                                <span className="text-sm text-slate-600">
                                    Seite {currentPage} von {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Weiter
                                </Button>
                            </div>
                        )}
                        </>
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
                        <>
                            <div className="flex items-center gap-3 px-4">
                                <input
                                    type="checkbox"
                                    checked={selectedTransactions.length > 0 && selectedTransactions.every(id => 
                                        categorizedTransactions.some(t => t.id === id)
                                    )}
                                    onChange={() => {
                                        if (selectedTransactions.length > 0) {
                                            setSelectedTransactions([]);
                                        } else {
                                            setSelectedTransactions(categorizedTransactions.map(t => t.id));
                                        }
                                    }}
                                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-600 font-medium">
                                    {selectedTransactions.length > 0 
                                        ? `${selectedTransactions.length} ausgewählt` 
                                        : 'Alle auswählen'}
                                </span>
                                {selectedTransactions.length > 0 && (
                                    <Button
                                        onClick={async () => {
                                            const count = selectedTransactions.length;
                                            if (!confirm(`${count} Kategorisierungen wirklich aufheben? Alle Verknüpfungen zu Forderungen werden gelöscht.`)) return;

                                            const toastId = toast.loading(`Bearbeite ${count} Transaktionen...`);

                                            try {
                                                const result = await base44.functions.invoke('bulkUncategorizeTransactions', {
                                                    transactionIds: selectedTransactions
                                                });

                                                console.log('Bulk uncategorize result:', result.data);

                                                if (result.data.success) {
                                                    // Clear selection first
                                                    setSelectedTransactions([]);

                                                    // Force refetch all related data
                                                    await Promise.all([
                                                        queryClient.invalidateQueries({ queryKey: ['bank-transactions'] }),
                                                        queryClient.invalidateQueries({ queryKey: ['financial-items'] }),
                                                        queryClient.invalidateQueries({ queryKey: ['financial-item-transaction-links'] })
                                                    ]);

                                                    // Wait a bit for refetch to complete
                                                    await new Promise(resolve => setTimeout(resolve, 500));

                                                    toast.success(`✓ ${result.data.uncategorized} Kategorisierungen aufgehoben`, { id: toastId });

                                                    if (result.data.errors > 0) {
                                                        toast.warning(`${result.data.errors} Fehler aufgetreten`);
                                                    }
                                                } else {
                                                    toast.error('Fehler: ' + (result.data.error || 'Unbekannter Fehler'), { id: toastId });
                                                }
                                            } catch (error) {
                                                console.error('Bulk uncategorize error:', error);
                                                toast.error('Fehler beim Aufheben: ' + (error.message || 'Unbekannter Fehler'), { id: toastId });
                                            }
                                        }}
                                        variant="outline"
                                        size="sm"
                                        className="ml-auto text-red-600 hover:text-red-700"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Alle Kategorisierungen aufheben ({selectedTransactions.length})
                                    </Button>
                                )}
                            </div>
                            {categorizedTransactions.map(transaction => (
                                <TransactionCategoryCard
                                    key={transaction.id}
                                    transaction={transaction}
                                    categoryLabels={CATEGORY_LABELS}
                                    onUncategorize={() => uncategorizeMutation.mutate({ transactionId: transaction.id })}
                                    tenants={tenants}
                                    units={units}
                                    buildings={buildings}
                                    contracts={contracts}
                                    isSelected={selectedTransactions.includes(transaction.id)}
                                    onSelect={handleSelectTransaction}
                                    showAllocatedAmount={true}
                                    allTransactionLinks={allTransactionLinks}
                                />
                            ))}
                        </>
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

            {allocationDialogOpen && selectedTransaction && (
                <TransactionAllocationDialog
                    transaction={selectedTransaction}
                    onClose={() => {
                        setAllocationDialogOpen(false);
                        setSelectedTransaction(null);
                    }}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
                        queryClient.invalidateQueries({ queryKey: ['financial-items'] });
                        queryClient.invalidateQueries({ queryKey: ['invoices'] });
                    }}
                    availableCategories={selectedTransaction.amount > 0 ? INCOME_CATEGORIES : EXPENSE_CATEGORIES}
                    categoryLabels={CATEGORY_LABELS}
                    tenants={tenants}
                    units={units}
                    buildings={buildings}
                    contracts={contracts}
                    financialItems={selectedTransaction.amount > 0 ? pendingFinancialItems : financialItems.filter(i => i.type === 'payable')}
                    invoices={invoices}
                />
            )}

            {createInvoiceDialogOpen && selectedTransactionForInvoice && (
                <CreateInvoiceFromTransactionDialog
                    open={createInvoiceDialogOpen}
                    onOpenChange={setCreateInvoiceDialogOpen}
                    transaction={selectedTransactionForInvoice}
                    costTypes={costTypes}
                    buildings={buildings}
                    units={units}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
                        queryClient.invalidateQueries({ queryKey: ['financial-items'] });
                        queryClient.invalidateQueries({ queryKey: ['invoices'] });
                        queryClient.invalidateQueries({ queryKey: ['financial-item-transaction-links'] });
                        setSelectedTransactionForInvoice(null);
                    }}
                />
            )}

            {createMultipleInvoicesDialogOpen && selectedTransactions.length > 0 && (
                <CreateMultipleInvoicesDialog
                    open={createMultipleInvoicesDialogOpen}
                    onOpenChange={setCreateMultipleInvoicesDialogOpen}
                    transactions={transactions.filter(t => selectedTransactions.includes(t.id))}
                    costTypes={costTypes}
                    buildings={buildings}
                    units={units}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
                        queryClient.invalidateQueries({ queryKey: ['financial-items'] });
                        queryClient.invalidateQueries({ queryKey: ['invoices'] });
                        queryClient.invalidateQueries({ queryKey: ['financial-item-transaction-links'] });
                        setCreateMultipleInvoicesDialogOpen(false);
                        setSelectedTransactions([]);
                    }}
                />
            )}
            </div>
            );
            }