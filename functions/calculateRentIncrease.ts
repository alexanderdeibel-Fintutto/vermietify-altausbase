import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { leaseContractId, calculationMethod, indexValue, marketRent, percentageIncrease } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // LeaseContract laden
        const contracts = await base44.entities.LeaseContract.list();
        const lease = contracts.find(c => c.id === leaseContractId);
        if (!lease) {
            return new Response(JSON.stringify({ error: 'LeaseContract not found' }), { status: 404 });
        }

        const currentRent = lease.rent_amount || 0;
        let newRent = currentRent;
        let calculationDetails = {};

        // Berechnung nach Methode
        if (calculationMethod === 'INDEX' && indexValue) {
            // Indexabhängig (z.B. Mietindex)
            const increase = currentRent * (indexValue / 100);
            newRent = currentRent + increase;
            calculationDetails = {
                method: 'Indexabhängige Mieterhöhung',
                indexValue,
                calculation: `${currentRent} € × (${indexValue}% / 100)`
            };
        } else if (calculationMethod === 'PERCENTAGE' && percentageIncrease) {
            // Prozentuale Erhöhung
            const increase = currentRent * (percentageIncrease / 100);
            newRent = currentRent + increase;
            calculationDetails = {
                method: 'Prozentuale Mieterhöhung',
                percentage: percentageIncrease,
                calculation: `${currentRent} € × ${percentageIncrease}%`
            };
        } else if (calculationMethod === 'MARKET' && marketRent) {
            // An ortsübliche Vergleichsmiete anpassen
            // Max. Erhöhung: 20% in 3 Jahren (BGB §558 Abs. 3)
            const allowedIncrease = currentRent * 0.20;
            const marketIncrease = Math.min(marketRent - currentRent, allowedIncrease);
            newRent = currentRent + Math.max(0, marketIncrease);
            calculationDetails = {
                method: 'Ortsübliche Vergleichsmiete',
                marketRent,
                legalCap: '20% in 3 Jahren (BGB §558)',
                calculation: `Marktmiete ${marketRent} € (gekürzt auf max. ${allowedIncrease.toFixed(2)} € Erhöhung)`
            };
        }

        newRent = parseFloat(newRent.toFixed(2));
        const increaseAmount = parseFloat((newRent - currentRent).toFixed(2));
        const increasePercentage = parseFloat(((increaseAmount / currentRent) * 100).toFixed(2));

        // Kündigungsfristen beachten (2 Monate zum Ende eines Kalendermonats)
        const today = new Date();
        const noticeDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        const effectiveDate = new Date(today.getFullYear(), today.getMonth() + 3, 1);

        return new Response(JSON.stringify({
            success: true,
            currentRent,
            newRent,
            increaseAmount,
            increasePercentage,
            calculationMethod,
            calculationDetails,
            noticeDate: noticeDate.toISOString().split('T')[0],
            effectiveDate: effectiveDate.toISOString().split('T')[0],
            legalValidation: {
                meetsMinimumNotice: true,
                meetsLegalLimits: increasePercentage <= 20,
                warning: increasePercentage > 20 ? 'Erhöhung überschreitet 20% Limit in 3 Jahren' : null
            }
        }), { status: 200 });

    } catch (error) {
        console.error('Error calculating rent increase:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});