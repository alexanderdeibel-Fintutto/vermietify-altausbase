import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { assetId } = await req.json();

    try {
        const asset = await base44.entities.AfaAsset.get(assetId);
        if (!asset) {
            return new Response(JSON.stringify({ error: 'Asset nicht gefunden' }), { status: 404 });
        }

        // Abschreibungsbasis berechnen
        const depreciableBase = asset.acquisition_cost - (asset.land_value || 0);

        // Jährlicher AfA-Betrag
        const yearlyAfa = depreciableBase * (asset.afa_rate / 100);

        // AfA-Einträge erstellen
        const entries = [];
        let remainingValue = depreciableBase;
        let cumulativeAfa = 0;

        for (let year = asset.start_year; year <= asset.start_year + asset.afa_duration_years; year++) {
            // Erstes Jahr: Anteilig ab Kaufmonat
            let afaAmount = yearlyAfa;
            let isPartial = false;
            let partialMonths = 12;

            if (year === asset.start_year) {
                const purchaseDate = new Date(asset.acquisition_date);
                const purchaseMonth = purchaseDate.getMonth() + 1;
                partialMonths = 13 - purchaseMonth; // Monate ab Kauf
                afaAmount = (yearlyAfa / 12) * partialMonths;
                isPartial = true;
            }

            // Letztes Jahr: Restwert
            if (afaAmount > remainingValue) {
                afaAmount = Math.max(0, remainingValue);
            }

            cumulativeAfa += afaAmount;
            remainingValue -= afaAmount;

            entries.push({
                afa_asset_id: assetId,
                year: year,
                afa_amount: Math.round(afaAmount * 100) / 100,
                cumulative_afa: Math.round(cumulativeAfa * 100) / 100,
                remaining_value: Math.round(Math.max(0, remainingValue) * 100) / 100,
                is_partial_year: isPartial,
                partial_months: isPartial ? partialMonths : null,
                status: year <= new Date().getFullYear() ? 'BOOKED' : 'PLANNED'
            });

            if (remainingValue <= 0) break;
        }

        // Bestehende Einträge löschen
        const existingEntries = await base44.entities.AfaYearlyEntry.filter({
            afa_asset_id: assetId
        });
        
        for (const entry of existingEntries) {
            await base44.entities.AfaYearlyEntry.delete(entry.id);
        }

        // Neue Einträge erstellen
        for (const entry of entries) {
            await base44.entities.AfaYearlyEntry.create(entry);
        }

        // Asset aktualisieren
        await base44.entities.AfaAsset.update(assetId, {
            depreciable_base: depreciableBase,
            end_year: asset.start_year + entries.length - 1,
            remaining_value: remainingValue
        });

        return new Response(JSON.stringify({
            success: true,
            entriesCreated: entries.length,
            schedule: entries
        }), { status: 200 });

    } catch (error) {
        console.error('Error calculating AfA schedule:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});