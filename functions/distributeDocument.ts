import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            document_id,
            tenant_id,
            channels = [], // ['email', 'whatsapp', 'postal']
            auto_select = true
        } = await req.json();

        console.log(`Distributing document ${document_id} via ${channels.join(', ')}`);

        // Get document
        const doc = await base44.entities.GeneratedDocument.filter({
            id: document_id
        });

        if (!doc || doc.length === 0) {
            return Response.json({ error: 'Document not found' }, { status: 404 });
        }

        const document = doc[0];

        // Get tenant preferences
        const tenants = await base44.entities.Tenant.filter({
            id: tenant_id
        });

        if (!tenants || tenants.length === 0) {
            return Response.json({ error: 'Tenant not found' }, { status: 404 });
        }

        const tenant = tenants[0];
        const prefs = tenant.communication_preferences || {};

        // Determine channels
        let targetChannels = channels;
        if (auto_select && channels.length === 0) {
            if (prefs.primary_method) targetChannels.push(prefs.primary_method);
            if (prefs.secondary_method) targetChannels.push(prefs.secondary_method);
        }

        const distributionResults = [];
        const signedUrl = await base44.integrations.Core.CreateFileSignedUrl({
            file_uri: document.pdf_file_uri,
            expires_in: 7 * 24 * 60 * 60 // 7 days
        });

        // EMAIL
        if (targetChannels.includes('email') && tenant.email && prefs.allow_email) {
            try {
                await base44.integrations.Core.SendEmail({
                    to: tenant.email,
                    subject: `Dokument: ${document.document_type}`,
                    body: `Anbei erhalten Sie das Dokument ${document.document_type}.\n\nLink: ${signedUrl.signed_url}`
                });
                distributionResults.push({ channel: 'email', status: 'sent' });
            } catch (e) {
                console.error('Email failed:', e);
                distributionResults.push({ channel: 'email', status: 'failed', error: e.message });
            }
        }

        // WHATSAPP
        if (targetChannels.includes('whatsapp') && prefs.whatsapp_number && prefs.allow_whatsapp) {
            try {
                await base44.functions.invoke('whatsapp_sendDocument', {
                    phone: prefs.whatsapp_number,
                    file_url: signedUrl.signed_url,
                    caption: `${document.document_type}: Ihr wichtiges Dokument`
                });
                distributionResults.push({ channel: 'whatsapp', status: 'sent' });
            } catch (e) {
                console.error('WhatsApp failed:', e);
                distributionResults.push({ channel: 'whatsapp', status: 'failed', error: e.message });
            }
        }

        // POSTAL
        if (targetChannels.includes('postal') && prefs.postal_address_override && prefs.allow_postal) {
            try {
                const result = await base44.functions.invoke('letterxpress', {
                    file_url: signedUrl.signed_url,
                    recipient: {
                        name: `${tenant.first_name} ${tenant.last_name}`,
                        address: prefs.postal_address_override
                    },
                    document_type: document.document_type
                });
                distributionResults.push({ channel: 'postal', status: 'sent', delivery_id: result.shipment_id });
            } catch (e) {
                console.error('Postal failed:', e);
                distributionResults.push({ channel: 'postal', status: 'failed', error: e.message });
            }
        }

        // IN-APP
        if (targetChannels.includes('in_app')) {
            try {
                await base44.functions.invoke('sendNotification', {
                    user_email: user.email,
                    title: `Dokument verfügbar: ${document.document_type}`,
                    message: `Ein neues Dokument ist für Sie verfügbar`,
                    document_id: document_id
                });
                distributionResults.push({ channel: 'in_app', status: 'sent' });
            } catch (e) {
                console.error('In-App failed:', e);
                distributionResults.push({ channel: 'in_app', status: 'failed', error: e.message });
            }
        }

        // Update document status
        const newChannels = (document.distribution_channels || []).concat(
            distributionResults.map(r => ({
                channel: r.channel,
                status: r.status,
                timestamp: new Date().toISOString(),
                delivery_id: r.delivery_id,
                error_message: r.error
            }))
        );

        await base44.entities.GeneratedDocument.update(document_id, {
            distribution_channels: newChannels,
            distribution_status: distributionResults.some(r => r.status === 'sent') ? 'sent' : 'failed'
        });

        console.log(`Document distributed: ${JSON.stringify(distributionResults)}`);

        return Response.json({
            success: true,
            document_id,
            results: distributionResults
        });

    } catch (error) {
        console.error('Error distributing document:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});