import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowRight, AlertTriangle, X } from 'lucide-react';
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
    const [duplicateSuggestions, setDuplicateSuggestions] = useState([]);
    const [checkingDuplicates, setCheckingDuplicates] = useState(false);
    const [transactionDecisions, setTransactionDecisions] = useState(new Map()); // idx -> 'skip' | 'import' | 'pending'

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
        // Try to load saved mapping first
        try {
            const savedMapping = localStorage.getItem('csv_import_mapping');
            if (savedMapping) {
                const parsed = JSON.parse(savedMapping);
                // Check if all saved columns exist in current headers
                const allColumnsExist = Object.values(parsed).every(col => 
                    !col || headers.includes(col)
                );
                if (allColumnsExist) {
                    return parsed;
                }
            }
        } catch (error) {
            console.warn('Could not load saved mapping:', error);
        }

        // Fallback to auto-detection
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
            if ((h.includes('verwendungszweck') || h.includes('zweck') || h.includes('referenz') || 
                 h.includes('verwendung') || h.includes('purpose') || h.includes('memo')) && !newMapping.reference) {
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

    const parseGermanNumber = (value) => {
        if (!value) return 0;
        // German format: -1.573,42
        // Step 1: Remove thousands separator (.)
        // Step 2: Replace decimal separator (,) with (.)
        // Step 3: Parse as float
        const cleaned = value.toString()
            .replace(/\./g, '')  // Remove thousands separator
            .replace(',', '.');   // Replace decimal separator
        return parseFloat(cleaned) || 0;
    };

    const extractSenderFromDescription = (description) => {
        if (!description) return '';
        
        // Extract first meaningful part (usually sender name)
        const parts = description.split(/\s+/);
        const meaningfulParts = [];
        
        for (let i = 0; i < Math.min(parts.length, 5); i++) {
            const part = parts[i];
            // Stop at common separators or technical terms
            if (part.includes('End-to-End') || part.includes('Mandatsref') || 
                part.includes('Gläubiger') || part.includes('Kundenreferenz') ||
                part.includes('SEPA') || part.match(/^\d+\.\d+\.\d+$/)) {
                break;
            }
            meaningfulParts.push(part);
        }
        
        return meaningfulParts.join(' ').trim();
    };

    const extractReferenceFromDescription = (description) => {
        if (!description) return '';
        
        // Try to extract reference/purpose from description
        // Look for patterns like: "Verwendungszweck:", "Zweck:", or after "SEPA"
        const patterns = [
            /Verwendungszweck[:\s]+([^,]+)/i,
            /Zweck[:\s]+([^,]+)/i,
            /SEPA[^,]*,\s*([^,]+)/i,
            /Kundenreferenz[:\s]+([^,]+)/i
        ];
        
        for (const pattern of patterns) {
            const match = description.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        
        // If no pattern matches, extract text after common separators
        const parts = description.split(/End-to-End|Mandatsref|Gläubiger/);
        if (parts.length > 1 && parts[1]) {
            return parts[1].split(',')[0].trim();
        }
        
        return '';
    };

    const buildTransactionsFromMapping = () => {
        const transactions = [];

        csvData.forEach(row => {
            const descriptionText = mapping.description ? row[mapping.description]?.trim() : '';
            let senderReceiver = mapping.sender_receiver ? row[mapping.sender_receiver]?.trim() : '';
            let reference = mapping.reference ? row[mapping.reference]?.trim() : '';
            
            // If no sender_receiver column mapped, try to extract from description
            if (!senderReceiver && descriptionText) {
                senderReceiver = extractSenderFromDescription(descriptionText);
            }
            
            // If no reference column mapped, try to extract from description
            if (!reference && descriptionText) {
                reference = extractReferenceFromDescription(descriptionText);
            }
            
            const transaction = {
                transaction_date: mapping.transaction_date ? row[mapping.transaction_date]?.trim() : '',
                value_date: mapping.value_date ? row[mapping.value_date]?.trim() : '',
                amount: mapping.amount ? parseGermanNumber(row[mapping.amount]) : 0,
                description: descriptionText,
                sender_receiver: senderReceiver,
                iban: mapping.iban ? row[mapping.iban]?.trim() : '',
                reference: reference
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

    const handleContinueToPreview = async () => {
        const transactions = buildTransactionsFromMapping();
        if (transactions.length === 0) {
            toast.error('Keine gültigen Transaktionen gefunden');
            return;
        }
        
        setPreview(transactions.slice(0, 10));
        setStep(3);
        
        // Check for potential duplicates in background
        setCheckingDuplicates(true);
        try {
            const response = await base44.functions.invoke('checkPotentialDuplicates', {
                accountId,
                transactions
            });
            
            if (response.data.success) {
                setDuplicateSuggestions(response.data.duplicateSuggestions || []);
            }
        } catch (error) {
            console.error('Duplicate check error:', error);
            // Don't show error to user, just skip duplicate check
        } finally {
            setCheckingDuplicates(false);
        }
    };

    const handleImport = async () => {
        if (!accountId) {
            toast.error('Kein Konto ausgewählt');
            return;
        }

        setImporting(true);

        try {
            const transactions = buildTransactionsFromMapping();

            console.log('Built transactions:', transactions);

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

            console.log('Existing transactions for account:', allExisting.length);

            // Very robust duplicate detection: date + value_date + amount + sender
            const existingKeys = new Set(
                allExisting.map(tx => {
                    // Use multiple unique identifiers
                    return JSON.stringify({
                        date: tx.transaction_date,
                        value: tx.value_date,
                        amt: tx.amount?.toFixed(2), // Normalize to 2 decimals
                        sender: tx.sender_receiver?.substring(0, 30) || '',
                        iban: tx.iban?.substring(0, 15) || ''
                    });
                })
            );

            const newTransactions = transactions.filter((tx) => {
                    // Check if user decided to skip this transaction
                    const txKey = `${tx.transaction_date}-${tx.amount}-${tx.description}`;
                    if (transactionDecisions.get(txKey) === 'skip') {
                        return false;
                    }

                const key = JSON.stringify({
                    date: tx.transaction_date,
                    value: tx.value_date,
                    amt: tx.amount?.toFixed(2),
                    sender: tx.sender_receiver?.substring(0, 30) || '',
                    iban: tx.iban?.substring(0, 15) || ''
                });
                return !existingKeys.has(key);
            });

            const skipped = transactions.length - newTransactions.length;

            console.log('New transactions to import:', newTransactions.length, 'Skipped:', skipped);

            if (newTransactions.length === 0) {
                toast.info('Alle Transaktionen bereits vorhanden');
                setImporting(false);
                handleClose();
                return;
            }

            const toCreate = newTransactions.map(tx => ({
                account_id: accountId,
                ...tx,
                is_matched: false,
                is_categorized: false
            }));

            console.log('Creating transactions:', toCreate);

            const result = await base44.entities.BankTransaction.bulkCreate(toCreate);
            
            console.log('BulkCreate result:', result);

            // Save mapping for future imports
            try {
                localStorage.setItem('csv_import_mapping', JSON.stringify(mapping));
            } catch (error) {
                console.warn('Could not save mapping:', error);
            }

            // Call onSuccess to refresh data BEFORE showing success message
            if (onSuccess) {
                await onSuccess();
            }
            
            // Give the queries time to refetch
            await new Promise(resolve => setTimeout(resolve, 500));
            
            toast.success(`${newTransactions.length} Transaktionen importiert${skipped > 0 ? `, ${skipped} übersprungen` : ''}`);
            
            handleClose();
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Import fehlgeschlagen: ' + (error.message || 'Unbekannter Fehler'));
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
        setDuplicateSuggestions([]);
        setTransactionDecisions(new Map());
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

    const fieldLabels = {
        transaction_date: 'Buchungstag',
        value_date: 'Wertstellung',
        amount: 'Betrag',
        description: 'Buchungstext',
        reference: 'Verwendungszweck',
        sender_receiver: 'Auftraggeber/Empfänger',
        iban: 'IBAN'
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Transaktionen importieren (CSV)</DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                        <div className={`flex items-center gap-2 text-xs ${step >= 1 ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-emerald-100' : 'bg-slate-100'}`}>1</div>
                            Datei
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                        <div className={`flex items-center gap-2 text-xs ${step >= 2 ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-emerald-100' : 'bg-slate-100'}`}>2</div>
                            Zuordnung
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                        <div className={`flex items-center gap-2 text-xs ${step >= 3 ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-emerald-100' : 'bg-slate-100'}`}>3</div>
                            Vorschau
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {/* Step 1: File Upload */}
                    {step === 1 && (
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
                                Unterstützt werden CSV-Dateien mit Semikolon oder Komma als Trennzeichen
                            </p>
                        </div>
                    )}

                    {/* Step 2: Column Mapping */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-800">
                                    Ordnen Sie die CSV-Spalten den Transaktionsfeldern zu. Felder mit * sind erforderlich.
                                </p>
                                <p className="text-xs text-blue-700 mt-2">
                                    💡 Tipp: Wenn kein Empfänger-Feld vorhanden ist, wird versucht, den Empfänger aus dem Buchungstext zu extrahieren.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(fieldLabels).map(([field, label]) => (
                                    <div key={field}>
                                        <Label>{label} {['transaction_date', 'amount', 'description'].includes(field) && '*'}</Label>
                                        <Select 
                                            value={mapping[field] || ''} 
                                            onValueChange={(value) => setMapping({...mapping, [field]: value === 'auto' ? '' : value})}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Spalte wählen..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {['sender_receiver', 'reference'].includes(field) && (
                                                    <SelectItem value="auto">🔍 Automatisch erkennen</SelectItem>
                                                )}
                                                <SelectItem value={null}>Nicht zuordnen</SelectItem>
                                                {csvHeaders.map(header => (
                                                    <SelectItem key={header} value={header}>
                                                        {header}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>

                            {csvData.length > 0 && (
                                <div className="border border-slate-200 rounded-lg p-3">
                                    <p className="text-xs font-medium text-slate-600 mb-2">Beispielzeile aus CSV:</p>
                                    <div className="text-xs text-slate-500 space-y-1">
                                        {csvHeaders.slice(0, 5).map(header => (
                                            <div key={header}>
                                                <span className="font-medium">{header}:</span> {csvData[0][header]}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between gap-3 pt-4">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setStep(1)}
                                >
                                    Zurück
                                </Button>
                                <Button 
                                    onClick={handleContinueToPreview}
                                    disabled={!mapping.transaction_date || !mapping.amount || !mapping.description}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    Weiter zur Vorschau
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Preview */}
                    {step === 3 && preview.length > 0 && (
                        <div className="space-y-4">
                            {checkingDuplicates && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                                    <div className="animate-spin">⏳</div>
                                    <span className="text-sm text-blue-800">Prüfe auf mögliche Duplikate...</span>
                                </div>
                            )}

                            {duplicateSuggestions.length > 0 && (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                                        <span className="font-medium text-orange-800">
                                            {duplicateSuggestions.length} mögliche Duplikate gefunden
                                        </span>
                                    </div>
                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                        {duplicateSuggestions.map((suggestion, idx) => {
                                            const txKey = `${suggestion.newTransaction.transaction_date}-${suggestion.newTransaction.amount}-${suggestion.newTransaction.description}`;
                                            const decision = transactionDecisions.get(txKey) || 'pending';
                                            const topMatch = suggestion.potentialDuplicates[0];

                                                return (
                                                    <div key={idx} className={`border rounded-lg p-3 ${
                                                        decision === 'skip' ? 'bg-red-50 border-red-200' : 
                                                        decision === 'import' ? 'bg-green-50 border-green-200' : 
                                                        'bg-white'
                                                    }`}>
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1 space-y-2">
                                                                <div className="text-sm">
                                                                    <span className="font-medium text-slate-700">Neue Transaktion:</span>
                                                                    <div className="mt-1 text-xs text-slate-600">
                                                                        {suggestion.newTransaction.transaction_date} | €{suggestion.newTransaction.amount.toFixed(2)} | {suggestion.newTransaction.description?.substring(0, 50)}...
                                                                    </div>
                                                                </div>
                                                                <div className="text-sm">
                                                                    <span className="font-medium text-orange-700">Ähnliche existierende:</span>
                                                                    <div className="mt-1 text-xs text-slate-600">
                                                                        {topMatch.existingTransaction.transaction_date} | €{topMatch.existingTransaction.amount.toFixed(2)} | {topMatch.existingTransaction.description?.substring(0, 50)}...
                                                                    </div>
                                                                    <div className="mt-1 text-xs text-orange-600">
                                                                        Übereinstimmung: {(topMatch.matchScore * 100).toFixed(0)}%
                                                                    </div>
                                                                </div>
                                                                {decision !== 'pending' && (
                                                                    <div className={`text-xs font-medium ${
                                                                        decision === 'skip' ? 'text-red-600' : 'text-green-600'
                                                                    }`}>
                                                                        ✓ {decision === 'skip' ? 'Wird übersprungen' : 'Wird importiert (kein Duplikat)'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant={decision === 'skip' ? "default" : "destructive"}
                                                                    onClick={() => {
                                                                        const newDecisions = new Map(transactionDecisions);
                                                                        if (decision === 'skip') {
                                                                            newDecisions.delete(txKey);
                                                                        } else {
                                                                            newDecisions.set(txKey, 'skip');
                                                                        }
                                                                        setTransactionDecisions(newDecisions);
                                                                    }}
                                                                >
                                                                    {decision === 'skip' ? '✓ Überspringen' : 'Überspringen'}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant={decision === 'import' ? "default" : "outline"}
                                                                    onClick={() => {
                                                                        const newDecisions = new Map(transactionDecisions);
                                                                        if (decision === 'import') {
                                                                            newDecisions.delete(txKey);
                                                                        } else {
                                                                            newDecisions.set(txKey, 'import');
                                                                        }
                                                                        setTransactionDecisions(newDecisions);
                                                                    }}
                                                                >
                                                                    {decision === 'import' ? '✓ Kein Duplikat' : 'Kein Duplikat'}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}

                            <div className="border border-slate-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-slate-500" />
                                        <span className="text-sm font-medium">Vorschau (erste 10 Zeilen)</span>
                                    </div>
                                    <span className="text-xs text-slate-500">
                                        {csvData.length - Array.from(transactionDecisions.values()).filter(d => d === 'skip').length} von {csvData.length} werden importiert
                                    </span>
                                </div>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {preview.map((tx, idx) => {
                                        const txKey = `${tx.transaction_date}-${tx.amount}-${tx.description}`;
                                        const decision = transactionDecisions.get(txKey) || 'pending';
                                        const isSkipped = decision === 'skip';
                                        return (
                                            <div key={idx} className={`text-xs border rounded-lg p-3 ${isSkipped ? 'bg-slate-100 opacity-40' : 'bg-slate-50 border-slate-200'}`}>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <span className="font-medium text-slate-500">Datum:</span>
                                                        <span className="ml-2 text-slate-800">{tx.transaction_date}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-slate-500">Betrag:</span>
                                                        <span className={`ml-2 font-semibold ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                            €{tx.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                    {tx.sender_receiver && (
                                                        <div className="col-span-2">
                                                            <span className="font-medium text-slate-500">Auftraggeber/Empfänger:</span>
                                                            <span className="ml-2 text-slate-800">{tx.sender_receiver}</span>
                                                        </div>
                                                    )}
                                                    <div className="col-span-2">
                                                        <span className="font-medium text-slate-500">Buchungstext:</span>
                                                        <span className="ml-2 text-slate-800">{tx.description}</span>
                                                    </div>
                                                    {tx.reference && tx.reference !== tx.description && (
                                                        <div className="col-span-2">
                                                            <span className="font-medium text-slate-500">Verwendungszweck:</span>
                                                            <span className="ml-2 text-slate-800">{tx.reference}</span>
                                                        </div>
                                                    )}
                                                    {tx.iban && (
                                                        <div className="col-span-2">
                                                            <span className="font-medium text-slate-500">IBAN:</span>
                                                            <span className="ml-2 text-slate-800 font-mono">{tx.iban}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {isSkipped && (
                                                    <div className="mt-2 pt-2 border-t border-slate-300">
                                                        <span className="text-xs text-red-600 italic">Wird übersprungen (Duplikat)</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-between gap-3">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setStep(2)}
                                >
                                    Zurück
                                </Button>
                                <Button 
                                    onClick={handleImport}
                                    disabled={importing}
                                    className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                                >
                                    <Upload className="w-4 h-4" />
                                    {importing ? 'Importiere...' : `${csvData.length} Transaktionen importieren`}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}