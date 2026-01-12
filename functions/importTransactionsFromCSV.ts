import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Broker-Mappings für verschiedene CSV-Formate
const BROKER_FORMATS = {
  trade_republic: {
    dateField: 'Datum',
    isinField: 'ISIN',
    symbolField: 'Wertpapier',
    typeField: 'Typ',
    quantityField: 'Stück',
    priceField: 'Kurs',
    feesField: 'Gebühren',
    totalField: 'Betrag',
    currencyField: 'Währung',
    delimiter: ';',
    typeMapping: {
      'Kauf': 'buy',
      'Verkauf': 'sell',
      'Dividende': 'dividend'
    }
  },
  scalable: {
    dateField: 'Buchungsdatum',
    isinField: 'ISIN',
    symbolField: 'Bezeichnung',
    typeField: 'Buchungstyp',
    quantityField: 'Nominal',
    priceField: 'Kurs',
    feesField: 'Ordergebühren',
    totalField: 'Wert',
    currencyField: 'Währung',
    delimiter: ';',
    typeMapping: {
      'Kauf': 'buy',
      'Verkauf': 'sell',
      'Ausschüttung': 'dividend'
    }
  },
  ing: {
    dateField: 'Datum',
    isinField: 'ISIN',
    symbolField: 'Wertpapier',
    typeField: 'Geschäftsart',
    quantityField: 'Anzahl',
    priceField: 'Kurs',
    totalField: 'Betrag',
    currencyField: 'Währung',
    delimiter: ';',
    typeMapping: {
      'Kauf': 'buy',
      'Verkauf': 'sell',
      'Dividende': 'dividend'
    }
  },
  generic: {
    dateField: 'date',
    isinField: 'isin',
    symbolField: 'symbol',
    typeField: 'type',
    quantityField: 'quantity',
    priceField: 'price',
    feesField: 'fees',
    totalField: 'total',
    currencyField: 'currency',
    delimiter: ',',
    typeMapping: {
      'buy': 'buy',
      'sell': 'sell',
      'dividend': 'dividend'
    }
  }
};

function parseCSV(content, delimiter = ',') {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
  
  return lines.slice(1).map(line => {
    const values = line.split(delimiter).map(v => v.trim().replace(/"/g, ''));
    const row = {};
    headers.forEach((header, i) => {
      row[header] = values[i];
    });
    return row;
  });
}

function parseGermanNumber(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fileUrl, portfolioAccountId, brokerFormat = 'generic' } = body;

    if (!fileUrl || !portfolioAccountId) {
      return Response.json(
        { error: 'fileUrl und portfolioAccountId erforderlich' },
        { status: 400 }
      );
    }

    const format = BROKER_FORMATS[brokerFormat] || BROKER_FORMATS.generic;

    // CSV laden
    const response = await fetch(fileUrl);
    const csvContent = await response.text();
    const rows = parseCSV(csvContent, format.delimiter);

    console.log(`Importiere ${rows.length} Transaktionen...`);

    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };

    // Alle existierenden Assets laden
    const existingAssets = await base44.entities.Asset.list();
    const assetsByISIN = {};
    existingAssets.forEach(a => {
      if (a.isin) assetsByISIN[a.isin] = a;
    });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        const isin = row[format.isinField];
        const symbol = row[format.symbolField];
        const rawType = row[format.typeField];
        const transactionType = format.typeMapping[rawType] || 'buy';
        
        if (!isin || !symbol) {
          results.errors.push({ row: i + 2, error: 'ISIN oder Symbol fehlt' });
          results.skipped++;
          continue;
        }

        // Asset suchen oder erstellen
        let asset = assetsByISIN[isin];
        if (!asset) {
          asset = await base44.entities.Asset.create({
            isin,
            symbol: symbol.split(' ')[0],
            name: symbol,
            asset_class: 'stock',
            currency: row[format.currencyField] || 'EUR',
            tax_category: 'standard',
            is_actively_traded: true
          });
          assetsByISIN[isin] = asset;
        }

        // Transaktion erstellen
        const quantity = parseGermanNumber(row[format.quantityField]);
        const price = parseGermanNumber(row[format.priceField]);
        const fees = parseGermanNumber(row[format.feesField] || '0');
        const gross = Math.abs(parseGermanNumber(row[format.totalField]));

        await base44.entities.AssetTransaction.create({
          portfolio_account_id: portfolioAccountId,
          asset_id: asset.id,
          transaction_type: transactionType,
          transaction_date: row[format.dateField],
          quantity: transactionType === 'sell' ? -Math.abs(quantity) : quantity,
          price_per_unit: price,
          price_currency: row[format.currencyField] || 'EUR',
          exchange_rate: 1,
          gross_amount: gross,
          fees: fees,
          taxes_withheld: 0,
          net_amount: transactionType === 'buy' ? gross + fees : gross - fees
        });

        // Holdings neu berechnen
        await base44.functions.invoke('recalculateHoldings', {
          portfolioAccountId,
          assetId: asset.id
        });

        results.imported++;
      } catch (error) {
        console.error(`Fehler in Zeile ${i + 2}:`, error);
        results.errors.push({ row: i + 2, error: error.message });
      }
    }

    return Response.json({
      success: true,
      message: `Import abgeschlossen: ${results.imported} importiert, ${results.skipped} übersprungen`,
      results
    });
  } catch (error) {
    console.error('Import error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});