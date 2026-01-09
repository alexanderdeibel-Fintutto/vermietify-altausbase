import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, auditFileId } = await req.json();

    if (!country || !taxYear || !auditFileId) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch audit file
    const auditFile = await base44.entities.TaxAuditFile.read(auditFileId);
    if (!auditFile) {
      return Response.json({ error: 'Audit file not found' }, { status: 404 });
    }

    // Fetch related data
    const calculations = await base44.entities.TaxCalculation.filter({
      user_email: user.email,
      country,
      tax_year: taxYear
    }) || [];

    const documents = await base44.entities.TaxDocument.filter({
      user_email: user.email,
      country,
      tax_year: taxYear
    }) || [];

    // Calculate readiness score
    let readinessScore = 0;
    const checklist = {
      documents_complete: false,
      questions_answered: false,
      calculations_accurate: false,
      advisor_engaged: false,
      supporting_evidence: false
    };

    // Check document completeness
    const requiredDocs = ['bank_statement', 'investment_confirmation', 'tax_certificate'];
    const hasRequiredDocs = requiredDocs.some(docType => 
      documents.some(d => d.document_type === docType)
    );
    if (hasRequiredDocs) {
      readinessScore += 20;
      checklist.documents_complete = true;
    }

    // Check if questions are answered
    const unansweredQuestions = (auditFile.audit_questions || []).filter(q => !q.response_provided);
    if (unansweredQuestions.length === 0 && auditFile.audit_questions?.length > 0) {
      readinessScore += 25;
      checklist.questions_answered = true;
    }

    // Check calculation accuracy
    if (calculations.length > 0 && calculations[0].status === 'filed') {
      readinessScore += 20;
      checklist.calculations_accurate = true;
    }

    // Check if tax advisor is engaged
    if (auditFile.tax_advisor_email) {
      readinessScore += 15;
      checklist.advisor_engaged = true;
    }

    // Check supporting evidence
    if ((auditFile.supporting_documents || []).length >= 5) {
      readinessScore += 20;
      checklist.supporting_evidence = true;
    }

    // Generate AI-powered recommendations
    const recommendations = [];
    
    if (!checklist.documents_complete) {
      recommendations.push({
        priority: 'high',
        category: 'documents',
        action: 'Sammeln Sie alle erforderlichen Dokumente',
        detail: 'Bank statements, Wertschriftenmitteilungen, und Belege für alle geltend gemachten Posten'
      });
    }

    if (!checklist.questions_answered) {
      recommendations.push({
        priority: 'critical',
        category: 'questions',
        action: 'Beantworten Sie alle ausstehenden Fragen',
        detail: `${unansweredQuestions.length} Fragen erfordern Antworten vor ${auditFile.next_deadline || 'der Deadline'}`
      });
    }

    if (!checklist.advisor_engaged) {
      recommendations.push({
        priority: 'high',
        category: 'legal',
        action: 'Engagieren Sie einen Steuerberater',
        detail: 'Ein erfahrener Berater kann die Chancen auf ein günstiges Ergebnis erheblich verbessern'
      });
    }

    // Risk assessment
    const riskLevel = readinessScore >= 80 ? 'low' : readinessScore >= 60 ? 'medium' : 'high';

    return Response.json({
      status: 'success',
      audit_file: {
        audit_type: auditFile.audit_type,
        audit_notice_date: auditFile.audit_notice_date,
        next_deadline: auditFile.next_deadline
      },
      readiness: {
        score: Math.round(readinessScore),
        checklist,
        risk_level: riskLevel
      },
      documents: {
        total_uploaded: documents.length,
        required_types: requiredDocs,
        has_critical_docs: hasRequiredDocs
      },
      audit_questions: {
        total: auditFile.audit_questions?.length || 0,
        answered: (auditFile.audit_questions || []).filter(q => q.response_provided).length,
        unanswered: unansweredQuestions.length
      },
      recommendations,
      timeline: {
        notice_received: auditFile.audit_notice_date,
        next_deadline: auditFile.next_deadline,
        days_remaining: Math.ceil(
          (new Date(auditFile.next_deadline) - new Date()) / (1000 * 60 * 60 * 24)
        )
      }
    });
  } catch (error) {
    console.error('Audit readiness error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});