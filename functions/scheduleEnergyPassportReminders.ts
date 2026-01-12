import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    console.log('[Energy Passport Reminders] Starting check...');

    const passports = await base44.asServiceRole.entities.EnergyPassport.list();
    const buildings = await base44.asServiceRole.entities.Building.list();
    
    let notificationsSent = 0;

    for (const passport of passports) {
      const gueltigBis = new Date(passport.gueltig_bis);
      const heute = new Date();
      const monthsRemaining = Math.floor((gueltigBis - heute) / (1000 * 60 * 60 * 24 * 30));

      const building = buildings.find(b => b.id === passport.building_id);
      const buildingName = building?.name || 'Unbekanntes Gebäude';

      let shouldNotify = false;
      let message = '';

      if (monthsRemaining < 0) {
        shouldNotify = true;
        message = `Der Energieausweis für "${buildingName}" ist abgelaufen. ` +
                  `Bei Neuvermietung muss ein gültiger Ausweis vorliegen (GEG-Pflicht).`;
        
        await base44.asServiceRole.entities.EnergyPassport.update(passport.id, {
          status: 'Abgelaufen'
        });
      } else if (monthsRemaining <= 6) {
        shouldNotify = true;
        message = `Der Energieausweis für "${buildingName}" läuft in ${monthsRemaining} Monat(en) ab. ` +
                  `Bitte rechtzeitig erneuern.`;
        
        await base44.asServiceRole.entities.EnergyPassport.update(passport.id, {
          status: 'Läuft bald ab'
        });
      }

      if (shouldNotify) {
        await base44.asServiceRole.entities.Task.create({
          titel: `Energieausweis erneuern - ${buildingName}`,
          beschreibung: message,
          prioritaet: monthsRemaining < 0 ? 'Hoch' : 'Mittel',
          kategorie: 'Verwaltung',
          faelligkeitsdatum: new Date(heute.setDate(heute.getDate() + 30)).toISOString().split('T')[0],
          building_id: passport.building_id,
          status: 'Offen'
        });

        notificationsSent++;
        console.log(`[Energy Passport] Reminder created for ${buildingName}`);
      }
    }

    console.log(`[Energy Passport Reminders] Completed. ${notificationsSent} notifications sent.`);

    return Response.json({ 
      success: true, 
      notifications_sent: notificationsSent,
      total_passports: passports.length
    });
  } catch (error) {
    console.error('[Energy Passport Reminders] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});