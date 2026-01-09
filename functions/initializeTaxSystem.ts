import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Tax Localization Configuration for DACH Region
const COUNTRIES = {
  DE: { code: 'DE', name: 'Deutschland', currency: 'EUR' },
  AT: { code: 'AT', name: 'Österreich', currency: 'EUR' },
  CH: { code: 'CH', name: 'Schweiz', currency: 'CHF' }
};

const SWISS_CANTONS = {
  ZH: 'Zürich', BE: 'Bern', LU: 'Luzern', UR: 'Uri', SZ: 'Schwyz',
  OW: 'Obwalden', NW: 'Nidwalden', GL: 'Glarus', ZG: 'Zug', FR: 'Freiburg',
  SO: 'Solothurn', BS: 'Basel-Stadt', BL: 'Basel-Landschaft', SH: 'Schaffhausen',
  AR: 'Appenzell Ausserrhoden', AI: 'Appenzell Innerrhoden', SG: 'Sankt Gallen',
  GR: 'Graubünden', AG: 'Aargau', TG: 'Thurgau', TI: 'Tessin', VD: 'Waadt',
  VS: 'Wallis', NE: 'Neuenburg', GE: 'Genf', JU: 'Jura'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { country, canton } = await req.json();

    console.log(`Initializing tax system for country: ${country}, canton: ${canton}`);

    if (!COUNTRIES[country]) {
      return Response.json({ error: 'Invalid country' }, { status: 400 });
    }

    if (country === 'CH' && !SWISS_CANTONS[canton]) {
      return Response.json({ error: 'Invalid canton' }, { status: 400 });
    }

    const user = await base44.auth.me();

    // Update user with country and canton
    await base44.auth.updateMe({
      country,
      ...(country === 'CH' && { canton })
    });

    return Response.json({
      success: true,
      message: `Tax system initialized for ${COUNTRIES[country].name}${country === 'CH' ? ` (${SWISS_CANTONS[canton]})` : ''}`,
      user: {
        country,
        canton: country === 'CH' ? canton : null
      }
    });
  } catch (error) {
    console.error('Tax system initialization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});