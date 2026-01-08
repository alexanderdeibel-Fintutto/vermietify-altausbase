import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    const submission = await base44.asServiceRole.entities.ElsterSubmission.get(submission_id);
    
    if (!submission) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Template laden oder erstellen
    const templates = await base44.asServiceRole.entities.ElsterFormTemplate.filter({
      form_type: submission.tax_form_type,
      legal_form: submission.legal_form,
      year: submission.tax_year,
      is_active: true
    });

    let xmlTemplate;
    if (templates.length === 0) {
      xmlTemplate = generateDefaultTemplate(submission.tax_form_type, submission.legal_form);
    } else {
      xmlTemplate = templates[0].xml_template;
    }

    // Form-Data in XML einsetzen
    const xml = fillTemplate(xmlTemplate, submission.form_data);

    // XML in Submission speichern
    await base44.asServiceRole.entities.ElsterSubmission.update(submission_id, {
      xml_data: xml,
      status: 'VALIDATED'
    });

    return Response.json({
      success: true,
      xml_preview: xml.substring(0, 500) + '...',
      xml_length: xml.length
    });

  } catch (error) {
    console.error('Error generating ELSTER XML:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateDefaultTemplate(formType, legalForm) {
  const namespace = getNamespace(formType);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<Elster xmlns="${namespace}">
  <TransferHeader version="11">
    <Verfahren>ElsterAnmeldung</Verfahren>
    <DatenArt>${formType}</DatenArt>
    <Vorgang>send-NoSig</Vorgang>
    <TransferTicket>{{transfer_ticket}}</TransferTicket>
    <Testmerker>{{test_flag}}</Testmerker>
  </TransferHeader>
  <DatenTeil>
    <Nutzdatenblock>
      <NutzdatenHeader version="11">
        <NutzdatenTicket>{{nutzdaten_ticket}}</NutzdatenTicket>
      </NutzdatenHeader>
      <Nutzdaten>
        ${getFormXML(formType)}
      </Nutzdaten>
    </Nutzdatenblock>
  </DatenTeil>
</Elster>`;
}

function getNamespace(formType) {
  const namespaces = {
    'ANLAGE_V': 'http://finkonsens.de/elster/elstererklarung/anlagev/v2024',
    'EUER': 'http://finkonsens.de/elster/elstererklarung/euer/v2024',
    'EST1B': 'http://finkonsens.de/elster/elstererklarung/est1b/v2024',
    'GEWERBESTEUER': 'http://finkonsens.de/elster/elstererklarung/gewst/v2024',
    'UMSATZSTEUER': 'http://finkonsens.de/elster/elsteranmeldung/ustva/v2024'
  };
  return namespaces[formType] || namespaces['ANLAGE_V'];
}

function getFormXML(formType) {
  // Vereinfachte Templates - in Produktion würden hier die vollständigen Schemas sein
  const templates = {
    'ANLAGE_V': `
      <AnlageV>
        <Adresse>{{address}}</Adresse>
        <Einnahmen>{{income}}</Einnahmen>
        <Werbungskosten>{{expenses}}</Werbungskosten>
        <AfA>{{depreciation}}</AfA>
      </AnlageV>`,
    'EUER': `
      <EUeR>
        <Betriebseinnahmen>{{revenue}}</Betriebseinnahmen>
        <Betriebsausgaben>{{expenses}}</Betriebsausgaben>
        <Gewinn>{{profit}}</Gewinn>
      </EUeR>`
  };
  return templates[formType] || templates['ANLAGE_V'];
}

function fillTemplate(template, data) {
  let filled = template;
  
  // Platzhalter ersetzen
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`;
    filled = filled.replaceAll(placeholder, String(value || ''));
  }
  
  // Defaults für nicht gesetzte Werte
  filled = filled.replaceAll(/\{\{[^}]+\}\}/g, '');
  
  return filled;
}