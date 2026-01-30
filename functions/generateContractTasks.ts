import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Generiert automatisch Tasks aus Vertragsanalysen
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { analysis_id } = await req.json();

        if (!analysis_id) {
            return Response.json({ error: 'Missing analysis_id' }, { status: 400 });
        }

        // Lade die Analyse
        const analyses = await base44.entities.ContractAnalysis.list(undefined, 1, { id: analysis_id });
        if (!analyses || analyses.length === 0) {
            return Response.json({ error: 'Analysis not found' }, { status: 404 });
        }

        const analysis = analyses[0];
        const createdTasks = [];

        // Task 1: Vertragsverlängerung prüfen (falls auto_renewal)
        if (analysis.auto_renewal && analysis.contract_end_date) {
            const endDate = new Date(analysis.contract_end_date);
            const reminderDate = new Date(endDate);
            reminderDate.setDate(endDate.getDate() - 60); // 60 Tage vorher erinnern

            const task1 = await base44.entities.Task.create({
                title: `Vertragsverlängerung prüfen: ${analysis.document_name}`,
                description: `Der Vertrag verlängert sich automatisch am ${endDate.toLocaleDateString('de-DE')}. Bitte prüfen Sie, ob eine Verlängerung gewünscht ist. Verlängerungszeitraum: ${analysis.renewal_period || 'siehe Vertrag'}`,
                due_date: reminderDate.toISOString().split('T')[0],
                priority: 'high',
                status: 'todo',
                category: 'contract_management',
                related_entity_type: 'ContractAnalysis',
                related_entity_id: analysis_id
            });
            createdTasks.push(task1.id);
        }

        // Task 2: Kündigungsfrist beachten
        if (analysis.termination_notice_period && analysis.contract_end_date) {
            const endDate = new Date(analysis.contract_end_date);
            
            // Extrahiere Kündigungsfrist in Tagen
            const noticePeriodMatch = analysis.termination_notice_period.match(/(\d+)\s*(Monat|Monate|Tag|Tage)/i);
            let noticeDays = 30; // Default
            if (noticePeriodMatch) {
                const value = parseInt(noticePeriodMatch[1]);
                const unit = noticePeriodMatch[2].toLowerCase();
                noticeDays = unit.includes('monat') ? value * 30 : value;
            }

            const terminationDeadline = new Date(endDate);
            terminationDeadline.setDate(endDate.getDate() - noticeDays - 7); // 7 Tage Puffer

            const task2 = await base44.entities.Task.create({
                title: `Kündigungsfrist beachten: ${analysis.document_name}`,
                description: `Kündigungsfrist: ${analysis.termination_notice_period}. Kündigung muss spätestens bis ${new Date(endDate.getTime() - noticeDays * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')} erfolgen, falls gewünscht.`,
                due_date: terminationDeadline.toISOString().split('T')[0],
                priority: 'high',
                status: 'todo',
                category: 'contract_management',
                related_entity_type: 'ContractAnalysis',
                related_entity_id: analysis_id
            });
            createdTasks.push(task2.id);
        }

        // Task 3: Zahlungserinnerung (falls payment_terms vorhanden)
        if (analysis.payment_terms && analysis.payment_terms.amount && analysis.payment_terms.frequency) {
            const task3 = await base44.entities.Task.create({
                title: `Zahlungsbedingungen überwachen: ${analysis.document_name}`,
                description: `Betrag: ${analysis.payment_terms.amount} ${analysis.payment_terms.currency || 'EUR'} - Häufigkeit: ${analysis.payment_terms.frequency}. Regelmäßige Prüfung der Zahlungseinhaltung.`,
                due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
                priority: 'medium',
                status: 'todo',
                category: 'finance',
                related_entity_type: 'ContractAnalysis',
                related_entity_id: analysis_id
            });
            createdTasks.push(task3.id);
        }

        // Task 4: Risikoklauseln überprüfen
        if (analysis.risk_clauses && analysis.risk_clauses.filter(r => r.risk_level === 'high').length > 0) {
            const highRiskClauses = analysis.risk_clauses.filter(r => r.risk_level === 'high');
            const task4 = await base44.entities.Task.create({
                title: `Hochrisiko-Klauseln prüfen: ${analysis.document_name}`,
                description: `${highRiskClauses.length} Hochrisiko-Klausel(n) identifiziert:\n${highRiskClauses.map(c => `- ${c.clause}: ${c.recommendation}`).join('\n')}`,
                due_date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
                priority: 'urgent',
                status: 'todo',
                category: 'legal',
                related_entity_type: 'ContractAnalysis',
                related_entity_id: analysis_id
            });
            createdTasks.push(task4.id);
        }

        // Update analysis mit generierten Task-IDs
        await base44.entities.ContractAnalysis.update(analysis_id, {
            auto_generated_tasks: createdTasks
        });

        return Response.json({
            success: true,
            tasks_created: createdTasks.length,
            task_ids: createdTasks
        });

    } catch (error) {
        console.error('Task generation failed:', error);
        return Response.json({ 
            error: error.message,
            success: false
        }, { status: 500 });
    }
});