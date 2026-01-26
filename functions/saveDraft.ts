import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Speichert einen Abrechnung-Entwurf
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { draftId, data, currentStep } = await req.json();

    let result;
    
    if (draftId) {
      // Update existing draft
      result = await base44.entities.OperatingCostStatement.update(draftId, {
        draft_details: JSON.stringify(data),
        current_step: currentStep,
        status: 'Entwurf',
        updated_date: new Date().toISOString()
      });
    } else {
      // Create new draft
      result = await base44.entities.OperatingCostStatement.create({
        building_id: data.building_id,
        abrechnungsjahr: new Date(data.period_start).getFullYear(),
        zeitraum_von: data.period_start,
        zeitraum_bis: data.period_end,
        erstellungsdatum: new Date().toISOString().split('T')[0],
        status: 'Entwurf',
        draft_details: JSON.stringify(data),
        current_step: currentStep
      });
    }

    return Response.json({
      success: true,
      draftId: result.id
    });

  } catch (error) {
    console.error('Error saving draft:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});