import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { message, conversationHistory = [], leaseId } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // Lease & Tenant Kontext laden
        let leaseContext = '';
        if (leaseId) {
            const leases = await base44.entities.LeaseContract.list();
            const lease = leases.find(l => l.id === leaseId);
            if (lease) {
                const units = await base44.entities.Unit.list();
                const unit = units.find(u => u.id === lease.unit_id);
                leaseContext = `
Mietvertrag: ${lease.tenant_name}
Einheit: ${unit?.unit_number}
Miete: €${lease.monthly_rent}/Monat
Kaution: €${lease.security_deposit || 0}
Start: ${new Date(lease.start_date).toLocaleDateString('de-DE')}
${lease.end_date ? `Ende: ${new Date(lease.end_date).toLocaleDateString('de-DE')}` : 'Unbefristet'}
                `;
            }
        }

        const systemPrompt = `Du bist ein hilfreicher Mieterverwaltungs-Assistent für die Immobilienverwaltung. 
Du kannst Fragen beantworten zu:
- Mietverträgen und Mietrecht
- Betriebskosten und Nebenkostenabrechnung
- Instandhaltungs- und Reparaturanfragen
- Zahlungen und Gebühren
- Allgemeine Verwaltungsfragen

${leaseContext ? `Mieterdaten:\n${leaseContext}` : ''}

Sei prägnant, hilfreich und professional. Wenn eine Frage außerhalb deiner Zuständigkeit liegt, verweise auf den Vermieter.`;

        const messages = [
            ...conversationHistory.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            { role: 'user', content: message }
        ];

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: JSON.stringify({
                system: systemPrompt,
                messages: messages
            }),
            add_context_from_internet: false
        });

        return new Response(JSON.stringify({
            success: true,
            message: response,
            timestamp: new Date().toISOString()
        }), { status: 200 });

    } catch (error) {
        console.error('Chatbot error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});