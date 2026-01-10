import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { company_id } = await req.json();

    // Get all active retention policies
    const policies = await base44.asServiceRole.entities.DocumentRetentionPolicy.filter({
      company_id,
      is_active: true
    });

    const results = [];

    for (const policy of policies) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retention_days);

      // Get documents matching this policy
      const docs = await base44.asServiceRole.entities.Document.filter({
        company_id
      });

      const expiredDocs = docs.filter(d => 
        d.document_type === policy.document_type &&
        new Date(d.created_date) < cutoffDate
      );

      for (const doc of expiredDocs) {
        if (policy.action_after_retention === 'delete') {
          await base44.asServiceRole.entities.Document.delete(doc.id);
        } else if (policy.action_after_retention === 'archive') {
          await base44.asServiceRole.entities.DocumentArchive.create({
            document_id: doc.id,
            original_data: doc
          });
          await base44.asServiceRole.entities.Document.delete(doc.id);
        } else if (policy.action_after_retention === 'anonymize') {
          await base44.asServiceRole.entities.Document.update(doc.id, {
            content: '[ANONYMIZED]'
          });
        }
      }

      results.push({
        policy_id: policy.id,
        documents_processed: expiredDocs.length
      });
    }

    return Response.json({ success: true, results });
  } catch (error) {
    console.error('Retention processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});