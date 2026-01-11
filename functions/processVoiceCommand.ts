import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { textCommand, context } = await req.json();

        console.log(`Processing voice command from ${user.email}: "${textCommand}"`);
        console.log('Context:', context);

        // Helper functions to find entities
        const findTenant = async (name) => {
            if (!name) return null;
            const nameParts = name.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ');
            
            const tenants = await base44.entities.Tenant.filter({
                first_name: firstName,
                last_name: lastName
            });
            return tenants[0] || null;
        };

        const findUnit = async (unitNumber, buildingId) => {
            if (!unitNumber) return null;
            const filters = { unit_number: unitNumber };
            if (buildingId) filters.gebaeude_id = buildingId;
            
            const units = await base44.entities.Unit.filter(filters);
            return units[0] || null;
        };

        const findBuilding = async (buildingName) => {
            if (!buildingName) return null;
            const buildings = await base44.entities.Building.filter({
                name: buildingName
            });
            return buildings[0] || null;
        };

        // Simulated LLM parsing (will be replaced with actual LLM when costs approved)
        let intent = 'GenericCommand';
        let extractedData = { rawText: textCommand };
        let missingFields = [];
        let message = 'Befehl empfangen, aber keine spezifische Aktion erkannt.';

        const lowerCommand = textCommand.toLowerCase();

        // Parse Mietvertrag (LeaseContract)
        if (lowerCommand.includes('mietvertrag')) {
            intent = 'CreateLeaseContract';
            const tenantNameMatch = textCommand.match(/(?:an|für) ([\wäöüß]+ [\wäöüß]+)/i);
            const unitMatch = textCommand.match(/wohnung (\d+)/i);
            const buildingMatch = textCommand.match(/(?:gebäude|objekt) ([\wäöüß ]+ \d+|[\d]+)/i);
            
            extractedData = {
                tenantName: tenantNameMatch?.[1],
                unitNumber: unitMatch?.[1],
                buildingName: buildingMatch?.[1],
            };

            // Perform entity lookups
            if (extractedData.tenantName) {
                const tenant = await findTenant(extractedData.tenantName);
                if (tenant) {
                    extractedData.tenant_id = tenant.id;
                    extractedData.tenantName = `${tenant.first_name} ${tenant.last_name}`;
                }
            }

            if (extractedData.buildingName) {
                const building = await findBuilding(extractedData.buildingName);
                if (building) {
                    extractedData.building_id = building.id;
                }
            }

            if (extractedData.unitNumber) {
                const unit = await findUnit(extractedData.unitNumber, extractedData.building_id || context.buildingId);
                if (unit) {
                    extractedData.unit_id = unit.id;
                    extractedData.unitNumber = unit.unit_number;
                }
            }
            
            missingFields = [];
            if (!extractedData.tenant_id) missingFields.push('tenant_id');
            if (!extractedData.unit_id) missingFields.push('unit_id');
            if (!extractedData.start_date) missingFields.push('start_date');
            if (!extractedData.base_rent) missingFields.push('base_rent');
            if (!extractedData.total_rent) missingFields.push('total_rent');
            
            message = `Mietvertrag für ${extractedData.tenantName || 'unbekannt'} wird vorbereitet.`;
        } 
        // Parse Übergabeprotokoll (HandoverProtocol)
        else if (lowerCommand.includes('übergabeprotokoll')) {
            intent = 'CreateHandoverProtocol';
            const unitMatch = textCommand.match(/wohnung (\d+)/i);
            
            extractedData = {
                unitNumber: unitMatch?.[1],
                protocolType: lowerCommand.includes('einzug') ? 'move_in' : 'move_out',
                protocol_type: lowerCommand.includes('einzug') ? 'move_in' : 'move_out',
            };

            // Perform entity lookups
            if (extractedData.unitNumber) {
                const unit = await findUnit(extractedData.unitNumber, context.buildingId);
                if (unit) {
                    extractedData.unit_id = unit.id;
                }
            }

            missingFields = [];
            if (!extractedData.unit_id) missingFields.push('unit_id');
            if (!extractedData.company_id) missingFields.push('company_id');
            
            message = `Übergabeprotokoll für Wohnung ${extractedData.unitNumber || 'unbekannt'} wird vorbereitet.`;
        }
        // Parse Aufgabe (Task)
        else if (lowerCommand.includes('aufgabe') || lowerCommand.includes('task')) {
            intent = 'CreateTask';
            const titleText = textCommand.replace(/(?:erstelle |mache )?aufgabe:?/i, '').trim();
            
            extractedData = {
                title: titleText || 'Neue Aufgabe',
                status: 'offen',
            };
            missingFields = [];
            message = 'Aufgabe wird erstellt.';
        }
        // Parse Problem melden (MaintenanceTask)
        else if (lowerCommand.includes('problem')) {
            intent = 'CreateMaintenanceTask';
            const descMatch = textCommand.replace(/(?:melde |ein )?problem:?/i, '').trim();
            const unitMatch = textCommand.match(/wohnung (\d+)/i);
            
            extractedData = {
                title: descMatch || 'Problem gemeldet',
                description: descMatch,
                unitNumber: unitMatch?.[1],
                priority: 'medium',
                status: 'pending',
            };

            // Perform entity lookups
            if (extractedData.unitNumber) {
                const unit = await findUnit(extractedData.unitNumber, context.buildingId);
                if (unit) {
                    extractedData.unit_id = unit.id;
                }
            }

            missingFields = [];
            if (!extractedData.title) missingFields.push('title');
            if (!extractedData.category) missingFields.push('category');
            
            message = 'Problem wird als Wartungsaufgabe erfasst.';
        }
        // Parse Angebot erstellen
        else if (lowerCommand.includes('angebot')) {
            intent = 'CreateOffer';
            const recipientMatch = textCommand.match(/(?:an|für) ([\wäöüß]+ [\wäöüß]+)/i);
            
            extractedData = {
                recipient: recipientMatch?.[1],
            };
            missingFields = ['offerDetails', 'price'];
            message = `Angebot für ${extractedData.recipient || 'unbekannt'} wird vorbereitet.`;
        }
        // Parse Notiz
        else if (lowerCommand.includes('notiz')) {
            intent = 'CreateNote';
            const noteContent = textCommand.replace(/(?:erstelle |mache )?notiz:?/i, '').trim();
            
            extractedData = {
                title: noteContent.substring(0, 50),
                description: noteContent,
                status: 'offen',
            };
            missingFields = [];
            message = 'Notiz wird erstellt.';
        }

        // Add context if available
        if (context.buildingId) {
            extractedData.buildingId = context.buildingId;
        }
        if (context.unitId) {
            extractedData.unitId = context.unitId;
        }

        return Response.json({
            success: true,
            intent,
            data: extractedData,
            missingFields,
            message,
        });

    } catch (error) {
        console.error('Error processing voice command:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});