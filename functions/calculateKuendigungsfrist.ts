import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { contract_id, termination_date } = await req.json();

    const contract = await base44.entities.LeaseContract.read(contract_id);
    if (!contract) return Response.json({ error: 'Vertrag nicht gefunden' }, { status: 404 });

    const startDate = new Date(contract.start_date);
    const terminationDate = new Date(termination_date);
    const notice_period = contract.notice_period_months || 3;
    const earliest_termination = new Date(startDate);
    earliest_termination.setMonth(earliest_termination.getMonth() + notice_period);

    const is_valid = terminationDate >= earliest_termination;
    const days_until_valid = Math.ceil((earliest_termination - new Date(termination_date)) / (1000 * 60 * 60 * 24));

    return Response.json({
      contract_start: contract.start_date,
      notice_period_months: notice_period,
      earliest_termination: earliest_termination.toISOString().split('T')[0],
      proposed_termination: termination_date,
      is_valid: is_valid,
      days_until_valid: days_until_valid > 0 ? days_until_valid : 0
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});