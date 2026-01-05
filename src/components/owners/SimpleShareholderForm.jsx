import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Trash2 } from 'lucide-react';

export default function SimpleShareholderForm({ ownerId, ownerName, existingShareholders, allOwners, onSuccess, onCancel }) {
    const [shareholders, setShareholders] = useState(() => {
        if (existingShareholders && existingShareholders.length > 0) {
            // Bearbeitungs-Modus: Lade existierende Gesellschafter
            return existingShareholders.map(sh => {
                const owner = allOwners.find(o => o.id === sh.gesellschafter_owner_id);
                return {
                    id: sh.id,
                    gesellschafter_owner_id: sh.gesellschafter_owner_id,
                    eigentuemer_typ: owner?.eigentuemer_typ || 'natuerliche_person',
                    vorname: owner?.vorname || '',
                    nachname: owner?.nachname || '',
                    anteil_prozent: sh.anteil_prozent,
                    gueltig_von: sh.gueltig_von,
                    staatsangehoerigkeit: owner?.staatsangehoerigkeit || 'deutsch',
                    land: owner?.land || 'Deutschland',
                    steuerliche_ansaessigkeit: owner?.steuerliche_ansaessigkeit || 'inland',
                    aktiv: owner?.aktiv !== false,
                    ...owner
                };
            });
        }
        // Erstellen-Modus: Leeres Formular
        return [{
            eigentuemer_typ: 'natuerliche_person',
            vorname: '',
            nachname: '',
            anteil_prozent: '',
            gueltig_von: new Date().toISOString().split('T')[0],
            staatsangehoerigkeit: 'deutsch',
            land: 'Deutschland',
            steuerliche_ansaessigkeit: 'inland',
            aktiv: true
        }];
    });
    const [saving, setSaving] = useState(false);
    
    const isEditing = existingShareholders && existingShareholders.length > 0;

    const addShareholder = () => {
        setShareholders([...shareholders, {
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

    const removeShareholder = (index) => {
        setShareholders(shareholders.filter((_, i) => i !== index));
    };

    const updateShareholder = (index, field, value) => {
        const updated = [...shareholders];
        updated[index] = { ...updated[index], [field]: value };
        setShareholders(updated);
    };

    const totalPercent = shareholders.reduce((sum, s) => sum + (parseFloat(s.anteil_prozent) || 0), 0);

    const handleSave = async () => {
        for (const shareholder of shareholders) {
            if (!shareholder.nachname || shareholder.nachname.trim() === '') {
                alert('Bitte Name/Firmenname bei allen Gesellschaftern angeben');
                return;
            }
            if (!shareholder.anteil_prozent || parseFloat(shareholder.anteil_prozent) <= 0) {
                alert('Bitte Anteil in % bei allen Gesellschaftern angeben');
                return;
            }
        }

        if (Math.abs(totalPercent - 100) > 0.01) {
            alert('Die Anteile müssen zusammen 100% ergeben');
            return;
        }

        setSaving(true);
        onSuccess(shareholders);
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                    <strong>Gesellschafter von:</strong> {ownerName}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                    {isEditing ? 'Bearbeiten Sie die Gesellschafter (100% erforderlich)' : 'Die Anteile aller Gesellschafter müssen zusammen 100% ergeben'}
                </p>
            </div>

            {shareholders.map((shareholder, index) => {
                const isNaturalPerson = shareholder.eigentuemer_typ === 'natuerliche_person';
                
                return (
                    <div key={index} className="border-2 border-slate-200 rounded-lg p-4 bg-slate-50">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-slate-800">Gesellschafter {index + 1}</h4>
                            {shareholders.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeShareholder(index)}
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
                                        value={shareholder.eigentuemer_typ}
                                        onChange={(e) => updateShareholder(index, 'eigentuemer_typ', e.target.value)}
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
                                                value={shareholder.anrede || ''}
                                                onChange={(e) => updateShareholder(index, 'anrede', e.target.value)}
                                            >
                                                <option value="">-</option>
                                                <option value="herr">Herr</option>
                                                <option value="frau">Frau</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label>Titel</Label>
                                            <Input
                                                value={shareholder.titel || ''}
                                                onChange={(e) => updateShareholder(index, 'titel', e.target.value)}
                                                placeholder="Dr., Prof."
                                            />
                                        </div>
                                        <div>
                                            <Label>Vorname</Label>
                                            <Input
                                                value={shareholder.vorname || ''}
                                                onChange={(e) => updateShareholder(index, 'vorname', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>{isNaturalPerson ? 'Nachname' : 'Firmenname'} *</Label>
                                        <Input
                                            value={shareholder.nachname || ''}
                                            onChange={(e) => updateShareholder(index, 'nachname', e.target.value)}
                                        />
                                    </div>
                                    {!isNaturalPerson && (
                                        <div>
                                            <Label>Zusatz</Label>
                                            <Input
                                                value={shareholder.firma_zusatz || ''}
                                                onChange={(e) => updateShareholder(index, 'firma_zusatz', e.target.value)}
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
                                                value={shareholder.geburtsdatum || ''}
                                                onChange={(e) => updateShareholder(index, 'geburtsdatum', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Geburtsort</Label>
                                            <Input
                                                value={shareholder.geburtsort || ''}
                                                onChange={(e) => updateShareholder(index, 'geburtsort', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <Label>Staatsangehörigkeit</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                                        value={shareholder.staatsangehoerigkeit}
                                        onChange={(e) => updateShareholder(index, 'staatsangehoerigkeit', e.target.value)}
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
                                            value={shareholder.strasse || ''}
                                            onChange={(e) => updateShareholder(index, 'strasse', e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <Label>PLZ</Label>
                                            <Input
                                                value={shareholder.plz || ''}
                                                onChange={(e) => updateShareholder(index, 'plz', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Label>Ort</Label>
                                            <Input
                                                value={shareholder.ort || ''}
                                                onChange={(e) => updateShareholder(index, 'ort', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Adresszusatz</Label>
                                        <Input
                                            value={shareholder.adresszusatz || ''}
                                            onChange={(e) => updateShareholder(index, 'adresszusatz', e.target.value)}
                                            placeholder="c/o, Postfach"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 pt-3 border-t">
                                    <h4 className="font-semibold text-slate-700">Anteil am Eigentümer</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label>Anteil (%)*</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={shareholder.anteil_prozent}
                                                onChange={(e) => updateShareholder(index, 'anteil_prozent', e.target.value)}
                                                placeholder="100"
                                            />
                                        </div>
                                        <div>
                                            <Label>Gültig von</Label>
                                            <Input
                                                type="date"
                                                value={shareholder.gueltig_von}
                                                onChange={(e) => updateShareholder(index, 'gueltig_von', e.target.value)}
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
                                            value={shareholder.telefon_privat || ''}
                                            onChange={(e) => updateShareholder(index, 'telefon_privat', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Telefon geschäftlich</Label>
                                        <Input
                                            value={shareholder.telefon_geschaeftlich || ''}
                                            onChange={(e) => updateShareholder(index, 'telefon_geschaeftlich', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Mobil</Label>
                                        <Input
                                            value={shareholder.mobil || ''}
                                            onChange={(e) => updateShareholder(index, 'mobil', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Fax</Label>
                                        <Input
                                            value={shareholder.fax || ''}
                                            onChange={(e) => updateShareholder(index, 'fax', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Email privat</Label>
                                        <Input
                                            type="email"
                                            value={shareholder.email_privat || ''}
                                            onChange={(e) => updateShareholder(index, 'email_privat', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Email geschäftlich</Label>
                                        <Input
                                            type="email"
                                            value={shareholder.email_geschaeftlich || ''}
                                            onChange={(e) => updateShareholder(index, 'email_geschaeftlich', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>Bevorzugte Kontaktart</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                                        value={shareholder.bevorzugte_kontaktart || ''}
                                        onChange={(e) => updateShareholder(index, 'bevorzugte_kontaktart', e.target.value)}
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
                                        value={shareholder.bank_name || ''}
                                        onChange={(e) => updateShareholder(index, 'bank_name', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>IBAN</Label>
                                    <Input
                                        value={shareholder.iban || ''}
                                        onChange={(e) => updateShareholder(index, 'iban', e.target.value)}
                                        placeholder="DE89 3704 0044 0532 0130 00"
                                    />
                                </div>
                                <div>
                                    <Label>BIC</Label>
                                    <Input
                                        value={shareholder.bic || ''}
                                        onChange={(e) => updateShareholder(index, 'bic', e.target.value)}
                                        placeholder="COBADEFFXXX"
                                    />
                                </div>
                                <div>
                                    <Label>Kontoinhaber (falls abweichend)</Label>
                                    <Input
                                        value={shareholder.kontoinhaber || ''}
                                        onChange={(e) => updateShareholder(index, 'kontoinhaber', e.target.value)}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="tax" className="space-y-3 mt-4">
                                <div>
                                    <Label>Steuer-ID</Label>
                                    <Input
                                        value={shareholder.steuer_id || ''}
                                        onChange={(e) => updateShareholder(index, 'steuer_id', e.target.value)}
                                        placeholder="12 345 678 901"
                                    />
                                </div>
                                <div>
                                    <Label>Steuernummer privat</Label>
                                    <Input
                                        value={shareholder.steuernummer_privat || ''}
                                        onChange={(e) => updateShareholder(index, 'steuernummer_privat', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Steuernummer gewerblich</Label>
                                    <Input
                                        value={shareholder.steuernummer_gewerblich || ''}
                                        onChange={(e) => updateShareholder(index, 'steuernummer_gewerblich', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Steuerliche Ansässigkeit</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                                        value={shareholder.steuerliche_ansaessigkeit}
                                        onChange={(e) => updateShareholder(index, 'steuerliche_ansaessigkeit', e.target.value)}
                                    >
                                        <option value="inland">Inland</option>
                                        <option value="eu_ausland">EU-Ausland</option>
                                        <option value="drittland">Drittland</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>Zuständiges Finanzamt</Label>
                                    <Input
                                        value={shareholder.zustaendiges_finanzamt || ''}
                                        onChange={(e) => updateShareholder(index, 'zustaendiges_finanzamt', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>FA-Steuernummer</Label>
                                    <Input
                                        value={shareholder.fa_steuernummer || ''}
                                        onChange={(e) => updateShareholder(index, 'fa_steuernummer', e.target.value)}
                                    />
                                </div>

                                <div className="pt-3 border-t space-y-3">
                                    <h4 className="font-semibold text-slate-700">Umsatzsteuer</h4>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`ust_pflichtig_${index}`}
                                            checked={shareholder.umsatzsteuer_pflichtig || false}
                                            onCheckedChange={(checked) => updateShareholder(index, 'umsatzsteuer_pflichtig', checked)}
                                        />
                                        <label htmlFor={`ust_pflichtig_${index}`} className="text-sm">Umsatzsteuerpflichtig</label>
                                    </div>
                                    {shareholder.umsatzsteuer_pflichtig && (
                                        <>
                                            <div>
                                                <Label>USt-ID Nummer</Label>
                                                <Input
                                                    value={shareholder.ust_id_nummer || ''}
                                                    onChange={(e) => updateShareholder(index, 'ust_id_nummer', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`kleinunternehmer_${index}`}
                                                    checked={shareholder.kleinunternehmer_regelung || false}
                                                    onCheckedChange={(checked) => updateShareholder(index, 'kleinunternehmer_regelung', checked)}
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
                                        checked={shareholder.gewerbeanmeldung_vorhanden || false}
                                        onCheckedChange={(checked) => updateShareholder(index, 'gewerbeanmeldung_vorhanden', checked)}
                                    />
                                    <label htmlFor={`gewerbe_${index}`} className="text-sm">Gewerbeanmeldung vorhanden</label>
                                </div>

                                {shareholder.gewerbeanmeldung_vorhanden && (
                                    <>
                                        <div>
                                            <Label>Anmeldedatum</Label>
                                            <Input
                                                type="date"
                                                value={shareholder.gewerbe_anmeldedatum || ''}
                                                onChange={(e) => updateShareholder(index, 'gewerbe_anmeldedatum', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Art des Gewerbes</Label>
                                            <Input
                                                value={shareholder.gewerbe_art || ''}
                                                onChange={(e) => updateShareholder(index, 'gewerbe_art', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Gewerbe-Finanzamt</Label>
                                            <Input
                                                value={shareholder.gewerbe_finanzamt || ''}
                                                onChange={(e) => updateShareholder(index, 'gewerbe_finanzamt', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`ihk_${index}`}
                                                    checked={shareholder.ihk_mitgliedschaft || false}
                                                    onCheckedChange={(checked) => updateShareholder(index, 'ihk_mitgliedschaft', checked)}
                                                />
                                                <label htmlFor={`ihk_${index}`} className="text-sm">IHK-Mitglied</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`hwk_${index}`}
                                                    checked={shareholder.hwk_mitgliedschaft || false}
                                                    onCheckedChange={(checked) => updateShareholder(index, 'hwk_mitgliedschaft', checked)}
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
                        onClick={addShareholder}
                        size="sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Weiterer Gesellschafter
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        size="sm"
                    >
                        Abbrechen
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
        </div>
    );
}