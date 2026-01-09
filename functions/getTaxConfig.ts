import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const TAX_FORMS_BY_COUNTRY = {
  DE: [
    { id: 'anlage_v', name: 'Anlage V', description: 'Vermietung & Verpachtung', module: 'steuer' },
    { id: 'anlage_kap', name: 'Anlage KAP', description: 'Kapitalvermögen', module: 'steuer' },
    { id: 'anlage_so', name: 'Anlage SO', description: 'Sonstige Einkünfte', module: 'steuer' },
    { id: 'anlage_vg', name: 'Anlage VG', description: 'Veräußerungsgewinne', module: 'steuer' }
  ],
  AT: [
    { id: 'anlage_e1kv', name: 'Beilage E1kv', description: 'Kapitalvermögen', module: 'steuer_at' },
    { id: 'anlage_e1c', name: 'Beilage E1c', description: 'Vermietung & Verpachtung', module: 'steuer_at' },
    { id: 'anlage_e1', name: 'E1', description: 'Einkommensteuererklärung', module: 'steuer_at' }
  ],
  CH: [
    { id: 'wertschriftenverzeichnis', name: 'Wertschriftenverzeichnis', description: 'Wertschriften & Vermögen', module: 'steuer_ch' },
    { id: 'liegenschaftenverzeichnis', name: 'Liegenschaftenverzeichnis', description: 'Immobilien', module: 'steuer_ch' }
  ]
};

const SUBMISSION_SYSTEMS = {
  DE: {
    system: 'ELSTER',
    description: 'Elektronische Steuererklärung (ELSTER)',
    supportedFormats: ['xml', 'pdf'],
    apiAvailable: true,
    testMode: true
  },
  AT: {
    system: 'FINANZOnline',
    description: 'Österreichisches Online-Portal für Steuererklärungen',
    supportedFormats: ['xml', 'pdf'],
    apiAvailable: true,
    testMode: true
  },
  CH: {
    system: 'kantonal',
    description: 'Kantonal unterschiedliche E-Tax/TaxMe-Online Portale',
    supportedFormats: ['pdf', 'xml'],
    apiAvailable: false,
    testMode: true,
    note: 'Abhängig vom Kanton'
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { country } = await req.json();

    const user = await base44.auth.me();
    const userCountry = user.country || country;

    if (!userCountry) {
      return Response.json({
        error: 'Country not set',
        message: 'Bitte konfigurieren Sie zuerst Ihr Steuersystem'
      }, { status: 400 });
    }

    return Response.json({
      success: true,
      country: userCountry,
      canton: user.canton || null,
      forms: TAX_FORMS_BY_COUNTRY[userCountry] || [],
      submission: SUBMISSION_SYSTEMS[userCountry] || {},
      taxYear: new Date().getFullYear()
    });
  } catch (error) {
    console.error('Error getting tax config:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});