import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Submit tax forms to Swiss Cantonal e-tax portals
 * Supports multiple cantons with different APIs
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { tax_form_id, tax_year, canton, form_type } = await req.json();

        // Fetch tax form
        const taxForm = await base44.entities.TaxForm.filter(
            { id: tax_form_id },
            '-updated_date',
            1
        );

        if (!taxForm || taxForm.length === 0) {
            return Response.json({ error: 'Tax form not found' }, { status: 404 });
        }

        // Route to appropriate cantonal portal
        const cantonPortals = {
            ZH: submitToZurich,      // Zurich
            BE: submitToBern,        // Bern
            AG: submitToAargau,      // Aargau
            SG: submitToSaintGallen, // St. Gallen
            BS: submitToBaselStadt,  // Basel-Stadt
            // Add more cantons as needed
        };

        const submitter = cantonPortals[canton];
        if (!submitter) {
            return Response.json({ 
                error: `Canton ${canton} not yet supported` 
            }, { status: 400 });
        }

        const result = await submitter(taxForm[0], user);

        // Log submission
        await base44.asServiceRole.entities.ElsterSubmission.create({
            user_email: user.email,
            country: 'CH',
            tax_year,
            canton,
            form_type,
            status: 'submitted',
            submission_id: result.submission_id,
            submission_date: new Date().toISOString(),
            source_system: `CANTONAL_${canton}`,
            source_reference: result.submission_id
        });

        return Response.json({
            success: true,
            submission_id: result.submission_id,
            status: 'submitted',
            canton,
            message: `Steuererklärung für ${canton} eingereicht`
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});

async function submitToZurich(taxForm, user) {
    // Zurich e-tax portal API
    const response = await fetch('https://www.myprofessional.zh.ch/api/submit', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${Deno.env.get('ZURICH_ETAX_TOKEN')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            taxpayer_id: taxForm.pin,
            tax_year: taxForm.tax_year,
            form_data: taxForm.form_data,
            submission_type: 'ELECTRONIC'
        })
    });
    
    if (!response.ok) throw new Error('Zurich submission failed');
    const data = await response.json();
    return { submission_id: data.submission_reference };
}

async function submitToBern(taxForm, user) {
    // Bern cantonal portal
    const response = await fetch('https://steuerveranlagung.be.ch/api/submit', {
        method: 'POST',
        headers: {
            'X-API-Key': Deno.env.get('BERN_ETAX_API_KEY'),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            taxpayer_id: taxForm.pin,
            tax_year: taxForm.tax_year,
            form_data: taxForm.form_data
        })
    });
    
    if (!response.ok) throw new Error('Bern submission failed');
    const data = await response.json();
    return { submission_id: data.reference_number };
}

async function submitToAargau(taxForm, user) {
    // Aargau portal
    const response = await fetch('https://etax.ag.ch/api/declaration/submit', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${Deno.env.get('AARGAU_ETAX_TOKEN')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            taxpayer_id: taxForm.pin,
            tax_year: taxForm.tax_year,
            form_data: taxForm.form_data
        })
    });
    
    if (!response.ok) throw new Error('Aargau submission failed');
    const data = await response.json();
    return { submission_id: data.submission_id };
}

async function submitToSaintGallen(taxForm, user) {
    // St. Gallen portal
    const response = await fetch('https://steuererklarung.sg.ch/api/submit', {
        method: 'POST',
        headers: {
            'X-Service-Token': Deno.env.get('SG_ETAX_TOKEN'),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            steuerpflichtige_id: taxForm.pin,
            steuerjahr: taxForm.tax_year,
            formular_daten: taxForm.form_data
        })
    });
    
    if (!response.ok) throw new Error('St. Gallen submission failed');
    const data = await response.json();
    return { submission_id: data.einreichungs_nr };
}

async function submitToBaselStadt(taxForm, user) {
    // Basel-Stadt portal
    const response = await fetch('https://bs-steueramt.portal.bs.ch/api/submit', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${Deno.env.get('BASEL_STADT_ETAX_TOKEN')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            taxpayer_id: taxForm.pin,
            tax_year: taxForm.tax_year,
            form_data: taxForm.form_data
        })
    });
    
    if (!response.ok) throw new Error('Basel-Stadt submission failed');
    const data = await response.json();
    return { submission_id: data.submission_reference };
}