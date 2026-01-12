import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { Save, User, Building2, Phone, Mail, CreditCard, FileText, Briefcase } from 'lucide-react';

export default function OwnerFormDialog({ open, onOpenChange, onSuccess, initialData = null }) {
  const [formData, setFormData] = useState(initialData || {
    eigentuemer_typ: 'natuerliche_person',
    anrede: 'herr',
    staatsangehoerigkeit: 'deutsch',
    land: 'Deutschland',
    steuerliche_ansaessigkeit: 'inland',
    gewerbeanmeldung_vorhanden: false,
    umsatzsteuer_pflichtig: false,
    aktiv: true
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validation
      if (!formData.nachname) {
        toast.error('Nachname/Firmenname ist erforderlich');
        setSaving(false);
        return;
      }

      if (formData.eigentuemer_typ === 'natuerliche_person' && !formData.vorname) {
        toast.error('Vorname ist bei natürlicher Person erforderlich');
        setSaving(false);
        return;
      }

      let result;
      if (initialData) {
        result = await base44.entities.Owner.update(initialData.id, formData);
      } else {
        result = await base44.entities.Owner.create(formData);
      }

      toast.success('Eigentümer gespeichert');
      if (onSuccess) onSuccess(result);
      onOpenChange(false);
    } catch (error) {
      toast.error('Fehler beim Speichern: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Eigentümer bearbeiten' : 'Neuer Eigentümer'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basis" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="basis">
                <User className="w-4 h-4 mr-1" />
                Basis
              </TabsTrigger>
              <TabsTrigger value="kontakt">
                <Phone className="w-4 h-4 mr-1" />
                Kontakt
              </TabsTrigger>
              <TabsTrigger value="bank">
                <CreditCard className="w-4 h-4 mr-1" />
                Bank
              </TabsTrigger>
              <TabsTrigger value="steuer">
                <FileText className="w-4 h-4 mr-1" />
                Steuer
              </TabsTrigger>
              <TabsTrigger value="gewerbe">
                <Briefcase className="w-4 h-4 mr-1" />
                Gewerbe
              </TabsTrigger>
              <TabsTrigger value="berater">
                <User className="w-4 h-4 mr-1" />
                Berater
              </TabsTrigger>
            </TabsList>

            {/* Tab: Basisdaten */}
            <TabsContent value="basis" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Eigentümer-Typ *</Label>
                  <Select value={formData.eigentuemer_typ} onValueChange={(v) => updateField('eigentuemer_typ', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="natuerliche_person">Natürliche Person</SelectItem>
                      <SelectItem value="gbr">GbR</SelectItem>
                      <SelectItem value="kg">KG</SelectItem>
                      <SelectItem value="gmbh">GmbH</SelectItem>
                      <SelectItem value="ug">UG</SelectItem>
                      <SelectItem value="ag">AG</SelectItem>
                      <SelectItem value="erbengemeinschaft">Erbengemeinschaft</SelectItem>
                      <SelectItem value="stiftung">Stiftung</SelectItem>
                      <SelectItem value="sonstige">Sonstige</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.eigentuemer_typ === 'natuerliche_person' && (
                  <>
                    <div>
                      <Label>Anrede *</Label>
                      <Select value={formData.anrede} onValueChange={(v) => updateField('anrede', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="herr">Herr</SelectItem>
                          <SelectItem value="frau">Frau</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Titel</Label>
                      <Input value={formData.titel || ''} onChange={(e) => updateField('titel', e.target.value)} placeholder="Dr., Prof., etc." />
                    </div>
                    <div>
                      <Label>Vorname *</Label>
                      <Input value={formData.vorname || ''} onChange={(e) => updateField('vorname', e.target.value)} required />
                    </div>
                  </>
                )}

                <div>
                  <Label>Nachname / Firmenname *</Label>
                  <Input value={formData.nachname || ''} onChange={(e) => updateField('nachname', e.target.value)} required />
                </div>

                {formData.eigentuemer_typ !== 'natuerliche_person' && (
                  <>
                    <div>
                      <Label>Firmenzusatz</Label>
                      <Input value={formData.firma_zusatz || ''} onChange={(e) => updateField('firma_zusatz', e.target.value)} placeholder="GmbH, AG, etc." />
                    </div>
                    <div>
                      <Label>Rechtsform</Label>
                      <Input value={formData.rechtsform || ''} onChange={(e) => updateField('rechtsform', e.target.value)} />
                    </div>
                  </>
                )}

                {formData.eigentuemer_typ === 'natuerliche_person' && (
                  <>
                    <div>
                      <Label>Geburtsdatum</Label>
                      <Input type="date" value={formData.geburtsdatum || ''} onChange={(e) => updateField('geburtsdatum', e.target.value)} />
                    </div>
                    <div>
                      <Label>Geburtsort</Label>
                      <Input value={formData.geburtsort || ''} onChange={(e) => updateField('geburtsort', e.target.value)} />
                    </div>
                  </>
                )}

                <div className="col-span-2">
                  <Label>Staatsangehörigkeit *</Label>
                  <Select value={formData.staatsangehoerigkeit} onValueChange={(v) => updateField('staatsangehoerigkeit', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deutsch">Deutsch</SelectItem>
                      <SelectItem value="eu">EU</SelectItem>
                      <SelectItem value="sonstige">Sonstige</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label>Straße und Hausnummer *</Label>
                  <Input value={formData.strasse || ''} onChange={(e) => updateField('strasse', e.target.value)} required />
                </div>

                <div>
                  <Label>PLZ *</Label>
                  <Input value={formData.plz || ''} onChange={(e) => updateField('plz', e.target.value)} required />
                </div>

                <div>
                  <Label>Ort *</Label>
                  <Input value={formData.ort || ''} onChange={(e) => updateField('ort', e.target.value)} required />
                </div>

                <div>
                  <Label>Land *</Label>
                  <Input value={formData.land || ''} onChange={(e) => updateField('land', e.target.value)} />
                </div>

                <div>
                  <Label>Adresszusatz</Label>
                  <Input value={formData.adresszusatz || ''} onChange={(e) => updateField('adresszusatz', e.target.value)} placeholder="c/o, Postfach" />
                </div>
              </div>
            </TabsContent>

            {/* Tab: Kontakt */}
            <TabsContent value="kontakt" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Telefon Privat</Label>
                  <Input type="tel" value={formData.telefon_privat || ''} onChange={(e) => updateField('telefon_privat', e.target.value)} />
                </div>
                <div>
                  <Label>Telefon Geschäftlich</Label>
                  <Input type="tel" value={formData.telefon_geschaeftlich || ''} onChange={(e) => updateField('telefon_geschaeftlich', e.target.value)} />
                </div>
                <div>
                  <Label>Mobil</Label>
                  <Input type="tel" value={formData.mobil || ''} onChange={(e) => updateField('mobil', e.target.value)} />
                </div>
                <div>
                  <Label>Fax</Label>
                  <Input type="tel" value={formData.fax || ''} onChange={(e) => updateField('fax', e.target.value)} />
                </div>
                <div>
                  <Label>Email Privat</Label>
                  <Input type="email" value={formData.email_privat || ''} onChange={(e) => updateField('email_privat', e.target.value)} />
                </div>
                <div>
                  <Label>Email Geschäftlich</Label>
                  <Input type="email" value={formData.email_geschaeftlich || ''} onChange={(e) => updateField('email_geschaeftlich', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>Bevorzugte Kontaktart</Label>
                  <Select value={formData.bevorzugte_kontaktart || ''} onValueChange={(v) => updateField('bevorzugte_kontaktart', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="telefon">Telefon</SelectItem>
                      <SelectItem value="post">Post</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Bankverbindung */}
            <TabsContent value="bank" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Bank Name</Label>
                  <Input value={formData.bank_name || ''} onChange={(e) => updateField('bank_name', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>IBAN</Label>
                  <Input value={formData.iban || ''} onChange={(e) => updateField('iban', e.target.value)} placeholder="DE89 3704 0044 0532 0130 00" />
                </div>
                <div>
                  <Label>BIC</Label>
                  <Input value={formData.bic || ''} onChange={(e) => updateField('bic', e.target.value)} />
                </div>
                <div>
                  <Label>Kontoinhaber (falls abweichend)</Label>
                  <Input value={formData.kontoinhaber || ''} onChange={(e) => updateField('kontoinhaber', e.target.value)} />
                </div>
              </div>
            </TabsContent>

            {/* Tab: Steuerliche Daten */}
            <TabsContent value="steuer" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Steuer-ID *</Label>
                  <Input value={formData.steuer_id || ''} onChange={(e) => updateField('steuer_id', e.target.value)} placeholder="12345678901" maxLength={11} />
                </div>
                <div>
                  <Label>Steuernummer Privat *</Label>
                  <Input value={formData.steuernummer_privat || ''} onChange={(e) => updateField('steuernummer_privat', e.target.value)} />
                </div>
                <div>
                  <Label>Steuernummer Gewerblich</Label>
                  <Input value={formData.steuernummer_gewerblich || ''} onChange={(e) => updateField('steuernummer_gewerblich', e.target.value)} />
                </div>
                <div>
                  <Label>Wirtschafts-ID</Label>
                  <Input value={formData.wirtschafts_id || ''} onChange={(e) => updateField('wirtschafts_id', e.target.value)} />
                </div>
                <div>
                  <Label>Steuerliche Ansässigkeit *</Label>
                  <Select value={formData.steuerliche_ansaessigkeit} onValueChange={(v) => updateField('steuerliche_ansaessigkeit', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inland">Inland</SelectItem>
                      <SelectItem value="eu_ausland">EU-Ausland</SelectItem>
                      <SelectItem value="drittland">Drittland</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Zuständiges Finanzamt *</Label>
                  <Input value={formData.zustaendiges_finanzamt || ''} onChange={(e) => updateField('zustaendiges_finanzamt', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>Steuernummer beim FA *</Label>
                  <Input value={formData.fa_steuernummer || ''} onChange={(e) => updateField('fa_steuernummer', e.target.value)} />
                </div>
              </div>
            </TabsContent>

            {/* Tab: Gewerbe & USt */}
            <TabsContent value="gewerbe" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="gewerbeanmeldung"
                    checked={formData.gewerbeanmeldung_vorhanden || false}
                    onChange={(e) => updateField('gewerbeanmeldung_vorhanden', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="gewerbeanmeldung">Gewerbeanmeldung vorhanden</Label>
                </div>

                {formData.gewerbeanmeldung_vorhanden && (
                  <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-slate-200">
                    <div>
                      <Label>Anmeldedatum</Label>
                      <Input type="date" value={formData.gewerbe_anmeldedatum || ''} onChange={(e) => updateField('gewerbe_anmeldedatum', e.target.value)} />
                    </div>
                    <div>
                      <Label>Gewerbe-Finanzamt</Label>
                      <Input value={formData.gewerbe_finanzamt || ''} onChange={(e) => updateField('gewerbe_finanzamt', e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <Label>Art des Gewerbes</Label>
                      <Input value={formData.gewerbe_art || ''} onChange={(e) => updateField('gewerbe_art', e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="ihk" checked={formData.ihk_mitgliedschaft || false} onChange={(e) => updateField('ihk_mitgliedschaft', e.target.checked)} className="w-4 h-4" />
                      <Label htmlFor="ihk">IHK-Mitglied</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="hwk" checked={formData.hwk_mitgliedschaft || false} onChange={(e) => updateField('hwk_mitgliedschaft', e.target.checked)} className="w-4 h-4" />
                      <Label htmlFor="hwk">HWK-Mitglied</Label>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="ust"
                      checked={formData.umsatzsteuer_pflichtig || false}
                      onChange={(e) => updateField('umsatzsteuer_pflichtig', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="ust">Umsatzsteuerpflichtig</Label>
                  </div>

                  {formData.umsatzsteuer_pflichtig && (
                    <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-slate-200">
                      <div>
                        <Label>USt-ID Nummer</Label>
                        <Input value={formData.ust_id_nummer || ''} onChange={(e) => updateField('ust_id_nummer', e.target.value)} placeholder="DE123456789" />
                      </div>
                      <div>
                        <Label>Voranmeldung Rhythmus</Label>
                        <Select value={formData.voranmeldung_rhythmus || ''} onValueChange={(v) => updateField('voranmeldung_rhythmus', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Auswählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monatlich">Monatlich</SelectItem>
                            <SelectItem value="vierteljaehrlich">Vierteljährlich</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="kleinunternehmer" checked={formData.kleinunternehmer_regelung || false} onChange={(e) => updateField('kleinunternehmer_regelung', e.target.checked)} className="w-4 h-4" />
                        <Label htmlFor="kleinunternehmer">Kleinunternehmerregelung</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="ist" checked={formData.istversteuerung || false} onChange={(e) => updateField('istversteuerung', e.target.checked)} className="w-4 h-4" />
                        <Label htmlFor="ist">Istversteuerung</Label>
                      </div>
                      <div className="flex items-center gap-2 col-span-2">
                        <input type="checkbox" id="dfv" checked={formData.dauerfristverlaengerung || false} onChange={(e) => updateField('dauerfristverlaengerung', e.target.checked)} className="w-4 h-4" />
                        <Label htmlFor="dfv">Dauerfristverlängerung beantragt</Label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab: Steuerberater */}
            <TabsContent value="berater" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name des Steuerberaters</Label>
                  <Input value={formData.steuerberater_name || ''} onChange={(e) => updateField('steuerberater_name', e.target.value)} />
                </div>
                <div>
                  <Label>Kanzleiname</Label>
                  <Input value={formData.steuerberater_firma || ''} onChange={(e) => updateField('steuerberater_firma', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>Straße</Label>
                  <Input value={formData.steuerberater_strasse || ''} onChange={(e) => updateField('steuerberater_strasse', e.target.value)} />
                </div>
                <div>
                  <Label>PLZ</Label>
                  <Input value={formData.steuerberater_plz || ''} onChange={(e) => updateField('steuerberater_plz', e.target.value)} />
                </div>
                <div>
                  <Label>Ort</Label>
                  <Input value={formData.steuerberater_ort || ''} onChange={(e) => updateField('steuerberater_ort', e.target.value)} />
                </div>
                <div>
                  <Label>Telefon</Label>
                  <Input type="tel" value={formData.steuerberater_telefon || ''} onChange={(e) => updateField('steuerberater_telefon', e.target.value)} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={formData.steuerberater_email || ''} onChange={(e) => updateField('steuerberater_email', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>Steuernummer des Steuerberaters</Label>
                  <Input value={formData.steuerberater_steuernummer || ''} onChange={(e) => updateField('steuerberater_steuernummer', e.target.value)} />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Bemerkungen */}
          <div>
            <Label>Bemerkungen</Label>
            <Input value={formData.bemerkungen || ''} onChange={(e) => updateField('bemerkungen', e.target.value)} />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? 'Speichere...' : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Speichern
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}