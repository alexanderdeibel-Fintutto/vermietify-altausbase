import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { unit_id, applicant_email } = await req.json();
    
    const unit = await base44.asServiceRole.entities.Unit.read(unit_id);
    const building = await base44.asServiceRole.entities.Building.read(unit.building_id);
    
    // Generate AR model URL (in production: use actual 3D scanning service)
    const arModelUrl = `https://ar-models.example.com/unit_${unit_id}.glb`;
    const floorPlanUrl = building.floor_plan_url || null;
    
    const sessionId = `ar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const arViewing = await base44.asServiceRole.entities.ARViewing.create({
      unit_id,
      company_id: unit.company_id,
      applicant_email,
      ar_model_url: arModelUrl,
      floor_plan_url: floorPlanUrl,
      viewing_session_id: sessionId,
      session_duration_minutes: 0,
      interaction_points: [],
      scheduled_physical_viewing: false
    });
    
    // Send viewing link to applicant
    await base44.integrations.Core.SendEmail({
      to: applicant_email,
      subject: '🏠 Ihre AR-Wohnungsbesichtigung ist bereit!',
      body: `Hallo,

vielen Dank für Ihr Interesse an unserer Wohnung!

Sie können die Wohnung jetzt virtuell per Augmented Reality besichtigen:
📱 AR-Link: https://app.finx.de/ar-viewing/${sessionId}

Tipps:
- Nutzen Sie Ihr Smartphone oder Tablet
- Erlauben Sie Kamera-Zugriff für AR-Funktionen
- Gehen Sie virtuell durch alle Räume

Größe: ${unit.size_sqm} m² | Zimmer: ${unit.rooms}
Adresse: ${building.address?.street}, ${building.address?.city}

Bei Interesse melden Sie sich für eine persönliche Besichtigung!

Mit freundlichen Grüßen`
    });
    
    return Response.json({ success: true, viewing: arViewing, session_url: `https://app.finx.de/ar-viewing/${sessionId}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});