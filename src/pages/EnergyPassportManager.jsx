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
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload, AlertCircle, CheckCircle, Calendar, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInMonths, isBefore } from 'date-fns';
import { de } from 'date-fns/locale';

export default function EnergyPassportManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [formData, setFormData] = useState({
    building_id: '',
    ausweis_typ: 'Verbrauchsausweis',
    ausstellungsdatum: format(new Date(), 'yyyy-MM-dd'),
    energieeffizienzklasse: 'D',
    endenergiebedarf: '',
    energietraeger: 'Gas'
  });

  const queryClient = useQueryClient();

  const { data: passports = [] } = useQuery({
    queryKey: ['energyPassports'],
    queryFn: () => base44.entities.EnergyPassport.list('-ausstellungsdatum', 100)
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      let fileUrl = null;
      if (uploadFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadFile });
        fileUrl = file_url;
      }

      const gueltigBis = new Date(data.ausstellungsdatum);
      gueltigBis.setFullYear(gueltigBis.getFullYear() + 10);

      const monthsRemaining = differenceInMonths(gueltigBis, new Date());
      const status = monthsRemaining < 6 ? 'Läuft bald ab' : 
                     monthsRemaining < 0 ? 'Abgelaufen' : 'Gültig';

      return base44.entities.EnergyPassport.create({
        ...data,
        gueltig_bis: format(gueltigBis, 'yyyy-MM-dd'),
        datei_url: fileUrl,
        status,
        endenergiebedarf: parseFloat(data.endenergiebedarf),
        pflichtangaben_generiert: generatePflichtangaben(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['energyPassports']);
      toast.success('Energieausweis hinzugefügt');
      setDialogOpen(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setFormData({
      building_id: '',
      ausweis_typ: 'Verbrauchsausweis',
      ausstellungsdatum: format(new Date(), 'yyyy-MM-dd'),
      energieeffizienzklasse: 'D',
      endenergiebedarf: '',
      energietraeger: 'Gas'
    });
    setUploadFile(null);
  };

  const generatePflichtangaben = (data) => {
    return `Energieeffizienzklasse: ${data.energieeffizienzklasse}, ` +
           `Endenergiebedarf: ${data.endenergiebedarf} kWh/(m²·a), ` +
           `Energieträger: ${data.energietraeger}, ` +
           `${data.ausweis_typ}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Gültig': return 'bg-emerald-100 text-emerald-700';
      case 'Läuft bald ab': return 'bg-amber-100 text-amber-700';
      case 'Abgelaufen': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getEfficiencyColor = (klasse) => {
    if (['A+', 'A', 'B'].includes(klasse)) return 'bg-emerald-500';
    if (['C', 'D'].includes(klasse)) return 'bg-yellow-500';
    if (['E', 'F'].includes(klasse)) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Energieausweise</h1>
          <p className="text-slate-600 mt-1">Verwaltung nach GEG (Gebäudeenergiegesetz)</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Neuer Ausweis
        </Button>
      </div>

      {/* Expiring Soon Alert */}
      {passports.filter(p => p.status === 'Läuft bald ab' || p.status === 'Abgelaufen').length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900">
                  {passports.filter(p => p.status === 'Abgelaufen').length} Energieausweise abgelaufen
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Bitte erneuern Sie diese vor Neuvermietung (GEG-Pflicht)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Passports List */}
      <div className="space-y-3">
        {passports.map(passport => {
          const building = buildings.find(b => b.id === passport.building_id);
          const monthsRemaining = differenceInMonths(new Date(passport.gueltig_bis), new Date());

          return (
            <Card key={passport.id} className="hover:border-slate-300 transition-colors">
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <p className="font-medium text-slate-900">{building?.name || 'Gebäude nicht gefunden'}</p>
                      <Badge variant="outline">{passport.ausweis_typ}</Badge>
                      <Badge className={getStatusColor(passport.status)}>
                        {passport.status}
                      </Badge>
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getEfficiencyColor(passport.energieeffizienzklasse)}`} />
                          <span className="text-sm font-medium">Klasse {passport.energieeffizienzklasse}</span>
                        </div>
                        <span className="text-sm text-slate-600">
                          {passport.endenergiebedarf} kWh/(m²·a)
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {passport.energietraeger}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Gültig bis {format(new Date(passport.gueltig_bis), 'dd.MM.yyyy', { locale: de })}
                        </span>
                        {monthsRemaining > 0 && monthsRemaining < 12 && (
                          <Badge className="bg-amber-100 text-amber-700 text-xs">
                            {monthsRemaining} Monate verbleibend
                          </Badge>
                        )}
                      </div>

                      {passport.pflichtangaben_generiert && (
                        <div className="bg-slate-50 rounded p-2 mt-2">
                          <p className="text-xs text-slate-600">
                            <strong>Pflichtangaben für Anzeigen:</strong><br />
                            {passport.pflichtangaben_generiert}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {passport.datei_url && (
                    <Button size="sm" variant="outline" onClick={() => window.open(passport.datei_url, '_blank')}>
                      <FileText className="w-4 h-4 mr-1" />
                      PDF
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {passports.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-slate-500">
              Keine Energieausweise erfasst
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Energieausweis erfassen</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Gebäude *</Label>
              <Select value={formData.building_id} onValueChange={v => setFormData({...formData, building_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Gebäude wählen" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Typ *</Label>
                <Select value={formData.ausweis_typ} onValueChange={v => setFormData({...formData, ausweis_typ: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Verbrauchsausweis">Verbrauchsausweis</SelectItem>
                    <SelectItem value="Bedarfsausweis">Bedarfsausweis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ausstellungsdatum *</Label>
                <Input
                  type="date"
                  value={formData.ausstellungsdatum}
                  onChange={e => setFormData({...formData, ausstellungsdatum: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Effizienzklasse *</Label>
                <Select value={formData.energieeffizienzklasse} onValueChange={v => setFormData({...formData, energieeffizienzklasse: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(k => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Endenergiebedarf *</Label>
                <Input
                  type="number"
                  value={formData.endenergiebedarf}
                  onChange={e => setFormData({...formData, endenergiebedarf: e.target.value})}
                  placeholder="120"
                />
                <p className="text-xs text-slate-500 mt-1">kWh/(m²·a)</p>
              </div>
            </div>

            <div>
              <Label>Energieträger *</Label>
              <Select value={formData.energietraeger} onValueChange={v => setFormData({...formData, energietraeger: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gas">Gas</SelectItem>
                  <SelectItem value="Öl">Öl</SelectItem>
                  <SelectItem value="Fernwärme">Fernwärme</SelectItem>
                  <SelectItem value="Strom">Strom</SelectItem>
                  <SelectItem value="Wärmepumpe">Wärmepumpe</SelectItem>
                  <SelectItem value="Pellets">Pellets</SelectItem>
                  <SelectItem value="Sonstige">Sonstige</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Modernisierungsempfehlungen</Label>
              <Textarea
                value={formData.modernisierungsempfehlungen || ''}
                onChange={e => setFormData({...formData, modernisierungsempfehlungen: e.target.value})}
                placeholder="z.B. Dämmung Außenwände, Heizungsaustausch..."
                rows={3}
              />
            </div>

            <div>
              <Label>PDF hochladen</Label>
              <Input
                type="file"
                accept=".pdf"
                onChange={e => setUploadFile(e.target.files[0])}
              />
              {uploadFile && (
                <p className="text-xs text-slate-500 mt-1">
                  {uploadFile.name} ({(uploadFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button 
                onClick={() => createMutation.mutate(formData)}
                disabled={createMutation.isPending || !formData.building_id}
              >
                {createMutation.isPending && <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />}
                Speichern
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}