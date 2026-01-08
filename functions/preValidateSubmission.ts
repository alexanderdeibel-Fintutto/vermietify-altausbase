import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    if (!submission_id) {
      return Response.json({ error: 'submission_id required' }, { status: 400 });
    }

    const submissions = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (!submissions || submissions.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submission = submissions[0];

    console.log(`[PRE-VALIDATION] Checking ${submission.id}`);

    const result = {
      can_submit: true,
      blockers: [],
      warnings: [],
      recommendations: []
    };

    // Kritische Blocker prüfen
    
    // 1. Zertifikat vorhanden?
    const certificates = await base44.entities.ElsterCertificate.filter({
      is_active: true,
      certificate_type: submission.submission_mode
    });

    if (certificates.length === 0) {
      result.can_submit = false;
      result.blockers.push({
        category: 'Zertifikat',
        message: `Kein gültiges ${submission.submission_mode}-Zertifikat vorhanden`,
        action: 'Zertifikat hochladen'
      });
    } else {
      // Prüfe Ablaufdatum
      const cert = certificates[0];
      const daysUntilExpiry = Math.floor((new Date(cert.valid_until) - new Date()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) {
        result.can_submit = false;
        result.blockers.push({
          category: 'Zertifikat',
          message: 'Zertifikat ist abgelaufen',
          action: 'Neues Zertifikat hochladen'
        });
      } else if (daysUntilExpiry < 30) {
        result.warnings.push({
          category: 'Zertifikat',
          message: `Zertifikat läuft in ${daysUntilExpiry} Tagen ab`,
          action: 'Erwägen Sie Zertifikatserneuerung'
        });
      }
    }

    // 2. Pflichtfelder vollständig?
    const formData = submission.form_data || {};
    const requiredFields = getRequiredFields(submission.tax_form_type);
    const missingFields = requiredFields.filter(field => 
      !formData[field] || formData[field] === ''
    );

    if (missingFields.length > 0) {
      result.can_submit = false;
      result.blockers.push({
        category: 'Pflichtfelder',
        message: `${missingFields.length} Pflichtfelder fehlen`,
        fields: missingFields,
        action: 'Alle Pflichtfelder ausfüllen'
      });
    }

    // 3. Status-Prüfung
    if (submission.status === 'SUBMITTED' || submission.status === 'ACCEPTED') {
      result.can_submit = false;
      result.blockers.push({
        category: 'Status',
        message: 'Submission wurde bereits eingereicht',
        action: 'Neue Submission erstellen oder duplizieren'
      });
    }

    // 4. Validierungsfehler?
    if (submission.validation_errors && submission.validation_errors.length > 0) {
      result.can_submit = false;
      result.blockers.push({
        category: 'Validierung',
        message: `${submission.validation_errors.length} Validierungsfehler vorhanden`,
        action: 'Validierung durchführen und Fehler beheben'
      });
    }

    // Warnungen

    // 1. KI-Vertrauen niedrig
    if (submission.ai_confidence_score < 70) {
      result.warnings.push({
        category: 'Datenqualität',
        message: `Niedriges KI-Vertrauen (${submission.ai_confidence_score}%)`,
        action: 'Manuelle Überprüfung empfohlen'
      });
    }

    // 2. Keine vorherige Validierung
    if (submission.status === 'DRAFT' || submission.status === 'AI_PROCESSED') {
      result.warnings.push({
        category: 'Prozess',
        message: 'Noch nicht validiert',
        action: 'Validierung vor Einreichung durchführen'
      });
    }

    // 3. Test-Modus Warnung
    if (submission.submission_mode === 'TEST') {
      result.warnings.push({
        category: 'Modus',
        message: 'Test-Modus aktiv - keine offizielle Übermittlung',
        action: 'Für echte Einreichung auf PRODUCTION umstellen'
      });
    }

    // Empfehlungen

    // 1. Plausibilitätsprüfung
    result.recommendations.push({
      category: 'Qualitätssicherung',
      message: 'Plausibilitätsprüfung durchführen',
      action: 'Prüfung mit Branchenvergleich'
    });

    // 2. Backup erstellen
    result.recommendations.push({
      category: 'Sicherheit',
      message: 'GoBD-konforme Archivierung',
      action: 'Backup vor Einreichung erstellen'
    });

    console.log(`[PRE-VALIDATION] Result: can_submit=${result.can_submit}, ${result.blockers.length} blockers`);

    return Response.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getRequiredFields(formType) {
  const fieldsByType = {
    ANLAGE_V: ['income_rent', 'address', 'tax_number'],
    EUER: ['business_income', 'business_expenses', 'tax_number'],
    GEWERBESTEUER: ['business_name', 'revenue', 'tax_number'],
    UMSATZSTEUER: ['revenue', 'vat_collected', 'tax_number']
  };

  return fieldsByType[formType] || [];
}