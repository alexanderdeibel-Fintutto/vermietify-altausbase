import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, FileText } from 'lucide-react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export default function GrundbuchForm({ grundbuch, onChange }) {
    const [bestandsverzeichnis, setBestandsverzeichnis] = React.useState(
        grundbuch?.bestandsverzeichnis || []
    );

    React.useEffect(() => {
        if (grundbuch?.bestandsverzeichnis) {
            setBestandsverzeichnis(grundbuch.bestandsverzeichnis);
        }
    }, [grundbuch]);

    const updateDeckblatt = (field, value) => {
        onChange({
            ...grundbuch,
            deckblatt: {
                ...(grundbuch?.deckblatt || {}),
                [field]: value
            }
        });
    };

    const updateAbteilung1 = (field, value) => {
        onChange({
            ...grundbuch,
            abteilung1: {
                ...(grundbuch?.abteilung1 || {}),
                [field]: value
            }
        });
    };

    const updateAbteilung2 = (field, value) => {
        onChange({
            ...grundbuch,
            abteilung2: {
                ...(grundbuch?.abteilung2 || {}),
                [field]: value
            }
        });
    };

    const updateAbteilung3 = (field, value) => {
        onChange({
            ...grundbuch,
            abteilung3: {
                ...(grundbuch?.abteilung3 || {}),
                [field]: value
            }
        });
    };

    const updateKataster = (field, value) => {
        onChange({
            ...grundbuch,
            kataster_stammdaten: {
                ...(grundbuch?.kataster_stammdaten || {}),
                [field]: value
            }
        });
    };

    const addBestandsverzeichnisEintrag = () => {
        const updated = [...bestandsverzeichnis, {}];
        setBestandsverzeichnis(updated);
        onChange({
            ...grundbuch,
            bestandsverzeichnis: updated
        });
    };

    const removeBestandsverzeichnisEintrag = (index) => {
        const updated = bestandsverzeichnis.filter((_, i) => i !== index);
        setBestandsverzeichnis(updated);
        onChange({
            ...grundbuch,
            bestandsverzeichnis: updated
        });
    };

    const updateBestandsverzeichnisEintrag = (index, field, value) => {
        const updated = [...bestandsverzeichnis];
        updated[index] = { ...updated[index], [field]: value };
        setBestandsverzeichnis(updated);
        onChange({
            ...grundbuch,
            bestandsverzeichnis: updated
        });
    };

    return (
        <div className="space-y-4">
            <Accordion type="multiple" className="space-y-2">
                {/* Deckblatt */}
                <AccordionItem value="deckblatt" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-600" />
                            <span className="font-medium">Deckblatt</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs">Datum (Erstellung/Änderung)</Label>
                                <Input
                                    type="date"
                                    value={grundbuch?.deckblatt?.datum || ''}
                                    onChange={(e) => updateDeckblatt('datum', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Zuständiges Amtsgericht</Label>
                                <Input
                                    value={grundbuch?.deckblatt?.amtsgericht || ''}
                                    onChange={(e) => updateDeckblatt('amtsgericht', e.target.value)}
                                    placeholder="z.B. Amtsgericht Berlin"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Grundbuchbezirk</Label>
                                <Input
                                    value={grundbuch?.deckblatt?.grundbuchbezirk || ''}
                                    onChange={(e) => updateDeckblatt('grundbuchbezirk', e.target.value)}
                                    placeholder="z.B. Mitte"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Band-Nummer</Label>
                                <Input
                                    value={grundbuch?.deckblatt?.band_nummer || ''}
                                    onChange={(e) => updateDeckblatt('band_nummer', e.target.value)}
                                    placeholder="z.B. 123"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Blatt-Nummer</Label>
                                <Input
                                    value={grundbuch?.deckblatt?.blatt_nummer || ''}
                                    onChange={(e) => updateDeckblatt('blatt_nummer', e.target.value)}
                                    placeholder="z.B. 456"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Gemeinde</Label>
                                <Input
                                    value={grundbuch?.deckblatt?.gemeinde || ''}
                                    onChange={(e) => updateDeckblatt('gemeinde', e.target.value)}
                                    placeholder="z.B. Berlin"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Flur</Label>
                                <Input
                                    value={grundbuch?.deckblatt?.flur || ''}
                                    onChange={(e) => updateDeckblatt('flur', e.target.value)}
                                    placeholder="z.B. 001"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Flurstück</Label>
                                <Input
                                    value={grundbuch?.deckblatt?.flurstueck || ''}
                                    onChange={(e) => updateDeckblatt('flurstueck', e.target.value)}
                                    placeholder="z.B. 123/45"
                                />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Bestandsverzeichnis */}
                <AccordionItem value="bestandsverzeichnis" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-600" />
                            <span className="font-medium">Bestandsverzeichnis</span>
                            {bestandsverzeichnis.length > 0 && (
                                <span className="text-xs text-slate-500">({bestandsverzeichnis.length})</span>
                            )}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-3">
                        {bestandsverzeichnis.map((eintrag, index) => (
                            <Card key={index} className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-xs">Lfd. Nr.</Label>
                                            <Input
                                                value={eintrag.lfd_nr_bestand || ''}
                                                onChange={(e) => updateBestandsverzeichnisEintrag(index, 'lfd_nr_bestand', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Gemarkung</Label>
                                            <Input
                                                value={eintrag.gemarkung || ''}
                                                onChange={(e) => updateBestandsverzeichnisEintrag(index, 'gemarkung', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Flur</Label>
                                            <Input
                                                value={eintrag.flur || ''}
                                                onChange={(e) => updateBestandsverzeichnisEintrag(index, 'flur', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Flurstück-Nummer</Label>
                                            <Input
                                                value={eintrag.flurstueck_nummer || ''}
                                                onChange={(e) => updateBestandsverzeichnisEintrag(index, 'flurstueck_nummer', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Flurstück-Nenner</Label>
                                            <Input
                                                value={eintrag.flurstueck_nenner || ''}
                                                onChange={(e) => updateBestandsverzeichnisEintrag(index, 'flurstueck_nenner', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Größe (qm)</Label>
                                            <Input
                                                type="number"
                                                value={eintrag.groesse_qm || ''}
                                                onChange={(e) => updateBestandsverzeichnisEintrag(index, 'groesse_qm', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Nutzungsart</Label>
                                            <Input
                                                value={eintrag.nutzungsart || ''}
                                                onChange={(e) => updateBestandsverzeichnisEintrag(index, 'nutzungsart', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Wirtschaftsart</Label>
                                            <Input
                                                value={eintrag.wirtschaftsart || ''}
                                                onChange={(e) => updateBestandsverzeichnisEintrag(index, 'wirtschaftsart', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Lage - Straße</Label>
                                            <Input
                                                value={eintrag.lage_strasse || ''}
                                                onChange={(e) => updateBestandsverzeichnisEintrag(index, 'lage_strasse', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Lage - Hausnummer</Label>
                                            <Input
                                                value={eintrag.lage_hausnummer || ''}
                                                onChange={(e) => updateBestandsverzeichnisEintrag(index, 'lage_hausnummer', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeBestandsverzeichnisEintrag(index)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addBestandsverzeichnisEintrag}
                            className="w-full"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Eintrag hinzufügen
                        </Button>
                    </AccordionContent>
                </AccordionItem>

                {/* Abteilung 1 - Eigentümer */}
                <AccordionItem value="abteilung1" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-600" />
                            <span className="font-medium">Abteilung 1 - Eigentümer</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs">Name</Label>
                                <Input
                                    value={grundbuch?.abteilung1?.eigentuemer_name || ''}
                                    onChange={(e) => updateAbteilung1('eigentuemer_name', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Vorname</Label>
                                <Input
                                    value={grundbuch?.abteilung1?.eigentuemer_vorname || ''}
                                    onChange={(e) => updateAbteilung1('eigentuemer_vorname', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Geburtsdatum</Label>
                                <Input
                                    type="date"
                                    value={grundbuch?.abteilung1?.eigentuemer_geburtsdatum || ''}
                                    onChange={(e) => updateAbteilung1('eigentuemer_geburtsdatum', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Wohnort</Label>
                                <Input
                                    value={grundbuch?.abteilung1?.eigentuemer_wohnort || ''}
                                    onChange={(e) => updateAbteilung1('eigentuemer_wohnort', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Anteil</Label>
                                <Input
                                    value={grundbuch?.abteilung1?.eigentuemer_anteil || ''}
                                    onChange={(e) => updateAbteilung1('eigentuemer_anteil', e.target.value)}
                                    placeholder="z.B. 1/1"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Erwerbsgrund</Label>
                                <Input
                                    value={grundbuch?.abteilung1?.erwerbsgrund || ''}
                                    onChange={(e) => updateAbteilung1('erwerbsgrund', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Erwerbsdatum</Label>
                                <Input
                                    type="date"
                                    value={grundbuch?.abteilung1?.erwerbsdatum || ''}
                                    onChange={(e) => updateAbteilung1('erwerbsdatum', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Vorheriger Eigentümer</Label>
                                <Input
                                    value={grundbuch?.abteilung1?.vorheriger_eigentuemer || ''}
                                    onChange={(e) => updateAbteilung1('vorheriger_eigentuemer', e.target.value)}
                                />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Abteilung 2 - Belastungen */}
                <AccordionItem value="abteilung2" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-600" />
                            <span className="font-medium">Abteilung 2 - Belastungen/Beschränkungen</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs">Wegerecht Berechtigter</Label>
                                <Input
                                    value={grundbuch?.abteilung2?.wegerecht_berechtigter || ''}
                                    onChange={(e) => updateAbteilung2('wegerecht_berechtigter', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Wegerecht Beschreibung</Label>
                                <Textarea
                                    value={grundbuch?.abteilung2?.wegerecht_beschreibung || ''}
                                    onChange={(e) => updateAbteilung2('wegerecht_beschreibung', e.target.value)}
                                    rows={2}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Nießbrauch Berechtigter</Label>
                                <Input
                                    value={grundbuch?.abteilung2?.niessbrauch_berechtigter || ''}
                                    onChange={(e) => updateAbteilung2('niessbrauch_berechtigter', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Nießbrauch Beschreibung</Label>
                                <Textarea
                                    value={grundbuch?.abteilung2?.niessbrauch_beschreibung || ''}
                                    onChange={(e) => updateAbteilung2('niessbrauch_beschreibung', e.target.value)}
                                    rows={2}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Erbbaurecht Berechtigter</Label>
                                <Input
                                    value={grundbuch?.abteilung2?.erbbaurecht_berechtigter || ''}
                                    onChange={(e) => updateAbteilung2('erbbaurecht_berechtigter', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Erbbaurecht bis Datum</Label>
                                <Input
                                    type="date"
                                    value={grundbuch?.abteilung2?.erbbaurecht_bis_datum || ''}
                                    onChange={(e) => updateAbteilung2('erbbaurecht_bis_datum', e.target.value)}
                                />
                            </div>
                            <div className="col-span-2">
                                <Label className="text-xs">Sonstige Belastungen</Label>
                                <Textarea
                                    value={grundbuch?.abteilung2?.sonstige_belastungen || ''}
                                    onChange={(e) => updateAbteilung2('sonstige_belastungen', e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Abteilung 3 - Grundschulden */}
                <AccordionItem value="abteilung3" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-600" />
                            <span className="font-medium">Abteilung 3 - Grundschulden/Hypotheken</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs">Gläubiger</Label>
                                <Input
                                    value={grundbuch?.abteilung3?.grundschuld_glaeubiger || ''}
                                    onChange={(e) => updateAbteilung3('grundschuld_glaeubiger', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Betrag (€)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={grundbuch?.abteilung3?.grundschuld_betrag || ''}
                                    onChange={(e) => updateAbteilung3('grundschuld_betrag', parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Zinssatz (%)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={grundbuch?.abteilung3?.grundschuld_zinssatz || ''}
                                    onChange={(e) => updateAbteilung3('grundschuld_zinssatz', parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Datum</Label>
                                <Input
                                    type="date"
                                    value={grundbuch?.abteilung3?.grundschuld_datum || ''}
                                    onChange={(e) => updateAbteilung3('grundschuld_datum', e.target.value)}
                                />
                            </div>
                            <div className="col-span-2">
                                <Label className="text-xs">Hypothek Details</Label>
                                <Textarea
                                    value={grundbuch?.abteilung3?.hypothek_details || ''}
                                    onChange={(e) => updateAbteilung3('hypothek_details', e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Kataster/Flurkarten-Stammdaten */}
                <AccordionItem value="kataster" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-600" />
                            <span className="font-medium">Kataster/Flurkarten-Stammdaten</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs">Gemeinde</Label>
                                <Input
                                    value={grundbuch?.kataster_stammdaten?.kataster_gemeinde || ''}
                                    onChange={(e) => updateKataster('kataster_gemeinde', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Gemarkung</Label>
                                <Input
                                    value={grundbuch?.kataster_stammdaten?.kataster_gemarkung || ''}
                                    onChange={(e) => updateKataster('kataster_gemarkung', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Flur</Label>
                                <Input
                                    value={grundbuch?.kataster_stammdaten?.kataster_flur || ''}
                                    onChange={(e) => updateKataster('kataster_flur', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Flurstück</Label>
                                <Input
                                    value={grundbuch?.kataster_stammdaten?.kataster_flurstueck || ''}
                                    onChange={(e) => updateKataster('kataster_flurstueck', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Nenner</Label>
                                <Input
                                    value={grundbuch?.kataster_stammdaten?.kataster_nenner || ''}
                                    onChange={(e) => updateKataster('kataster_nenner', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Vermessungsbezirk</Label>
                                <Input
                                    value={grundbuch?.kataster_stammdaten?.vermessungsbezirk || ''}
                                    onChange={(e) => updateKataster('vermessungsbezirk', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Koordinaten Rechtswert</Label>
                                <Input
                                    value={grundbuch?.kataster_stammdaten?.koordinaten_rechtswert || ''}
                                    onChange={(e) => updateKataster('koordinaten_rechtswert', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Koordinaten Hochwert</Label>
                                <Input
                                    value={grundbuch?.kataster_stammdaten?.koordinaten_hochwert || ''}
                                    onChange={(e) => updateKataster('koordinaten_hochwert', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Anzahl Grenzpunkte</Label>
                                <Input
                                    type="number"
                                    value={grundbuch?.kataster_stammdaten?.grenzpunkte_anzahl || ''}
                                    onChange={(e) => updateKataster('grenzpunkte_anzahl', parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Bodenart</Label>
                                <Input
                                    value={grundbuch?.kataster_stammdaten?.bodenart || ''}
                                    onChange={(e) => updateKataster('bodenart', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Nachbar-Flurstück Nord</Label>
                                <Input
                                    value={grundbuch?.kataster_stammdaten?.nachbar_flurstueck_nord || ''}
                                    onChange={(e) => updateKataster('nachbar_flurstueck_nord', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Nachbar-Flurstück Süd</Label>
                                <Input
                                    value={grundbuch?.kataster_stammdaten?.nachbar_flurstueck_sued || ''}
                                    onChange={(e) => updateKataster('nachbar_flurstueck_sued', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Nachbar-Flurstück Ost</Label>
                                <Input
                                    value={grundbuch?.kataster_stammdaten?.nachbar_flurstueck_ost || ''}
                                    onChange={(e) => updateKataster('nachbar_flurstueck_ost', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Nachbar-Flurstück West</Label>
                                <Input
                                    value={grundbuch?.kataster_stammdaten?.nachbar_flurstueck_west || ''}
                                    onChange={(e) => updateKataster('nachbar_flurstueck_west', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Angrenzende Straßen</Label>
                                <Input
                                    value={grundbuch?.kataster_stammdaten?.strassen_angrenzend || ''}
                                    onChange={(e) => updateKataster('strassen_angrenzend', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Angrenzende Gewässer</Label>
                                <Input
                                    value={grundbuch?.kataster_stammdaten?.gewaesser_angrenzend || ''}
                                    onChange={(e) => updateKataster('gewaesser_angrenzend', e.target.value)}
                                />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}