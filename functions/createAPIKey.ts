import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const { name, scopes = ['read'], rateLimit, allowedIps, expiresInDays } = await req.json();
    
    if (!name) {
      return Response.json({ error: "name required" }, { status: 400 });
    }
    
    // API-Key generieren
    const key = 'sk_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Hash erstellen (in Produktion würde man bcrypt/scrypt verwenden)
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const prefix = key.substring(0, 12) + '...';
    
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;
    
    await base44.asServiceRole.entities.APIKey.create({
      name,
      key_hash: hash,
      prefix,
      user_id: user.id,
      scopes,
      expires_at: expiresAt,
      last_used_at: null,
      usage_count: 0,
      is_active: true,
      rate_limit: rateLimit || null,
      allowed_ips: allowedIps || null
    });
    
    return Response.json({
      success: true,
      key,
      prefix,
      message: 'API key created - save it now, it will not be shown again!'
    });
    
  } catch (error) {
    console.error("Create API key error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});