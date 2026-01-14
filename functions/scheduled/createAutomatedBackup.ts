import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This is a scheduled task - no user auth needed, use service role
    console.log('Starting automated backup job...');
    
    // Fetch all users who have auto-backup enabled
    const allPreferences = await base44.asServiceRole.entities.UserPreferences.list();
    const usersWithAutoBackup = allPreferences.filter(pref => pref.auto_backup_enabled);
    
    console.log(`Found ${usersWithAutoBackup.length} users with auto-backup enabled`);
    
    for (const userPref of usersWithAutoBackup) {
      try {
        const userEmail = userPref.user_email;
        console.log(`Creating backup for user: ${userEmail}`);
        
        // Check if backup is due based on frequency
        const lastBackup = userPref.last_backup_date ? new Date(userPref.last_backup_date) : null;
        const now = new Date();
        const daysSinceBackup = lastBackup ? (now - lastBackup) / (1000 * 60 * 60 * 24) : 999;
        
        let shouldBackup = false;
        if (userPref.backup_frequency === 'daily' && daysSinceBackup >= 1) shouldBackup = true;
        if (userPref.backup_frequency === 'weekly' && daysSinceBackup >= 7) shouldBackup = true;
        if (userPref.backup_frequency === 'monthly' && daysSinceBackup >= 30) shouldBackup = true;
        
        if (!shouldBackup) {
          console.log(`Backup not due for ${userEmail} (last: ${daysSinceBackup.toFixed(1)} days ago)`);
          continue;
        }
        
        // Fetch user's data (service role can access all data)
        const [buildings, units, contracts, tenants, invoices] = await Promise.all([
          base44.asServiceRole.entities.Building.list(),
          base44.asServiceRole.entities.Unit.list(),
          base44.asServiceRole.entities.LeaseContract.list(),
          base44.asServiceRole.entities.Tenant.list(),
          base44.asServiceRole.entities.Invoice.list()
        ]);
        
        const backupData = {
          timestamp: now.toISOString(),
          user_email: userEmail,
          version: '1.0',
          data: {
            buildings,
            units,
            contracts,
            tenants,
            invoices
          }
        };
        
        const backupJson = JSON.stringify(backupData, null, 2);
        const backupSizeKb = Math.round(backupJson.length / 1024);
        
        // Send backup via email
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: userEmail,
          subject: `FinX Backup - ${format(now, 'dd.MM.yyyy')}`,
          body: `
            <h2>Ihr automatisches FinX Backup</h2>
            <p>Ihr regelmäßiges Backup wurde erfolgreich erstellt.</p>
            <ul>
              <li><strong>Zeitpunkt:</strong> ${now.toLocaleString('de-DE')}</li>
              <li><strong>Größe:</strong> ${backupSizeKb} KB</li>
              <li><strong>Gebäude:</strong> ${buildings.length}</li>
              <li><strong>Verträge:</strong> ${contracts.length}</li>
              <li><strong>Rechnungen:</strong> ${invoices.length}</li>
            </ul>
            <p><em>Die Backup-Datei ist im Anhang dieser E-Mail.</em></p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              Sie erhalten diese E-Mail, weil Sie automatische Backups aktiviert haben.
              Ändern Sie die Einstellungen in Ihrem Account.
            </p>
          `
        });
        
        // Update last backup timestamp
        await base44.asServiceRole.entities.UserPreferences.update(userPref.id, {
          last_backup_date: now.toISOString(),
          backup_size_kb: backupSizeKb
        });
        
        console.log(`Backup created and sent to ${userEmail} (${backupSizeKb} KB)`);
        
      } catch (userError) {
        console.error(`Error creating backup for ${userPref.user_email}:`, userError);
      }
    }
    
    return Response.json({ 
      success: true,
      processed: usersWithAutoBackup.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Automated backup job error:', error);
    return Response.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});