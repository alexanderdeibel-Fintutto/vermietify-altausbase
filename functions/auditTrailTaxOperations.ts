import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operation_type, country, tax_year, operation_data, status } = await req.json();

    if (!operation_type) {
      return Response.json({ error: 'Missing operation_type' }, { status: 400 });
    }

    // Create audit log entry
    const auditEntry = {
      user_email: user.email,
      operation_type,
      country,
      tax_year,
      operation_data,
      status,
      timestamp: new Date().toISOString(),
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown'
    };

    console.log(`[AUDIT] ${user.email} | ${operation_type} | ${country}/${tax_year} | ${status}`);

    return Response.json({
      status: 'success',
      audit_entry: auditEntry
    });
  } catch (error) {
    console.error('Audit trail error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});