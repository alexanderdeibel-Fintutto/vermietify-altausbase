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

        // === OBJEKT/GEBÄUDE AUFGABEN ===
        
        // Objektfotos aktualisieren
        else if (lowerCommand.includes('objektfotos') || lowerCommand.includes('gebäudefotos')) {
            intent = 'CreateFieldTask';
            extractedData = {
                task_category: 'objekt_stammdaten',
                task_type: 'objektfotos_aktualisieren',
                title: 'Objektfotos aktualisieren',
                priority: 'normal',
                created_via: 'voice'
            };
            if (context.buildingId) extractedData.building_id = context.buildingId;
            missingFields = [];
            message = 'Aufgabe "Objektfotos aktualisieren" wird erstellt.';
        }

        // Zählerablesung
        else if (lowerCommand.includes('zähler ablesen') || lowerCommand.includes('zaehler ablesen')) {
            intent = 'CreateFieldTask';
            let meterType = 'water';
            if (lowerCommand.includes('wasser')) meterType = 'water';
            else if (lowerCommand.includes('strom')) meterType = 'electricity';
            else if (lowerCommand.includes('gas')) meterType = 'gas';
            else if (lowerCommand.includes('wärme')) meterType = 'heat';
            
            extractedData = {
                task_category: 'objekt_zaehler',
                task_type: 'zaehler_ablesen',
                title: `Zählerablesung - ${meterType === 'water' ? 'Wasser' : meterType === 'electricity' ? 'Strom' : meterType === 'gas' ? 'Gas' : 'Wärme'}`,
                priority: 'normal',
                created_via: 'voice',
                meter_reading: {
                    meter_type: meterType
                }
            };
            if (context.buildingId) extractedData.building_id = context.buildingId;
            missingFields = ['meter_reading.reading_value'];
            message = 'Zählerablesung wird erfasst.';
        }

        // Heizungsprüfung
        else if (lowerCommand.includes('heizung') && (lowerCommand.includes('prüfen') || lowerCommand.includes('status'))) {
            intent = 'CreateFieldTask';
            extractedData = {
                task_category: 'objekt_technik',
                task_type: 'heizung_betriebsstatus_pruefen',
                title: 'Heizungsanlage Betriebsstatus prüfen',
                priority: 'hoch',
                created_via: 'voice'
            };
            if (context.buildingId) extractedData.building_id = context.buildingId;
            missingFields = [];
            message = 'Heizungsprüfung wird dokumentiert.';
        }

        // Feuerlöscher prüfen
        else if (lowerCommand.includes('feuerlöscher') || lowerCommand.includes('feuerloescher')) {
            intent = 'CreateFieldTask';
            extractedData = {
                task_category: 'objekt_technik',
                task_type: 'feuerloescher_pruefdatum_kontrollieren',
                title: 'Feuerlöscher Prüfdatum kontrollieren',
                priority: 'hoch',
                created_via: 'voice'
            };
            if (context.buildingId) extractedData.building_id = context.buildingId;
            missingFields = [];
            message = 'Feuerlöscher-Prüfung wird dokumentiert.';
        }

        // Treppenhaus reinigung
        else if (lowerCommand.includes('treppenhaus') && (lowerCommand.includes('reinigung') || lowerCommand.includes('sauber'))) {
            intent = 'CreateFieldTask';
            extractedData = {
                task_category: 'objekt_gemeinschaftsflaechen',
                task_type: 'treppenhaus_reinigungszustand',
                title: 'Treppenhaus Reinigungszustand prüfen',
                priority: 'normal',
                created_via: 'voice'
            };
            if (context.buildingId) extractedData.building_id = context.buildingId;
            missingFields = [];
            message = 'Treppenhaus-Prüfung wird erfasst.';
        }

        // Spielplatz Sicherheitsprüfung
        else if (lowerCommand.includes('spielplatz')) {
            intent = 'CreateFieldTask';
            extractedData = {
                task_category: 'objekt_aussenanlagen',
                task_type: 'spielplatz_sicherheitspruefung',
                title: 'Spielplatz Sicherheitsprüfung',
                priority: 'hoch',
                created_via: 'voice'
            };
            if (context.buildingId) extractedData.building_id = context.buildingId;
            missingFields = [];
            message = 'Spielplatz-Sicherheitsprüfung wird dokumentiert.';
        }

        // Müllstandplatz prüfen
        else if (lowerCommand.includes('müll') && (lowerCommand.includes('standplatz') || lowerCommand.includes('tonnen'))) {
            intent = 'CreateFieldTask';
            extractedData = {
                task_category: 'objekt_aussenanlagen',
                task_type: 'muellstandplatz_zustand',
                title: 'Müllstandplatz Zustand/Sauberkeit prüfen',
                priority: 'normal',
                created_via: 'voice'
            };
            if (context.buildingId) extractedData.building_id = context.buildingId;
            missingFields = [];
            message = 'Müllstandplatz-Prüfung wird erfasst.';
        }

        // Aufzug prüfen
        else if (lowerCommand.includes('aufzug')) {
            intent = 'CreateFieldTask';
            extractedData = {
                task_category: 'objekt_technik',
                task_type: 'aufzug_funktionspruefung',
                title: 'Aufzug Funktionsprüfung',
                priority: 'hoch',
                created_via: 'voice'
            };
            if (context.buildingId) extractedData.building_id = context.buildingId;
            missingFields = [];
            message = 'Aufzug-Prüfung wird dokumentiert.';
        }

        // === WOHNUNG AUFGABEN ===
        
        // Besichtigung
        else if (lowerCommand.includes('besichtigung')) {
            intent = 'CreateFieldTask';
            const unitMatch = textCommand.match(/wohnung (\d+)/i);
            extractedData = {
                task_category: 'wohnung_besichtigung',
                task_type: 'leerstandsbesichtigung',
                title: 'Leerstandsbesichtigung durchführen',
                priority: 'normal',
                created_via: 'voice',
                unitNumber: unitMatch?.[1]
            };
            if (unitMatch?.[1]) {
                const unit = await findUnit(unitMatch[1], context.buildingId);
                if (unit) extractedData.unit_id = unit.id;
            }
            if (context.buildingId) extractedData.building_id = context.buildingId;
            missingFields = [];
            message = 'Besichtigungsaufgabe wird erstellt.';
        }

        // Schlüsselübergabe
        else if (lowerCommand.includes('schlüssel') && lowerCommand.includes('übergabe')) {
            intent = 'CreateFieldTask';
            extractedData = {
                task_category: 'wohnung_uebergabe_einzug',
                task_type: 'schluesseluebergabe',
                title: 'Schlüsselübergabe dokumentieren',
                priority: 'hoch',
                created_via: 'voice'
            };
            if (context.unitId) extractedData.unit_id = context.unitId;
            if (context.buildingId) extractedData.building_id = context.buildingId;
            missingFields = [];
            message = 'Schlüsselübergabe wird dokumentiert.';
        }

        // Rauchwarnmelder prüfen
        else if (lowerCommand.includes('rauchwarnmelder') || lowerCommand.includes('rauchmelder')) {
            intent = 'CreateFieldTask';
            extractedData = {
                task_category: 'wohnung_pruefung',
                task_type: 'rauchwarnmelder_pruefung_einheit',
                title: 'Rauchwarnmelder-Prüfung',
                priority: 'hoch',
                created_via: 'voice'
            };
            if (context.unitId) extractedData.unit_id = context.unitId;
            if (context.buildingId) extractedData.building_id = context.buildingId;
            missingFields = [];
            message = 'Rauchwarnmelder-Prüfung wird erfasst.';
        }

        // === VERTRAG AUFGABEN ===
        
        // SEPA Mandat
        else if (lowerCommand.includes('sepa') || lowerCommand.includes('lastschrift')) {
            intent = 'CreateFieldTask';
            extractedData = {
                task_category: 'vertrag_abschluss',
                task_type: 'sepa_mandat_unterschrieben',
                title: 'SEPA-Lastschriftmandat unterschrieben',
                priority: 'hoch',
                created_via: 'voice'
            };
            missingFields = [];
            message = 'SEPA-Mandat Aufgabe wird erstellt.';
        }

        // Kaution
        else if (lowerCommand.includes('kaution')) {
            intent = 'CreateFieldTask';
            extractedData = {
                task_category: 'vertrag_kaution',
                task_type: 'kaution_rate_erhalten',
                title: 'Kaution Rate erhalten',
                priority: 'normal',
                created_via: 'voice'
            };
            missingFields = [];
            message = 'Kaution-Aufgabe wird erstellt.';
        }

        // Mieter angetroffen
        else if (lowerCommand.includes('mieter angetroffen') || lowerCommand.includes('mieter getroffen')) {
            intent = 'CreateFieldTask';
            extractedData = {
                task_category: 'vertrag_kommunikation',
                task_type: 'mieter_vor_ort_angetroffen',
                title: 'Mieter vor Ort angetroffen',
                priority: 'niedrig',
                created_via: 'voice'
            };
            missingFields = [];
            message = 'Mieter-Kontakt wird dokumentiert.';
        }

        // === SCHADEN AUFGABEN ===
        
        // Schaden/Wasserschaden
        else if (lowerCommand.includes('schaden') || lowerCommand.includes('wasserschaden') || lowerCommand.includes('rohrbruch')) {
            intent = 'CreateFieldTask';
            let damageType = 'allgemein';
            if (lowerCommand.includes('wasser')) damageType = 'wasserschaden';
            else if (lowerCommand.includes('rohr')) damageType = 'rohrbruch';
            
            extractedData = {
                task_category: 'schaden_erfassung',
                task_type: 'schadensmeldung_aufnehmen',
                title: 'Schadensmeldung aufnehmen',
                priority: 'hoch',
                created_via: 'voice',
                damage_data: {
                    damage_type: damageType,
                    urgency: 'zeitnah'
                }
            };
            if (context.unitId) extractedData.unit_id = context.unitId;
            if (context.buildingId) extractedData.building_id = context.buildingId;
            missingFields = [];
            message = 'Schadensmeldung wird aufgenommen.';
        }

        // === HANDWERKER AUFGABEN ===
        
        // Handwerker Einsatz
        else if (lowerCommand.includes('handwerker')) {
            intent = 'CreateFieldTask';
            extractedData = {
                task_category: 'handwerker_einsatz',
                task_type: 'handwerker_eingewiesen',
                title: 'Handwerker vor Ort eingewiesen',
                priority: 'normal',
                created_via: 'voice'
            };
            if (context.buildingId) extractedData.building_id = context.buildingId;
            missingFields = [];
            message = 'Handwerker-Einsatz wird dokumentiert.';
        }

        // === NOTFALL AUFGABEN ===
        
        // Notfall
        else if (lowerCommand.includes('notfall') || lowerCommand.includes('feuerwehr') || lowerCommand.includes('wasser absperren')) {
            intent = 'CreateFieldTask';
            let taskType = 'notdienst_gerufen';
            if (lowerCommand.includes('feuerwehr')) taskType = 'feuerwehr_gerufen';
            else if (lowerCommand.includes('wasser')) taskType = 'wasserabsperrung';
            
            extractedData = {
                task_category: 'notfall_sofortmassnahme',
                task_type: taskType,
                title: taskType === 'feuerwehr_gerufen' ? 'Feuerwehr gerufen' : taskType === 'wasserabsperrung' ? 'Wasserabsperrung vorgenommen' : 'Notdienst gerufen',
                priority: 'sofort',
                created_via: 'voice'
            };
            if (context.buildingId) extractedData.building_id = context.buildingId;
            missingFields = [];
            message = 'Notfall-Sofortmaßnahme wird dokumentiert!';
        }

        // Default fallback
        else {
            intent = 'Unknown';
            message = 'Befehl wurde nicht erkannt. Bitte versuchen Sie es erneut.';
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