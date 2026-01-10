import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, days = 90 } = await req.json();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get all metrics
    const [documents, analytics, tasks, signatures, archived] = await Promise.all([
      base44.asServiceRole.entities.Document.list(),
      base44.asServiceRole.entities.DocumentAnalytics.filter({ company_id }),
      base44.asServiceRole.entities.DocumentTask.filter({ company_id }),
      base44.asServiceRole.entities.SignatureRequest.filter({ company_id }),
      base44.asServiceRole.entities.DocumentArchive.filter({ company_id })
    ]);

    // Document creation trends
    const creationTrends = {};
    documents
      .filter(d => new Date(d.created_date) > cutoffDate)
      .forEach(d => {
        const date = new Date(d.created_date).toISOString().split('T')[0];
        creationTrends[date] = (creationTrends[date] || 0) + 1;
      });

    const trendData = Object.entries(creationTrends)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, count]) => ({ date, count }));

    // Document types
    const documentTypes = {};
    documents.forEach(d => {
      const type = d.document_type || 'Unknown';
      documentTypes[type] = (documentTypes[type] || 0) + 1;
    });

    const typeData = Object.entries(documentTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    // Archiving trends
    const archivingTrends = {};
    archived
      .filter(a => new Date(a.archived_date) > cutoffDate)
      .forEach(a => {
        const date = new Date(a.archived_date).toISOString().split('T')[0];
        archivingTrends[date] = (archivingTrends[date] || 0) + 1;
      });

    const archiveData = Object.entries(archivingTrends)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, count]) => ({ date, count }));

    // Task completion
    const taskCompletion = {
      open: tasks.filter(t => t.status === 'open').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length
    };

    // Signature status
    const signatureStatus = {
      draft: signatures.filter(s => s.status === 'draft').length,
      sent: signatures.filter(s => s.status === 'sent').length,
      in_progress: signatures.filter(s => s.status === 'in_progress').length,
      completed: signatures.filter(s => s.status === 'completed').length,
      rejected: signatures.filter(s => s.status === 'rejected').length,
      cancelled: signatures.filter(s => s.status === 'cancelled').length
    };

    // Overdue tasks
    const now = new Date();
    const overdueTasks = tasks.filter(t => 
      t.due_date && new Date(t.due_date) < now && (t.status === 'open' || t.status === 'in_progress')
    ).length;

    // Overall stats
    const stats = {
      totalDocuments: documents.length,
      totalArchived: archived.length,
      totalTasks: tasks.length,
      overdueTasks,
      totalSignatureRequests: signatures.length,
      completionRate: tasks.length > 0 ? Math.round((taskCompletion.completed / tasks.length) * 100) : 0
    };

    return Response.json({
      stats,
      trendData,
      typeData,
      archiveData,
      taskCompletion,
      signatureStatus
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});