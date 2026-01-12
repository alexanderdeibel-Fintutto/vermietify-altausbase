import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(req.url);
        const searchTerm = url.searchParams.get('search') || '';
        const bundesland = url.searchParams.get('bundesland') || '';

        // Hole ELSTER Settings
        const settings = await base44.asServiceRole.entities.ElsterSettings.filter({ user_email: user.email });
        const ericServiceUrl = settings[0]?.eric_service_url || Deno.env.get('ERIC_SERVICE_URL');
        const ericApiKey = Deno.env.get('ERIC_SERVICE_API_KEY');

        // Rufe ERiC-Microservice auf (falls verfügbar)
        if (ericServiceUrl) {
            try {
                const response = await fetch(`${ericServiceUrl}/masterdata/tax-offices?search=${searchTerm}&bundesland=${bundesland}`, {
                    method: 'GET',
                    headers: {
                        'X-API-Key': ericApiKey
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    return Response.json(result);
                }
            } catch (error) {
                console.error('ERiC service not available, using fallback');
            }
        }

        // Fallback: Statische Liste (Auszug wichtigster Finanzämter)
        const taxOffices = [
            { number: '1010', name: 'Finanzamt Berlin Charlottenburg', plz: '10707', city: 'Berlin', bundesland: 'Berlin' },
            { number: '1020', name: 'Finanzamt Berlin Mitte/Tiergarten', plz: '10178', city: 'Berlin', bundesland: 'Berlin' },
            { number: '1030', name: 'Finanzamt Berlin Neukölln', plz: '12043', city: 'Berlin', bundesland: 'Berlin' },
            { number: '9101', name: 'Finanzamt München', plz: '80538', city: 'München', bundesland: 'Bayern' },
            { number: '9102', name: 'Finanzamt München-Abteilung II', plz: '80335', city: 'München', bundesland: 'Bayern' },
            { number: '5101', name: 'Finanzamt Hamburg', plz: '20095', city: 'Hamburg', bundesland: 'Hamburg' },
            { number: '5301', name: 'Finanzamt Köln', plz: '50667', city: 'Köln', bundesland: 'Nordrhein-Westfalen' },
            { number: '5401', name: 'Finanzamt Frankfurt am Main', plz: '60327', city: 'Frankfurt', bundesland: 'Hessen' },
            { number: '2301', name: 'Finanzamt Stuttgart', plz: '70173', city: 'Stuttgart', bundesland: 'Baden-Württemberg' }
        ];

        // Filter
        let filtered = taxOffices;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(office => 
                office.name.toLowerCase().includes(term) ||
                office.city.toLowerCase().includes(term) ||
                office.plz.includes(term) ||
                office.number.includes(term)
            );
        }
        if (bundesland) {
            filtered = filtered.filter(office => office.bundesland === bundesland);
        }

        return Response.json({ tax_offices: filtered });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});