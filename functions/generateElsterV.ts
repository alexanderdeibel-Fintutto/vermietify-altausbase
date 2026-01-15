import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { anlageVId, buildingId, taxYear } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // AnlageV laden
        const anlagenV = await base44.entities.AnlageV.list();
        const anlageV = anlagenV.find(a => a.id === anlageVId);
        if (!anlageV) {
            return new Response(JSON.stringify({ error: 'AnlageV not found' }), { status: 404 });
        }

        // Building laden für Daten
        const buildings = await base44.entities.Building.list();
        const building = buildings.find(b => b.id === buildingId);
        if (!building) {
            return new Response(JSON.stringify({ error: 'Building not found' }), { status: 404 });
        }

        // XML generieren (vereinfachtes ELSTER-Format)
        const xml = generateElsterXML({
            user,
            building,
            anlageV,
            taxYear
        });

        // ElsterSubmission erstellen/aktualisieren
        let submission = await base44.entities.ElsterSubmission.filter({
            anlage_v_id: anlageVId,
            tax_year: taxYear
        });

        if (!submission.length) {
            submission = await base44.entities.ElsterSubmission.create({
                tax_year: taxYear,
                anlage_v_id: anlageVId,
                building_id: buildingId,
                xml_content: xml,
                status: 'DRAFT'
            });
            submission = [submission];
        } else {
            await base44.entities.ElsterSubmission.update(submission[0].id, {
                xml_content: xml,
                status: 'VALIDATED'
            });
        }

        return new Response(JSON.stringify({
            success: true,
            submissionId: submission[0].id,
            xml: xml
        }), { status: 200 });

    } catch (error) {
        console.error('Error generating Elster:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});

function generateElsterXML({ user, building, anlageV, taxYear }) {
    const today = new Date().toISOString().split('T')[0];
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<Elster xmlns="http://www.elster.de/elsterxml/schema/v11">
  <TransportBody>
    <Header version="11">
      <HeaderTaxYear>${taxYear}</HeaderTaxYear>
      <HeaderExchangedData>
        <HeaderExchangedDataVersion>20131201</HeaderExchangedDataVersion>
      </HeaderExchangedData>
    </Header>
    <DataTransport version="1">
      <DataTransmitter>
        <TransmitterID>${user.email}</TransmitterID>
      </DataTransmitter>
      <Taxpayer>
        <TaxpayerID>${user.email}</TaxpayerID>
        <TaxYear>${taxYear}</TaxYear>
      </Taxpayer>
      <Content>
        <FormData FormName="Anlage V">
          <Field Name="Property">
            <Value>${building.name || 'Immobilie'}</Value>
          </Field>
          <Field Name="Address">
            <Value>${building.address || ''}</Value>
          </Field>
          <Field Name="TotalRentals">
            <Value>${anlageV.total_rentals || 0}</Value>
          </Field>
          <Field Name="TotalExpenses">
            <Value>${anlageV.total_expenses || 0}</Value>
          </Field>
          <Field Name="NetIncome">
            <Value>${anlageV.net_income || 0}</Value>
          </Field>
          <Field Name="SubmissionDate">
            <Value>${today}</Value>
          </Field>
        </FormData>
      </Content>
    </DataTransport>
  </TransportBody>
</Elster>`;
}