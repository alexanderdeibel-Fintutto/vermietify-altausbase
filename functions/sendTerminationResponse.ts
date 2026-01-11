import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { terminationId, responseType, communicationMethod, customMessage } = await req.json();

        console.log(`Sending termination response for ${terminationId} via ${communicationMethod}`);

        // 1. Load termination and related data
        const termination = await base44.entities.Termination.read(terminationId);
        const tenant = await base44.entities.Tenant.read(termination.tenant_id);
        const contract = await base44.entities.LeaseContract.read(termination.contract_id);

        // 2. Generate response document based on template
        let responseMessage = '';
        let subject = '';

        if (responseType === 'confirmation') {
            subject = 'Bestätigung Ihrer Kündigung';
            responseMessage = `Sehr geehrte/r ${tenant.first_name} ${tenant.last_name},\n\n` +
                `wir bestätigen den Eingang Ihrer Kündigung vom ${new Date(termination.termination_date).toLocaleDateString('de-DE')}.\n\n` +
                `Ihr Mietverhältnis endet zum ${new Date(termination.move_out_date).toLocaleDateString('de-DE')}.\n\n` +
                `Bitte vereinbaren Sie rechtzeitig einen Termin für das Übergabeprotokoll.\n\n` +
                `Mit freundlichen Grüßen`;
        } else if (responseType === 'correction_notice_period') {
            subject = 'Eingangsbestätigung Ihrer Kündigung - Korrektur Kündigungsfrist';
            responseMessage = `Sehr geehrte/r ${tenant.first_name} ${tenant.last_name},\n\n` +
                `wir bestätigen den Eingang Ihrer Kündigung vom ${new Date(termination.termination_date).toLocaleDateString('de-DE')}.\n\n` +
                `Gemäß Ihrem Mietvertrag beträgt die Kündigungsfrist ${termination.notice_period_months} Monate. ` +
                `Das frühestmögliche Auszugsdatum ist daher der ${new Date(termination.calculated_move_out_date).toLocaleDateString('de-DE')}.\n\n` +
                `Das von Ihnen angegebene Datum (${new Date(termination.requested_move_out_date).toLocaleDateString('de-DE')}) ` +
                `kann leider nicht berücksichtigt werden.\n\n` +
                `Mit freundlichen Grüßen`;
        } else if (customMessage) {
            subject = 'Ihre Kündigung';
            responseMessage = customMessage;
        }

        // 3. Send via selected communication method
        const responses = [];

        if (communicationMethod === 'email' || communicationMethod === 'all') {
            await base44.integrations.Core.SendEmail({
                to: tenant.email,
                subject: subject,
                body: responseMessage
            });
            responses.push({ method: 'email', status: 'sent', to: tenant.email });
        }

        if (communicationMethod === 'in_app' || communicationMethod === 'all') {
            await base44.entities.TenantNotification.create({
                tenant_id: tenant.id,
                company_id: termination.company_id,
                notification_type: 'contract_update',
                title: subject,
                message: responseMessage,
                priority: 'high',
                sent_at: new Date().toISOString()
            });
            responses.push({ method: 'in_app', status: 'sent' });
        }

        if (communicationMethod === 'whatsapp' && tenant.communication_preferences?.whatsapp_number) {
            // WhatsApp integration would go here
            responses.push({ method: 'whatsapp', status: 'pending', note: 'WhatsApp integration pending' });
        }

        if (communicationMethod === 'postal' || communicationMethod === 'all') {
            // Postal integration (LetterXpress) would go here
            responses.push({ method: 'postal', status: 'pending', note: 'Postal service integration pending' });
        }

        // 4. Update termination status
        await base44.entities.Termination.update(terminationId, {
            status: 'confirmation_sent',
            response_type: responseType,
            response_sent_date: new Date().toISOString(),
            response_method: communicationMethod
        });

        // 5. Update tenant address history with future address if provided
        if (termination.future_address) {
            const currentAddressHistory = tenant.address_history || [];
            const updatedHistory = [
                ...currentAddressHistory,
                {
                    address_type: 'future',
                    street: termination.future_address.street,
                    house_number: termination.future_address.house_number,
                    postal_code: termination.future_address.postal_code,
                    city: termination.future_address.city,
                    country: termination.future_address.country || 'Deutschland',
                    valid_from: termination.move_out_date,
                    is_current: false,
                    notes: 'Nach Auszug'
                }
            ];
            
            await base44.entities.Tenant.update(tenant.id, {
                address_history: updatedHistory
            });
        }

        return Response.json({
            success: true,
            responses,
            message: `Antwort erfolgreich versendet via ${communicationMethod}`
        });

    } catch (error) {
        console.error('Error sending termination response:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});