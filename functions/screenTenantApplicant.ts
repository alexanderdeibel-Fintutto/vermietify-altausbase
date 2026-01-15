import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { applicantId } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // Applicant laden
        const applicants = await base44.entities.TenantApplicant.list();
        const applicant = applicants.find(a => a.id === applicantId);
        if (!applicant) {
            return new Response(JSON.stringify({ error: 'Applicant not found' }), { status: 404 });
        }

        // Screening-Scores berechnen
        const scores = {
            income_score: calculateIncomeScore(applicant),
            credit_score: applicant.credit_score || 50,
            employment_score: calculateEmploymentScore(applicant),
            reference_score: applicant.references?.length * 15 || 0,
            criminal_score: applicant.criminal_record ? 0 : 30
        };

        const total_score = Object.values(scores).reduce((a, b) => a + b, 0);
        const approval_recommendation = total_score >= 70 ? 'APPROVE' : total_score >= 50 ? 'REVIEW' : 'REJECT';

        // Vetting Notes generieren
        const vetting_notes = generateVettingNotes(applicant, scores, approval_recommendation);

        // Applicant aktualisieren
        await base44.entities.TenantApplicant.update(applicantId, {
            status: 'SCREENING',
            vetting_notes
        });

        return new Response(JSON.stringify({
            success: true,
            applicant_id: applicantId,
            scores,
            total_score,
            approval_recommendation,
            vetting_notes
        }), { status: 200 });

    } catch (error) {
        console.error('Error screening tenant:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});

function calculateIncomeScore(applicant) {
    if (!applicant.monthly_income) return 0;
    // Faustformel: Miete sollte max. 30% des Einkommens sein
    // Der Score ist basierend auf verfügbarem Einkommen nach typischen Fixkosten
    return Math.min(40, applicant.monthly_income / 100);
}

function calculateEmploymentScore(applicant) {
    const scores = {
        EMPLOYED: 25,
        SELF_EMPLOYED: 15,
        RETIRED: 20,
        STUDENT: 5,
        UNEMPLOYED: 0
    };
    return scores[applicant.employment_status] || 0;
}

function generateVettingNotes(applicant, scores, recommendation) {
    return `
Screening durchgeführt am: ${new Date().toLocaleDateString('de-DE')}

BEWERTUNG:
- Einkommen-Score: ${scores.income_score}/40
- Beschäftigungs-Score: ${scores.employment_score}/25
- Bonitäts-Score: ${scores.credit_score}/30
- Referenzen-Score: ${Math.min(30, scores.reference_score)}/30
- Führungszeugnis-Score: ${scores.criminal_score}/30

GESAMTSCORE: ${scores.income_score + scores.employment_score + scores.credit_score + Math.min(30, scores.reference_score) + scores.criminal_score}/100

EMPFEHLUNG: ${recommendation}

DETAILS:
- Beschäftigung: ${applicant.employment_status}
- Arbeitgeber: ${applicant.employer || 'N/A'}
- Monatliches Einkommen: €${applicant.monthly_income || 0}
- Bonitätsvermerke: ${applicant.criminal_record ? 'JA - Ablehnungsgrund!' : 'Keine'}
- Referenzen: ${applicant.references?.length || 0}

NÄCHSTE SCHRITTE:
${recommendation === 'APPROVE' ? '✓ Zur Genehmigung empfohlen - Mietvertrag kann unterzeichnet werden' : ''}
${recommendation === 'REVIEW' ? '⚠ Überprüfung erforderlich - Weitere Dokumentation anfordern' : ''}
${recommendation === 'REJECT' ? '✗ Ablehnung empfohlen - Bewerber erfüllt nicht die Anforderungen' : ''}
    `.trim();
}