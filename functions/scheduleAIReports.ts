import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Wöchentlicher Report an alle Admins
        const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });

        for (const admin of admins) {
            // Analyse der letzten 7 Tage
            const { data } = await base44.asServiceRole.functions.invoke('analyzeAICostPatterns', { days: 7 });

            if (data.success) {
                const subject = `📊 Wöchentlicher AI-Report (${data.total_cost.toFixed(2)} €)`;
                
                const body = `
                    <h2>AI-Nutzungsbericht der letzten 7 Tage</h2>
                    
                    <h3>Zusammenfassung</h3>
                    <ul>
                        <li><strong>Gesamtkosten:</strong> €${data.total_cost.toFixed(2)}</li>
                        <li><strong>Requests:</strong> ${data.total_requests}</li>
                        <li><strong>Ø pro Request:</strong> €${(data.total_cost / data.total_requests).toFixed(4)}</li>
                    </ul>

                    <h3>Top 3 Features</h3>
                    <ul>
                        ${Object.entries(data.cost_by_feature || {})
                            .sort((a, b) => b[1].total_cost - a[1].total_cost)
                            .slice(0, 3)
                            .map(([feature, stats]) => 
                                `<li>${feature}: €${stats.total_cost.toFixed(2)} (${stats.total_requests} Requests)</li>`
                            ).join('')}
                    </ul>

                    <h3>Top 3 User</h3>
                    <ul>
                        ${Object.entries(data.cost_by_user || {})
                            .sort((a, b) => b[1].total_cost - a[1].total_cost)
                            .slice(0, 3)
                            .map(([email, stats]) => 
                                `<li>${email}: €${stats.total_cost.toFixed(2)} (${stats.total_requests} Requests)</li>`
                            ).join('')}
                    </ul>

                    ${data.top_opportunities?.length > 0 ? `
                        <h3>🎯 Einsparpotenziale</h3>
                        <ul>
                            ${data.top_opportunities.slice(0, 3).map(opp => 
                                `<li><strong>${opp.title}</strong>: -€${opp.potential_savings_eur.toFixed(2)}/Monat</li>`
                            ).join('')}
                        </ul>
                    ` : ''}

                    <p style="margin-top: 20px;">
                        <a href="${Deno.env.get('BASE_URL') || ''}/AIAdminReporting">→ Zum detaillierten Dashboard</a>
                    </p>
                `;

                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: admin.email,
                    subject,
                    body
                });
            }
        }

        return Response.json({ 
            success: true, 
            reports_sent: admins.length 
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});