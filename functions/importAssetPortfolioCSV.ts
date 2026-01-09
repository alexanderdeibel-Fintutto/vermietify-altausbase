import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Validierungsschema für Duplikaterkennung
class DuplicateChecker {
  constructor() {
    this.seen = new Map(); // isin + date + quantity -> true
  }

  getKey(asset) {
    return `${asset.isin}|${asset.purchase_date}|${asset.quantity}`;
  }

  isDuplicate(asset) {
    const key = this.getKey(asset);
    if (this.seen.has(key)) return true;
    this.seen.set(key, true);
    return false;
  }
}

// CSV Parser mit robuster Fehlerbehandlung
function parseCSVContent(content, brokerMapping) {
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error('CSV-Datei ist leer');
  }

  const headers = lines[0].split(',').map(h => h.trim());
  if (headers.length === 0) {
    throw new Error('CSV Header konnte nicht geparst werden');
  }

  const skipRows = brokerMapping.skip_header_rows || 1;
  const rows = lines.slice(skipRows);

  return {
    headers,
    rows: rows.map((row, idx) => {
      const cells = row.split(',');
      const rowData = {};
      headers.forEach((header, cellIdx) => {
        rowData[header] = cells[cellIdx]?.trim() || '';
      });
      return { data: rowData, lineNumber: skipRows + idx + 2 };
    })
  };
}

// Datum-Parser mit Validierung
function parseDate(dateStr, format) {
  if (!dateStr || dateStr.trim() === '') {
    throw new Error('Datum ist leer');
  }

  const str = dateStr.trim();
  let date;

  try {
    if (format === 'DD.MM.YYYY') {
      const [day, month, year] = str.split('.');
      if (!day || !month || !year) throw new Error('Format stimmt nicht überein');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else if (format === 'YYYY-MM-DD') {
      date = new Date(str);
    } else {
      date = new Date(str);
    }

    if (isNaN(date.getTime())) {
      throw new Error(`Ungültiges Datum: ${str}`);
    }

    // Plausibilitätsprüfung (nicht in Zukunft, nicht älter als 100 Jahre)
    const now = new Date();
    const hundredYearsAgo = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate());
    
    if (date > now) {
      throw new Error('Datum liegt in der Zukunft');
    }
    if (date < hundredYearsAgo) {
      throw new Error('Datum ist unrealistisch alt');
    }

    return date.toISOString().split('T')[0];
  } catch (error) {
    throw new Error(`Datum-Parse-Fehler: ${error.message}`);
  }
}

// Zahlen-Parser mit Validierung
function parseNumber(numStr, decimalSeparator) {
  if (!numStr || numStr.trim() === '') {
    throw new Error('Zahl ist leer');
  }

  const str = numStr.trim();
  
  // Whitespace und Tausender-Trennzeichen entfernen
  let normalized = str.replace(/\s/g, '');
  if (decimalSeparator === ',') {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = normalized.replace(/,/g, '');
  }

  const num = parseFloat(normalized);
  
  if (isNaN(num)) {
    throw new Error(`Ungültige Zahl: ${str}`);
  }

  if (num <= 0) {
    throw new Error(`Zahl muss positiv sein: ${num}`);
  }

  if (num > 1e10) {
    throw new Error(`Zahl unrealistisch groß: ${num}`);
  }

  return num;
}

// Asset-Kategorie erkennen
function detectAssetCategory(isin) {
  if (!isin || isin.trim() === '') {
    return 'stocks'; // Fallback
  }

  const firstChar = isin.charAt(0).toUpperCase();
  const mappings = {
    'U': 'stocks',
    'D': 'stocks',
    'F': 'funds',
    'I': 'funds',
    'A': 'bonds',
    'X': 'crypto',
  };

  return mappings[firstChar] || 'stocks';
}

