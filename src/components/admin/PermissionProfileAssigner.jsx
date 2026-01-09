import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const PROFILES = [
  {
    value: 'admin',
    label: 'Administrator',
    description: 'Vollständiger Zugriff auf alle Funktionen',
    color: 'bg-red-100 text-red-800'
  },
  {
    value: 'manager',
    label: 'Manager',
    description: 'Verwaltungs- und Analysezugriff',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    value: 'analyst',
    label: 'Analyst',
    description: 'Lesezugriff und detaillierte Analysen',
    color: 'bg-purple-100 text-purple-800'
  },
  {
    value: 'read-only',
    label: 'Nur Lesezugriff',
    description: 'Nur Ansicht von Daten',
    color: 'bg-gray-100 text-gray-800'
  }
];

export default function PermissionProfileAssigner({ roleId, currentProfile, onProfileAssigned }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(currentProfile);
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssignProfile = async () => {
    if (selectedProfile === currentProfile) {
      toast.info('Profil hat sich nicht geändert');
      return;
    }

    setIsAssigning(true);
    try {
      await base44.functions.invoke('updateCustomRole', {
        role_id: roleId,
        permission_profile: selectedProfile
      });

      toast.success('Berechtigungsprofil zugewiesen');
      setIsOpen(false);
      if (onProfileAssigned) {
        onProfileAssigned(selectedProfile);
      }
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
      >
        Profil zuweisen
      </Button>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Berechtigungsprofil zuweisen</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          {PROFILES.map(profile => (
            <div
              key={profile.value}
              onClick={() => setSelectedProfile(profile.value)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedProfile === profile.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm">{profile.label}</h3>
                <input
                  type="radio"
                  checked={selectedProfile === profile.value}
                  onChange={() => setSelectedProfile(profile.value)}
                  className="cursor-pointer"
                />
              </div>
              <p className="text-xs text-slate-600">{profile.description}</p>
            </div>
          ))}
        </div>

        <div className="p-3 bg-slate-50 rounded border border-slate-200 mt-4">
          <p className="text-xs text-slate-700">
            <strong>Ausgewähltes Profil:</strong> {PROFILES.find(p => p.value === selectedProfile)?.label}
          </p>
        </div>

        <Button
          onClick={handleAssignProfile}
          disabled={isAssigning || selectedProfile === currentProfile}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isAssigning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Wird zugewiesen...
            </>
          ) : (
            'Profil zuweisen'
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}