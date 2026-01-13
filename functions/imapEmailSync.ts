import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imapServer, email, password } = await req.json();

    // IMAP sync mock - In real app, use imap library
    console.log(`Syncing emails from ${email} via ${imapServer}`);

    const syncedEmails = [
      {
        from: 'invoice@supplier.de',
        subject: 'Rechnung INV-001',
        date: new Date(),
        category: 'invoice',
        amount: 450.00
      },
      {
        from: 'notification@bank.de',
        subject: 'Zahlungsbestätigung',
        date: new Date(),
        category: 'payment',
        amount: 2000.00
      }
    ];

    // Auto-categorize emails
    const categorized = syncedEmails.map(email => {
      const subject = email.subject.toLowerCase();
      
      if (subject.includes('rechnung') || subject.includes('invoice')) {
        return { ...email, category: 'invoice' };
      }
      if (subject.includes('zahlung') || subject.includes('payment')) {
        return { ...email, category: 'payment' };
      }
      if (subject.includes('mahnung')) {
        return { ...email, category: 'reminder' };
      }
      
      return { ...email, category: 'other' };
    });

    // Create DocumentInbox entries for invoices
    for (const email of categorized) {
      if (email.category === 'invoice') {
        await base44.entities.DocumentInbox.create({
          source_type: 'email',
          source_email: email.from,
          subject: email.subject,
          category: 'invoice',
          amount: email.amount,
          date_received: email.date,
          status: 'pending_review'
        });
      }
    }

    return Response.json({
      success: true,
      synced: categorized.length,
      emails: categorized
    });

  } catch (error) {
    console.error('IMAP error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});