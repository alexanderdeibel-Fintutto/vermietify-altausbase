import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X, Tag } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function RulePreviewDialog({ 
    open, 
    onOpenChange, 
    suggestions = [],
    availableCategories = [],
    categoryLabels = {},
    onConfirm
}) {
    const [editedSuggestions, setEditedSuggestions] = useState({});
    const [removedSuggestions, setRemovedSuggestions] = useState(new Set());

    const handleCategoryChange = (transactionId, newCategory) => {
        setEditedSuggestions({
            ...editedSuggestions,
            [transactionId]: newCategory
        });
    };

    const handleRemove = (transactionId) => {
        setRemovedSuggestions(new Set([...removedSuggestions, transactionId]));
    };

    const handleConfirm = () => {
        const finalSuggestions = suggestions
            .filter(s => !removedSuggestions.has(s.transaction.id))
            .map(s => ({
                transaction: s.transaction,
                category: editedSuggestions[s.transaction.id] || s.category,
                rule: s.rule
            }));
        
        onConfirm(finalSuggestions);
        
        // Reset state
        setEditedSuggestions({});
        setRemovedSuggestions(new Set());
    };

    const activeSuggestions = suggestions.filter(s => !removedSuggestions.has(s.transaction.id));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Regelbasierte Kategorisierung - Vorschau</DialogTitle>
                    <p className="text-sm text-slate-500 mt-1">
                        {activeSuggestions.length} Transaktionen werden kategorisiert
                    </p>
                </DialogHeader>

                <div className="space-y-3 mt-4">
                    {activeSuggestions.map(suggestion => {
                        const tx = suggestion.transaction;
                        const currentCategory = editedSuggestions[tx.id] || suggestion.category;
                        const isPositive = tx.amount > 0;

                        return (
                            <div 
                                key={tx.id}
                                className="border border-slate-200 rounded-lg p-4 bg-slate-50"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <p className="font-semibold text-slate-800">
                                                    {tx.sender_receiver || 'Unbekannt'}
                                                </p>
                                                <p className="text-sm text-slate-600 mt-1">
                                                    {tx.description}
                                                </p>
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className={cn(
                                                    "text-lg font-bold whitespace-nowrap",
                                                    isPositive ? "text-emerald-600" : "text-red-600"
                                                )}>
                                                    {isPositive ? '+' : ''}{tx.amount?.toFixed(2)} €
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {(() => {
                                                        try {
                                                            const date = parseISO(tx.transaction_date);
                                                            return format(date, 'dd.MM.yyyy', { locale: de });
                                                        } catch {
                                                            return tx.transaction_date;
                                                        }
                                                    })()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mt-3">
                                            <Tag className="w-4 h-4 text-slate-500" />
                                            <Select 
                                                value={currentCategory} 
                                                onValueChange={(value) => handleCategoryChange(tx.id, value)}
                                            >
                                                <SelectTrigger className="w-64 h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableCategories.map(cat => (
                                                        <SelectItem key={cat} value={cat} className="text-xs">
                                                            {categoryLabels[cat] || cat}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            
                                            <Badge variant="outline" className="text-xs">
                                                Regel: {suggestion.rule.name}
                                            </Badge>
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemove(tx.id)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}

                    {activeSuggestions.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-slate-500">Keine Vorschläge verfügbar</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center gap-3 pt-4 border-t mt-6">
                    <p className="text-sm text-slate-600">
                        {activeSuggestions.length} Transaktionen werden kategorisiert
                    </p>
                    <div className="flex gap-2">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => onOpenChange(false)}
                        >
                            Abbrechen
                        </Button>
                        <Button 
                            onClick={handleConfirm}
                            disabled={activeSuggestions.length === 0}
                            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Alle bestätigen
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}