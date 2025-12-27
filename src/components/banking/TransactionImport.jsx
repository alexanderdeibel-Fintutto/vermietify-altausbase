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

    const detectDelimiter = (line) => {
        const semicolonCount = (line.match(/;/g) || []).length;
        const commaCount = (line.match(/,/g) || []).length;
        return semicolonCount > commaCount ? ';' : ',';
    };

    const parseLine = (line, delimiter) => {
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

    const parseCSVFile = (text) => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) return { headers: [], data: [] };

        const delimiter = detectDelimiter(lines[0]);
        const headers = parseLine(lines[0], delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = parseLine(lines[i], delimiter).map(v => v.replace(/^"|"$/g, ''));
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            data.push(row);
        }

        return { headers, data };
    };

    const autoDetectMapping = (headers) => {
        const newMapping = { ...mapping };
        
        headers.forEach(header => {
            const h = header.toLowerCase();
            if ((h.includes('buchungstag') || h.includes('buchungsdatum') || h === 'datum') && !newMapping.transaction_date) {
                newMapping.transaction_date = header;
            }
            if ((h.includes('wertstellung') || h.includes('valuta')) && !newMapping.value_date) {
                newMapping.value_date = header;
            }
            if ((h.includes('betrag') || h.includes('amount') || h.includes('umsatz')) && !newMapping.amount) {
                newMapping.amount = header;
            }
            if (h.includes('buchungstext') && !newMapping.description) {
                newMapping.description = header;
            }
            if ((h.includes('verwendungszweck') || h.includes('zweck') || h.includes('referenz')) && !newMapping.reference) {
                newMapping.reference = header;
            }
            if ((h.includes('auftraggeber') || h.includes('empfänger') || h.includes('name')) && !newMapping.sender_receiver) {
                newMapping.sender_receiver = header;
            }
            if (h.includes('iban') && !newMapping.iban) {
                newMapping.iban = header;
            }
        });

        return newMapping;
    };

    const buildTransactionsFromMapping = () => {
        const transactions = [];

        csvData.forEach(row => {
            const transaction = {
                transaction_date: mapping.transaction_date ? row[mapping.transaction_date]?.trim() : '',
                value_date: mapping.value_date ? row[mapping.value_date]?.trim() : '',
                amount: mapping.amount ? parseFloat((row[mapping.amount] || '0').replace(',', '.').replace(/[^\d.-]/g, '')) : 0,
                description: mapping.description ? row[mapping.description]?.trim() : '',
                sender_receiver: mapping.sender_receiver ? row[mapping.sender_receiver]?.trim() : '',
                iban: mapping.iban ? row[mapping.iban]?.trim() : '',
                reference: mapping.reference ? row[mapping.reference]?.trim() : ''
            };

            if (transaction.transaction_date && !isNaN(transaction.amount)) {
                transactions.push(transaction);
            }
        });

        return transactions;
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const { headers, data } = parseCSVFile(text);
            
            if (headers.length === 0) {
                toast.error('Keine Spalten in der CSV gefunden');
                return;
            }

            setCsvHeaders(headers);
            setCsvData(data);
            
            // Auto-detect mapping
            const detectedMapping = autoDetectMapping(headers);
            setMapping(detectedMapping);
            
            setStep(2);
        };
        reader.readAsText(selectedFile, 'UTF-8');
    };

    const handleContinueToPreview = () => {
        const transactions = buildTransactionsFromMapping();
        if (transactions.length === 0) {
            toast.error('Keine gültigen Transaktionen gefunden');
            return;
        }
        setPreview(transactions.slice(0, 10));
        setStep(3);
    };

    const handleImport = async () => {
        if (!accountId) return;

        setImporting(true);

        try {
            const transactions = buildTransactionsFromMapping();

            if (transactions.length === 0) {
                toast.error('Keine gültigen Transaktionen gefunden');
                setImporting(false);
                return;
            }

            // Get all existing transactions for this account
            const allExisting = await base44.entities.BankTransaction.filter(
                { account_id: accountId },
                null,
                10000
            );

            const existingKeys = new Set(
                allExisting.map(tx => 
                    `${tx.transaction_date}_${tx.amount}_${tx.description}`
                )
            );

            const newTransactions = transactions.filter(tx => {
                const key = `${tx.transaction_date}_${tx.amount}_${tx.description}`;
                return !existingKeys.has(key);
            });

            const skipped = transactions.length - newTransactions.length;

            if (newTransactions.length === 0) {
                toast.info('Alle Transaktionen bereits vorhanden');
                handleClose();
                setImporting(false);
                return;
            }

            const toCreate = newTransactions.map(tx => ({
                account_id: accountId,
                ...tx,
                is_matched: false,
                is_categorized: false
            }));

            await base44.entities.BankTransaction.bulkCreate(toCreate);

            toast.success(`${newTransactions.length} Transaktionen importiert${skipped > 0 ? `, ${skipped} übersprungen` : ''}`);
            onSuccess();
            handleClose();
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Import fehlgeschlagen: ' + error.message);
        } finally {
            setImporting(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setStep(1);
        setCsvHeaders([]);
        setCsvData([]);
        setPreview([]);
        setMapping({
            transaction_date: '',
            value_date: '',
            amount: '',
            description: '',
            sender_receiver: '',
            iban: '',
            reference: ''
        });
        onOpenChange(false);
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