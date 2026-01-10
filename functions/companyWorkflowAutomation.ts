import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { company_id, trigger_type } = await req.json();
    const company = await base44.entities.Company.filter({ id: company_id });

    if (company.length === 0) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    const companyData = company[0];
    const tasksCreated = [];

    // Trigger-based automation
    switch (trigger_type) {
      case 'company_created':
        // Create initial setup tasks based on legal form
        const setupTasks = getSetupTasksByLegalForm(companyData.legal_form);
        for (const task of setupTasks) {
          await base44.entities.BuildingTask.create({
            company_id: company_id,
            task_title: task.title,
            description: task.description,
            task_type: 'administrative',
            status: 'open',
            priority: task.priority
          });
          tasksCreated.push(task.title);
        }
        break;

      case 'compliance_reminder':
        // Create compliance-related tasks
        const complianceTasks = getComplianceTasksByLegalForm(companyData.legal_form);
        for (const task of complianceTasks) {
          const existingTask = await base44.entities.BuildingTask.filter({
            company_id: company_id,
            task_title: task.title,
            status: 'open'
          });
          
          if (existingTask.length === 0) {
            await base44.entities.BuildingTask.create({
              company_id: company_id,
              task_title: task.title,
              description: task.description,
              task_type: 'administrative',
              status: 'open',
              priority: task.priority,
              due_date: task.dueDate
            });
            tasksCreated.push(task.title);
          }
        }
        break;
    }

    return Response.json({
      success: true,
      tasks_created: tasksCreated.length,
      tasks: tasksCreated
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getSetupTasksByLegalForm(legalForm) {
  const baseTasks = [
    { title: 'Bankkonten konfigurieren', description: 'Geschäftskonten einrichten', priority: 'high' },
    { title: 'Kontakte hinzufügen', description: 'Mitarbeiter und wichtige Kontakte erfassen', priority: 'medium' }
  ];

  const formSpecific = {
    gmbh: [
      { title: 'Notarielle Beurkundung', description: 'Gründungsurkunde erstellen', priority: 'high' },
      { title: 'Handelsregistereintrag', description: 'Beim Handelsregister anmelden', priority: 'high' },
      { title: 'Geschäftsführer-Sozialversicherung', description: 'SVA-Meldung einreichen', priority: 'high' }
    ],
    gbr: [
      { title: 'Gesellschaftervertrag', description: 'Partnerschaftsvertrag aufsetzen', priority: 'high' },
      { title: 'Gewerbeanmeldung', description: 'Gewerbe anmelden', priority: 'high' }
    ],
    einzelunternehmen: [
      { title: 'Gewerbeanmeldung', description: 'Gewerbe beim Amt anmelden', priority: 'high' }
    ]
  };

  return [...baseTasks, ...(formSpecific[legalForm] || [])];
}

function getComplianceTasksByLegalForm(legalForm) {
  const today = new Date();
  const endOfYear = new Date(today.getFullYear(), 11, 31);

  const tasks = {
    gmbh: [
      {
        title: 'Jahresabschluss einreichen',
        description: 'Bilanz, G&V und Anhang einreichen',
        priority: 'high',
        dueDate: endOfYear.toISOString()
      },
      {
        title: 'Quartalsumsatzsteuer',
        description: 'Monatliche Umsatzsteuervoranmeldung',
        priority: 'high',
        dueDate: new Date(today.getFullYear(), today.getMonth() + 1, 10).toISOString()
      }
    ],
    ag: [
      {
        title: 'Geschäftsbericht',
        description: 'Jahresbericht für Aktionäre',
        priority: 'high',
        dueDate: new Date(today.getFullYear(), 4, 31).toISOString()
      },
      {
        title: 'Hauptversammlung',
        description: 'Ordentliche Hauptversammlung durchführen',
        priority: 'high',
        dueDate: new Date(today.getFullYear(), 7, 31).toISOString()
      }
    ],
    ev: [
      {
        title: 'Mitgliederversammlung',
        description: 'Jahreshauptversammlung durchführen',
        priority: 'high',
        dueDate: endOfYear.toISOString()
      }
    ]
  };

  return tasks[legalForm] || [];
}