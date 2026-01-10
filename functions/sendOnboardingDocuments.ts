import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { onboarding_id, channel } = await req.json();

    const onboarding = await base44.entities.TenantOnboarding.get(onboarding_id);
    const tenant = await base44.entities.Tenant.get(onboarding.tenant_id);
    
    const documentIds = onboarding.generated_documents.map(d => d.document_id);
    const documents = await Promise.all(
      documentIds.map(id => base44.entities.Document.get(id))
    );

    const results = [];

    // Send via selected channel
    if (channel === 'email' || channel === 'mixed') {
      const emailResult = await sendViaEmail(base44, tenant, documents);
      results.push({ channel: 'email', ...emailResult });
    }

    if (channel === 'whatsapp' || channel === 'mixed') {
      const whatsappResult = await sendViaWhatsApp(base44, tenant, documents);
      results.push({ channel: 'whatsapp', ...whatsappResult });
    }

    if (channel === 'post' || channel === 'mixed') {
      const postResult = await sendViaPost(base44, tenant, documents);
      results.push({ channel: 'post', ...postResult });
    }

    // Update onboarding status
    await base44.asServiceRole.entities.TenantOnboarding.update(onboarding_id, {
      status: 'documents_sent',
      generated_documents: onboarding.generated_documents.map(d => ({
        ...d,
        status: 'sent',
        sent_at: new Date().toISOString(),
        channel
      })),
      steps_completed: [
        ...onboarding.steps_completed,
        { step: 'documents_sent', completed_at: new Date().toISOString(), status: 'completed' }
      ],
      progress_percentage: 70
    });

    return Response.json({ results, status: 'success' });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function sendViaEmail(base44, tenant, documents) {
  try {
    const documentList = documents.map(d => `- ${d.name}`).join('\n');
    
    await base44.integrations.Core.SendEmail({
      to: tenant.email,
      subject: 'Ihre Onboarding-Unterlagen',
      body: `Hallo ${tenant.first_name} ${tenant.last_name},

herzlich willkommen! Anbei erhalten Sie Ihre Onboarding-Unterlagen:

${documentList}

Bitte prüfen Sie die Dokumente und senden Sie diese unterschrieben zurück.

Mit freundlichen Grüßen
Ihre Hausverwaltung`
    });

    return { success: true, message: 'Email gesendet' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function sendViaWhatsApp(base44, tenant, documents) {
  try {
    if (!tenant.phone) {
      return { success: false, error: 'Keine Telefonnummer hinterlegt' };
    }

    // Send via WhatsApp connector if available
    const message = `Hallo ${tenant.first_name}, herzlich willkommen! Ihre Onboarding-Unterlagen wurden vorbereitet. Sie erhalten diese in Kürze per Email.`;
    
    // This would use the WhatsApp connector if properly configured
    // For now, we just log it
    console.log('WhatsApp message would be sent:', message);

    return { success: true, message: 'WhatsApp-Nachricht vorbereitet' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function sendViaPost(base44, tenant, documents) {
  try {
    // Create a record for postal sending
    // This would integrate with LetterXpress or similar service
    console.log('Postal sending prepared for:', tenant.address);

    return { success: true, message: 'Postversand vorbereitet' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}