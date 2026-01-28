import { supabase } from './supabaseClient';
import { base44 } from '@/api/base44Client';

const APP_ID = 'nk-abrechnung';
const USER_TYPE = 'landlord';

// ============================================================================
// CONVERSATIONS
// ============================================================================

export async function getMyConversations({ type = null, buildingId = null, limit = 50 } = {}) {
  try {
    const user = await base44.auth.me();
    if (!user) return [];
    
    let query = supabase
      .from('conversations')
      .select(`
        *,
        conversation_members!inner(user_id, role, last_read_at, unread_count),
        messages(id, content, created_at)
      `)
      .eq('conversation_members.user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    if (type) query = query.eq('conversation_type', type);
    if (buildingId) query = query.eq('building_id', buildingId);
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Get Conversations Error:', error);
    return [];
  }
}

export async function getConversationById(conversationId) {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        conversation_members(user_id, role, user_name, user_type, user_app),
        tasks(id, title, status, priority)
      `)
      .eq('id', conversationId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get Conversation Error:', error);
    return null;
  }
}

export async function createTenantConversation(tenantEmail, unitId, buildingId, subject, initialMessage = null) {
  try {
    const user = await base44.auth.me();
    
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        conversation_type: 'direct',
        building_id: buildingId,
        unit_id: unitId,
        title: subject,
        source_app: APP_ID,
        created_by: user.id
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Members hinzufügen
    await supabase.from('conversation_members').insert([
      {
        conversation_id: conversation.id,
        user_id: user.id,
        role: 'owner',
        user_type: USER_TYPE,
        user_app: APP_ID,
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
    
    if (initialMessage) {
      await sendMessage(conversation.id, initialMessage);
    }
    
    return { success: true, conversation };
  } catch (error) {
    console.error('Create Conversation Error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// MESSAGES
// ============================================================================

export async function getMessages(conversationId, { limit = 100, before = null } = {}) {
  try {
    let query = supabase
      .from('messages')
      .select(`
        *,
        message_attachments(*)
      `)
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(limit);
    
    if (before) {
      query = query.lt('created_at', before);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    // Als gelesen markieren
    await markConversationAsRead(conversationId);
    
    return data || [];
  } catch (error) {
    console.error('Get Messages Error:', error);
    return [];
  }
}

export async function sendMessage(conversationId, content, options = {}) {
  try {
    const user = await base44.auth.me();
    
    const messageData = {
      conversation_id: conversationId,
      sender_id: user.id,
      sender_name: user.full_name,
      sender_email: user.email,
      sender_type: USER_TYPE,
      sender_app: APP_ID,
      content,
      content_type: options.type || 'text',
      reply_to_id: options.replyTo || null,
      mentions: options.mentions || []
    };
    
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Anhänge hochladen
    if (options.attachments?.length > 0) {
      for (const file of options.attachments) {
        await uploadMessageAttachment(data.id, file);
      }
    }
    
    return { success: true, message: data };
  } catch (error) {
    console.error('Send Message Error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendImageMessage(conversationId, file, caption = '') {
  try {
    const user = await base44.auth.me();
    
    // Bild hochladen über Base44
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    
    // Nachricht erstellen
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_name: user.full_name,
        sender_email: user.email,
        sender_type: USER_TYPE,
        sender_app: APP_ID,
        content: caption || '📷 Bild',
        content_type: 'image'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Attachment-Eintrag
    await supabase.from('message_attachments').insert({
      message_id: message.id,
      file_url,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      attachment_type: 'image'
    });
    
    return { success: true, message };
  } catch (error) {
    console.error('Send Image Error:', error);
    return { success: false, error: error.message };
  }
}

async function uploadMessageAttachment(messageId, file) {
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  
  await supabase.from('message_attachments').insert({
    message_id: messageId,
    file_url,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type,
    attachment_type: determineAttachmentType(file.type)
  });
}

function determineAttachmentType(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'file';
}

async function markConversationAsRead(conversationId) {
  try {
    const user = await base44.auth.me();
    
    await supabase
      .from('conversation_members')
      .update({ 
        last_read_at: new Date().toISOString(),
        unread_count: 0
      })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);
  } catch (error) {
    console.error('Mark as read error:', error);
  }
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export async function getUnreadNotifications() {
  try {
    const user = await base44.auth.me();
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get Notifications Error:', error);
    return [];
  }
}

export async function markNotificationRead(notificationId) {
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId);
}

// ============================================================================
// REALTIME SUBSCRIPTIONS
// ============================================================================

export function subscribeToConversation(conversationId, callback) {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => callback(payload.new)
    )
    .subscribe();
}

export function subscribeToNotifications(userId, callback) {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => callback(payload.new)
    )
    .subscribe();
}

// ============================================================================
// DAMAGE REPORTS / TASKS
// ============================================================================

export async function createDamageReportWithConversation({
  buildingId,
  unitId,
  tenantId,
  title,
  description,
  category,
  urgency = 'medium',
  images = []
}) {
  try {
    const user = await base44.auth.me();
    
    // Conversation erstellen
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        conversation_type: 'task',
        building_id: buildingId,
        unit_id: unitId,
        title: `Schadensmeldung: ${title}`,
        source_app: APP_ID,
        created_by: user.id
      })
      .select()
      .single();
    
    if (convError) throw convError;
    
    // MaintenanceTask erstellen und mit Conversation verknüpfen
    const taskData = {
      building_id: buildingId,
      unit_id: unitId,
      titel: title,
      beschreibung: description,
      kategorie: category === 'water_damage' ? 'Reparatur' : 'Reparatur',
      prioritaet: urgency === 'emergency' ? 'Dringend' : urgency === 'high' ? 'Hoch' : 'Mittel',
      status: 'Offen',
      quelle_typ: 'tenant_portal',
      quelle_id: conversation.id
    };
    
    const task = await base44.entities.MaintenanceTask.create(taskData);
    
    // Conversation-Task-Link
    await supabase
      .from('conversations')
      .update({ task_id: task.id })
      .eq('id', conversation.id);
    
    // Members hinzufügen
    await supabase.from('conversation_members').insert([
      {
        conversation_id: conversation.id,
        user_id: user.id,
        role: 'owner',
        user_type: USER_TYPE,
        user_app: APP_ID,
        user_name: user.full_name,
        user_email: user.email
      },
      {
        conversation_id: conversation.id,
        user_id: tenantId,
        role: 'member',
        user_type: 'tenant',
        user_app: 'mieterapp'
      }
    ]);
    
    // Bilder hochladen als erste Nachricht
    if (images.length > 0) {
      for (const image of images) {
        await sendImageMessage(conversation.id, image, 'Schadensfoto');
      }
    }
    
    // System-Nachricht
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      sender_name: 'System',
      sender_type: 'system',
      sender_app: APP_ID,
      content: `Schadensmeldung wurde erstellt und an den Vermieter weitergeleitet.`,
      content_type: 'system'
    });
    
    return { success: true, conversation, task };
  } catch (error) {
    console.error('Create Damage Report Error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// DOCUMENT SHARING
// ============================================================================

export async function shareDocumentWithTenant(documentId, tenantEmail, unitId, buildingId) {
  try {
    const user = await base44.auth.me();
    
    // TenantPortalDocument erstellen
    const portalDoc = await base44.entities.TenantPortalDocument.create({
      unit_id: unitId,
      building_id: buildingId,
      document_type: 'other',
      title: 'Freigegebenes Dokument',
      file_url: documentId, // hier besser die echte URL
      is_visible: true
    });
    
    // Notification an Mieter senden (via Supabase)
    await supabase.from('notifications').insert({
      user_email: tenantEmail,
      notification_type: 'document_shared',
      title: 'Neues Dokument verfügbar',
      message: `Ein neues Dokument wurde für Sie freigegeben.`,
      action_url: `/tenant/documents`,
      source_app: 'mieterapp'
    });
    
    return { success: true, portalDoc };
  } catch (error) {
    console.error('Share Document Error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// TENANT INVITATIONS
// ============================================================================

export async function generateTenantInvitation(tenantEmail, unitId, buildingId, inviteType = 'mieterapp') {
  try {
    const inviteCode = generateInviteCode();
    const mieterAppUrl = 'https://mieterapp.fintutto.de';
    const inviteUrl = `${mieterAppUrl}/invite/${inviteCode}`;
    
    const invitation = await base44.entities.TenantInvitation.create({
      unit_id: unitId,
      building_id: buildingId,
      tenant_email: tenantEmail,
      invite_code: inviteCode,
      invite_url: inviteUrl,
      invite_type: inviteType,
      status: 'pending',
      access_level: 'full'
    });
    
    return { success: true, invitation, inviteUrl };
  } catch (error) {
    console.error('Generate Invitation Error:', error);
    return { success: false, error: error.message };
  }
}

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export async function sendInvitationEmail(invitationId) {
  try {
    const invitation = await base44.entities.TenantInvitation.get(invitationId);
    
    await base44.integrations.Core.SendEmail({
      to: invitation.tenant_email,
      subject: 'Einladung zur FinTuttO MieterApp',
      body: `
        <h2>Willkommen bei FinTuttO!</h2>
        <p>Sie wurden zur MieterApp eingeladen.</p>
        <p><a href="${invitation.invite_url}">Jetzt anmelden</a></p>
        <p>Mit der MieterApp können Sie:</p>
        <ul>
          <li>Dokumente einsehen (Nebenkostenabrechnungen, etc.)</li>
          <li>Mit Ihrem Vermieter kommunizieren</li>
          <li>Schäden melden</li>
          <li>Zählerstände übermitteln</li>
        </ul>
      `
    });
    
    return { success: true };
  } catch (error) {
    console.error('Send Invitation Error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// UTILS
// ============================================================================

export function subscribeToConversationUpdates(conversationId, onNewMessage) {
  return subscribeToConversation(conversationId, onNewMessage);
}

export async function getUnreadCount() {
  try {
    const user = await base44.auth.me();
    
    const { data, error } = await supabase
      .from('conversation_members')
      .select('unread_count')
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    return data?.reduce((sum, m) => sum + (m.unread_count || 0), 0) || 0;
  } catch (error) {
    console.error('Get Unread Count Error:', error);
    return 0;
  }
}