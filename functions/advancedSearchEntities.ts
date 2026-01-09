import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Advanced search across multiple entities with filtering and sorting
 * Supports: Buildings, Tenants, Contracts, Documents, Invoices, etc.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      query = '', 
      entity_types = [], 
      filters = {}, 
      sort_by = 'updated_date',
      sort_order = -1,
      limit = 50,
      offset = 0
    } = body;

    // Helper function to sort results
    const sortResults = (items, sortField, order = -1) => {
      return items.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        
        if (typeof aVal === 'string') {
          return order === -1 
            ? bVal?.localeCompare(aVal) || 0
            : aVal?.localeCompare(bVal) || 0;
        }
        
        return order === -1 
          ? (bVal || 0) - (aVal || 0)
          : (aVal || 0) - (bVal || 0);
      });
    };

    console.log(`Advanced search: query="${query}", entities=${entity_types.join(',')}`);

    const results = {
      buildings: [],
      tenants: [],
      contracts: [],
      documents: [],
      invoices: [],
      total: 0,
      took_ms: 0
    };

    const startTime = Date.now();

    // === BUILDINGS ===
    if (entity_types.includes('buildings') || entity_types.length === 0) {
      try {
        const buildings = await base44.entities.Building.list('-updated_date', 100);
        const filtered = buildings.filter(b => {
          const matchesQuery = !query || 
            (b.name?.toLowerCase().includes(query.toLowerCase())) ||
            (b.street?.toLowerCase().includes(query.toLowerCase())) ||
            (b.city?.toLowerCase().includes(query.toLowerCase()));
          
          if (!matchesQuery) return false;

          // Apply filters
          if (filters.building_type && b.type !== filters.building_type) return false;
          if (filters.min_units && b.units?.length < filters.min_units) return false;

          return true;
        });

        const sorted = sortResults(filtered, sort_by === 'name' ? 'name' : 'updated_date', sort_order);
        results.buildings = sorted.slice(offset, offset + limit);
        results.total += filtered.length;
      } catch (err) {
        console.warn('Error searching buildings:', err.message);
      }
    }

    // === TENANTS ===
    if (entity_types.includes('tenants') || entity_types.length === 0) {
      try {
        const tenants = await base44.entities.Tenant.list('-updated_date', 100);
        const filtered = tenants.filter(t => {
          const matchesQuery = !query ||
            (t.name?.toLowerCase().includes(query.toLowerCase())) ||
            (t.email?.toLowerCase().includes(query.toLowerCase())) ||
            (t.phone?.includes(query));

          if (!matchesQuery) return false;

          // Apply filters
          if (filters.tenant_status && t.status !== filters.tenant_status) return false;

          return true;
        });

        const sorted = sortResults(filtered, sort_by === 'name' ? 'name' : 'updated_date', sort_order);
        results.tenants = sorted.slice(offset, offset + limit);
        results.total += filtered.length;
      } catch (err) {
        console.warn('Error searching tenants:', err.message);
      }
    }

    // === CONTRACTS ===
    if (entity_types.includes('contracts') || entity_types.length === 0) {
      try {
        const contracts = await base44.entities.LeaseContract.list('-updated_date', 100);
        const filtered = contracts.filter(c => {
          const matchesQuery = !query ||
            (c.tenant_name?.toLowerCase().includes(query.toLowerCase())) ||
            (c.property_name?.toLowerCase().includes(query.toLowerCase()));

          if (!matchesQuery) return false;

          // Apply date filters
          if (filters.start_date) {
            const contractStart = new Date(c.start_date);
            if (contractStart < new Date(filters.start_date)) return false;
          }
          if (filters.end_date) {
            const contractEnd = new Date(c.end_date);
            if (contractEnd > new Date(filters.end_date)) return false;
          }
          if (filters.contract_status && c.status !== filters.contract_status) return false;

          return true;
        });

        const sorted = sortResults(filtered, sort_by === 'date' ? 'start_date' : 'updated_date', sort_order);
        results.contracts = sorted.slice(offset, offset + limit);
        results.total += filtered.length;
      } catch (err) {
        console.warn('Error searching contracts:', err.message);
      }
    }

    // === DOCUMENTS ===
    if (entity_types.includes('documents') || entity_types.length === 0) {
      try {
        const documents = await base44.entities.Document.list('-updated_date', 100);
        const filtered = documents.filter(d => {
          const matchesQuery = !query ||
            (d.name?.toLowerCase().includes(query.toLowerCase())) ||
            (d.description?.toLowerCase().includes(query.toLowerCase()));

          if (!matchesQuery) return false;

          // Apply filters
          if (filters.document_type && d.type !== filters.document_type) return false;
          if (filters.created_after) {
            const createdDate = new Date(d.created_date);
            if (createdDate < new Date(filters.created_after)) return false;
          }
          if (filters.created_before) {
            const createdDate = new Date(d.created_date);
            if (createdDate > new Date(filters.created_before)) return false;
          }

          return true;
        });

        const sorted = sortResults(filtered, sort_by === 'date' ? 'created_date' : 'updated_date', sort_order);
        results.documents = sorted.slice(offset, offset + limit);
        results.total += filtered.length;
      } catch (err) {
        console.warn('Error searching documents:', err.message);
      }
    }

    // === INVOICES ===
    if (entity_types.includes('invoices') || entity_types.length === 0) {
      try {
        const invoices = await base44.entities.Invoice.list('-updated_date', 100);
        const filtered = invoices.filter(i => {
          const matchesQuery = !query ||
            (i.number?.toLowerCase().includes(query.toLowerCase())) ||
            (i.recipient_name?.toLowerCase().includes(query.toLowerCase()));

          if (!matchesQuery) return false;

          // Apply filters
          if (filters.invoice_status && i.status !== filters.invoice_status) return false;
          if (filters.min_amount && i.total < filters.min_amount) return false;
          if (filters.max_amount && i.total > filters.max_amount) return false;

          return true;
        });

        const sorted = sortResults(filtered, sort_by === 'date' ? 'created_date' : sort_by === 'amount' ? 'total' : 'updated_date', sort_order);
        results.invoices = sorted.slice(offset, offset + limit);
        results.total += filtered.length;
      } catch (err) {
        console.warn('Error searching invoices:', err.message);
      }
    }

    results.took_ms = Date.now() - startTime;

    return Response.json({
      success: true,
      query,
      filters,
      results,
      pagination: {
        offset,
        limit,
        total: results.total
      }
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});