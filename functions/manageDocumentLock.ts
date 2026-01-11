import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, document_id, company_id, reason, duration_minutes = 30 } = await req.json();

    if (action === 'lock') {
      // Check existing lock
      const existing = await base44.asServiceRole.entities.DocumentLock.filter({
        document_id,
        is_active: true
      });

      if (existing.length > 0) {
        return Response.json({ 
          error: 'Document already locked',
          locked_by: existing[0].locked_by 
        }, { status: 409 });
      }

      // Create lock
      const expiresAt = new Date(Date.now() + duration_minutes * 60 * 1000);
      const lock = await base44.asServiceRole.entities.DocumentLock.create({
        document_id,
        company_id,
        locked_by: user.email,
        locked_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        reason: reason || 'Editing',
        is_active: true
      });

      return Response.json({ success: true, lock });
    }

    if (action === 'unlock') {
      const locks = await base44.asServiceRole.entities.DocumentLock.filter({
        document_id,
        is_active: true
      });

      for (const lock of locks) {
        if (lock.locked_by === user.email || user.role === 'admin') {
          await base44.asServiceRole.entities.DocumentLock.update(lock.id, {
            is_active: false
          });
        }
      }

      return Response.json({ success: true });
    }

    if (action === 'check') {
      const locks = await base44.asServiceRole.entities.DocumentLock.filter({
        document_id,
        is_active: true
      });

      // Check for expired locks
      const now = new Date();
      for (const lock of locks) {
        if (new Date(lock.expires_at) < now) {
          await base44.asServiceRole.entities.DocumentLock.update(lock.id, {
            is_active: false
          });
        }
      }

      const activeLocks = locks.filter(l => new Date(l.expires_at) >= now);
      return Response.json({ 
        is_locked: activeLocks.length > 0,
        lock: activeLocks[0] || null
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Lock error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});