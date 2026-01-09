export const BROKER_MAPPINGS = {
  trade_republic: {
    name: 'trade_republic',
    display_name: 'Trade Republic',
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
    }
  },
  scalable_capital: {
    name: 'scalable_capital',
    display_name: 'Scalable Capital',
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
    }
  },
  ing_diba: {
    name: 'ing_diba',
    display_name: 'ING',
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
    }
  },
  comdirect: {
    name: 'comdirect',
    display_name: 'comdirect',
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
    }
  },
  generic: {
    name: 'generic',
    display_name: 'Allgemeines CSV-Format',
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
    }
  }
};

export const detectBrokerFromCSVHeaders = (headers) => {
  const headerStr = headers.join('|').toLowerCase();
  
  if (headerStr.includes('gattungsbezeichnung') && headerStr.includes('geschäftstag')) return 'comdirect';
  if (headerStr.includes('produktbezeichnung') && headerStr.includes('ausführungsdatum')) return 'ing_diba';
  if (headerStr.includes('gattungsbezeichnung') && headerStr.includes('nominal') && headerStr.includes('notierung')) return 'scalable_capital';
  if (headerStr.includes('typ') && headerStr.includes('anzahl') && headerStr.includes('preis')) return 'trade_republic';
  
  return null;
};