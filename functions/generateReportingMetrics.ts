import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { from_date, to_date, company_id } = await req.json();
    const fromDate = new Date(from_date);
    const toDate = new Date(to_date);

    // Get documents
    const documents = await base44.asServiceRole.entities.Document.list('-created_date', 500);
    const filteredDocs = documents.filter(doc => {
      const docDate = new Date(doc.created_date);
      return docDate >= fromDate && docDate <= toDate && (!company_id || doc.company_id === company_id);
    });

    // Get tasks
    const tasks = await base44.asServiceRole.entities.DocumentTask.list('-created_date', 500);
    const filteredTasks = tasks.filter(task => {
      const taskDate = new Date(task.created_date);
      return taskDate >= fromDate && taskDate <= toDate && (!company_id || task.company_id === company_id);
    });

    // Get workflow rules
    const rules = await base44.asServiceRole.entities.DocumentWorkflowRule.list('-created_date', 500);
    const filteredRules = rules.filter(rule => {
      const ruleDate = new Date(rule.created_date);
      return ruleDate >= fromDate && ruleDate <= toDate && (!company_id || rule.company_id === company_id);
    });

    // Calculate metrics
    const metrics = {
      // Document metrics
      total_documents: filteredDocs.length,
      documents_by_type: groupBy(filteredDocs, 'document_type'),
      documents_by_date: groupByDate(filteredDocs, 'created_date'),
      
      // Task metrics
      total_tasks: filteredTasks.length,
      tasks_by_status: groupBy(filteredTasks, 'status'),
      tasks_by_priority: groupBy(filteredTasks, 'priority'),
      task_completion_rate: calculateTaskCompletionRate(filteredTasks),
      completed_tasks: filteredTasks.filter(t => t.status === 'completed').length,
      overdue_tasks: filteredTasks.filter(t => t.is_overdue).length,
      
      // Time metrics
      avg_document_processing_time: calculateAvgProcessingTime(filteredDocs),
      avg_task_completion_time: calculateAvgTaskCompletionTime(filteredTasks),
      
      // User activity
      active_users: countActiveUsers(filteredDocs, filteredTasks),
      documents_by_user: groupBy(filteredDocs, 'created_by'),
      
      // Workflow efficiency
      total_rules: filteredRules.length,
      rules_by_trigger: groupBy(filteredRules, 'trigger_type'),
      total_rule_executions: filteredRules.reduce((sum, rule) => sum + (rule.execution_count || 0), 0),
      
      // Time series for charts
      documents_timeline: generateTimeSeries(filteredDocs, fromDate, toDate),
      tasks_timeline: generateTaskTimeSeries(filteredTasks, fromDate, toDate)
    };

    return Response.json({ success: true, metrics });
  } catch (error) {
    console.error('Generate metrics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const val = item[key] || 'Unknown';
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
}

function groupByDate(arr, key) {
  const result = {};
  arr.forEach(item => {
    const date = new Date(item[key]).toLocaleDateString('de-DE');
    result[date] = (result[date] || 0) + 1;
  });
  return result;
}

function calculateTaskCompletionRate(tasks) {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter(t => t.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
}

function calculateAvgProcessingTime(docs) {
  if (docs.length === 0) return 0;
  const totalTime = docs.reduce((sum, doc) => {
    const created = new Date(doc.created_date);
    const updated = new Date(doc.updated_date);
    return sum + (updated - created);
  }, 0);
  const hours = Math.round(totalTime / docs.length / 3600000);
  return hours;
}

function calculateAvgTaskCompletionTime(tasks) {
  const completedTasks = tasks.filter(t => t.status === 'completed' && t.completed_date);
  if (completedTasks.length === 0) return 0;
  
  const totalTime = completedTasks.reduce((sum, task) => {
    const created = new Date(task.created_date);
    const completed = new Date(task.completed_date);
    return sum + (completed - created);
  }, 0);
  
  const days = Math.round(totalTime / completedTasks.length / 86400000);
  return days;
}

function countActiveUsers(docs, tasks) {
  const users = new Set();
  docs.forEach(d => d.created_by && users.add(d.created_by));
  tasks.forEach(t => t.assigned_to && users.add(t.assigned_to));
  return users.size;
}

function generateTimeSeries(docs, fromDate, toDate) {
  const data = [];
  const current = new Date(fromDate);
  
  while (current <= toDate) {
    const dateStr = current.toLocaleDateString('de-DE');
    const dayDocs = docs.filter(d => new Date(d.created_date).toLocaleDateString('de-DE') === dateStr);
    
    data.push({
      date: dateStr,
      documents: dayDocs.length
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return data;
}

function generateTaskTimeSeries(tasks, fromDate, toDate) {
  const data = [];
  const current = new Date(fromDate);
  
  while (current <= toDate) {
    const dateStr = current.toLocaleDateString('de-DE');
    const dayTasks = tasks.filter(t => new Date(t.created_date).toLocaleDateString('de-DE') === dateStr);
    const completed = dayTasks.filter(t => t.status === 'completed').length;
    
    data.push({
      date: dateStr,
      created: dayTasks.length,
      completed: completed
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return data;
}