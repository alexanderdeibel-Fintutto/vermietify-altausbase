import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Trash2 } from 'lucide-react';

export default function SimpleOwnerForm({ buildingId, initialOwner, onSuccess }) {
    const [ownerData, setOwnerData] = useState(initialOwner || {
        eigentuemer_typ: 'natuerliche_person',
        vorname: '',
        nachname: '',
        staatsangehoerigkeit: 'deutsch',
        land: 'Deutschland',
        steuerliche_ansaessigkeit: 'inland',
        aktiv: true
    });
    const [owners, setOwners] = useState(initialOwner ? [] : [{
        eigentuemer_typ: 'natuerliche_person',
        vorname: '',
        nachname: '',
        anteil_prozent: '',
        gueltig_von: new Date().toISOString().split('T')[0],
        staatsangehoerigkeit: 'deutsch',
        land: 'Deutschland',
        steuerliche_ansaessigkeit: 'inland',
        aktiv: true
    }]);
    const [saving, setSaving] = useState(false);
    
    const isEditing = !!initialOwner;

    const addOwner = () => {
        setOwners([...owners, {
            eigentuemer_typ: 'natuerliche_person',
            vorname: '',
            nachname: '',
            anteil_prozent: '',
            gueltig_von: new Date().toISOString().split('T')[0],
            staatsangehoerigkeit: 'deutsch',
            land: 'Deutschland',
            steuerliche_ansaessigkeit: 'inland',
            aktiv: true
        }]);
    };

    const removeOwner = (index) => {
        setOwners(owners.filter((_, i) => i !== index));
    };

    const updateOwner = (index, field, value) => {
        const updated = [...owners];
        updated[index] = { ...updated[index], [field]: value };
        setOwners(updated);
    };

    const totalPercent = owners.reduce((sum, o) => sum + (parseFloat(o.anteil_prozent) || 0), 0);

    const handleSave = async () => {
        if (isEditing) {
            // Bearbeiten-Modus
            if (!ownerData.nachname || ownerData.nachname.trim() === '') {
                alert('Bitte Name/Firmenname angeben');
                return;
            }
            setSaving(true);
            onSuccess(ownerData);
        } else {
            // Erstellen-Modus
            for (const owner of owners) {
                if (!owner.nachname || owner.nachname.trim() === '') {
                    alert('Bitte Name/Firmenname bei allen Eigentümern angeben');
                    return;
                }
                if (!owner.anteil_prozent || parseFloat(owner.anteil_prozent) <= 0) {
                    alert('Bitte Anteil in % bei allen Eigentümern angeben');
                    return;
                }
            }

            if (Math.abs(totalPercent - 100) > 0.01) {
                alert('Die Anteile müssen zusammen 100% ergeben');
                return;
            }

            setSaving(true);
            onSuccess(owners);
        }
    };

    const updateOwnerData = (field, value) => {
        setOwnerData({ ...ownerData, [field]: value });
    };

    return (
        <div className="space-y-6">
            {isEditing ? (
                // Bearbeiten-Modus: Zeige nur ein Formular
                <div className="border-2 border-slate-200 rounded-lg p-4 bg-slate-50">
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
                                <Label>Eigentümer-Typ</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                                    value={ownerData.eigentuemer_typ}
                                    onChange={(e) => updateOwnerData('eigentuemer_typ', e.target.value)}
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

                            {ownerData.eigentuemer_typ === 'natuerliche_person' && (
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <Label>Anrede</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                                            value={ownerData.anrede || ''}
                                            onChange={(e) => updateOwnerData('anrede', e.target.value)}
                                        >
                                            <option value="">-</option>
                                            <option value="herr">Herr</option>
                                            <option value="frau">Frau</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Titel</Label>
                                        <Input
                                            value={ownerData.titel || ''}
                                            onChange={(e) => updateOwnerData('titel', e.target.value)}
                                            placeholder="Dr., Prof."
                                        />
                                    </div>
                                    <div>
                                        <Label>Vorname</Label>
                                        <Input
                                            value={ownerData.vorname || ''}
                                            onChange={(e) => updateOwnerData('vorname', e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>{ownerData.eigentuemer_typ === 'natuerliche_person' ? 'Nachname' : 'Firmenname'} *</Label>
                                    <Input
                                        value={ownerData.nachname || ''}
                                        onChange={(e) => updateOwnerData('nachname', e.target.value)}
                                    />
                                </div>
                                {ownerData.eigentuemer_typ !== 'natuerliche_person' && (
                                    <div>
                                        <Label>Zusatz</Label>
                                        <Input
                                            value={ownerData.firma_zusatz || ''}
                                            onChange={(e) => updateOwnerData('firma_zusatz', e.target.value)}
                                            placeholder="GmbH, AG"
                                        />
                                    </div>
                                )}
                            </div>

                            {ownerData.eigentuemer_typ === 'natuerliche_person' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Geburtsdatum</Label>
                                        <Input
                                            type="date"
                                            value={ownerData.geburtsdatum || ''}
                                            onChange={(e) => updateOwnerData('geburtsdatum', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Geburtsort</Label>
                                        <Input
                                            value={ownerData.geburtsort || ''}
                                            onChange={(e) => updateOwnerData('geburtsort', e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <Label>Staatsangehörigkeit</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                                    value={ownerData.staatsangehoerigkeit}
                                    onChange={(e) => updateOwnerData('staatsangehoerigkeit', e.target.value)}
                                >
                                    <option value="deutsch">Deutsch</option>
                                    <option value="eu">EU</option>
                                    <option value="sonstige">Sonstige</option>
                                </select>
                            </div>

                            <div className="space-y-3 pt-3 border-t">
                                <h4 className="font-semibold text-slate-700">Adresse</h4>
                                <div>
                                    <Label>Straße und Hausnummer</Label>
                                    <Input
                                        value={ownerData.strasse || ''}
                                        onChange={(e) => updateOwnerData('strasse', e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <Label>PLZ</Label>
                                        <Input
                                            value={ownerData.plz || ''}
                                            onChange={(e) => updateOwnerData('plz', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label>Ort</Label>
                                        <Input
                                            value={ownerData.ort || ''}
                                            onChange={(e) => updateOwnerData('ort', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>Adresszusatz</Label>
                                    <Input
                                        value={ownerData.adresszusatz || ''}
                                        onChange={(e) => updateOwnerData('adresszusatz', e.target.value)}
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
                                        value={ownerData.telefon_privat || ''}
                                        onChange={(e) => updateOwnerData('telefon_privat', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Telefon geschäftlich</Label>
                                    <Input
                                        value={ownerData.telefon_geschaeftlich || ''}
                                        onChange={(e) => updateOwnerData('telefon_geschaeftlich', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Mobil</Label>
                                    <Input
                                        value={ownerData.mobil || ''}
                                        onChange={(e) => updateOwnerData('mobil', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Fax</Label>
                                    <Input
                                        value={ownerData.fax || ''}
                                        onChange={(e) => updateOwnerData('fax', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Email privat</Label>
                                    <Input
                                        type="email"
                                        value={ownerData.email_privat || ''}
                                        onChange={(e) => updateOwnerData('email_privat', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Email geschäftlich</Label>
                                    <Input
                                        type="email"
                                        value={ownerData.email_geschaeftlich || ''}
                                        onChange={(e) => updateOwnerData('email_geschaeftlich', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Bevorzugte Kontaktart</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                                    value={ownerData.bevorzugte_kontaktart || ''}
                                    onChange={(e) => updateOwnerData('bevorzugte_kontaktart', e.target.value)}
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
                                    value={ownerData.bank_name || ''}
                                    onChange={(e) => updateOwnerData('bank_name', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>IBAN</Label>
                                <Input
                                    value={ownerData.iban || ''}
                                    onChange={(e) => updateOwnerData('iban', e.target.value)}
                                    placeholder="DE89 3704 0044 0532 0130 00"
                                />
                            </div>
                            <div>
                                <Label>BIC</Label>
                                <Input
                                    value={ownerData.bic || ''}
                                    onChange={(e) => updateOwnerData('bic', e.target.value)}
                                    placeholder="COBADEFFXXX"
                                />
                            </div>
                            <div>
                                <Label>Kontoinhaber (falls abweichend)</Label>
                                <Input
                                    value={ownerData.kontoinhaber || ''}
                                    onChange={(e) => updateOwnerData('kontoinhaber', e.target.value)}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="tax" className="space-y-3 mt-4">
                            <div>
                                <Label>Steuer-ID</Label>
                                <Input
                                    value={ownerData.steuer_id || ''}
                                    onChange={(e) => updateOwnerData('steuer_id', e.target.value)}
                                    placeholder="12 345 678 901"
                                />
                            </div>
                            <div>
                                <Label>Steuernummer privat</Label>
                                <Input
                                    value={ownerData.steuernummer_privat || ''}
                                    onChange={(e) => updateOwnerData('steuernummer_privat', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Steuernummer gewerblich</Label>
                                <Input
                                    value={ownerData.steuernummer_gewerblich || ''}
                                    onChange={(e) => updateOwnerData('steuernummer_gewerblich', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Steuerliche Ansässigkeit</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                                    value={ownerData.steuerliche_ansaessigkeit}
                                    onChange={(e) => updateOwnerData('steuerliche_ansaessigkeit', e.target.value)}
                                >
                                    <option value="inland">Inland</option>
                                    <option value="eu_ausland">EU-Ausland</option>
                                    <option value="drittland">Drittland</option>
                                </select>
                            </div>
                            <div>
                                <Label>Zuständiges Finanzamt</Label>
                                <Input
                                    value={ownerData.zustaendiges_finanzamt || ''}
                                    onChange={(e) => updateOwnerData('zustaendiges_finanzamt', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>FA-Steuernummer</Label>
                                <Input
                                    value={ownerData.fa_steuernummer || ''}
                                    onChange={(e) => updateOwnerData('fa_steuernummer', e.target.value)}
                                />
                            </div>

                            <div className="pt-3 border-t space-y-3">
                                <h4 className="font-semibold text-slate-700">Umsatzsteuer</h4>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="ust_pflichtig"
                                        checked={ownerData.umsatzsteuer_pflichtig || false}
                                        onCheckedChange={(checked) => updateOwnerData('umsatzsteuer_pflichtig', checked)}
                                    />
                                    <label htmlFor="ust_pflichtig" className="text-sm">Umsatzsteuerpflichtig</label>
                                </div>
                                {ownerData.umsatzsteuer_pflichtig && (
                                    <>
                                        <div>
                                            <Label>USt-ID Nummer</Label>
                                            <Input
                                                value={ownerData.ust_id_nummer || ''}
                                                onChange={(e) => updateOwnerData('ust_id_nummer', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="kleinunternehmer"
                                                checked={ownerData.kleinunternehmer_regelung || false}
                                                onCheckedChange={(checked) => updateOwnerData('kleinunternehmer_regelung', checked)}
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
                                    checked={ownerData.gewerbeanmeldung_vorhanden || false}
                                    onCheckedChange={(checked) => updateOwnerData('gewerbeanmeldung_vorhanden', checked)}
                                />
                                <label htmlFor="gewerbe" className="text-sm">Gewerbeanmeldung vorhanden</label>
                            </div>

                            {ownerData.gewerbeanmeldung_vorhanden && (
                                <>
                                    <div>
                                        <Label>Anmeldedatum</Label>
                                        <Input
                                            type="date"
                                            value={ownerData.gewerbe_anmeldedatum || ''}
                                            onChange={(e) => updateOwnerData('gewerbe_anmeldedatum', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Art des Gewerbes</Label>
                                        <Input
                                            value={ownerData.gewerbe_art || ''}
                                            onChange={(e) => updateOwnerData('gewerbe_art', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Gewerbe-Finanzamt</Label>
                                        <Input
                                            value={ownerData.gewerbe_finanzamt || ''}
                                            onChange={(e) => updateOwnerData('gewerbe_finanzamt', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="ihk"
                                                checked={ownerData.ihk_mitgliedschaft || false}
                                                onCheckedChange={(checked) => updateOwnerData('ihk_mitgliedschaft', checked)}
                                            />
                                            <label htmlFor="ihk" className="text-sm">IHK-Mitglied</label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="hwk"
                                                checked={ownerData.hwk_mitgliedschaft || false}
                                                onCheckedChange={(checked) => updateOwnerData('hwk_mitgliedschaft', checked)}
                                            />
                                            <label htmlFor="hwk" className="text-sm">HWK-Mitglied</label>
                                        </div>
                                    </div>
                                </>
                            )}
                        </TabsContent>
                    </Tabs>

                    <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-emerald-600 hover:bg-emerald-700"
                            size="sm"
                        >
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Speichern
                        </Button>
                    </div>
                </div>
            ) : (
                // Erstellen-Modus: Zeige Liste von Eigentümern
                <>
                    {owners.map((owner, index) => {
                        const isNaturalPerson = owner.eigentuemer_typ === 'natuerliche_person';
                
                return (
                    <div key={index} className="border-2 border-slate-200 rounded-lg p-4 bg-slate-50">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-slate-800">Eigentümer {index + 1}</h4>
                            {owners.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeOwner(index)}
                                    className="text-red-600"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>

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
                                    <Label>Eigentümer-Typ</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                                        value={owner.eigentuemer_typ}
                                        onChange={(e) => updateOwner(index, 'eigentuemer_typ', e.target.value)}
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
                                                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                                                value={owner.anrede || ''}
                                                onChange={(e) => updateOwner(index, 'anrede', e.target.value)}
                                            >
                                                <option value="">-</option>
                                                <option value="herr">Herr</option>
                                                <option value="frau">Frau</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label>Titel</Label>
                                            <Input
                                                value={owner.titel || ''}
                                                onChange={(e) => updateOwner(index, 'titel', e.target.value)}
                                                placeholder="Dr., Prof."
                                            />
                                        </div>
                                        <div>
                                            <Label>Vorname</Label>
                                            <Input
                                                value={owner.vorname || ''}
                                                onChange={(e) => updateOwner(index, 'vorname', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>{isNaturalPerson ? 'Nachname' : 'Firmenname'} *</Label>
                                        <Input
                                            value={owner.nachname || ''}
                                            onChange={(e) => updateOwner(index, 'nachname', e.target.value)}
                                        />
                                    </div>
                                    {!isNaturalPerson && (
                                        <div>
                                            <Label>Zusatz</Label>
                                            <Input
                                                value={owner.firma_zusatz || ''}
                                                onChange={(e) => updateOwner(index, 'firma_zusatz', e.target.value)}
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
                                                value={owner.geburtsdatum || ''}
                                                onChange={(e) => updateOwner(index, 'geburtsdatum', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Geburtsort</Label>
                                            <Input
                                                value={owner.geburtsort || ''}
                                                onChange={(e) => updateOwner(index, 'geburtsort', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <Label>Staatsangehörigkeit</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                                        value={owner.staatsangehoerigkeit}
                                        onChange={(e) => updateOwner(index, 'staatsangehoerigkeit', e.target.value)}
                                    >
                                        <option value="deutsch">Deutsch</option>
                                        <option value="eu">EU</option>
                                        <option value="sonstige">Sonstige</option>
                                    </select>
                                </div>

                                <div className="space-y-3 pt-3 border-t">
                                    <h4 className="font-semibold text-slate-700">Adresse</h4>
                                    <div>
                                        <Label>Straße und Hausnummer</Label>
                                        <Input
                                            value={owner.strasse || ''}
                                            onChange={(e) => updateOwner(index, 'strasse', e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <Label>PLZ</Label>
                                            <Input
                                                value={owner.plz || ''}
                                                onChange={(e) => updateOwner(index, 'plz', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Label>Ort</Label>
                                            <Input
                                                value={owner.ort || ''}
                                                onChange={(e) => updateOwner(index, 'ort', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Adresszusatz</Label>
                                        <Input
                                            value={owner.adresszusatz || ''}
                                            onChange={(e) => updateOwner(index, 'adresszusatz', e.target.value)}
                                            placeholder="c/o, Postfach"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 pt-3 border-t">
                                    <h4 className="font-semibold text-slate-700">Eigentumsanteil am Objekt</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label>Anteil (%)*</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={owner.anteil_prozent}
                                                onChange={(e) => updateOwner(index, 'anteil_prozent', e.target.value)}
                                                placeholder="100"
                                            />
                                        </div>
                                        <div>
                                            <Label>Gültig von</Label>
                                            <Input
                                                type="date"
                                                value={owner.gueltig_von}
                                                onChange={(e) => updateOwner(index, 'gueltig_von', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="contact" className="space-y-3 mt-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Telefon privat</Label>
                                        <Input
                                            value={owner.telefon_privat || ''}
                                            onChange={(e) => updateOwner(index, 'telefon_privat', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Telefon geschäftlich</Label>
                                        <Input
                                            value={owner.telefon_geschaeftlich || ''}
                                            onChange={(e) => updateOwner(index, 'telefon_geschaeftlich', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Mobil</Label>
                                        <Input
                                            value={owner.mobil || ''}
                                            onChange={(e) => updateOwner(index, 'mobil', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Fax</Label>
                                        <Input
                                            value={owner.fax || ''}
                                            onChange={(e) => updateOwner(index, 'fax', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Email privat</Label>
                                        <Input
                                            type="email"
                                            value={owner.email_privat || ''}
                                            onChange={(e) => updateOwner(index, 'email_privat', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Email geschäftlich</Label>
                                        <Input
                                            type="email"
                                            value={owner.email_geschaeftlich || ''}
                                            onChange={(e) => updateOwner(index, 'email_geschaeftlich', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>Bevorzugte Kontaktart</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                                        value={owner.bevorzugte_kontaktart || ''}
                                        onChange={(e) => updateOwner(index, 'bevorzugte_kontaktart', e.target.value)}
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
                                        value={owner.bank_name || ''}
                                        onChange={(e) => updateOwner(index, 'bank_name', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>IBAN</Label>
                                    <Input
                                        value={owner.iban || ''}
                                        onChange={(e) => updateOwner(index, 'iban', e.target.value)}
                                        placeholder="DE89 3704 0044 0532 0130 00"
                                    />
                                </div>
                                <div>
                                    <Label>BIC</Label>
                                    <Input
                                        value={owner.bic || ''}
                                        onChange={(e) => updateOwner(index, 'bic', e.target.value)}
                                        placeholder="COBADEFFXXX"
                                    />
                                </div>
                                <div>
                                    <Label>Kontoinhaber (falls abweichend)</Label>
                                    <Input
                                        value={owner.kontoinhaber || ''}
                                        onChange={(e) => updateOwner(index, 'kontoinhaber', e.target.value)}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="tax" className="space-y-3 mt-4">
                                <div>
                                    <Label>Steuer-ID</Label>
                                    <Input
                                        value={owner.steuer_id || ''}
                                        onChange={(e) => updateOwner(index, 'steuer_id', e.target.value)}
                                        placeholder="12 345 678 901"
                                    />
                                </div>
                                <div>
                                    <Label>Steuernummer privat</Label>
                                    <Input
                                        value={owner.steuernummer_privat || ''}
                                        onChange={(e) => updateOwner(index, 'steuernummer_privat', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Steuernummer gewerblich</Label>
                                    <Input
                                        value={owner.steuernummer_gewerblich || ''}
                                        onChange={(e) => updateOwner(index, 'steuernummer_gewerblich', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Steuerliche Ansässigkeit</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                                        value={owner.steuerliche_ansaessigkeit}
                                        onChange={(e) => updateOwner(index, 'steuerliche_ansaessigkeit', e.target.value)}
                                    >
                                        <option value="inland">Inland</option>
                                        <option value="eu_ausland">EU-Ausland</option>
                                        <option value="drittland">Drittland</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>Zuständiges Finanzamt</Label>
                                    <Input
                                        value={owner.zustaendiges_finanzamt || ''}
                                        onChange={(e) => updateOwner(index, 'zustaendiges_finanzamt', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>FA-Steuernummer</Label>
                                    <Input
                                        value={owner.fa_steuernummer || ''}
                                        onChange={(e) => updateOwner(index, 'fa_steuernummer', e.target.value)}
                                    />
                                </div>

                                <div className="pt-3 border-t space-y-3">
                                    <h4 className="font-semibold text-slate-700">Umsatzsteuer</h4>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`ust_pflichtig_${index}`}
                                            checked={owner.umsatzsteuer_pflichtig || false}
                                            onCheckedChange={(checked) => updateOwner(index, 'umsatzsteuer_pflichtig', checked)}
                                        />
                                        <label htmlFor={`ust_pflichtig_${index}`} className="text-sm">Umsatzsteuerpflichtig</label>
                                    </div>
                                    {owner.umsatzsteuer_pflichtig && (
                                        <>
                                            <div>
                                                <Label>USt-ID Nummer</Label>
                                                <Input
                                                    value={owner.ust_id_nummer || ''}
                                                    onChange={(e) => updateOwner(index, 'ust_id_nummer', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`kleinunternehmer_${index}`}
                                                    checked={owner.kleinunternehmer_regelung || false}
                                                    onCheckedChange={(checked) => updateOwner(index, 'kleinunternehmer_regelung', checked)}
                                                />
                                                <label htmlFor={`kleinunternehmer_${index}`} className="text-sm">Kleinunternehmerregelung</label>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="business" className="space-y-3 mt-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`gewerbe_${index}`}
                                        checked={owner.gewerbeanmeldung_vorhanden || false}
                                        onCheckedChange={(checked) => updateOwner(index, 'gewerbeanmeldung_vorhanden', checked)}
                                    />
                                    <label htmlFor={`gewerbe_${index}`} className="text-sm">Gewerbeanmeldung vorhanden</label>
                                </div>

                                {owner.gewerbeanmeldung_vorhanden && (
                                    <>
                                        <div>
                                            <Label>Anmeldedatum</Label>
                                            <Input
                                                type="date"
                                                value={owner.gewerbe_anmeldedatum || ''}
                                                onChange={(e) => updateOwner(index, 'gewerbe_anmeldedatum', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Art des Gewerbes</Label>
                                            <Input
                                                value={owner.gewerbe_art || ''}
                                                onChange={(e) => updateOwner(index, 'gewerbe_art', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Gewerbe-Finanzamt</Label>
                                            <Input
                                                value={owner.gewerbe_finanzamt || ''}
                                                onChange={(e) => updateOwner(index, 'gewerbe_finanzamt', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`ihk_${index}`}
                                                    checked={owner.ihk_mitgliedschaft || false}
                                                    onCheckedChange={(checked) => updateOwner(index, 'ihk_mitgliedschaft', checked)}
                                                />
                                                <label htmlFor={`ihk_${index}`} className="text-sm">IHK-Mitglied</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`hwk_${index}`}
                                                    checked={owner.hwk_mitgliedschaft || false}
                                                    onCheckedChange={(checked) => updateOwner(index, 'hwk_mitgliedschaft', checked)}
                                                />
                                                <label htmlFor={`hwk_${index}`} className="text-sm">HWK-Mitglied</label>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                    );
                })}

                <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-sm">
                        <span className="text-slate-600">Gesamt: </span>
                        <span className={`font-semibold ${Math.abs(totalPercent - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                            {totalPercent.toFixed(2)}%
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addOwner}
                            size="sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Weiterer Eigentümer
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-emerald-600 hover:bg-emerald-700"
                            size="sm"
                        >
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Speichern
                        </Button>
                    </div>
                </div>
                </>
            )}
        </div>
    );
}