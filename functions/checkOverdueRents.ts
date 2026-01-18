import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This function runs as a scheduled task (admin-only)
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const dayOfMonth = today.getDate();

    // Only check after the 5th of the month
    if (dayOfMonth < 5) {
      return Response.json({ 
        message: 'Too early in the month',
        checked: 0 
      });
    }

    // Get all active contracts
    const allContracts = await base44.asServiceRole.entities.LeaseContract.filter({ 
      status: 'Aktiv' 
    });

    // Get all payments for current month
    const allPayments = await base44.asServiceRole.entities.ActualPayment.list();
    const currentMonthPayments = allPayments.filter(p => {
      const paymentDate = new Date(p.payment_date);
      return paymentDate.getMonth() === currentMonth && 
             paymentDate.getFullYear() === currentYear;
    });

    const overdueContracts = [];

    for (const contract of allContracts) {
      const hasPayment = currentMonthPayments.some(p => 
        p.contract_id === contract.id
      );

      if (!hasPayment) {
        overdueContracts.push(contract);
        
        // Create notification
        await base44.asServiceRole.entities.Notification.create({
          title: 'Überfällige Miete',
          message: `Keine Mietzahlung für Vertrag ${contract.id.substring(0, 8)} erhalten`,
          type: 'warning',
          category: 'payment',
          recipient_email: user.email
        });
      }
    }

    return Response.json({
      success: true,
      checked: allContracts.length,
      overdue: overdueContracts.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});