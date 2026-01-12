import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, Users, Plus, Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function MandantManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [selectedMandant, setSelectedMandant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    rechtsform: 'Privatperson',
    ist_aktiv: true
  });
  const [accessData, setAccessData] = useState({
    user_email: '',
    rolle: 'Objekt-Manager',
    gebaeude_zugriff: '[]'
  });

  const queryClient = useQueryClient();

  const { data: mandanten = [] } = useQuery({
    queryKey: ['mandanten'],
    queryFn: () => base44.entities.Mandant.list()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const createMandantMutation = useMutation({
    mutationFn: (data) => base44.entities.Mandant.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['mandanten']);
      toast.success('Mandant erstellt');
      setDialogOpen(false);
      setFormData({ name: '', rechtsform: 'Privatperson', ist_aktiv: true });
    }
  });

  const createAccessMutation = useMutation({
    mutationFn: (data) => base44.entities.UserMandantAccess.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['userAccess']);
      toast.success('Zugriff erteilt');
      setAccessDialogOpen(false);
      setAccessData({ user_email: '', rolle: 'Objekt-Manager', gebaeude_zugriff: '[]' });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Mandanten-Verwaltung</h1>
          <p className="text-slate-600 mt-1">Multi-Mandanten-Fähigkeit für Hausverwaltungen</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-slate-700 hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-2" />
          Neuer Mandant
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mandanten.map(mandant => (
          <Card key={mandant.id} className="hover:border-slate-300 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-slate-600" />
                  <CardTitle className="text-base">{mandant.name}</CardTitle>
                </div>
                {mandant.ist_aktiv ? (
                  <Badge className="bg-emerald-100 text-emerald-700">Aktiv</Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-700">Inaktiv</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-slate-600">
                <p>Rechtsform: {mandant.rechtsform}</p>
                {mandant.ansprechpartner && <p>Kontakt: {mandant.ansprechpartner}</p>}
                {mandant.email && <p>E-Mail: {mandant.email}</p>}
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setSelectedMandant(mandant.id);
                  setAccessDialogOpen(true);
                }}
              >
                <Users className="w-4 h-4 mr-2" />
                Zugriffe verwalten
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Mandant Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Mandant</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Mustermann GmbH"
              />
            </div>

            <div>
              <Label>Rechtsform *</Label>
              <Select value={formData.rechtsform} onValueChange={v => setFormData({...formData, rechtsform: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Privatperson">Privatperson</SelectItem>
                  <SelectItem value="GbR">GbR</SelectItem>
                  <SelectItem value="GmbH">GmbH</SelectItem>
                  <SelectItem value="UG">UG</SelectItem>
                  <SelectItem value="KG">KG</SelectItem>
                  <SelectItem value="AG">AG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
              <Button onClick={() => createMandantMutation.mutate(formData)}>Erstellen</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Access Management Dialog */}
      <Dialog open={accessDialogOpen} onOpenChange={setAccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Benutzerzugriff erteilen</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Benutzer E-Mail *</Label>
              <Input
                type="email"
                value={accessData.user_email}
                onChange={e => setAccessData({...accessData, user_email: e.target.value})}
                placeholder="user@beispiel.de"
              />
            </div>

            <div>
              <Label>Rolle *</Label>
              <Select value={accessData.rolle} onValueChange={v => setAccessData({...accessData, rolle: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Objekt-Manager">Objekt-Manager</SelectItem>
                  <SelectItem value="Buchhaltung">Buchhaltung</SelectItem>
                  <SelectItem value="Hausmeister">Hausmeister</SelectItem>
                  <SelectItem value="Steuerberater">Steuerberater (Read-Only)</SelectItem>
                  <SelectItem value="Externer Prüfer">Externer Prüfer</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-600">
                <strong>Hinweis:</strong> Gebäude-spezifische Rechte können nach Erstellung eingestellt werden.
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAccessDialogOpen(false)}>Abbrechen</Button>
              <Button 
                onClick={() => createAccessMutation.mutate({
                  ...accessData,
                  mandant_id: selectedMandant
                })}
                disabled={!accessData.user_email}
              >
                Zugriff erteilen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}