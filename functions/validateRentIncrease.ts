import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Validates rent increase against legal limits (Kappungsgrenze)
 * Germany: Max 20% over 3 years (Kappungsgrenze)
 * Also checks against market rent (Marktmiete)
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { contractId, newRent, increaseDate } = await req.json();

        if (!contractId || newRent === undefined) {
            return Response.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Get contract
        const contracts = await base44.entities.LeaseContract.list(
            '-updated_date',
            1,
            { id: contractId }
        );

        if (!contracts?.length) {
            return Response.json({ error: 'Contract not found' }, { status: 404 });
        }

        const contract = contracts[0];
        const currentRent = contract.rent_amount || 0;
        const increasePercent = ((newRent - currentRent) / currentRent) * 100;

        // Get previous rent changes in last 3 years
        const threeYearsAgo = new Date();
        threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

        const previousRentChanges = await base44.entities.RentChange.list(
            '-change_date',
            100,
            {
                lease_contract_id: contractId,
                change_date: { $gte: threeYearsAgo.toISOString().split('T')[0] }
            }
        );

        // Calculate total increase over 3 years
        let totalIncreasePercent = increasePercent;
        let previousRent = currentRent;

        if (previousRentChanges?.length) {
            for (const change of previousRentChanges) {
                const changePercent = ((change.new_rent - change.old_rent) / change.old_rent) * 100;
                totalIncreasePercent += changePercent;
            }
        }

        // Get market rent for comparison
        const unit = await base44.entities.Unit.list('-updated_date', 1, { id: contract.unit_id });
        let marketRent = null;

        if (unit?.length) {
            const rentIndex = await base44.entities.RentIndex.list(
                '-gueltig_ab',
                1,
                {
                    postal_code: unit[0].postal_code,
                    zimmer: unit[0].rooms
                }
            );

            if (rentIndex?.length) {
                marketRent = rentIndex[0].miete_max;
            }
        }

        // Validation results
        const validations = {
            increasePercent: increasePercent,
            totalIncreaseInLast3Years: totalIncreasePercent,
            kappungsgrenzeLimit: 20,
            kappungsgrenzeExceeded: totalIncreasePercent > 20,
            marketRent: marketRent,
            exceedsMarketRent: marketRent ? newRent > marketRent : null,
            warnings: [],
            errors: []
        };

        // Check Kappungsgrenze
        if (validations.kappungsgrenzeExceeded) {
            validations.errors.push(
                `Gesamterhöhung von ${totalIncreasePercent.toFixed(1)}% in 3 Jahren überschreitet Kappungsgrenze (20%)`
            );
        }

        // Check single increase (usually max 10% allowed, but context dependent)
        if (increasePercent > 10) {
            validations.warnings.push(
                `Erhöhung von ${increasePercent.toFixed(1)}% ist erheblich - prüfen Sie lokale Regelungen`
            );
        }

        // Check market rent
        if (marketRent && newRent > marketRent) {
            validations.warnings.push(
                `Neue Miete (${newRent}€) übersteigt Marktmiete (${marketRent}€)`
            );
        }

        // Add recommendation
        if (validations.errors.length === 0) {
            validations.recommendation = 'ERLAUBT';
        } else {
            validations.recommendation = 'NICHT ERLAUBT - Verstößt gegen Kappungsgrenze';
        }

        return Response.json(validations);

    } catch (error) {
        console.error('Error validating rent increase:', error.message);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});