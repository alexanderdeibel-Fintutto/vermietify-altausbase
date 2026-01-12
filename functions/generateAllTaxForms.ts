import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { tax_return_id } = await req.json();

        // Hole TaxReturn
        const [taxReturn] = await base44.asServiceRole.entities.TaxReturn.filter({ id: tax_return_id });
        if (!taxReturn) {
            return Response.json({ error: 'Tax return not found' }, { status: 404 });
        }

        const results = {
            anlage_kap: null,
            anlage_so: null,
            anlage_g: null,
            anlage_vorsorgeaufwand: null,
            mantelbogen: null
        };

        // Prüfe ob Anlagen benötigt werden
        const portfolios = await base44.asServiceRole.entities.Portfolio.list();
        const taxSummaries = await base44.asServiceRole.entities.TaxSummary.filter({ tax_year: taxReturn.tax_year });
        
        const hasCapitalIncome = taxSummaries.some(s => 
            s.total_dividends > 0 || 
            s.total_capital_gains_stocks > 0 || 
            s.total_capital_gains_funds > 0 ||
            s.total_interest > 0
        );

        const taxEvents = await base44.asServiceRole.entities.TaxEvent.list();
        const hasPrivateSales = taxEvents.some(e => 
            e.tax_year === taxReturn.tax_year &&
            ['capital_gains_crypto', 'capital_gains_precious_metals'].includes(e.tax_category) &&
            !e.is_tax_exempt
        );

        const insurances = await base44.asServiceRole.entities.InsuranceContract.list();
        const hasInsurances = insurances.length > 0;

        // Generiere benötigte Anlagen
        const person = 'taxpayer'; // TODO: Bei Zusammenveranlagung beide Personen

        if (hasCapitalIncome) {
            const kapResponse = await base44.functions.invoke('generateAnlageKAP', { 
                tax_return_id, 
                person 
            });
            results.anlage_kap = kapResponse.data.anlage_kap;
        }

        if (hasPrivateSales) {
            const soResponse = await base44.functions.invoke('generateAnlageSO', { 
                tax_return_id, 
                person 
            });
            results.anlage_so = soResponse.data.anlage_so;
        }

        if (hasInsurances) {
            const vorsorgeResponse = await base44.functions.invoke('generateAnlageVorsorgeaufwand', { 
                tax_return_id, 
                person 
            });
            results.anlage_vorsorgeaufwand = vorsorgeResponse.data.anlage_vorsorgeaufwand;
        }

        // Generiere Mantelbogen als letztes
        const mantelbogenResponse = await base44.functions.invoke('generateEstMantelbogen', { 
            tax_return_id 
        });
        results.mantelbogen = mantelbogenResponse.data.mantelbogen;

        // Kreuzvalidierung
        const allValid = [
            results.anlage_kap?.is_valid !== false,
            results.anlage_so?.is_valid !== false,
            results.anlage_vorsorgeaufwand?.is_valid !== false,
            results.mantelbogen?.is_valid !== false
        ].every(v => v);

        // Aktualisiere TaxReturn Status
        if (allValid) {
            await base44.asServiceRole.entities.TaxReturn.update(tax_return_id, {
                status: 'ready_for_review'
            });
        }

        return Response.json({ 
            success: true, 
            results,
            all_valid: allValid,
            message: allValid ? 'Alle Formulare erfolgreich generiert' : 'Formulare generiert mit Validierungsfehlern'
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});