// ISIN-Format validieren
function validateISIN(isin) {
  if (!isin || isin.trim() === '') {
    return true; // ISIN optional
  }

  const cleanISIN = isin.trim().toUpperCase();
  
  // Format: 2 Buchstaben + 9 Ziffern + 1 Prüfziffer
  if (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(cleanISIN)) {
    throw new Error(`Ungültiges ISIN-Format: ${isin}`);
  }

  return true;
}

// Haupt-Import-Funktion
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_content, broker_key, broker_mapping } = await req.json();

    if (!file_content || !broker_mapping) {
      return Response.json(
        { error: 'Pflichtfelder fehlen: file_content, broker_mapping' },
        { status: 400 }
      );
    }

    // CSV parsen
    let parsed;
    try {
      parsed = parseCSVContent(file_content, broker_mapping);
    } catch (parseError) {
      return Response.json(
        {
          success: false,
          error: `CSV-Parse-Fehler: ${parseError.message}`,
          success_count: 0,
          total_rows: 0,
          errors: [{ row: 0, message: parseError.message }]
        },
        { status: 400 }
      );
    }

    const { rows } = parsed;
    const batchId = `import_${user.id}_${Date.now()}`;
    const assetsToCreate = [];
    const errors = [];
    const duplicateChecker = new DuplicateChecker();
    const existingAssets = new Set();

    // Vorhandene Assets laden (Duplikaterkennung)
    try {
      const userAssets = await base44.entities.AssetPortfolio.filter(
        { user_id: user.id, status: 'active' },
        '',
        5000
      );
      userAssets.forEach(asset => {
        const key = `${asset.isin}|${asset.purchase_date}|${asset.quantity}`;
        existingAssets.add(key);
      });
    } catch (error) {
      console.warn('Could not pre-load existing assets for duplicate detection:', error);
    }

    // Jede Zeile verarbeiten
    for (const row of rows) {
      const rowNumber = row.lineNumber;

      try {
        // Erforderliche Felder prüfen
        const requiredFields = broker_mapping.validation_rules?.required_fields || [];
        const missingFields = requiredFields.filter(field => !row.data[field]);

        if (missingFields.length > 0) {
          errors.push({
            row: rowNumber,
            severity: 'error',
            message: `Erforderliche Felder fehlen: ${missingFields.join(', ')}`
          });
          continue;
        }

        // Datum parsen
        const dateField = Object.keys(row.data).find(
          k => k.toLowerCase().includes('datum') || k.toLowerCase().includes('date')
        );
        if (!dateField) {
          errors.push({
            row: rowNumber,
            severity: 'error',
            message: 'Datum-Spalte nicht gefunden'
          });
          continue;
        }

        let purchaseDate;
        try {
          purchaseDate = parseDate(row.data[dateField], broker_mapping.date_format);
        } catch (dateError) {
          errors.push({
            row: rowNumber,
            severity: 'error',
            message: dateError.message
          });
          continue;
        }

        // Menge parsen
        const quantityField = Object.keys(row.data).find(
          k => k.toLowerCase().includes('anzahl') || k.toLowerCase().includes('nominal') || k.toLowerCase().includes('stück')
        );
        if (!quantityField) {
          errors.push({
            row: rowNumber,
            severity: 'error',
            message: 'Menge-Spalte nicht gefunden'
          });
          continue;
        }

        let quantity;
        try {
          quantity = parseNumber(row.data[quantityField], broker_mapping.decimal_separator);
        } catch (quantityError) {
          errors.push({
            row: rowNumber,
            severity: 'error',
            message: quantityError.message
          });
          continue;
        }

        // Preis parsen
        const priceField = Object.keys(row.data).find(
          k => k.toLowerCase().includes('preis') || k.toLowerCase().includes('kurs')
        );
        if (!priceField) {
          errors.push({
            row: rowNumber,
            severity: 'error',
            message: 'Preis-Spalte nicht gefunden'
          });
          continue;
        }

        let purchasePrice;
        try {
          purchasePrice = parseNumber(row.data[priceField], broker_mapping.decimal_separator);
        } catch (priceError) {
          errors.push({
            row: rowNumber,
            severity: 'error',
            message: priceError.message
          });
          continue;
        }

        // Asset-Name
        const nameField = Object.keys(row.data).find(
          k => k.toLowerCase().includes('name') || k.toLowerCase().includes('gattung')
        );
        const assetName = (nameField && row.data[nameField]) || 'Unnamed Asset';

        // ISIN
        const isinField = Object.keys(row.data).find(k => k.toLowerCase().includes('isin'));
        const isin = (isinField && row.data[isinField]) || '';

        // ISIN validieren
        try {
          validateISIN(isin);
        } catch (isinError) {
          errors.push({
            row: rowNumber,
            severity: 'warning',
            message: isinError.message
          });
          // Warning, aber weitermachen
        }

        // Asset-Daten zusammenstellen
        const assetData = {
          user_id: user.id,
          asset_category: detectAssetCategory(isin),
          name: assetName.trim(),
          isin: isin.trim(),
          purchase_date: purchaseDate,
          purchase_price: purchasePrice,
          quantity: quantity,
          current_value: purchasePrice,
          currency: broker_mapping.currency || 'EUR',
          status: 'active',
          import_source: `csv_${broker_key}`,
          import_batch_id: batchId,
          import_date: new Date().toISOString(),
          import_raw_data: row.data,
          validation_status: 'validated'
        };

        // Duplikat-Prüfung (in dieser Batch-Import)
        if (duplicateChecker.isDuplicate(assetData)) {
          errors.push({
            row: rowNumber,
            severity: 'warning',
            message: `Duplikat in diesem Import (${isin}, ${quantity}x)`
          });
          continue;
        }

        // Duplikat-Prüfung (existierende Assets)
        const existenceKey = `${assetData.isin}|${assetData.purchase_date}|${assetData.quantity}`;
        if (existingAssets.has(existenceKey)) {
          errors.push({
            row: rowNumber,
            severity: 'warning',
            message: `Position existiert bereits (${isin}, ${quantity}x)`
          });
          continue;
        }

        assetsToCreate.push(assetData);

      } catch (error) {
        errors.push({
          row: rowNumber,
          severity: 'error',
          message: `Unerwarteter Fehler: ${error.message}`
        });
      }
    }

    // Assets erstellen (mit Rollback bei kritischen Fehlern)
    let createdCount = 0;
    let createErrors = [];

    if (assetsToCreate.length > 0) {
      try {
        // Batch-Insert mit Fehlerbehandlung
        const results = await base44.asServiceRole.entities.AssetPortfolio.bulkCreate(assetsToCreate);
        createdCount = results.length || 0;

        // ActivityLog
        await base44.entities.ActivityLog.create({
          action: 'csv_import_completed',
          entity_type: 'AssetPortfolio',
          details: {
            batch_id: batchId,
            success_count: createdCount,
            error_count: errors.length,
            total_rows: rows.length
          }
        });

      } catch (createError) {
        createErrors.push({
          row: 'batch_create',
          severity: 'error',
          message: `Datenbankfehler beim Speichern: ${createError.message}`
        });
      }
    }

    // Erfolgs/Fehler-Zusammenfassung
    const allErrors = [...errors, ...createErrors];
    const hasOnlyWarnings = allErrors.every(e => e.severity === 'warning');

    return Response.json({
      success: createdCount > 0,
      success_count: createdCount,
      total_rows: rows.length,
      batch_id: batchId,
      error_count: allErrors.length,
      warning_count: allErrors.filter(e => e.severity === 'warning').length,
      errors: allErrors.length > 0 ? allErrors : null,
      message:
        createdCount > 0
          ? `${createdCount} von ${rows.length} Positionen erfolgreich importiert`
          : 'Kein Import möglich - siehe Fehler unten'
    });

  } catch (error) {
    console.error('Import error:', error);
    return Response.json(
      {
        success: false,
        error: error.message,
        success_count: 0,
        errors: [{ row: 'system', severity: 'error', message: error.message }]
      },
      { status: 500 }
    );
  }
});