import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function TransactionImport({ open, onOpenChange, accountId, onSuccess }) {
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [step, setStep] = useState(1); // 1: upload, 2: mapping, 3: preview
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [csvData, setCsvData] = useState([]);
    const [mapping, setMapping] = useState({
        transaction_date: '',
        value_date: '',
        amount: '',
        description: '',
        sender_receiver: '',
        iban: '',
        reference: ''
    });
    const [preview, setPreview] = useState([]);

    const parseCSV = (text) => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        // Handle different CSV delimiters and quoted values
        const detectDelimiter = (line) => {
            const semicolonCount = (line.match(/;/g) || []).length;
            const commaCount = (line.match(/,/g) || []).length;
            return semicolonCount > commaCount ? ';' : ',';
        };

        const delimiter = detectDelimiter(lines[0]);
        
        const parseLine = (line) => {
            const values = [];
            let currentValue = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === delimiter && !inQuotes) {
                    values.push(currentValue.trim());
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            values.push(currentValue.trim());
            return values;
        };

        const headers = parseLine(lines[0]).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
        const transactions = [];

        for (let i = 1; i < lines.length; i++) {
            const values = parseLine(lines[i]).map(v => v.replace(/^"|"$/g, ''));
            const row = {};
            
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });

            // Map common German CSV headers - more variations
            const transactionDate = row['buchungstag'] || row['buchungsdatum'] || row['datum'] || row['date'] || '';
            const valueDate = row['wertstellung'] || row['valuta'] || row['value_date'] || transactionDate || '';

            const transaction = {
                transaction_date: transactionDate.trim(),
                value_date: valueDate.trim(),
                amount: parseFloat((row['betrag'] || row['amount'] || row['umsatz'] || '0').replace(',', '.').replace(/[^\d.-]/g, '')),
                description: row['buchungstext'] || row['verwendungszweck'] || row['beschreibung'] || row['description'] || row['zweck'] || '',
                sender_receiver: row['auftraggeber'] || row['empfänger'] || row['name'] || row['sender_receiver'] || row['auftraggeber / empfänger'] || '',
                iban: row['iban'] || row['kontonummer'] || row['account'] || '',
                reference: row['verwendungszweck'] || row['referenz'] || row['reference'] || row['buchungstext'] || ''
            };

            // Only add if date is valid and not empty
            if (transaction.transaction_date && transaction.transaction_date !== '' && !isNaN(transaction.amount)) {
                transactions.push(transaction);
            }
        }

        return transactions;
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const parsed = parseCSV(text);
            setPreview(parsed.slice(0, 5));
        };
        reader.readAsText(selectedFile, 'UTF-8');
    };

    const handleImport = async () => {
        if (!file || !accountId) return;

        setImporting(true);

        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const text = event.target.result;
                const transactions = parseCSV(text);

                if (transactions.length === 0) {
                    toast.error('Keine gültigen Transaktionen gefunden');
                    setImporting(false);
                    return;
                }

                // Get all existing transactions for this account at once (no limit)
                const allExisting = await base44.entities.BankTransaction.filter(
                    { account_id: accountId },
                    null,
                    10000 // High limit to get all transactions
                );

                // Create a Set for fast duplicate checking
                const existingKeys = new Set(
                    allExisting.map(tx => 
                        `${tx.transaction_date}_${tx.amount}_${tx.description}`
                    )
                );

                // Filter out duplicates
                const newTransactions = transactions.filter(tx => {
                    const key = `${tx.transaction_date}_${tx.amount}_${tx.description}`;
                    return !existingKeys.has(key);
                });

                const skipped = transactions.length - newTransactions.length;

                if (newTransactions.length === 0) {
                    toast.info('Alle Transaktionen bereits vorhanden');
                    onOpenChange(false);
                    setFile(null);
                    setPreview([]);
                    setImporting(false);
                    return;
                }

                // Bulk create all new transactions
                const toCreate = newTransactions.map(tx => ({
                    account_id: accountId,
                    ...tx,
                    is_matched: false
                }));

                await base44.entities.BankTransaction.bulkCreate(toCreate);

                toast.success(`${newTransactions.length} Transaktionen importiert${skipped > 0 ? `, ${skipped} übersprungen (bereits vorhanden)` : ''}`);
                onSuccess();
                onOpenChange(false);
                setFile(null);
                setPreview([]);
            };
            reader.readAsText(file, 'UTF-8');
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Import fehlgeschlagen: ' + error.message);
        } finally {
            setImporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Transaktionen importieren (CSV)</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    <div>
                        <Label>CSV-Datei auswählen</Label>
                        <div className="mt-2">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-slate-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-lg file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-emerald-50 file:text-emerald-700
                                    hover:file:bg-emerald-100"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Erwartete Spalten: Buchungstag, Betrag, Buchungstext, Auftraggeber/Empfänger, IBAN
                        </p>
                    </div>

                    {preview.length > 0 && (
                        <div className="border border-slate-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <FileText className="w-4 h-4 text-slate-500" />
                                <span className="text-sm font-medium">Vorschau (erste 5 Zeilen)</span>
                            </div>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {preview.map((tx, idx) => (
                                    <div key={idx} className="text-xs border-b border-slate-100 pb-2 last:border-0">
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">{tx.transaction_date}</span>
                                            <span className={`font-semibold ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                €{tx.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="text-slate-500 mt-1">{tx.description}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => onOpenChange(false)}
                        >
                            Abbrechen
                        </Button>
                        <Button 
                            onClick={handleImport}
                            disabled={!file || importing}
                            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                        >
                            <Upload className="w-4 h-4" />
                            {importing ? 'Importiere...' : 'Importieren'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}