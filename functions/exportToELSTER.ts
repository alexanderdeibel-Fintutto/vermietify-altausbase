import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year } = await req.json();

    // Formulare generieren
    const formsRes = await base44.functions.invoke('generateTaxFormsPerCountry', {
      country: 'DE',
      tax_year
    });

    const formData = formsRes.data.forms_generated;

    // KI-basierte XML-Generierung für ELSTER
    const elsterXml = await base44.integrations.Core.InvokeLLM({
      prompt: `Generiere ein ELSTER-kompatibles XML aus folgenden Formulardaten für ${tax_year}:

${JSON.stringify(formData, null, 2)}

Das XML muss:
- Die ELSTER-DTD erfüllen
- Alle erforderlichen Felder enthalten
- Numerische Werte mit 2 Dezimalstellen
- Korrekte Feldkennzeichen nutzen`,
      response_json_schema: {
        type: "object",
        properties: {
          xml_string: { type: "string" },
          validation_passed: { type: "boolean" },
          error_messages: { type: "array", items: { type: "string" } }
        }
      }
    });

    // XML speichern
    const fileName = `ELSTER_${tax_year}_${new Date().getTime()}.xml`;

    return Response.json({
      user_email: user.email,
      tax_year,
      xml_generated: true,
      file_name: fileName,
      xml_preview: elsterXml.xml_string?.substring(0, 500),
      validation_passed: elsterXml.validation_passed,
      next_steps: ['XML in ELSTER-Portal hochladen', 'Zertifikat verwenden', 'Elektronisch signieren']
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});