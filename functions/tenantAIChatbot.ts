import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message, tenant_id } = await req.json();

  // Get tenant data
  const tenant = await base44.asServiceRole.entities.Tenant.filter({ id: tenant_id }).then(t => t[0]);
  if (!tenant) {
    return Response.json({ error: 'Tenant not found' }, { status: 404 });
  }

  // Get knowledge base
  const kbArticles = await base44.asServiceRole.entities.KnowledgeBaseArticle.filter({ 
    is_published: true 
  });

  // Get tenant's issues
  const tenantIssues = await base44.asServiceRole.entities.TenantIssueReport.filter({ 
    tenant_id 
  });

  // Get maintenance tasks for tenant's unit
  const maintenanceTasks = tenant.unit_id ? await base44.asServiceRole.entities.MaintenanceTask.filter({ 
    unit_id: tenant.unit_id 
  }) : [];

  // Get IoT sensors for tenant's unit
  const sensors = tenant.unit_id ? await base44.asServiceRole.entities.IoTSensor.filter({ 
    unit_id: tenant.unit_id 
  }) : [];

  // Prepare context for AI
  const context = {
    kbArticles: kbArticles.map(a => ({
      question: a.question,
      answer: a.answer,
      category: a.category,
      tags: a.tags
    })),
    openIssues: tenantIssues.filter(i => i.status !== 'resolved' && i.status !== 'closed').map(i => ({
      title: i.title,
      status: i.status,
      created: i.created_date
    })),
    maintenanceTasks: maintenanceTasks.map(t => ({
      title: t.title,
      status: t.status,
      scheduled: t.scheduled_date
    })),
    sensors: sensors.map(s => ({
      name: s.sensor_name,
      type: s.sensor_type,
      value: s.current_value,
      unit: s.unit
    }))
  };

  // Call AI
  const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Du bist ein hilfreicher Assistent für Mieter. Beantworte die folgende Frage basierend auf dem Kontext.

WISSENSDATENBANK:
${JSON.stringify(context.kbArticles, null, 2)}

AKTUELLE STÖRUNGSMELDUNGEN:
${JSON.stringify(context.openIssues, null, 2)}

WARTUNGSARBEITEN:
${JSON.stringify(context.maintenanceTasks, null, 2)}

IOT-SENSOREN:
${JSON.stringify(context.sensors, null, 2)}

MIETERFRAGE: ${message}

Analysiere die Frage und:
1. Wenn sie mit einem KB-Artikel beantwortet werden kann, nutze diesen
2. Wenn eine Störungsmeldung erstellt werden soll, setze "action" auf "create_issue"
3. Wenn nach Wartungsstatus gefragt wird, gib den aktuellen Status
4. Wenn nach Sensor-Werten gefragt wird, gib diese aus

Antworte freundlich auf Deutsch.`,
    response_json_schema: {
      type: 'object',
      properties: {
        response: { type: 'string' },
        action: { 
          type: 'string',
          enum: ['none', 'create_issue', 'show_maintenance', 'show_sensors']
        },
        action_data: { 
          type: 'object',
          properties: {
            issue_type: { type: 'string' },
            issue_title: { type: 'string' },
            issue_description: { type: 'string' },
            severity: { type: 'string' }
          }
        },
        kb_article_used: { type: 'string' },
        confidence: { type: 'number' }
      }
    }
  });

  let issueCreated = null;

  // Execute action if needed
  if (aiResponse.action === 'create_issue' && aiResponse.action_data) {
    const issueData = aiResponse.action_data;
    issueCreated = await base44.asServiceRole.entities.TenantIssueReport.create({
      tenant_id,
      unit_id: tenant.unit_id,
      building_id: tenant.building_id,
      issue_type: issueData.issue_type || 'general',
      title: issueData.issue_title || 'Chatbot-Meldung',
      description: issueData.issue_description || message,
      severity: issueData.severity || 'medium',
      status: 'open'
    });

    // Trigger maintenance workflow
    await base44.asServiceRole.functions.invoke('createMaintenanceFromIssue', {
      issue_id: issueCreated.id
    });
  }

  // Update KB article view count if used
  if (aiResponse.kb_article_used) {
    const article = kbArticles.find(a => 
      a.question === aiResponse.kb_article_used || 
      a.title === aiResponse.kb_article_used
    );
    if (article) {
      await base44.asServiceRole.entities.KnowledgeBaseArticle.update(article.id, {
        view_count: (article.view_count || 0) + 1
      });
    }
  }

  return Response.json({
    response: aiResponse.response,
    action: aiResponse.action,
    issue_created: issueCreated,
    confidence: aiResponse.confidence,
    suggested_kb_articles: aiResponse.kb_article_used ? [aiResponse.kb_article_used] : []
  });
});