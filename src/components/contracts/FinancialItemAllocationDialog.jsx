import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Trash2, Check, Calendar, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function FinancialItemAllocationDialog({ financialItem, invoice, open, onOpenChange, buildings, units, contracts, tenants }) {
    const queryClient = useQueryClient();
    const [allocations, setAllocations] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const item = financialItem || invoice;
    const isInvoice = !!invoice;

    // Fetch linked transactions for this item
    const { data: existingLinks = [] } = useQuery({
        queryKey: ['item-links', item?.id, isInvoice],
        queryFn: () => isInvoice 
            ? base44.entities.FinancialItemTransactionLink.filter({ invoice_id: item.id })
            : base44.entities.FinancialItemTransactionLink.filter({ financial_item_id: item.id }),
        enabled: !!item?.id && open
    });

    // Fetch all uncategorized transactions that match the amount/type
    const { data: allTransactions = [] } = useQuery({
        queryKey: ['bank-transactions'],
        queryFn: () => base44.entities.BankTransaction.list('-transaction_date')
    });

    // Filter relevant transactions (positive for income/receivables, negative for expenses/payables)
    const availableTransactions = React.useMemo(() => {
        if (isInvoice) {
            // For invoices: income -> positive, expense -> negative
            const isIncome = invoice.type === 'other_income';
            return allTransactions.filter(tx => 
                isIncome ? tx.amount > 0 : tx.amount < 0
            );
        } else {
            // For financial items: receivable -> positive, payable -> negative
            const isIncome = financialItem.type === 'receivable';
            return allTransactions.filter(tx => 
                isIncome ? tx.amount > 0 : tx.amount < 0
            );
        }
    }, [allTransactions, isInvoice, invoice, financialItem]);

    // Initialize allocations from existing links
    useEffect(() => {
        if (existingLinks.length > 0) {
            setAllocations(existingLinks.map(link => ({
                linkId: link.id,
                transactionId: link.transaction_id,
                amount: link.linked_amount?.toString() || '0'
            })));
        }
    }, [existingLinks]);

    const totalAllocated = allocations.reduce((sum, alloc) => sum + (parseFloat(alloc.amount) || 0), 0);
    const expectedAmount = isInvoice 
        ? (invoice.expected_amount || invoice.amount || 0)
        : (financialItem.expected_amount || 0);
    const remaining = expectedAmount - totalAllocated;

    const addAllocation = () => {
        setAllocations([...allocations, { linkId: null, transactionId: '', amount: '' }]);
    };

    const removeAllocation = (index) => {
        setAllocations(allocations.filter((_, i) => i !== index));
    };

    const updateAllocation = (index, field, value) => {
        const updated = [...allocations];
        updated[index][field] = value;
        setAllocations(updated);
    };

    const handleSubmit = async () => {
        setIsProcessing(true);
        try {
            // Delete all existing links
            for (const link of existingLinks) {
                await base44.entities.FinancialItemTransactionLink.delete(link.id);
            }

            // Create new links
            const validAllocations = allocations.filter(a => a.transactionId && parseFloat(a.amount) > 0);
            for (const alloc of validAllocations) {
                const linkData = {
                    transaction_id: alloc.transactionId,
                    linked_amount: parseFloat(alloc.amount)
                };
                
                if (isInvoice) {
                    linkData.invoice_id = item.id;
                } else {
                    linkData.financial_item_id = item.id;
                }
                
                await base44.entities.FinancialItemTransactionLink.create(linkData);
            }

            // Update item status and amount
            const newAmount = validAllocations.reduce((sum, a) => sum + parseFloat(a.amount), 0);
            
            let newStatus = 'pending';
            if (newAmount >= expectedAmount - 0.01) {
                newStatus = 'paid';
            } else if (newAmount > 0) {
                newStatus = 'partial';
            }

            if (isInvoice) {
                // Check if overdue
                if (newStatus !== 'paid' && invoice.due_date) {
                    try {
                        const dueDate = new Date(invoice.due_date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (dueDate < today) {
                            newStatus = 'overdue';
                        }
                    } catch (error) {
                        console.error('Error parsing due_date:', error);
                    }
                }
                
                await base44.entities.Invoice.update(item.id, {
                    paid_amount: newAmount,
                    status: newStatus
                });
            } else {
                await base44.entities.FinancialItem.update(item.id, {
                    amount: newAmount,
                    status: newStatus
                });
            }

            // Update all affected transactions
            const allAffectedTransactionIds = [
                ...existingLinks.map(l => l.transaction_id),
                ...validAllocations.map(a => a.transactionId)
            ];
            
            for (const txId of [...new Set(allAffectedTransactionIds)]) {
                const txLinks = await base44.entities.FinancialItemTransactionLink.filter({ transaction_id: txId });
                const isCategorized = txLinks.length > 0;
                
                await base44.entities.BankTransaction.update(txId, {
                    is_categorized: isCategorized
                });
            }

            queryClient.invalidateQueries({ queryKey: ['financial-items'] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
            queryClient.invalidateQueries({ queryKey: ['financial-item-transaction-links'] });
            
            toast.success('Zuordnung aktualisiert');
            onOpenChange(false);
        } catch (error) {
            console.error('Error updating allocations:', error);
            toast.error('Fehler beim Aktualisieren');
        } finally {
            setIsProcessing(false);
        }
    };

    const getTransaction = (txId) => availableTransactions.find(t => t.id === txId);

    if (!open || !item) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-semibold text-slate-800">
                            Transaktionen zuordnen
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                            {item.description}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Financial Item Info */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 mb-6 border border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-slate-600">Erwarteter Betrag:</span>
                        <span className="text-2xl font-bold text-slate-800">
                            €{expectedAmount.toFixed(2)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-3 border-t">
                        <span className="text-slate-600">Aktuell zugeordnet:</span>
                        <span className="font-semibold">€{totalAllocated.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-slate-600">Verbleibend:</span>
                        <span className={`font-bold ${remaining < 0 ? 'text-red-600' : remaining > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            €{remaining.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Allocations */}
                <div className="space-y-3 mb-6">
                    <Label className="text-sm font-medium">Zugeordnete Transaktionen</Label>
                    
                    {allocations.map((alloc, index) => {
                        const transaction = getTransaction(alloc.transactionId);
                        return (
                            <div key={index} className="border rounded-lg p-4 bg-white">
                                <div className="flex gap-3">
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <Label className="text-xs text-slate-600 mb-1">Transaktion</Label>
                                            <Select 
                                                value={alloc.transactionId} 
                                                onValueChange={(value) => updateAllocation(index, 'transactionId', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Transaktion auswählen..." />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-80">
                                                    {availableTransactions.map(tx => (
                                                        <SelectItem key={tx.id} value={tx.id}>
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium">{tx.sender_receiver}</span>
                                                                    <span className={`font-semibold ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                        {tx.amount > 0 ? '+' : ''}{tx.amount?.toFixed(2)} €
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs text-slate-500">
                                                                    {tx.transaction_date ? (() => {
                                                                        try {
                                                                            const date = parseISO(tx.transaction_date);
                                                                            return isNaN(date.getTime()) ? tx.transaction_date : format(date, 'dd.MM.yyyy', { locale: de });
                                                                        } catch {
                                                                            return tx.transaction_date;
                                                                        }
                                                                    })() : '-'}
                                                                    {' • '}
                                                                    {tx.description}
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {transaction && (
                                            <div className="text-xs text-slate-500 pl-3 border-l-2 border-slate-200">
                                                <p>{transaction.description}</p>
                                                {transaction.reference && <p className="mt-1">Ref: {transaction.reference}</p>}
                                            </div>
                                        )}

                                        <div>
                                            <Label className="text-xs text-slate-600 mb-1">Zuzuordnender Betrag</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={alloc.amount}
                                                onChange={(e) => updateAllocation(index, 'amount', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeAllocation(index)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}

                    {allocations.length === 0 && (
                        <div className="text-center py-8 text-slate-500 border rounded-lg border-dashed">
                            Keine Transaktionen zugeordnet
                        </div>
                    )}
                </div>

                <Button
                    onClick={addAllocation}
                    variant="outline"
                    className="w-full mb-6"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Transaktion hinzufügen
                </Button>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Abbrechen
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isProcessing}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        <Check className="w-4 h-4 mr-2" />
                        {isProcessing ? 'Wird gespeichert...' : 'Speichern'}
                    </Button>
                </div>
            </div>
        </div>
    );
}