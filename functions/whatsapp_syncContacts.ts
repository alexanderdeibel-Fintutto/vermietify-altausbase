import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { whatsapp_account_id, kontakt_typ, auto_create } = await req.json();

        let neu_angelegt = 0;
        let bereits_vorhanden = 0;
        let ohne_telefonnummer = 0;
        const kontakte = [];

        if (kontakt_typ === 'mieter' || !kontakt_typ) {
            const tenants = await base44.entities.Tenant.list();
            
            for (const tenant of tenants) {
                if (!tenant.phone || tenant.phone.trim() === '') {
                    ohne_telefonnummer++;
                    continue;
                }

                // Prüfe ob Kontakt existiert
                const existing = await base44.entities.WhatsAppContact.filter({
                    whatsapp_account_id,
                    telefonnummer: tenant.phone
                });

                if (existing.length > 0) {
                    bereits_vorhanden++;
                    kontakte.push(existing[0]);
                } else if (auto_create) {
                    const contact = await base44.asServiceRole.entities.WhatsAppContact.create({
                        whatsapp_account_id,
                        kontakt_typ: 'mieter',
                        tenant_id: tenant.id,
                        telefonnummer: tenant.phone,
                        name: `${tenant.first_name} ${tenant.last_name}`,
                        opt_in_status: 'ausstehend',
                        ungelesene_nachrichten: 0,
                        gesperrt: false
                    });
                    neu_angelegt++;
                    kontakte.push(contact);
                }
            }
        }

        if (kontakt_typ === 'eigentuemer' || !kontakt_typ) {
            const owners = await base44.entities.Owner.list();
            
            for (const owner of owners) {
                const phone = owner.mobil || owner.telefon_privat || owner.telefon_geschaeftlich;
                
                if (!phone || phone.trim() === '') {
                    ohne_telefonnummer++;
                    continue;
                }

                const existing = await base44.entities.WhatsAppContact.filter({
                    whatsapp_account_id,
                    telefonnummer: phone
                });

                if (existing.length > 0) {
                    bereits_vorhanden++;
                    kontakte.push(existing[0]);
                } else if (auto_create) {
                    const contact = await base44.asServiceRole.entities.WhatsAppContact.create({
                        whatsapp_account_id,
                        kontakt_typ: 'eigentuemer',
                        owner_id: owner.id,
                        telefonnummer: phone,
                        name: `${owner.vorname || ''} ${owner.nachname}`.trim(),
                        opt_in_status: 'ausstehend',
                        ungelesene_nachrichten: 0,
                        gesperrt: false
                    });
                    neu_angelegt++;
                    kontakte.push(contact);
                }
            }
        }

        return Response.json({
            success: true,
            neu_angelegt,
            bereits_vorhanden,
            ohne_telefonnummer,
            kontakte
        });

    } catch (error) {
        console.error('WhatsApp sync contacts error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});