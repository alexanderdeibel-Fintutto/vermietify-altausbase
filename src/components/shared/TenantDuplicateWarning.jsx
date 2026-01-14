import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

export default function TenantDuplicateWarning({ firstName, lastName, dateOfBirth, excludeId }) {
  const [duplicates, setDuplicates] = useState([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!firstName || !lastName) {
      setDuplicates([]);
      return;
    }

    const checkDuplicates = async () => {
      setChecking(true);
      try {
        const allTenants = await base44.entities.Tenant.list(null, 500);
        
        const potentialDuplicates = allTenants.filter(tenant => {
          if (excludeId && tenant.id === excludeId) return false;
          
          const firstNameMatch = tenant.first_name?.toLowerCase() === firstName.toLowerCase();
          const lastNameMatch = tenant.last_name?.toLowerCase() === lastName.toLowerCase();
          
          // Strong match: same first + last name
          let matchScore = 0;
          if (firstNameMatch && lastNameMatch) matchScore = 2;
          
          // Very strong match: + same date of birth
          if (dateOfBirth && tenant.date_of_birth === dateOfBirth) matchScore = 3;
          
          return matchScore >= 2;
        });
        
        setDuplicates(potentialDuplicates);
      } catch (error) {
        console.error('Duplicate check failed:', error);
      } finally {
        setChecking(false);
      }
    };

    const debounce = setTimeout(checkDuplicates, 800);
    return () => clearTimeout(debounce);
  }, [firstName, lastName, dateOfBirth, excludeId]);

  if (checking || duplicates.length === 0) return null;

  return (
    <Alert className="border-red-500 bg-red-50">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-900">
        <p className="font-semibold mb-2">⚠️ Mieter möglicherweise bereits vorhanden ({duplicates.length})</p>
        <div className="space-y-2 mb-3">
          {duplicates.slice(0, 2).map(dup => (
            <div key={dup.id} className="text-sm flex items-center justify-between bg-white p-2 rounded border border-red-200">
              <div>
                <span className="font-medium">{dup.first_name} {dup.last_name}</span>
                {dup.date_of_birth && (
                  <span className="text-slate-600 ml-2">*{dup.date_of_birth}</span>
                )}
                {dup.email && (
                  <span className="text-slate-500 ml-2">{dup.email}</span>
                )}
              </div>
              <a href={createPageUrl('TenantDetail') + '?id=' + dup.id} target="_blank">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ExternalLink className="w-3 h-3" />
                  Ansehen
                </Button>
              </a>
            </div>
          ))}
        </div>
        <p className="text-xs text-red-700">
          Duplikate können zu Problemen bei der Buchhaltung führen. Bitte vorhandenen Mieter verwenden.
        </p>
      </AlertDescription>
    </Alert>
  );
}