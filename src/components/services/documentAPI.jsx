/**
 * FINTUTTO DOCUMENT SHARING API
 * 
 * Zentrale API für Cross-App Document Sharing
 * Single Source of Truth: Supabase PostgreSQL
 */

import { supabase } from './supabaseClient.js';

// ============================================================================
// DOCUMENT TYPES
// ============================================================================

export const DOCUMENT_TYPES = {
  MIETVERTRAG: 'mietvertrag',
  NK_ABRECHNUNG: 'nebenkostenabrechnung',
  KUENDIGUNG: 'kuendigung',
  UEBERGABEPROTOKOLL: 'uebergabeprotokoll',
  MAHNUNG: 'mahnung',
  RECHNUNG: 'rechnung',
  VERSICHERUNG: 'versicherung',
  GRUNDRISS: 'grundriss',
  AUSWEIS: 'ausweis',
  EINKOMMENSNACHWEIS: 'einkommensnachweis',
  SCHUFA: 'schufa',
  ZAEHLERSTAND: 'zaehlerstand',
  SONSTIGES: 'sonstiges'
};

// ============================================================================
// ACCESS LEVELS
// ============================================================================

export const ACCESS_LEVELS = {
  VIEW: 'view',
  DOWNLOAD: 'download',
  EDIT: 'edit',
  OWNER: 'owner'
};

// ============================================================================
// DOCUMENT CREATION & MANAGEMENT
// ============================================================================

export async function createDocument(documentData) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .insert([documentData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating document:', error);
    return null;
  }
}

export async function loadBuildingDocuments(buildingId, orgId) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        document_shares (
          id,
          shared_with_user_id,
          access_level,
          expires_at
        )
      `)
      .eq('building_id', buildingId)
      .eq('org_id', orgId)
      .order('created_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading building documents:', error);
    return [];
  }
}

export async function loadUnitDocuments(unitId, orgId) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        document_shares (
          id,
          shared_with_user_id,
          access_level,
          expires_at
        )
      `)
      .eq('unit_id', unitId)
      .eq('org_id', orgId)
      .order('created_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading unit documents:', error);
    return [];
  }
}

export async function loadLeaseDocuments(leaseId, orgId) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        document_shares (
          id,
          shared_with_user_id,
          access_level,
          expires_at
        )
      `)
      .eq('lease_id', leaseId)
      .eq('org_id', orgId)
      .order('created_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading lease documents:', error);
    return [];
  }
}

// ============================================================================
// DOCUMENT SHARING
// ============================================================================

export async function shareDocument(shareData) {
  try {
    const { data, error } = await supabase
      .from('document_shares')
      .insert([shareData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sharing document:', error);
    return null;
  }
}

export async function revokeDocumentShare(documentId, userId) {
  try {
    const { error } = await supabase
      .from('document_shares')
      .delete()
      .eq('document_id', documentId)
      .eq('shared_with_user_id', userId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error revoking document share:', error);
    return false;
  }
}

export async function updateDocumentShare(shareId, updateData) {
  try {
    const { data, error } = await supabase
      .from('document_shares')
      .update(updateData)
      .eq('id', shareId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating document share:', error);
    return null;
  }
}

// ============================================================================
// TENANT VIEW - Freigegebene Dokumente für Mieter
// ============================================================================

export async function loadMySharedDocuments(userId) {
  try {
    const { data, error } = await supabase
      .from('document_shares')
      .select(`
        id,
        access_level,
        expires_at,
        documents (
          id,
          title,
          file_name,
          file_url,
          document_type,
          created_date,
          buildings (name),
          units (unit_number)
        )
      `)
      .eq('shared_with_user_id', userId)
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('created_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading shared documents:', error);
    return [];
  }
}

// ============================================================================
// ACCESS CONTROL
// ============================================================================

export async function checkDocumentAccess(userId, documentId) {
  try {
    // 1. Prüfe ob User der Ersteller ist
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id, uploaded_by, org_id, tenant_id')
      .eq('id', documentId)
      .single();
    
    if (docError) throw docError;
    
    if (doc.uploaded_by === userId) {
      return { hasAccess: true, level: ACCESS_LEVELS.OWNER };
    }
    
    // 2. Prüfe ob User in der gleichen Org
    const { data: userOrg, error: orgError } = await supabase
      .from('user_roles')
      .select('org_id')
      .eq('user_id', userId)
      .eq('org_id', doc.org_id)
      .single();
    
    if (!orgError && userOrg) {
      return { hasAccess: true, level: ACCESS_LEVELS.EDIT };
    }
    
    // 3. Prüfe explizite Freigaben
    const { data: share, error: shareError } = await supabase
      .from('document_shares')
      .select('access_level, expires_at')
      .eq('document_id', documentId)
      .eq('shared_with_user_id', userId)
      .or('expires_at.is.null,expires_at.gt.now()')
      .single();
    
    if (!shareError && share) {
      return { hasAccess: true, level: share.access_level };
    }
    
    // 4. Prüfe ob User der Mieter des Dokuments ist
    if (doc.tenant_id) {
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('user_id')
        .eq('id', doc.tenant_id)
        .eq('user_id', userId)
        .single();
      
      if (!tenantError && tenant) {
        return { hasAccess: true, level: ACCESS_LEVELS.VIEW };
      }
    }
    
    return { hasAccess: false, level: null };
  } catch (error) {
    console.error('Error checking document access:', error);
    return { hasAccess: false, level: null };
  }
}

// ============================================================================
// DOCUMENT DELETION
// ============================================================================

export async function deleteDocument(documentId) {
  try {
    // Lösche zuerst alle Freigaben
    await supabase
      .from('document_shares')
      .delete()
      .eq('document_id', documentId);
    
    // Dann lösche das Dokument
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    return false;
  }
}