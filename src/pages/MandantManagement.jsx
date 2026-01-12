import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Plus, Edit, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function MandantManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMandant, setSelectedMandant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    rechtsform: 'Privatperson',
    strasse: '',
    plz: '',
    ort: '',
    ansprechpartner: '',
    telefon: '',
    email: '',
    ist_aktiv: true
  });

  const queryClient = useQueryClient();

  const { data: mandanten = [] } = useQuery({
    queryKey: ['mandanten'],
    queryFn: () => base44.entities.Mandant.list('-created_date', 100)
  });

  const { data: userAccessCounts = {} } = useQuery({
    queryKey: ['mandantUserCounts'],
    queryFn: async () => {
      const allAccess = await base44.entities.UserMandantAccess.list();
      const counts = {};
      allAccess.forEach(access => {
        counts[access.mandant_id] = (counts[access.mandant_id] || 0) + 1;
      });
      return counts;
    }
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (selectedMandant) {
        return base44.entities.Mandant.update(selectedMandant.id, data);
      }
      return base44.entities.Mandant.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mandanten']);
      toast.success(selectedMandant ? 'Mandant aktualisiert' : 'Mandant erstellt');
      setDialogOpen(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      rechtsform: 'Privatperson',
      strasse: '',
      plz: '',
      ort: '',
      ansprechpartner: '',
      telefon: '',
      email: '',
      ist_aktiv: true
    });
    setSelectedMandant(null);
  };

  const handleEdit = (mandant) => {
    setSelectedMandant(mandant);
    setFormData(mandant);
    setDialogOpen(true);
  };

  const handleNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Mandantenverwaltung</h1>
          <p className="text-slate-600 mt-1">Verwaltung mehrerer Kunden/Eigentümer</p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4 mr-2" />
          Neuer Mandant
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mandanten.map(mandant => (
          <Card key={mandant.id} className={mandant.ist_aktiv ? 'border-blue-200' : 'border-slate-200'}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <div>
                    <CardTitle className="text-base">{mandant.name}</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">{mandant.rechtsform}</p>
                  </div>
                </div>
                {mandant.ist_aktiv ? (
                  <Badge className="bg-emerald-100 text-emerald-700">Aktiv</Badge>
                ) : (
                  <Badge variant="outline">Inaktiv</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {mandant.ort && (
                <div className="text-sm">
                  <p className="text-slate-600">{mandant.strasse}</p>
                  <p className="text-slate-600">{mandant.plz} {mandant.ort}</p>
                </div>
              )}
              
              {mandant.ansprechpartner && (
                <div className="text-sm">
                  <p className="text-slate-700 font-medium">{mandant.ansprechpartner}</p>
                  {mandant.email && <p className="text-xs text-slate-600">{mandant.email}</p>}
                  {mandant.telefon && <p className="text-xs text-slate-600">{mandant.telefon}</p>}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-600">
                  {userAccessCounts[mandant.id] || 0} Benutzer
                </span>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => handleEdit(mandant)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Bearbeiten
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedMandant ? 'Mandant bearbeiten' : 'Neuer Mandant'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Max Mustermann GmbH"
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
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label>Straße</Label>
                <Input
                  value={formData.strasse}
                  onChange={e => setFormData({...formData, strasse: e.target.value})}
                />
              </div>
              <div>
                <Label>PLZ</Label>
                <Input
                  value={formData.plz}
                  onChange={e => setFormData({...formData, plz: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>Ort</Label>
              <Input
                value={formData.ort}
                onChange={e => setFormData({...formData, ort: e.target.value})}
              />
            </div>

            <div className="border-t pt-4 space-y-3">
              <Label>Ansprechpartner</Label>
              <Input
                value={formData.ansprechpartner}
                onChange={e => setFormData({...formData, ansprechpartner: e.target.value})}
                placeholder="Hauptansprechpartner"
              />
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Telefon</Label>
                  <Input
                    value={formData.telefon}
                    onChange={e => setFormData({...formData, telefon: e.target.value})}
                  />
                </div>
                <div>
                  <Label>E-Mail</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button 
                onClick={() => saveMutation.mutate(formData)}
                disabled={saveMutation.isPending || !formData.name}
              >
                {saveMutation.isPending ? 'Speichert...' : 'Speichern'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}