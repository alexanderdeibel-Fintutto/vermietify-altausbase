import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, document_id } = await req.json();

    // Get document
    const docs = await base44.asServiceRole.entities.Document.filter({ id: document_id });
    if (docs.length === 0) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }
    const doc = docs[0];

    // Get all active rules for company
    const rules = await base44.asServiceRole.entities.DocumentWorkflowRule.filter({
      company_id,
      is_active: true
    });

    let executedRules = 0;
    const executionDetails = [];

    for (const rule of rules) {
      const conditionsMet = checkConditions(rule.conditions, doc);

      if (conditionsMet) {
        // Execute actions
        for (const action of rule.actions || []) {
          await executeAction(base44, action, doc, company_id);
        }

        // Update rule execution count
        await base44.asServiceRole.entities.DocumentWorkflowRule.update(rule.id, {
          execution_count: (rule.execution_count || 0) + 1,
          last_executed: new Date().toISOString()
        });

        executionDetails.push({
          rule_name: rule.name,
          action_count: rule.actions?.length || 0
        });

        // Send notification about rule execution
        try {
          await base44.functions.invoke('sendNotification', {
            recipient_email: user.email,
            title: `✅ Regel ausgeführt: ${rule.name}`,
            message: `Die Regel "${rule.name}" wurde für das Dokument "${doc.name}" mit ${rule.actions?.length || 0} Aktion(en) ausgeführt.`,
            notification_type: 'rule_executed',
            related_entity_type: 'rule',
            related_entity_id: rule.id,
            priority: 'medium'
          });
        } catch (error) {
          console.log('Notification optional:', error.message);
        }

        executedRules++;
      }
    }

    return Response.json({ success: true, executed_rules: executedRules, details: executionDetails });
  } catch (error) {
    console.error('Execute rules error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function checkConditions(conditions, doc) {
  if (conditions.document_type && conditions.document_type.length > 0) {
    if (!conditions.document_type.includes(doc.document_type)) {
      return false;
    }
  }

  if (conditions.tags && conditions.tags.length > 0) {
    const docTags = doc.tags || [];
    const hasAnyTag = conditions.tags.some(tag => docTags.includes(tag));
    if (!hasAnyTag) {
      return false;
    }
  }

  if (conditions.age_days) {
    const docDate = new Date(doc.created_date);
    const ageMs = Date.now() - docDate.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays < conditions.age_days) {
      return false;
    }
  }

  if (conditions.metadata_conditions && conditions.metadata_conditions.length > 0) {
    for (const metaCond of conditions.metadata_conditions) {
      const docValue = doc[metaCond.key];
      if (!evaluateMetadataCondition(docValue, metaCond.operator, metaCond.value)) {
        return false;
      }
    }
  }

  return true;
}

function evaluateMetadataCondition(docValue, operator, condValue) {
  switch (operator) {
    case 'equals':
      return docValue === condValue;
    case 'contains':
      return String(docValue).includes(condValue);
    case 'greater':
      return Number(docValue) > Number(condValue);
    case 'less':
      return Number(docValue) < Number(condValue);
    default:
      return true;
  }
}

async function executeAction(base44, action, doc, company_id) {
  switch (action.action_type) {
    case 'create_task':
      await base44.asServiceRole.entities.DocumentTask.create({
        document_id: doc.id,
        company_id,
        title: action.parameters.title,
        description: action.parameters.description,
        task_type: action.parameters.task_type || 'review',
        assigned_to: action.parameters.assigned_to,
        priority: action.parameters.priority || 'medium',
        status: 'open'
      });
      break;

    case 'archive':
      await base44.asServiceRole.entities.DocumentArchive.create({
        document_id: doc.id,
        company_id,
        document_name: doc.name,
        document_url: doc.url,
        archived_date: new Date().toISOString(),
        archived_by: 'system@automation.local',
        archive_reason: action.parameters.reason || 'other',
        archive_notes: action.parameters.notes
      });
      break;

    case 'add_tag':
      const currentTags = doc.tags || [];
      const newTags = [...new Set([...currentTags, ...action.parameters.tags])];
      await base44.asServiceRole.entities.Document.update(doc.id, {
        tags: newTags
      });
      break;

    case 'send_notification':
      await base44.functions.invoke('sendNotification', {
        recipient_email: action.parameters.recipient_email || action.parameters.channel,
        title: action.parameters.title || 'Automatisierte Benachrichtigung',
        message: action.parameters.message || `Workflow-Aktion für ${doc.name}`,
        notification_type: 'system',
        related_entity_type: 'document',
        related_entity_id: doc.id,
        priority: 'medium'
      });
      break;

    case 'update_metadata':
      const updateData = {};
      for (const [key, value] of Object.entries(action.parameters.metadata || {})) {
        updateData[key] = value;
      }
      if (Object.keys(updateData).length > 0) {
        await base44.asServiceRole.entities.Document.update(doc.id, updateData);
      }
      break;
  }
}