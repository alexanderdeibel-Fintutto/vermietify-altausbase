import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const { name, scopes, rateLimit, expiresInDays } = await req.json();
    
    if (!name || !scopes || scopes.length === 0) {
      return Response.json({ error: "name and scopes required" }, { status: 400 });
    }
    
    // Generiere einen sicheren API-Key
    const key = `sk_${crypto.randomUUID().replace(/-/g, '')}`;
    
    // Hash den Key für Speicherung
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Speichere nur den Hash
    const prefix = key.substring(0, 12) + '...';
    
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;
    
    await base44.asServiceRole.entities.APIKey.create({
      name,
      key_hash: keyHash,
      prefix,
      user_id: user.id,
      scopes,
      expires_at: expiresAt,
      is_active: true,
      usage_count: 0,
      rate_limit: rateLimit || 1000
    });
    
    return Response.json({
      success: true,
      key, // Nur einmal zurückgeben!
      message: 'API-Key erstellt. Speichern Sie ihn sicher!'
    });
    
  } catch (error) {
    console.error("Create API key error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});