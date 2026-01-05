import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, AlertTriangle, Plus } from 'lucide-react';

export default function FloorPlanGenerator({ building, onUpdateBuilding }) {
    const [aktivesGeschoss, setAktivesGeschoss] = useState('EG');
    const [validierung, setValidierung] = useState(null);
    const [fehlendeDaten, setFehlendeDaten] = useState([]);

    useEffect(() => {
        pruefeVollstaendigkeit();
    }, [building]);

    const pruefeVollstaendigkeit = () => {
        const fehler = [];
        const kubatur = building?.kubatur || {};
        const gebaeude = building?.gebaeude_data || [];
        const einheiten = building?.flaechen_einheiten || [];

        // Kubatur-Prüfung
        if (!kubatur.grundriss_laenge || kubatur.grundriss_laenge <= 0) {
            fehler.push({
                typ: 'kubatur',
                feld: 'grundriss_laenge',
                bezeichnung: 'Grundriss Länge (m)',
                hilfe: 'Außenmaß des Gebäudes in Längsrichtung'
            });
        }

        if (!kubatur.grundriss_breite || kubatur.grundriss_breite <= 0) {
            fehler.push({
                typ: 'kubatur',
                feld: 'grundriss_breite',
                bezeichnung: 'Grundriss Breite (m)',
                hilfe: 'Außenmaß des Gebäudes in Querrichtung'
            });
        }

        if (!kubatur.anzahl_vollgeschosse || kubatur.anzahl_vollgeschosse <= 0) {
            fehler.push({
                typ: 'kubatur',
                feld: 'anzahl_vollgeschosse',
                bezeichnung: 'Anzahl Vollgeschosse',
                hilfe: 'Ohne Keller und Dachgeschoss'
            });
        }

        // Gebäude-Prüfung
        if (!gebaeude || gebaeude.length === 0) {
            fehler.push({
                typ: 'gebaeude',
                bezeichnung: 'Mindestens ein Gebäude/Aufgang erforderlich',
                hilfe: 'Bitte legen Sie zunächst Gebäude oder Aufgänge an'
            });
        }

        // Einheiten-Prüfung
        if (!einheiten || einheiten.length === 0) {
            fehler.push({
                typ: 'einheiten',
                bezeichnung: 'Mindestens eine Wohneinheit erforderlich',
                hilfe: 'Bitte legen Sie zunächst Flächen/Einheiten an'
            });
        }

        setFehlendeDaten(fehler);
        setValidierung(fehler.length === 0 ? 'ok' : 'fehler');
    };

    const getGeschossName = (geschoss) => {
        const namen = {
            'KG': 'Keller',
            'EG': 'Erdgeschoss',
            '1': '1. OG',
            '2': '2. OG',
            '3': '3. OG',
            '4': '4. OG',
            '5': '5. OG'
        };
        return namen[geschoss] || `${geschoss}. OG`;
    };

    const getWohnungFarbe = (qm) => {
        if (qm < 40) return '#FFECB3';
        if (qm < 70) return '#C8E6C9';
        if (qm < 100) return '#BBDEFB';
        return '#F8BBD9';
    };

    const zeigeGrundriss = () => {
        const kubatur = building.kubatur;
        const gebaeude = building.gebaeude_data || [];
        const alleEinheiten = building.flaechen_einheiten || [];
        
        const geschossWohnungen = alleEinheiten.filter(w => String(w.etage) === String(aktivesGeschoss));

        const gebaeudeBreite = parseFloat(kubatur.grundriss_breite);
        const gebaeudelaenge = parseFloat(kubatur.grundriss_laenge);
        
        const containerBreite = 600;
        const containerHoehe = 400;
        const scale = Math.min(containerBreite / gebaeudelaenge, containerHoehe / gebaeudeBreite);
        
        const aufgangBreite = gebaeudelaenge / gebaeude.length;
        const flurBreite = gebaeudeBreite * 0.15;
        const wohnungsHoehe = gebaeudeBreite - flurBreite;
        const flurY = (gebaeudeBreite - flurBreite) / 2;

        return (
            <div style={{ width: `${containerBreite}px`, height: `${containerHoehe}px`, position: 'relative', border: '2px solid #333', background: '#fafafa' }}>
                {/* Flur */}
                <div style={{
                    position: 'absolute',
                    left: 0,
                    top: `${flurY * scale}px`,
                    width: `${gebaeudelaenge * scale}px`,
                    height: `${flurBreite * scale}px`,
                    background: '#f0f0f0',
                    border: '1px dashed #999',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: '#666',
                    fontSize: '12px'
                }}>
                    Flur / Treppenhaus
                </div>

                {/* Aufgänge und Wohnungen */}
                {gebaeude.map((aufgang, index) => {
                    const aufgangX = index * aufgangBreite;
                    const aufgangWohnungen = geschossWohnungen.filter(w => w.gebaeude_index === index);
                    
                    return (
                        <div key={index} style={{
                            position: 'absolute',
                            left: `${aufgangX * scale}px`,
                            top: 0,
                            width: `${aufgangBreite * scale}px`,
                            height: `${wohnungsHoehe * scale}px`,
                            border: '1px solid #666',
                            background: '#e3f2fd'
                        }}>
                            {aufgangWohnungen.length > 0 ? (
                                aufgangWohnungen.map((wohnung, wIndex) => {
                                    const wohnungBreite = aufgangBreite / aufgangWohnungen.length;
                                    const wohnungX = wIndex * wohnungBreite;
                                    const farbe = getWohnungFarbe(parseFloat(wohnung.qm));
                                    
                                    return (
                                        <div key={wIndex} style={{
                                            position: 'absolute',
                                            left: `${wohnungX * scale}px`,
                                            top: 0,
                                            width: `${wohnungBreite * scale}px`,
                                            height: `${wohnungsHoehe * scale}px`,
                                            backgroundColor: farbe,
                                            border: '1px solid #999',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            fontSize: '10px',
                                            textAlign: 'center'
                                        }}>
                                            <strong>{wohnung.bezeichnung || `W${wIndex + 1}`}</strong>
                                            <span>{wohnung.qm}m²</span>
                                        </div>
                                    );
                                })
                            ) : null}
                        </div>
                    );
                })}
            </div>
        );
    };

    const berechneFlaechen = () => {
        const kubatur = building.kubatur;
        const alleEinheiten = building.flaechen_einheiten || [];
        const geschossWohnungen = alleEinheiten.filter(w => String(w.etage) === String(aktivesGeschoss));
        
        const gesamtflaeche = parseFloat(kubatur.grundriss_breite) * parseFloat(kubatur.grundriss_laenge);
        const wohnflaeche = geschossWohnungen.reduce((sum, w) => sum + parseFloat(w.qm || 0), 0);
        const gemeinschaftsflaeche = gesamtflaeche - wohnflaeche;

        return {
            gesamtflaeche: gesamtflaeche.toFixed(1),
            wohnflaeche: wohnflaeche.toFixed(1),
            gemeinschaftsflaeche: gemeinschaftsflaeche.toFixed(1),
            auslastung: (wohnflaeche / gesamtflaeche * 100).toFixed(1),
            anzahl: geschossWohnungen.length
        };
    };

    if (validierung === 'fehler') {
        return (
            <div className="p-8 border-2 border-orange-300 rounded-lg bg-gradient-to-br from-orange-50 to-white">
                <div className="text-center mb-6">
                    <AlertCircle className="w-12 h-12 text-orange-600 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">📋 Grundriss-Generator: Daten vervollständigen</h3>
                    <p className="text-slate-600">Für die Erstellung des Grundrisses werden noch folgende Daten benötigt:</p>
                </div>

                <Card className="p-6 mb-6">
                    <div className="space-y-4">
                        {fehlendeDaten.map((fehler, index) => (
                            <div key={index} className="flex items-start gap-3 p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
                                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <div className="font-semibold text-slate-800">{fehler.bezeichnung}</div>
                                    {fehler.hilfe && (
                                        <div className="text-sm text-slate-600 mt-1">{fehler.hilfe}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="text-center">
                    <p className="text-sm text-slate-600 mb-4">
                        Bitte vervollständigen Sie die Gebäudedaten im entsprechenden Bereich oben.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            ↑ Zu den Gebäudedaten
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const geschosse = [...new Set((building.flaechen_einheiten || []).map(w => String(w.etage)))].sort();
    const flaechen = berechneFlaechen();

    return (
        <div className="space-y-6">
            {/* Erfolgsmeldung */}
            <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-emerald-800">Alle Daten vorhanden - Grundriss wird generiert</span>
            </div>

            {/* Geschoss-Tabs */}
            <div className="flex gap-2 flex-wrap">
                {geschosse.map(g => (
                    <Button
                        key={g}
                        variant={g === aktivesGeschoss ? "default" : "outline"}
                        onClick={() => setAktivesGeschoss(g)}
                        className={g === aktivesGeschoss ? "bg-blue-600" : ""}
                    >
                        {getGeschossName(g)}
                    </Button>
                ))}
            </div>

            {/* Grundriss-Anzeige */}
            <Card className="p-6">
                <h4 className="font-semibold text-slate-800 mb-4">Grundriss {getGeschossName(aktivesGeschoss)}</h4>
                <div className="flex justify-center mb-4">
                    {zeigeGrundriss()}
                </div>
            </Card>

            {/* Flächeninformationen */}
            <Card className="p-6 bg-slate-50">
                <h4 className="font-semibold text-slate-800 mb-4">Flächenverteilung {getGeschossName(aktivesGeschoss)}</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                        <div className="text-xs text-slate-500 mb-1">Geschoss-Gesamtfläche</div>
                        <div className="text-lg font-bold text-slate-800">{flaechen.gesamtflaeche} m²</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 mb-1">Wohnfläche gesamt</div>
                        <div className="text-lg font-bold text-emerald-600">{flaechen.wohnflaeche} m²</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 mb-1">Gemeinschaftsfläche</div>
                        <div className="text-lg font-bold text-slate-600">{flaechen.gemeinschaftsflaeche} m²</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 mb-1">Auslastung</div>
                        <div className="text-lg font-bold text-blue-600">{flaechen.auslastung}%</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 mb-1">Anzahl Wohnungen</div>
                        <div className="text-lg font-bold text-slate-800">{flaechen.anzahl}</div>
                    </div>
                </div>
            </Card>

            {/* Legende */}
            <Card className="p-4">
                <h4 className="font-semibold text-slate-800 mb-3">Farbcodierung</h4>
                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FFECB3' }}></div>
                        <span className="text-slate-600">Klein (&lt;40m²)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#C8E6C9' }}></div>
                        <span className="text-slate-600">Mittel (40-70m²)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#BBDEFB' }}></div>
                        <span className="text-slate-600">Groß (70-100m²)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F8BBD9' }}></div>
                        <span className="text-slate-600">Sehr groß (&gt;100m²)</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}