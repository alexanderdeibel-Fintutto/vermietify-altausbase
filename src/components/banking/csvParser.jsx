import { parse } from 'date-fns/parse';

/**
 * Detects the bank format from CSV content
 */
export function detectBankFormat(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return 'unknown';

    const firstLine = lines[0].toLowerCase();
    const secondLine = lines[1];

    // Sparkasse
    if (firstLine.includes('auftragskonto') && firstLine.includes('buchungstag')) {
        return 'Sparkasse';
    }

    // Volksbank
    if (firstLine.includes('kontonummer') && firstLine.includes('buchungstag')) {
        return 'Volksbank';
    }

    // Deutsche Bank
    if (firstLine.includes('booking date') || firstLine.includes('buchungsdatum')) {
        return 'Deutsche Bank';
    }

    // ING
    if (firstLine.includes('datum') && firstLine.includes('verwendungszweck')) {
        return 'ING';
    }

    // Commerzbank
    if (firstLine.includes('wertstellung') && firstLine.includes('umsatz')) {
        return 'Commerzbank';
    }

    // Generic format detection
    const delimiter = detectDelimiter(secondLine);
    const fields = secondLine.split(delimiter);
    
    if (fields.length >= 4) {
        return 'Generic CSV';
    }

    return 'unknown';
}

/**
 * Detects CSV delimiter (semicolon or comma)
 */
function detectDelimiter(line) {
    const semicolons = (line.match(/;/g) || []).length;
    const commas = (line.match(/,/g) || []).length;
    return semicolons > commas ? ';' : ',';
}

/**
 * Parses CSV based on detected format
 */
export function parseCSV(csvText, format) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    switch (format) {
        case 'Sparkasse':
            return parseSparkasse(lines);
        case 'Volksbank':
            return parseVolksbank(lines);
        case 'Deutsche Bank':
            return parseDeutscheBank(lines);
        case 'ING':
            return parseING(lines);
        case 'Commerzbank':
            return parseCommerzbank(lines);
        case 'Generic CSV':
            return parseGeneric(lines);
        default:
            throw new Error('Unbekanntes CSV-Format');
    }
}

function parseSparkasse(lines) {
    const delimiter = detectDelimiter(lines[1]);
    const transactions = [];

    for (let i = 1; i < lines.length; i++) {
        const fields = parseCSVLine(lines[i], delimiter);
        if (fields.length < 8) continue;

        try {
            const transaction = {
                transaction_date: parseDate(fields[1], 'dd.MM.yyyy'),
                value_date: parseDate(fields[2], 'dd.MM.yyyy'),
                sender_receiver: cleanField(fields[3]),
                description: cleanField(fields[4]),
                reference: cleanField(fields[5]),
                iban: cleanField(fields[6]),
                amount: parseAmount(fields[7])
            };

            if (transaction.transaction_date && !isNaN(transaction.amount)) {
                transactions.push(transaction);
            }
        } catch (e) {
            console.warn('Skipping invalid line:', e);
        }
    }

    return transactions;
}

function parseVolksbank(lines) {
    const delimiter = detectDelimiter(lines[1]);
    const transactions = [];

    for (let i = 1; i < lines.length; i++) {
        const fields = parseCSVLine(lines[i], delimiter);
        if (fields.length < 8) continue;

        try {
            const transaction = {
                transaction_date: parseDate(fields[1], 'dd.MM.yyyy'),
                value_date: parseDate(fields[2], 'dd.MM.yyyy'),
                description: cleanField(fields[3]),
                sender_receiver: cleanField(fields[4]),
                reference: cleanField(fields[5]),
                amount: parseAmount(fields[6]),
                iban: cleanField(fields.length > 7 ? fields[7] : '')
            };

            if (transaction.transaction_date && !isNaN(transaction.amount)) {
                transactions.push(transaction);
            }
        } catch (e) {
            console.warn('Skipping invalid line:', e);
        }
    }

    return transactions;
}

function parseDeutscheBank(lines) {
    const delimiter = detectDelimiter(lines[1]);
    const transactions = [];

    for (let i = 1; i < lines.length; i++) {
        const fields = parseCSVLine(lines[i], delimiter);
        if (fields.length < 6) continue;

        try {
            const transaction = {
                transaction_date: parseDate(fields[0], 'dd.MM.yyyy'),
                value_date: parseDate(fields[1], 'dd.MM.yyyy'),
                description: cleanField(fields[2]),
                sender_receiver: cleanField(fields[3]),
                reference: cleanField(fields[2] + ' ' + fields[3]),
                amount: parseAmount(fields[4]),
                iban: ''
            };

            if (transaction.transaction_date && !isNaN(transaction.amount)) {
                transactions.push(transaction);
            }
        } catch (e) {
            console.warn('Skipping invalid line:', e);
        }
    }

    return transactions;
}

