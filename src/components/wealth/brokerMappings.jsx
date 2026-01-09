// Broker-spezifische CSV-Mapping-Konfigurationen
export const BROKER_MAPPINGS = {
  TRADE_REPUBLIC: {
    name: 'trade_republic',
    display_name: 'Trade Republic',
    csv_format_version: '1.0',
    date_format: 'DD.MM.YYYY',
    decimal_separator: ',',
    encoding: 'UTF-8',
    skip_header_rows: 1,
    column_mappings: {
      'Typ': 'transaction_type',
      'Datum': 'date',
      'ISIN': 'isin',
      'Name': 'asset_name',
      'Anzahl': 'quantity',
      'Preis': 'price',
      'Währung': 'currency'
    },
    validation_rules: {
      required_fields: ['ISIN', 'Datum', 'Anzahl', 'Preis'],
      numeric_fields: ['Anzahl', 'Preis'],
      date_field: 'Datum'
    }
  },

  SCALABLE_CAPITAL: {
    name: 'scalable_capital',
    display_name: 'Scalable Capital',
    csv_format_version: '1.0',
    date_format: 'YYYY-MM-DD',
    decimal_separator: '.',
    encoding: 'UTF-8',
    skip_header_rows: 1,
    column_mappings: {
      'Gattungsbezeichnung': 'asset_name',
      'ISIN': 'isin',
      'Notierung': 'currency',
      'Datum': 'date',
      'Nominal': 'quantity',
      'Kurs': 'price'
    },
    validation_rules: {
      required_fields: ['ISIN', 'Datum', 'Nominal', 'Kurs'],
      numeric_fields: ['Nominal', 'Kurs'],
      date_field: 'Datum'
    }
  },

  ING_DIBA: {
    name: 'ing_diba',
    display_name: 'ING',
    csv_format_version: '1.0',
    date_format: 'DD.MM.YYYY',
    decimal_separator: ',',
    encoding: 'ISO-8859-1',
    skip_header_rows: 1,
    column_mappings: {
      'Produktbezeichnung': 'asset_name',
      'ISIN': 'isin',
      'Ausführungsdatum': 'date',
      'Stück': 'quantity',
      'Ausführungskurs': 'price'
    },
    validation_rules: {
      required_fields: ['ISIN', 'Ausführungsdatum', 'Stück', 'Ausführungskurs'],
      numeric_fields: ['Stück', 'Ausführungskurs'],
      date_field: 'Ausführungsdatum'
    }
  },

  COMDIRECT: {
    name: 'comdirect',
    display_name: 'comdirect',
    csv_format_version: '1.0',
    date_format: 'DD.MM.YYYY',
    decimal_separator: ',',
    encoding: 'UTF-8',
    skip_header_rows: 1,
    column_mappings: {
      'Gattungsbezeichnung': 'asset_name',
      'ISIN': 'isin',
      'Geschäftstag': 'date',
      'Nominal': 'quantity',
      'Kurs': 'price',
      'Währung': 'currency'
    },
    validation_rules: {
      required_fields: ['ISIN', 'Geschäftstag', 'Nominal', 'Kurs'],
      numeric_fields: ['Nominal', 'Kurs'],
      date_field: 'Geschäftstag'
    }
  },

  GENERIC: {
    name: 'generic',
    display_name: 'Allgemeines CSV-Format',
    csv_format_version: '1.0',
    date_format: 'DD.MM.YYYY',
    decimal_separator: ',',
    encoding: 'UTF-8',
    skip_header_rows: 1,
    column_mappings: {
      'Name': 'asset_name',
      'ISIN': 'isin',
      'Datum': 'date',
      'Anzahl': 'quantity',
      'Preis': 'price',
      'Kategorie': 'asset_category'
    },
    validation_rules: {
      required_fields: ['ISIN', 'Datum', 'Anzahl', 'Preis'],
      numeric_fields: ['Anzahl', 'Preis'],
      date_field: 'Datum'
    }
  }
};

// Getter-Funktionen
export const getBrokerMappings = () => {
  return Object.entries(BROKER_MAPPINGS).map(([key, mapping]) => ({
    id: key,
    ...mapping
  }));
};

export const getBrokerMappingByName = (brokerName) => {
  return Object.values(BROKER_MAPPINGS).find(m => m.name === brokerName);
};

export const getBrokerMappingById = (brokerId) => {
  return BROKER_MAPPINGS[brokerId];
};

// CSV-Spalten-Auto-Detection Funktion
export const detectBrokerFromCSVHeaders = (headers) => {
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
  
  // Scoring-System: Welcher Broker passt am besten?
  const scores = {};
  
  Object.entries(BROKER_MAPPINGS).forEach(([key, mapping]) => {
    const mappedColumns = Object.keys(mapping.column_mappings);
    let matchCount = 0;
    
    mappedColumns.forEach(col => {
      if (normalizedHeaders.includes(col.toLowerCase())) {
        matchCount++;
      }
    });
    
    scores[key] = matchCount;
  });
  
  // Broker mit höchstem Score
  const bestMatch = Object.entries(scores).sort(([, a], [, b]) => b - a)[0];
  return bestMatch ? bestMatch[0] : null;
};