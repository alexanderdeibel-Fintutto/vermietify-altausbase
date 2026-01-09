import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// CSV Parser & Validator
function parseCSVContent(content, brokerMapping) {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(brokerMapping.skip_header_rows);
  
  return {
    headers,
    rows: rows.map(row => row.split(',')).map(cells => 
      cells.reduce((acc, cell, idx) => {
        acc[headers[idx]] = cell.trim();
        return acc;
      }, {})
    )
  };
}

// Datum-Parser für verschiedene Formate
function parseDate(dateStr, format) {
  const str = dateStr.trim();
  let date;
  
  if (format === 'DD.MM.YYYY') {
    const [day, month, year] = str.split('.');
    date = new Date(year, parseInt(month) - 1, day);
  } else if (format === 'YYYY-MM-DD') {
    date = new Date(str);
  } else {
    date = new Date(str);
  }
  
  return date.toISOString().split('T')[0];
}

// Dezimaltrennzeichen normalisieren
function parseNumber(numStr, decimal_separator) {
  const str = numStr.trim();
  const normalized = decimal_separator === ',' 
    ? str.replace(',', '.') 
    : str;
  return parseFloat(normalized);
}

// Asset-Kategorie von ISIN erkennen
function detectAssetCategory(isin, rowData) {
  if (!isin) return 'stocks';
  
  const firstChar = isin.charAt(0);
  const mappings = {
    'U': 'stocks',      // US Stocks
    'D': 'stocks',      // Germany Stocks
    'F': 'funds',       // Fonds
    'I': 'funds',       // International Funds
    'A': 'bonds',       // Anleihen
    'X': 'crypto',      // Crypto (custom)
  };
  
  return mappings[firstChar] || 'stocks';
}

// Haupt-Import-Funktion
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      file_content, 
      broker_key, 
      broker_mapping,
      column_mapping 
    } = await req.json();

    if (!file_content || !broker_mapping) {
      return Response.json(
        { error: 'Missing file_content or broker_mapping' },
        { status: 400 }
      );
    }

    // CSV parsen
    const parsed = parseCSVContent(file_content, broker_mapping);
    const { rows } = parsed;

    const successCount = 0;
    const errors = [];
    const batchId = `import_${Date.now()}`;
    const assetsToCreate = [];

    // Jede Zeile verarbeiten
    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      const rowNumber = rowIdx + broker_mapping.skip_header_rows + 1;

      try {
        // Spalten-Zuordnung anwenden
        const mappedRow = {};
        Object.entries(broker_mapping.column_mappings).forEach(([csvCol, dbField]) => {
          mappedRow[dbField] = row[csvCol];
        });

        // Validierung: Erforderliche Felder
        const requiredFields = broker_mapping.validation_rules?.required_fields || [];
        const missingFields = requiredFields.filter(
          field => !row[field] || row[field].trim() === ''
        );

        if (missingFields.length > 0) {
          errors.push({
            row: rowNumber,
            message: `Erforderliche Felder fehlen: ${missingFields.join(', ')}`
          });
          continue;
        }

        // Datums-Parsing
        const purchaseDate = parseDate(
          row[Object.keys(broker_mapping.column_mappings).find(k => 
            k.toLowerCase().includes('datum') || k.toLowerCase().includes('date')
          )],
          broker_mapping.date_format
        );

        // Preis & Menge parsen
        const quantity = parseNumber(
          row[Object.keys(broker_mapping.column_mappings).find(k => 
            k.toLowerCase().includes('anzahl') || k.toLowerCase().includes('nominal') || k.toLowerCase().includes('stück')
          )],
          broker_mapping.decimal_separator
        );

        const purchasePrice = parseNumber(
          row[Object.keys(broker_mapping.column_mappings).find(k => 
            k.toLowerCase().includes('preis') || k.toLowerCase().includes('kurs')
          )],
          broker_mapping.decimal_separator
        );

        if (!quantity || !purchasePrice || isNaN(quantity) || isNaN(purchasePrice)) {
          errors.push({
            row: rowNumber,
            message: 'Ungültige Menge oder Preis'
          });
          continue;
        }

        // Asset-Daten zusammenstellen
        const assetName = row[Object.keys(broker_mapping.column_mappings).find(k => 
          k.toLowerCase().includes('name') || k.toLowerCase().includes('gattung')
        )] || 'Unnamed Asset';

        const isin = row[Object.keys(broker_mapping.column_mappings).find(k => 
          k.toLowerCase().includes('isin')
        )] || '';

        const assetData = {
          user_id: user.id,
          asset_category: detectAssetCategory(isin, row),
          name: assetName.trim(),
          isin: isin.trim(),
          purchase_date: purchaseDate,
          purchase_price: purchasePrice,
          quantity: quantity,
          current_value: purchasePrice, // Initial: purchase price
          currency: broker_mapping.currency || 'EUR',
          status: 'active',
          import_source: `csv_${broker_key}`,
          import_batch_id: batchId,
          import_date: new Date().toISOString(),
          import_raw_data: row,
          validation_status: 'validated'
        };

        assetsToCreate.push(assetData);

      } catch (error) {
        errors.push({
          row: rowNumber,
          message: error.message
        });
      }
    }

    // Assets in Batch erstellen
    let createdCount = 0;
    if (assetsToCreate.length > 0) {
      try {
        const results = await base44.asServiceRole.entities.AssetPortfolio.bulkCreate(assetsToCreate);
        createdCount = results.length;
      } catch (createError) {
        return Response.json(
          { 
            error: 'Failed to create assets',
            details: createError.message,
            partial_success: true,
            success_count: 0,
            errors: errors.concat([{
              row: 'batch',
              message: createError.message
            }])
          },
          { status: 500 }
        );
      }
    }

    return Response.json({
      success: true,
      success_count: createdCount,
      total_rows: rows.length,
      batch_id: batchId,
      errors: errors.length > 0 ? errors : null
    });

  } catch (error) {
    console.error('Import error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});