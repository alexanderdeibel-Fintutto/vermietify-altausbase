import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function OwnerForm({ initialData, onSuccess, onCancel, embedded = false }) {
    const [formData, setFormData] = useState(initialData || {
        eigentuemer_typ: 'natuerliche_person',
        staatsangehoerigkeit: 'deutsch',
        land: 'Deutschland',
        steuerliche_ansaessigkeit: 'inland',
        aktiv: true
    });

    const queryClient = useQueryClient();

    const saveMutation = useMutation({
        mutationFn: (data) => {
            if (initialData?.id) {
                return base44.entities.Owner.update(initialData.id, data);
            }
            return base44.entities.Owner.create(data);
        },
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['owners'] });
            toast.success(initialData ? 'Eigentümer aktualisiert' : 'Eigentümer erstellt');
            if (onSuccess) {
                onSuccess(response.id);
            }
        },
        onError: (error) => {
            console.error('Owner save error:', error);
            toast.error('Fehler beim Speichern: ' + (error.message || 'Unbekannter Fehler'));
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        saveMutation.mutate(formData);
    };

    const updateField = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const isNaturalPerson = formData.eigentuemer_typ === 'natuerliche_person';

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="basic">Basis</TabsTrigger>
                    <TabsTrigger value="contact">Kontakt</TabsTrigger>
                    <TabsTrigger value="bank">Bank</TabsTrigger>
                    <TabsTrigger value="tax">Steuern</TabsTrigger>
                    <TabsTrigger value="business">Gewerbe</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-3 mt-4">
                    <div>
                        <Label>Eigentümer-Typ *</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={formData.eigentuemer_typ}
                            onChange={(e) => updateField('eigentuemer_typ', e.target.value)}
                            required
                        >
                            <option value="natuerliche_person">Natürliche Person</option>
                            <option value="gbr">GbR</option>
                            <option value="kg">KG</option>
                            <option value="gmbh">GmbH</option>
                            <option value="ug">UG</option>
                            <option value="ag">AG</option>
                            <option value="erbengemeinschaft">Erbengemeinschaft</option>
                            <option value="stiftung">Stiftung</option>
                            <option value="sonstige">Sonstige</option>
                        </select>
                    </div>

                    {isNaturalPerson && (
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <Label>Anrede</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={formData.anrede || ''}
                                    onChange={(e) => updateField('anrede', e.target.value)}
                                >
                                    <option value="">-</option>
                                    <option value="herr">Herr</option>
                                    <option value="frau">Frau</option>
                                </select>
                            </div>
                            <div>
                                <Label>Titel</Label>
                                <Input
                                    value={formData.titel || ''}
                                    onChange={(e) => updateField('titel', e.target.value)}
                                    placeholder="Dr., Prof."
                                />
                            </div>
                            <div>
                                <Label>Vorname *</Label>
                                <Input
                                    value={formData.vorname || ''}
                                    onChange={(e) => updateField('vorname', e.target.value)}
                                    required={isNaturalPerson}
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>{isNaturalPerson ? 'Nachname' : 'Firmenname'} *</Label>
                            <Input
                                value={formData.nachname || ''}
                                onChange={(e) => updateField('nachname', e.target.value)}
                                required
                            />
                        </div>
                        {!isNaturalPerson && (
                            <div>
                                <Label>Zusatz</Label>
                                <Input
                                    value={formData.firma_zusatz || ''}
                                    onChange={(e) => updateField('firma_zusatz', e.target.value)}
                                    placeholder="GmbH, AG"
                                />
                            </div>
                        )}
                    </div>

                    {isNaturalPerson && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Geburtsdatum</Label>
                                <Input
                                    type="date"
                                    value={formData.geburtsdatum || ''}
                                    onChange={(e) => updateField('geburtsdatum', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Geburtsort</Label>
                                <Input
                                    value={formData.geburtsort || ''}
                                    onChange={(e) => updateField('geburtsort', e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <Label>Staatsangehörigkeit *</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={formData.staatsangehoerigkeit}
                            onChange={(e) => updateField('staatsangehoerigkeit', e.target.value)}
                            required
                        >
                            <option value="deutsch">Deutsch</option>
                            <option value="eu">EU</option>
                            <option value="sonstige">Sonstige</option>
                        </select>
                    </div>

                    <div className="space-y-3 pt-3 border-t">
                        <h4 className="font-semibold text-slate-700">Adresse</h4>
                        <div>
                            <Label>Straße und Hausnummer *</Label>
                            <Input
                                value={formData.strasse || ''}
                                onChange={(e) => updateField('strasse', e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <Label>PLZ *</Label>
                                <Input
                                    value={formData.plz || ''}
                                    onChange={(e) => updateField('plz', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="col-span-2">
                                <Label>Ort *</Label>
                                <Input
                                    value={formData.ort || ''}
                                    onChange={(e) => updateField('ort', e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Adresszusatz</Label>
                            <Input
                                value={formData.adresszusatz || ''}
                                onChange={(e) => updateField('adresszusatz', e.target.value)}
                                placeholder="c/o, Postfach"
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-3 mt-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>Telefon privat</Label>
                            <Input
                                value={formData.telefon_privat || ''}
                                onChange={(e) => updateField('telefon_privat', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Telefon geschäftlich</Label>
                            <Input
                                value={formData.telefon_geschaeftlich || ''}
                                onChange={(e) => updateField('telefon_geschaeftlich', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Mobil</Label>
                            <Input
                                value={formData.mobil || ''}
                                onChange={(e) => updateField('mobil', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Fax</Label>
                            <Input
                                value={formData.fax || ''}
                                onChange={(e) => updateField('fax', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Email privat</Label>
                            <Input
                                type="email"
                                value={formData.email_privat || ''}
                                onChange={(e) => updateField('email_privat', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Email geschäftlich</Label>
                            <Input
                                type="email"
                                value={formData.email_geschaeftlich || ''}
                                onChange={(e) => updateField('email_geschaeftlich', e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <Label>Bevorzugte Kontaktart</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={formData.bevorzugte_kontaktart || ''}
                            onChange={(e) => updateField('bevorzugte_kontaktart', e.target.value)}
                        >
                            <option value="">Auswählen...</option>
                            <option value="email">Email</option>
                            <option value="telefon">Telefon</option>
                            <option value="post">Post</option>
                        </select>
                    </div>
                </TabsContent>

                <TabsContent value="bank" className="space-y-3 mt-4">
                    <div>
                        <Label>Bank Name</Label>
                        <Input
                            value={formData.bank_name || ''}
                            onChange={(e) => updateField('bank_name', e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>IBAN</Label>
                        <Input
                            value={formData.iban || ''}
                            onChange={(e) => updateField('iban', e.target.value)}
                            placeholder="DE89 3704 0044 0532 0130 00"
                        />
                    </div>
                    <div>
                        <Label>BIC</Label>
                        <Input
                            value={formData.bic || ''}
                            onChange={(e) => updateField('bic', e.target.value)}
                            placeholder="COBADEFFXXX"
                        />
                    </div>
                    <div>
                        <Label>Kontoinhaber (falls abweichend)</Label>
                        <Input
                            value={formData.kontoinhaber || ''}
                            onChange={(e) => updateField('kontoinhaber', e.target.value)}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="tax" className="space-y-3 mt-4">
                    <div>
                        <Label>Steuer-ID</Label>
                        <Input
                            value={formData.steuer_id || ''}
                            onChange={(e) => updateField('steuer_id', e.target.value)}
                            placeholder="12 345 678 901"
                        />
                    </div>
                    <div>
                        <Label>Steuernummer privat</Label>
                        <Input
                            value={formData.steuernummer_privat || ''}
                            onChange={(e) => updateField('steuernummer_privat', e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>Steuernummer gewerblich</Label>
                        <Input
                            value={formData.steuernummer_gewerblich || ''}
                            onChange={(e) => updateField('steuernummer_gewerblich', e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>Steuerliche Ansässigkeit</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={formData.steuerliche_ansaessigkeit}
                            onChange={(e) => updateField('steuerliche_ansaessigkeit', e.target.value)}
                        >
                            <option value="inland">Inland</option>
                            <option value="eu_ausland">EU-Ausland</option>
                            <option value="drittland">Drittland</option>
                        </select>
                    </div>
                    <div>
                        <Label>Zuständiges Finanzamt</Label>
                        <Input
                            value={formData.zustaendiges_finanzamt || ''}
                            onChange={(e) => updateField('zustaendiges_finanzamt', e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>FA-Steuernummer</Label>
                        <Input
                            value={formData.fa_steuernummer || ''}
                            onChange={(e) => updateField('fa_steuernummer', e.target.value)}
                        />
                    </div>

                    <div className="pt-3 border-t space-y-3">
                        <h4 className="font-semibold text-slate-700">Umsatzsteuer</h4>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="ust_pflichtig"
                                checked={formData.umsatzsteuer_pflichtig || false}
                                onCheckedChange={(checked) => updateField('umsatzsteuer_pflichtig', checked)}
                            />
                            <label htmlFor="ust_pflichtig" className="text-sm">Umsatzsteuerpflichtig</label>
                        </div>
                        {formData.umsatzsteuer_pflichtig && (
                            <>
                                <div>
                                    <Label>USt-ID Nummer</Label>
                                    <Input
                                        value={formData.ust_id_nummer || ''}
                                        onChange={(e) => updateField('ust_id_nummer', e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="kleinunternehmer"
                                        checked={formData.kleinunternehmer_regelung || false}
                                        onCheckedChange={(checked) => updateField('kleinunternehmer_regelung', checked)}
                                    />
                                    <label htmlFor="kleinunternehmer" className="text-sm">Kleinunternehmerregelung</label>
                                </div>
                            </>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="business" className="space-y-3 mt-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="gewerbe"
                            checked={formData.gewerbeanmeldung_vorhanden || false}
                            onCheckedChange={(checked) => updateField('gewerbeanmeldung_vorhanden', checked)}
                        />
                        <label htmlFor="gewerbe" className="text-sm">Gewerbeanmeldung vorhanden</label>
                    </div>

                    {formData.gewerbeanmeldung_vorhanden && (
                        <>
                            <div>
                                <Label>Anmeldedatum</Label>
                                <Input
                                    type="date"
                                    value={formData.gewerbe_anmeldedatum || ''}
                                    onChange={(e) => updateField('gewerbe_anmeldedatum', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Art des Gewerbes</Label>
                                <Input
                                    value={formData.gewerbe_art || ''}
                                    onChange={(e) => updateField('gewerbe_art', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Gewerbe-Finanzamt</Label>
                                <Input
                                    value={formData.gewerbe_finanzamt || ''}
                                    onChange={(e) => updateField('gewerbe_finanzamt', e.target.value)}
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="ihk"
                                        checked={formData.ihk_mitgliedschaft || false}
                                        onCheckedChange={(checked) => updateField('ihk_mitgliedschaft', checked)}
                                    />
                                    <label htmlFor="ihk" className="text-sm">IHK-Mitglied</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="hwk"
                                        checked={formData.hwk_mitgliedschaft || false}
                                        onCheckedChange={(checked) => updateField('hwk_mitgliedschaft', checked)}
                                    />
                                    <label htmlFor="hwk" className="text-sm">HWK-Mitglied</label>
                                </div>
                            </div>
                        </>
                    )}
                </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Abbrechen
                    </Button>
                )}
                <Button type="submit" disabled={saveMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                    {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {initialData ? 'Speichern' : 'Erstellen'}
                </Button>
            </div>
        </form>
    );
}