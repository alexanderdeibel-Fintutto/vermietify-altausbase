import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { document_id, redaction_patterns = [], auto_detect = false } = await req.json();

    const doc = await base44.asServiceRole.entities.Document.read(document_id);
    let content = doc.content || '';

    // Default patterns for auto-detection
    const defaultPatterns = [
      { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, label: 'credit_card', replacement: '[KREDITKARTE GESCHWÄRZT]' },
      { pattern: /\b[A-Z]{2}\d{2}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{2}\b/g, label: 'iban', replacement: '[IBAN GESCHWÄRZT]' },
      { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, label: 'ssn', replacement: '[SSN GESCHWÄRZT]' },
      { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, label: 'email', replacement: '[EMAIL GESCHWÄRZT]' },
      { pattern: /\b\+?\d{1,4}?[\s-]?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}\b/g, label: 'phone', replacement: '[TELEFON GESCHWÄRZT]' }
    ];

    const patternsToUse = auto_detect ? defaultPatterns : redaction_patterns;
    const redacted = [];

    for (const { pattern, label, replacement } of patternsToUse) {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        redacted.push({ type: label, count: matches.length });
      }
    }

    // Create redacted version
    const version = await base44.asServiceRole.entities.DocumentVersion.create({
      document_id,
      version_number: (doc.version || 1) + 1,
      content,
      change_notes: `Redacted: ${redacted.map(r => `${r.count} ${r.type}`).join(', ')}`,
      created_by: user.email
    });

    // Update document
    await base44.asServiceRole.entities.Document.update(document_id, {
      content,
      metadata: {
        ...(doc.metadata || {}),
        redacted: true,
        redacted_items: redacted
      }
    });

    return Response.json({ success: true, redacted, version });
  } catch (error) {
    console.error('Redaction error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});