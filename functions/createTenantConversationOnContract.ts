import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { contractId, tenantId, tenantEmail, unitId, buildingId } = await req.json();
    
    // Prüfen ob bereits Conversation existiert
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('unit_id', unitId)
      .eq('conversation_type', 'direct')
      .limit(1)
      .single();
    
    if (existingConv) {
      return Response.json({ 
        success: true, 
        conversationId: existingConv.id,
        message: 'Conversation already exists'
      });
    }
    
    // Neue Conversation erstellen
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        conversation_type: 'direct',
        building_id: buildingId,
        unit_id: unitId,
        title: `Mietvertrag - Einheit ${unitId}`,
        source_app: 'vermietify',
        created_by: user.id
      })
      .select()
      .single();
    
    if (convError) throw convError;
    
    // Members hinzufügen
    await supabase.from('conversation_members').insert([
      {
        conversation_id: conversation.id,
        user_id: user.id,
        role: 'owner',
        user_type: 'landlord',
        user_app: 'vermietify',
        user_name: user.full_name,
        user_email: user.email
      },
      {
        conversation_id: conversation.id,
        user_email: tenantEmail,
        role: 'member',
        user_type: 'tenant',
        user_app: 'mieterapp'
      }
    ]);
    
    // Willkommensnachricht
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      sender_name: 'System',
      sender_type: 'system',
      sender_app: 'vermietify',
      content: `Willkommen! Diese Konversation wurde automatisch für Ihre Wohnung erstellt. Sie können hier jederzeit Fragen stellen oder Anliegen mitteilen.`,
      content_type: 'system'
    });
    
    return Response.json({
      success: true,
      conversationId: conversation.id,
      message: 'Conversation created'
    });
    
  } catch (error) {
    console.error('Create Conversation Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});