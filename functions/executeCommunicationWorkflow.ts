import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflow_id, test_mode = false } = await req.json();

    const workflow = await base44.entities.CommunicationWorkflow.filter({ id: workflow_id }).then(r => r[0]);
    
    if (!workflow) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (!workflow.ist_aktiv && !test_mode) {
      return Response.json({ error: 'Workflow is not active' }, { status: 400 });
    }

    let targetContracts = [];

    switch (workflow.workflow_type) {
      case 'Mietzahlungserinnerung':
        targetContracts = await findContractsWithUpcomingPayments(base44, workflow);
        break;
      case 'Vertragsverlängerung':
        targetContracts = await findContractsExpiringSoon(base44, workflow);
        break;
      case 'Wartungsanfrage':
        return Response.json({ message: 'Event-based workflow' });
      default:
        targetContracts = await base44.entities.LeaseContract.filter({ vertragsstatus: 'Aktiv' });
    }

    let sentCount = 0;

    for (const contract of targetContracts) {
      const tenant = await base44.entities.Tenant.filter({ id: contract.tenant_id }).then(r => r[0]);
      const unit = await base44.entities.Unit.filter({ id: contract.unit_id }).then(r => r[0]);
      const building = await base44.entities.Building.filter({ id: unit?.gebaeude_id }).then(r => r[0]);

      if (!tenant || !tenant.email) continue;

      const placeholders = {
        '{{mieter_vorname}}': tenant.first_name || '',
        '{{mieter_nachname}}': tenant.last_name || '',
        '{{mieter_anrede}}': tenant.anrede || 'Herr/Frau',
        '{{mietbeginn}}': contract.start_date || '',
        '{{kaltmiete}}': contract.kaltmiete?.toFixed(2) || '0.00',
        '{{warmmiete}}': contract.warmmiete?.toFixed(2) || '0.00',
        '{{faelligkeitstag}}': contract.faelligkeitstag || '3',
        '{{gebaeude_name}}': building?.name || '',
        '{{gebaeude_adresse}}': building?.address || '',
        '{{heute}}': new Date().toLocaleDateString('de-DE'),
        '{{faellig_am}}': calculateDueDate(contract.faelligkeitstag),
        '{{vertragsende}}': contract.end_date || ''
      };

      let emailSubject = workflow.email_betreff;
      let emailBody = workflow.email_text;

      Object.entries(placeholders).forEach(([key, value]) => {
        emailSubject = emailSubject.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
        emailBody = emailBody.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
      });

      if (!test_mode) {
        await base44.integrations.Core.SendEmail({
          to: tenant.email,
          subject: emailSubject,
          body: emailBody
        });

        await base44.entities.CommunicationLog.create({
          workflow_id: workflow.id,
          tenant_id: tenant.id,
          contract_id: contract.id,
          building_id: building?.id,
          kommunikationstyp: 'E-Mail',
          empfaenger_email: tenant.email,
          betreff: emailSubject,
          nachricht: emailBody,
          versand_status: 'Versendet',
          versendet_am: new Date().toISOString().split('T')[0]
        });

        await base44.entities.CommunicationWorkflow.update(workflow.id, {
          letzte_ausfuehrung: new Date().toISOString().split('T')[0],
          anzahl_versendungen: (workflow.anzahl_versendungen || 0) + 1
        });
      }

      sentCount++;
    }

    console.log(`[Workflow ${workflow.name}] Sent ${sentCount} communications (test_mode: ${test_mode})`);

    return Response.json({ 
      success: true, 
      sent_count: sentCount,
      test_mode 
    });
  } catch (error) {
    console.error('Workflow execution error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateDueDate(day) {
  const today = new Date();
  const dueDate = new Date(today.getFullYear(), today.getMonth(), day || 3);
  if (dueDate < today) {
    dueDate.setMonth(dueDate.getMonth() + 1);
  }
  return dueDate.toLocaleDateString('de-DE');
}

async function findContractsWithUpcomingPayments(base44, workflow) {
  const offsetDays = workflow.trigger_offset_days || -3;
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - offsetDays);

  const contracts = await base44.entities.LeaseContract.filter({ vertragsstatus: 'Aktiv' });
  
  return contracts.filter(contract => {
    const dueDay = contract.faelligkeitstag || 3;
    const dueDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), dueDay);
    const daysDiff = Math.abs((dueDate - new Date()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 1;
  });
}

async function findContractsExpiringSoon(base44, workflow) {
  const offsetDays = workflow.trigger_offset_days || -60;
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - offsetDays);

  const contracts = await base44.entities.LeaseContract.filter({ 
    vertragsstatus: 'Aktiv',
    vertragsart: 'Befristet'
  });
  
  return contracts.filter(contract => {
    if (!contract.end_date) return false;
    const endDate = new Date(contract.end_date);
    const daysDiff = (endDate - new Date()) / (1000 * 60 * 60 * 24);
    return daysDiff > 0 && daysDiff <= Math.abs(offsetDays);
  });
}