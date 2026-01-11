import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const today = new Date();
    const allContracts = await base44.asServiceRole.entities.LeaseContract.filter({ status: 'active' });
    
    const reminders = [];
    
    for (const contract of allContracts) {
      const dueDate = new Date(today.getFullYear(), today.getMonth(), contract.payment_day || 1);
      const daysPastDue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      
      if (daysPastDue <= 0) continue;
      
      // Check existing reminders
      const existingReminders = await base44.asServiceRole.entities.PaymentReminder.filter({
        contract_id: contract.id,
        payment_received: false
      });
      
      let reminderLevel = 1;
      if (daysPastDue > 14) reminderLevel = 3;
      else if (daysPastDue > 7) reminderLevel = 2;
      
      // Skip if already sent at this level
      if (existingReminders.some(r => r.reminder_level >= reminderLevel)) continue;
      
      const reminder = await base44.asServiceRole.entities.PaymentReminder.create({
        contract_id: contract.id,
        tenant_id: contract.tenant_id,
        company_id: contract.company_id,
        reminder_level: reminderLevel,
        amount_due: contract.monthly_rent,
        due_date: dueDate.toISOString().split('T')[0],
        sent_date: today.toISOString().split('T')[0],
        payment_received: false,
        next_action_date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      
      // Send email
      const tenant = await base44.asServiceRole.entities.Tenant.read(contract.tenant_id);
      const subject = reminderLevel === 1 ? 'Zahlungserinnerung' : 
                     reminderLevel === 2 ? '1. Mahnung' : 'Letzte Mahnung';
      
      await base44.integrations.Core.SendEmail({
        to: tenant.email,
        subject: `${subject} - Miete ${contract.monthly_rent}€`,
        body: `Sehr geehrte/r ${tenant.first_name} ${tenant.last_name},

wir stellen fest, dass die Mietzahlung von ${contract.monthly_rent}€ fällig am ${dueDate.toLocaleDateString('de-DE')} noch nicht bei uns eingegangen ist.

${reminderLevel === 3 ? 'Dies ist unsere letzte Mahnung. Bei weiterem Zahlungsverzug behalten wir uns rechtliche Schritte vor.' : 'Bitte überweisen Sie den Betrag zeitnah.'}

Mit freundlichen Grüßen`
      });
      
      reminders.push(reminder);
    }
    
    return Response.json({ success: true, reminders_sent: reminders.length, reminders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});