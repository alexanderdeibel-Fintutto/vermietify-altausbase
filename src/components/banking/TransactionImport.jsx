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
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(fieldLabels).map(([field, label]) => (
                                    <div key={field}>
                                        <Label>{label} {['transaction_date', 'amount', 'description'].includes(field) && '*'}</Label>
                                        <Select 
                                            value={mapping[field]} 
                                            onValueChange={(value) => setMapping({...mapping, [field]: value})}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Spalte wählen..." />
                                            </SelectTrigger>
                                            <SelectContent>
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
                            <div className="border border-slate-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-slate-500" />
                                        <span className="text-sm font-medium">Vorschau (erste 10 Zeilen)</span>
                                    </div>
                                    <span className="text-xs text-slate-500">
                                        {csvData.length} Zeilen insgesamt
                                    </span>
                                </div>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {preview.map((tx, idx) => (
                                        <div key={idx} className="text-xs border border-slate-200 rounded-lg p-3 bg-slate-50">
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
                                        </div>
                                    ))}
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