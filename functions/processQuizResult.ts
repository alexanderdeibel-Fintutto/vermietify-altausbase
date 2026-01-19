import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { quiz_type, answers, user_email, session_id } = await req.json();

        if (!quiz_type || !answers) {
            return Response.json({ error: 'Quiz-Type und Antworten sind erforderlich' }, { status: 400 });
        }

        // Calculate score and determine result category
        let score = 0;
        let max_score = 0;
        let result_category = '';
        let result_title = '';
        let result_description = '';
        let recommendations = [];

        // Process based on quiz type
        if (quiz_type === 'investor_profil') {
            // Score calculation for investor profile
            max_score = Object.keys(answers).length * 10;
            
            // Sum up scores from answers
            Object.values(answers).forEach(answer => {
                if (typeof answer === 'number') {
                    score += answer;
                }
            });

            const percentage = (score / max_score) * 100;

            if (percentage >= 70) {
                result_category = 'aggressiv';
                result_title = 'Aggressiver Investor';
                result_description = 'Sie haben ein hohes Risikoprofil und sind bereit, für höhere Renditen mehr Risiko einzugehen.';
                recommendations = [
                    'Fokus auf Wertsteigerung und Entwicklungspotenzial',
                    'Investition in Sanierungsobjekte',
                    'Höherer Fremdkapitalanteil möglich'
                ];
            } else if (percentage >= 40) {
                result_category = 'balanced';
                result_title = 'Ausgewogener Investor';
                result_description = 'Sie bevorzugen eine ausgewogene Mischung aus Sicherheit und Rendite.';
                recommendations = [
                    'Mix aus Bestandsobjekten und Wertsteigerungspotenzial',
                    'Moderate Fremdkapitalquote',
                    'Diversifikation über mehrere Objekte'
                ];
            } else {
                result_category = 'konservativ';
                result_title = 'Konservativer Investor';
                result_description = 'Sie legen Wert auf Sicherheit und stabile Cashflows.';
                recommendations = [
                    'Fokus auf stabile Mieteinnahmen',
                    'Investition in etablierten Lagen',
                    'Niedriger Fremdkapitalanteil'
                ];
            }
        } else if (quiz_type === 'steuer_guide') {
            // Simple scoring for tax guide
            max_score = Object.keys(answers).length;
            score = Object.values(answers).filter(a => a === true || a === 'correct').length;
            
            const percentage = (score / max_score) * 100;
            
            if (percentage >= 80) {
                result_category = 'experte';
                result_title = 'Steuer-Experte';
                result_description = 'Sie haben sehr gute Kenntnisse im Bereich Immobilienbesteuerung.';
            } else if (percentage >= 50) {
                result_category = 'fortgeschritten';
                result_title = 'Fortgeschritten';
                result_description = 'Sie haben gute Grundkenntnisse, aber noch Verbesserungspotenzial.';
            } else {
                result_category = 'einsteiger';
                result_title = 'Einsteiger';
                result_description = 'Sie sollten sich intensiver mit dem Thema Steuern befassen.';
            }
            
            recommendations = [
                'Nutzen Sie unsere Steuer-Tools',
                'Konsultieren Sie einen Steuerberater',
                'Dokumentieren Sie alle Ausgaben sorgfältig'
            ];
        }

        const percentage = (score / max_score) * 100;

        // Save quiz result
        const quizResult = await base44.asServiceRole.entities.QuizResult.create({
            quiz_type,
            user_email,
            answers,
            score,
            max_score,
            percentage: Math.round(percentage * 100) / 100,
            result_category,
            result_title,
            result_description,
            recommendations,
            session_id
        });

        return Response.json({ 
            success: true, 
            result: quizResult
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});