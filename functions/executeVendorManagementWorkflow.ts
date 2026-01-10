import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { 
    workflow_id,
    action_type = 'insurance_reminder',
    days_before_expiry = 30
  } = await req.json();

  const results = [];
  const today = new Date();

  if (action_type === 'insurance_reminder') {
    const vendors = await base44.asServiceRole.entities.Vendor.filter({ is_active: true });
    
    for (const vendor of vendors) {
      if (vendor.insurance_valid_until) {
        const expiryDate = new Date(vendor.insurance_valid_until);
        const daysUntil = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntil >= 0 && daysUntil <= days_before_expiry) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: vendor.email,
            subject: 'Versicherungsablauf - Erinnerung',
            body: `
Sehr geehrte Damen und Herren,

Ihre Versicherung läuft am ${expiryDate.toLocaleDateString('de-DE')} ab (in ${daysUntil} Tagen).

Bitte senden Sie uns eine aktualisierte Versicherungsbestätigung.

Firma: ${vendor.company_name}

Mit freundlichen Grüßen
            `
          });

          results.push({
            vendor: vendor.company_name,
            expiry_date: vendor.insurance_valid_until,
            days_until: daysUntil
          });
        }
      }
    }
  } else if (action_type === 'performance_review') {
    const vendors = await base44.asServiceRole.entities.Vendor.filter({ is_active: true });
    
    for (const vendor of vendors) {
      const ratings = await base44.asServiceRole.entities.VendorRating.filter({
        vendor_id: vendor.id
      });

      if (ratings.length >= 5) {
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        
        if (avgRating < 3) {
          // Notify admins about poor performance
          const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
          
          for (const admin of admins) {
            await base44.asServiceRole.functions.invoke('sendNotificationWithEmail', {
              user_email: admin.email,
              title: 'Dienstleister-Warnung',
              message: `${vendor.company_name} hat eine niedrige Durchschnittsbewertung von ${avgRating.toFixed(1)}/5`,
              type: 'system',
              priority: 'high'
            });
          }

          results.push({
            vendor: vendor.company_name,
            avg_rating: avgRating,
            total_ratings: ratings.length
          });
        }
      }
    }
  }

  return Response.json({ 
    success: true, 
    actions_performed: results.length,
    details: results
  });
});