function parseING(lines) {
    const delimiter = detectDelimiter(lines[1]);
    const transactions = [];

    for (let i = 1; i < lines.length; i++) {
        const fields = parseCSVLine(lines[i], delimiter);
        if (fields.length < 6) continue;

        try {
            const transaction = {
                transaction_date: parseDate(fields[0], 'dd.MM.yyyy'),
                value_date: parseDate(fields[0], 'dd.MM.yyyy'),
                sender_receiver: cleanField(fields[1]),
                reference: cleanField(fields[2]),
                description: cleanField(fields[3]),
                amount: parseAmount(fields[4]),
                iban: cleanField(fields.length > 5 ? fields[5] : '')
            };

            if (transaction.transaction_date && !isNaN(transaction.amount)) {
                transactions.push(transaction);
            }
        } catch (e) {
            console.warn('Skipping invalid line:', e);
        }
    }

    return transactions;
}

function parseCommerzbank(lines) {
    const delimiter = detectDelimiter(lines[1]);
    const transactions = [];

    for (let i = 1; i < lines.length; i++) {
        const fields = parseCSVLine(lines[i], delimiter);
        if (fields.length < 7) continue;

        try {
            const transaction = {
                transaction_date: parseDate(fields[0], 'dd.MM.yyyy'),
                value_date: parseDate(fields[1], 'dd.MM.yyyy'),
                description: cleanField(fields[2]),
                sender_receiver: cleanField(fields[3]),
                reference: cleanField(fields[4]),
                amount: parseAmount(fields[5]),
                iban: cleanField(fields.length > 6 ? fields[6] : '')
            };

            if (transaction.transaction_date && !isNaN(transaction.amount)) {
                transactions.push(transaction);
            }
        } catch (e) {
            console.warn('Skipping invalid line:', e);
        }
    }

    return transactions;
}

function parseGeneric(lines) {
    const delimiter = detectDelimiter(lines[1]);
    const transactions = [];

    for (let i = 1; i < lines.length; i++) {
        const fields = parseCSVLine(lines[i], delimiter);
        if (fields.length < 4) continue;

        try {
            const transaction = {
                transaction_date: parseDate(fields[0], ['dd.MM.yyyy', 'yyyy-MM-dd']),
                value_date: fields.length > 1 ? parseDate(fields[1], ['dd.MM.yyyy', 'yyyy-MM-dd']) : parseDate(fields[0], ['dd.MM.yyyy', 'yyyy-MM-dd']),
                description: cleanField(fields.length > 2 ? fields[2] : ''),
                sender_receiver: cleanField(fields.length > 3 ? fields[3] : ''),
                reference: cleanField(fields.length > 4 ? fields[4] : ''),
                amount: parseAmount(fields.length > 5 ? fields[5] : fields[fields.length - 1]),
                iban: ''
            };

            if (transaction.transaction_date && !isNaN(transaction.amount)) {
                transactions.push(transaction);
            }
        } catch (e) {
            console.warn('Skipping invalid line:', e);
        }
    }

    return transactions;
}

/**
 * Parse CSV line handling quoted fields
 */
function parseCSVLine(line, delimiter) {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
            fields.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    fields.push(current);
    return fields;
}

/**
 * Parse date from string
 */
function parseDate(dateStr, formats) {
    dateStr = cleanField(dateStr);
    if (!dateStr) return null;

    const formatArray = Array.isArray(formats) ? formats : [formats];

    for (const format of formatArray) {
        try {
            const date = parse(dateStr, format, new Date());
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        } catch (e) {
            // Try next format
        }
    }

    return null;
}

/**
 * Parse amount from string
 */
function parseAmount(amountStr) {
    amountStr = cleanField(amountStr);
    if (!amountStr) return 0;

    // Replace German decimal format (1.234,56) with English (1234.56)
    amountStr = amountStr.replace(/\./g, '').replace(',', '.');
    
    const amount = parseFloat(amountStr);
    return isNaN(amount) ? 0 : amount;
}

/**
 * Clean CSV field (remove quotes, trim)
 */
function cleanField(str) {
    if (!str) return '';
    return str.replace(/^["']|["']$/g, '').trim();
}