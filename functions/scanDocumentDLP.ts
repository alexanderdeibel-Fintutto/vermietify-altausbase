import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { document_id, company_id } = await req.json();

    const doc = await base44.asServiceRole.entities.Document.read(document_id);
    const rules = await base44.asServiceRole.entities.DLPRule.filter({
      company_id,
      is_active: true
    });

    const violations = [];

    for (const rule of rules) {
      let pattern;

      // Built-in patterns
      if (rule.pattern_type === 'credit_card') {
        pattern = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
      } else if (rule.pattern_type === 'ssn') {
        pattern = /\b\d{3}-\d{2}-\d{4}\b/g;
      } else if (rule.pattern_type === 'email') {
        pattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      } else if (rule.pattern_type === 'iban') {
        pattern = /\b[A-Z]{2}\d{2}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{2}\b/g;
      } else if (rule.pattern_type === 'custom_regex') {
        pattern = new RegExp(rule.pattern, 'g');
      }

      const matches = (doc.content || '').match(pattern);

      if (matches && matches.length > 0) {
        // Create violation
        const violation = await base44.asServiceRole.entities.DLPViolation.create({
          document_id,
          company_id,
          rule_id: rule.id,
          matched_data: matches[0].substring(0, 10) + '***', // Partial data
          severity: rule.severity,
          action_taken: rule.action,
          resolved: false
        });

        violations.push(violation);

        // Execute action
        if (rule.action === 'notify') {
          await base44.integrations.Core.SendEmail({
            to: user.email,
            subject: `DLP Alert: ${rule.name}`,
            body: `Sensitive data detected in document: ${doc.name}\nRule: ${rule.name}\nMatches: ${matches.length}`
          });
        }

        if (rule.action === 'redact') {
          // Auto-redact
          await base44.functions.invoke('redactDocument', {
            document_id,
            redaction_patterns: [{ pattern, replacement: '[GESCHWÄRZT]' }]
          });
        }
      }
    }

    return Response.json({ success: true, violations, violations_count: violations.length });
  } catch (error) {
    console.error('DLP scan error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});