import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { document_id, company_id, password, action = 'encrypt' } = await req.json();

    const doc = await base44.asServiceRole.entities.Document.read(document_id);

    if (action === 'encrypt') {
      // Simple encryption using Web Crypto API
      const encoder = new TextEncoder();
      const data = encoder.encode(doc.content || '');
      const passwordData = encoder.encode(password);

      // Generate key from password
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordData,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('base44-salt'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      // Encrypt
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      // Convert to base64
      const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
      const ivBase64 = btoa(String.fromCharCode(...iv));

      // Store encryption record
      await base44.asServiceRole.entities.DocumentEncryption.create({
        document_id,
        company_id,
        encryption_method: 'AES-256',
        encrypted_content: `${ivBase64}:${encryptedBase64}`,
        encrypted_at: new Date().toISOString(),
        encrypted_by: user.email,
        is_encrypted: true
      });

      // Update document
      await base44.asServiceRole.entities.Document.update(document_id, {
        content: '[ENCRYPTED]',
        metadata: {
          ...(doc.metadata || {}),
          encrypted: true
        }
      });

      return Response.json({ success: true, encrypted: true });
    }

    if (action === 'decrypt') {
      const encryption = await base44.asServiceRole.entities.DocumentEncryption.filter({
        document_id,
        is_encrypted: true
      });

      if (encryption.length === 0) {
        return Response.json({ error: 'Document not encrypted' }, { status: 400 });
      }

      const [ivBase64, encryptedBase64] = encryption[0].encrypted_content.split(':');
      
      // Convert from base64
      const iv = new Uint8Array(atob(ivBase64).split('').map(c => c.charCodeAt(0)));
      const encrypted = new Uint8Array(atob(encryptedBase64).split('').map(c => c.charCodeAt(0)));

      const encoder = new TextEncoder();
      const passwordData = encoder.encode(password);

      // Generate key
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordData,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('base44-salt'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      const content = decoder.decode(decrypted);

      return Response.json({ success: true, content });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Encryption error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});