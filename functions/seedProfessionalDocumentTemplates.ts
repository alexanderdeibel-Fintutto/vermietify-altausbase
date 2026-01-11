import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const templates = [
      // 1. MIETVERTRAG
      {
        document_type: 'mietvertrag',
        template_html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 900px; margin: 0 auto; padding: 40px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #1e40af; padding-bottom: 20px;">
              <h1 style="margin: 0; color: #1e40af; font-size: 28px; font-weight: 700;">MIETVERTRAG</h1>
              <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 13px;">Für Wohnraum nach deutschem Mietrecht (BGB)</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f3f4f6; padding: 20px; border-radius: 8px;">
              <div>
                <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 13px; font-weight: 600; text-transform: uppercase;">Vermietende Partei</h3>
                <p style="margin: 0; color: #111827; font-weight: 600;">{{landlord_name}}</p>
                <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 13px;">{{landlord_address}}</p>
              </div>
              <div>
                <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 13px; font-weight: 600; text-transform: uppercase;">Mietende Partei</h3>
                <p style="margin: 0; color: #111827; font-weight: 600;">{{tenant_first_name}} {{tenant_last_name}}</p>
                <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 13px;">{{tenant_address}}</p>
              </div>
            </div>

            <h2 style="color: #1e40af; font-size: 16px; font-weight: 700; margin-bottom: 15px; border-bottom: 2px solid #dbeafe; padding-bottom: 10px;">1. MIETOBJEKT</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr style="background: #f9fafb;">
                <td style="padding: 10px; border: 1px solid #e5e7eb; width: 40%; font-weight: 600; color: #374151;">Anschrift:</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; color: #111827;">{{property_address}}, {{property_postal_code}} {{property_city}}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Wohnfläche:</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; color: #111827;">{{property_sqm}} m²</td>
              </tr>
              <tr style="background: #f9fafb;">
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Zimmer:</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; color: #111827;">{{property_rooms}}</td>
              </tr>
            </table>

            <h2 style="color: #1e40af; font-size: 16px; font-weight: 700; margin-bottom: 15px; border-bottom: 2px solid #dbeafe; padding-bottom: 10px;">2. MIETDAUER</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr style="background: #f9fafb;">
                <td style="padding: 10px; border: 1px solid #e5e7eb; width: 40%; font-weight: 600; color: #374151;">Mietbeginn:</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; color: #111827;">{{contract_start_date}}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Mietende:</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; color: #111827;">{{contract_end_date}}</td>
              </tr>
              <tr style="background: #f9fafb;">
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Art des Mietverhältnisses:</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; color: #111827;">{{contract_type}}</td>
              </tr>
            </table>

            <h2 style="color: #1e40af; font-size: 16px; font-weight: 700; margin-bottom: 15px; border-bottom: 2px solid #dbeafe; padding-bottom: 10px;">3. MIETZAHLUNG</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr style="background: #f9fafb;">
                <td style="padding: 10px; border: 1px solid #e5e7eb; width: 40%; font-weight: 600; color: #374151;">Kaltmiete monatlich:</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; color: #111827; font-weight: 600;">{{base_rent}} EUR</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Nebenkosten monatlich:</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; color: #111827; font-weight: 600;">{{utilities}} EUR</td>
              </tr>
              <tr style="background: #fef3c7;">
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 700; color: #78350f;">GESAMTMIETE monatlich:</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; color: #78350f; font-weight: 700; font-size: 15px;">{{total_rent}} EUR</td>
              </tr>
              <tr style="background: #f9fafb;">
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Zahlungsart:</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; color: #111827;">{{payment_method}}</td>
              </tr>
            </table>

            <h2 style="color: #1e40af; font-size: 16px; font-weight: 700; margin-bottom: 15px; border-bottom: 2px solid #dbeafe; padding-bottom: 10px;">4. KAUTION</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr style="background: #f9fafb;">
                <td style="padding: 10px; border: 1px solid #e5e7eb; width: 40%; font-weight: 600; color: #374151;">Kautionsbetrag:</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; color: #111827; font-weight: 600;">{{deposit}} EUR</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Zahlungstermin:</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; color: #111827;">{{deposit_due_date}}</td>
              </tr>
            </table>

            <div style="margin-top: 40px; padding: 20px; background: #eff6ff; border-left: 4px solid #1e40af; border-radius: 4px;">
              <p style="margin: 0; color: #1e3a8a; font-size: 13px; font-weight: 600;">Unterschriften</p>
              <div style="margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <div>
                  <p style="margin: 0 0 40px 0; border-bottom: 1px solid #1e40af; min-height: 30px;"></p>
                  <p style="margin: 0; color: #374151; font-weight: 600; font-size: 13px;">Vermietende Partei</p>
                </div>
                <div>
                  <p style="margin: 0 0 40px 0; border-bottom: 1px solid #1e40af; min-height: 30px;"></p>
                  <p style="margin: 0; color: #374151; font-weight: 600; font-size: 13px;">Mietende Partei</p>
                </div>
              </div>
            </div>
          </div>
        `,
        template_fields: [
          { id: 'landlord_name', name: 'landlord_name', type: 'text', required: true },
          { id: 'landlord_address', name: 'landlord_address', type: 'text', required: true },
          { id: 'tenant_first_name', name: 'tenant_first_name', type: 'text', required: true },
          { id: 'tenant_last_name', name: 'tenant_last_name', type: 'text', required: true },
          { id: 'tenant_address', name: 'tenant_address', type: 'text', required: true },
          { id: 'property_address', name: 'property_address', type: 'text', required: true },
          { id: 'property_postal_code', name: 'property_postal_code', type: 'text', required: true },
          { id: 'property_city', name: 'property_city', type: 'text', required: true },
          { id: 'property_sqm', name: 'property_sqm', type: 'number', required: true },
          { id: 'property_rooms', name: 'property_rooms', type: 'number', required: false },
          { id: 'contract_start_date', name: 'contract_start_date', type: 'date', required: true },
          { id: 'contract_end_date', name: 'contract_end_date', type: 'date', required: false },
          { id: 'contract_type', name: 'contract_type', type: 'text', required: true },
          { id: 'base_rent', name: 'base_rent', type: 'currency', required: true },
          { id: 'utilities', name: 'utilities', type: 'currency', required: false },
          { id: 'total_rent', name: 'total_rent', type: 'currency', required: true },
          { id: 'payment_method', name: 'payment_method', type: 'text', required: true },
          { id: 'deposit', name: 'deposit', type: 'currency', required: true },
          { id: 'deposit_due_date', name: 'deposit_due_date', type: 'date', required: true }
        ],
        description: 'Professioneller Mietvertrag für Wohnraum'
      }
    ];

    for (const template of templates) {
      await base44.entities.DocumentTemplate.create(template);
    }

    return Response.json({ success: true, created: 1 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});