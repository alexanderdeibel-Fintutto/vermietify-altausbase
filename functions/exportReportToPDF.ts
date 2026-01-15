import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { reportData, reportType, title } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Generiere HTML für einen professionellen ${reportType} PDF-Report:

Titel: ${title}
Daten: ${JSON.stringify(reportData, null, 2)}

Erstelle vollständiges, druckfreundliches HTML mit eingebettetem CSS für einen ${reportType}-Bericht.
Nutze professionelle Styling mit Farben, Tabellen und Diagrammen.`,
            response_json_schema: {
                type: 'object',
                properties: {
                    html: { type: 'string' }
                }
            }
        });

        return new Response(JSON.stringify({
            success: true,
            html: response.html
        }), { status: 200 });

    } catch (error) {
        console.error('PDF export error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});