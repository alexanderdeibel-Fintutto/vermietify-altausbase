// Lokalisierungs-Engine für mehrsprachige & länderspezifische Ausgabe

const translations = {
  DE: {
    income: 'Einkommen',
    expenses: 'Ausgaben',
    tax: 'Steuer',
    refund: 'Rückerstattung',
    payment: 'Nachzahlung',
    deduction: 'Abzug',
    total_income: 'Gesamteinkommen',
    taxable_income: 'Zu versteuerndes Einkommen',
    tax_rate: 'Steuersatz',
    effective_rate: 'Effektiver Steuersatz',
    federal_tax: 'Bundessteuer',
    cantonal_tax: 'Kantonalsteuer',
    municipal_tax: 'Gemeindesteuer',
    wealth_tax: 'Vermögenssteuer',
    currency_eur: '€',
    currency_chf: 'CHF',
    date_format: 'dd.MM.yyyy'
  },
  EN: {
    income: 'Income',
    expenses: 'Expenses',
    tax: 'Tax',
    refund: 'Refund',
    payment: 'Payment',
    deduction: 'Deduction',
    total_income: 'Total Income',
    taxable_income: 'Taxable Income',
    tax_rate: 'Tax Rate',
    effective_rate: 'Effective Tax Rate',
    federal_tax: 'Federal Tax',
    cantonal_tax: 'Cantonal Tax',
    municipal_tax: 'Municipal Tax',
    wealth_tax: 'Wealth Tax',
    currency_eur: '€',
    currency_chf: 'CHF',
    date_format: 'MM/dd/yyyy'
  }
};

const currencyFormats = {
  AT: { symbol: '€', position: 'after', locale: 'de-AT' },
  CH: { symbol: 'CHF', position: 'before', locale: 'de-CH' },
  DE: { symbol: '€', position: 'after', locale: 'de-DE' }
};

export class LocalizationEngine {
  constructor(country = 'DE', language = 'DE') {
    this.country = country;
    this.language = language;
    this.translations = translations[language] || translations.DE;
    this.currencyFormat = currencyFormats[country] || currencyFormats.DE;
  }

  t(key) {
    return this.translations[key] || key;
  }

  formatCurrency(amount) {
    const formatted = new Intl.NumberFormat(this.currencyFormat.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);

    return this.currencyFormat.position === 'before'
      ? `${this.currencyFormat.symbol} ${formatted}`
      : `${formatted} ${this.currencyFormat.symbol}`;
  }

  formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    if (this.currencyFormat.locale.startsWith('de')) {
      return `${day}.${month}.${year}`;
    } else {
      return `${month}/${day}/${year}`;
    }
  }

  formatTaxReport(data) {
    return {
      ...data,
      formatted_total_income: this.formatCurrency(data.total_income || 0),
      formatted_taxable_income: this.formatCurrency(data.taxable_income || 0),
      formatted_tax: this.formatCurrency(data.tax || 0),
      formatted_refund: this.formatCurrency(Math.abs(data.refund || 0)),
      formatted_date: this.formatDate(new Date()),
      tax_rate_display: `${(data.tax_rate || 0).toFixed(2)}%`,
      effective_rate_display: `${(data.effective_rate || 0).toFixed(2)}%`,
      labels: {
        income: this.t('total_income'),
        taxable: this.t('taxable_income'),
        tax: this.t('tax'),
        rate: this.t('tax_rate'),
        effective: this.t('effective_rate')
      }
    };
  }
}

// Server endpoint
Deno.serve(async (req) => {
  try {
    const { country = 'DE', language = 'DE', data } = await req.json();

    const l10n = new LocalizationEngine(country, language);
    const formatted = l10n.formatTaxReport(data || {});

    return Response.json({
      status: 'success',
      localized: formatted
    });
  } catch (error) {
    console.error('Localization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});