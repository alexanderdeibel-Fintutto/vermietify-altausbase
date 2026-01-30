import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader, AlertTriangle, CheckCircle, Download, ExternalLink, Calendar, Users, DollarSign, Bell, Plus, Edit } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const CONTRACT_TYPE_LABELS = {
    lease: 'Mietvertrag',
    employment: 'Arbeitsvertrag',
    service: 'Servicevertrag',
    purchase: 'Kaufvertrag',
    partnership: 'Partnerschaftsvertrag',
    other: 'Sonstiges'
};

const RISK_COLORS = {
    low: 'bg-green-100 text-green-800 border-green-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    high: 'bg-red-100 text-red-800 border-red-300'
};

export default function ContractAnalysisDetail({ analysisId }) {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);
    const [newReminder, setNewReminder] = useState({ reminder_date: '', reminder_text: '' });
    const [addingReminder, setAddingReminder] = useState(false);
    const [generatingTasks, setGeneratingTasks] = useState(false);

    useEffect(() => {
        loadAnalysis();
        
        // Subscribe to updates
        const unsubscribe = base44.entities.ContractAnalysis.subscribe((event) => {
            if (event.id === analysisId) {
                setAnalysis(event.data);
            }
        });

        return unsubscribe;
    }, [analysisId]);

    async function loadAnalysis() {
        try {
            const data = await base44.entities.ContractAnalysis.list(undefined, 1, { id: analysisId });
            if (data && data.length > 0) {
                setAnalysis(data[0]);
                setNotes(data[0].notes || '');
            }
        } catch (error) {
            console.error('Failed to load analysis:', error);
        } finally {
            setLoading(false);
        }
    }

    async function saveNotes() {
        setSavingNotes(true);
        try {
            await base44.entities.ContractAnalysis.update(analysisId, { notes });
            toast.success('Notizen gespeichert');
        } catch (error) {
            toast.error('Fehler beim Speichern');
        } finally {
            setSavingNotes(false);
        }
    }

    async function addReminder() {
        if (!newReminder.reminder_date || !newReminder.reminder_text) {
            toast.error('Bitte Datum und Text eingeben');
            return;
        }

        setAddingReminder(true);
        try {
            const currentReminders = analysis.custom_reminders || [];
            await base44.entities.ContractAnalysis.update(analysisId, {
                custom_reminders: [
                    ...currentReminders,
                    { ...newReminder, completed: false }
                ]
            });
            setNewReminder({ reminder_date: '', reminder_text: '' });
            toast.success('Erinnerung hinzugefügt');
        } catch (error) {
            toast.error('Fehler beim Hinzufügen');
        } finally {
            setAddingReminder(false);
        }
    }

    async function generateTasks() {
        setGeneratingTasks(true);
        try {
            const { tasks_created } = await base44.functions.invoke('generateContractTasks', {
                analysis_id: analysisId
            });
            toast.success(`${tasks_created} Task(s) erstellt`);
        } catch (error) {
            toast.error('Fehler beim Generieren der Tasks');
        } finally {
            setGeneratingTasks(false);
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader className="w-6 h-6 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-600">Lädt...</span>
                </CardContent>
            </Card>
        );
    }

    if (!analysis) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-gray-500">
                    Analyse nicht gefunden
                </CardContent>
            </Card>
        );
    }

    if (analysis.analysis_status === 'analyzing') {
        return (
            <Card className="bg-blue-50">
                <CardContent className="flex items-center justify-center py-12">
                    <Loader className="w-6 h-6 animate-spin text-blue-500" />
                    <span className="ml-2 text-blue-700 font-medium">Dokument wird analysiert...</span>
                </CardContent>
            </Card>
        );
    }

    if (analysis.analysis_status === 'failed') {
        return (
            <Card className="bg-red-50">
                <CardContent className="py-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-red-900">Analyse fehlgeschlagen</p>
                            <p className="text-sm text-red-700 mt-1">{analysis.analysis_error}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>{analysis.document_name}</CardTitle>
                            <div className="flex gap-2 mt-2">
                                <Badge>{CONTRACT_TYPE_LABELS[analysis.contract_type]}</Badge>
                                <Badge variant="outline">{analysis.file_format.toUpperCase()}</Badge>
                                {analysis.is_expiring_soon && (
                                    <Badge className="bg-orange-100 text-orange-800">
                                        ⚠️ Endet bald
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={generateTasks}
                                disabled={generatingTasks || analysis.auto_generated_tasks?.length > 0}
                            >
                                <Bell className="w-4 h-4 mr-2" />
                                {generatingTasks ? 'Generiere...' : 
                                 analysis.auto_generated_tasks?.length > 0 ? 'Tasks erstellt' : 'Tasks generieren'}
                            </Button>
                            <a href={analysis.file_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm">
                                    <Download className="w-4 h-4 mr-2" />
                                    Herunterladen
                                </Button>
                            </a>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* AI Summary */}
                    {analysis.ai_summary && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-blue-900 mb-2">KI-Zusammenfassung</h4>
                            <p className="text-sm text-gray-700">{analysis.ai_summary}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Risk Assessment */}
            {analysis.risk_score !== undefined && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Risikobewertung</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${
                                            analysis.risk_score < 30 ? 'bg-green-500' :
                                            analysis.risk_score < 70 ? 'bg-yellow-500' :
                                            'bg-red-500'
                                        }`}
                                        style={{ width: `${analysis.risk_score}%` }}
                                    />
                                </div>
                            </div>
                            <span className="font-bold text-2xl">{analysis.risk_score}/100</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Key Information Grid */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Parties */}
                {analysis.parties && analysis.parties.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Users className="w-4 h-4" />
                                Vertragsparteien
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-1">
                                {analysis.parties.map((party, i) => (
                                    <li key={i} className="text-sm text-gray-700">• {party}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {/* Duration & Termination */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Calendar className="w-4 h-4" />
                            Laufzeit & Kündigung
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {analysis.contract_start_date && (
                            <div className="text-sm">
                                <span className="font-medium">Start:</span> {new Date(analysis.contract_start_date).toLocaleDateString('de-DE')}
                            </div>
                        )}
                        {analysis.contract_end_date && (
                            <div className="text-sm">
                                <span className="font-medium">Ende:</span> {new Date(analysis.contract_end_date).toLocaleDateString('de-DE')}
                                {analysis.days_until_expiry !== null && analysis.days_until_expiry >= 0 && (
                                    <Badge variant="outline" className="ml-2">
                                        in {analysis.days_until_expiry} Tagen
                                    </Badge>
                                )}
                            </div>
                        )}
                        {analysis.duration_months && (
                            <div className="text-sm">
                                <span className="font-medium">Laufzeit:</span> {analysis.duration_months} Monate
                            </div>
                        )}
                        {analysis.termination_notice_period && (
                            <div className="text-sm">
                                <span className="font-medium">Kündigungsfrist:</span> {analysis.termination_notice_period}
                            </div>
                        )}
                        {analysis.auto_renewal !== undefined && (
                            <div className="text-sm">
                                <span className="font-medium">Automatische Verlängerung:</span>{' '}
                                {analysis.auto_renewal ? (
                                    <Badge className="bg-orange-100 text-orange-800 ml-2">
                                        Ja {analysis.renewal_period && `(${analysis.renewal_period})`}
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="ml-2">Nein</Badge>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Payment Terms */}
            {analysis.payment_terms && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <DollarSign className="w-4 h-4" />
                            Zahlungsbedingungen
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {analysis.payment_terms.amount && (
                            <div className="text-sm">
                                <span className="font-medium">Betrag:</span>{' '}
                                {analysis.payment_terms.amount.toLocaleString('de-DE')} {analysis.payment_terms.currency || 'EUR'}
                            </div>
                        )}
                        {analysis.payment_terms.frequency && (
                            <div className="text-sm">
                                <span className="font-medium">Häufigkeit:</span> {analysis.payment_terms.frequency}
                            </div>
                        )}
                        {analysis.payment_terms.payment_method && (
                            <div className="text-sm">
                                <span className="font-medium">Zahlungsart:</span> {analysis.payment_terms.payment_method}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Key Clauses */}
            {analysis.key_clauses && analysis.key_clauses.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Wichtige Klauseln</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {analysis.key_clauses.map((clause, i) => (
                                <div key={i} className="p-3 border rounded-lg">
                                    <div className="flex items-start justify-between">
                                        <h5 className="font-semibold text-sm">{clause.clause_name}</h5>
                                        <Badge variant="outline" className="text-xs">
                                            {clause.importance}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{clause.description}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Risk Clauses */}
            {analysis.risk_clauses && analysis.risk_clauses.length > 0 && (
                <Card className="border-red-200">
                    <CardHeader className="bg-red-50">
                        <CardTitle className="flex items-center gap-2 text-base text-red-900">
                            <AlertTriangle className="w-5 h-5" />
                            Risikoklauseln ({analysis.risk_clauses.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-3">
                            {analysis.risk_clauses.map((risk, i) => (
                                <div key={i} className={`p-4 border rounded-lg ${RISK_COLORS[risk.risk_level]}`}>
                                    <div className="flex items-start justify-between mb-2">
                                        <h5 className="font-semibold text-sm">{risk.clause}</h5>
                                        <Badge className={RISK_COLORS[risk.risk_level]}>
                                            {risk.risk_level.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <p className="text-sm opacity-90">
                                        <span className="font-medium">Empfehlung:</span> {risk.recommendation}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Special Conditions */}
            {analysis.special_conditions && analysis.special_conditions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Besondere Bedingungen</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {analysis.special_conditions.map((condition, i) => (
                                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                    {condition}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Keywords & Sentiment */}
            {(analysis.keywords || analysis.sentiment_label) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">KI-Analyse</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {analysis.keywords && analysis.keywords.length > 0 && (
                            <div>
                                <h5 className="text-xs font-semibold text-gray-600 mb-2">Schlüsselwörter:</h5>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.keywords.map((keyword, i) => (
                                        <Badge key={i} variant="outline">{keyword}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                        {analysis.sentiment_label && (
                            <div>
                                <h5 className="text-xs font-semibold text-gray-600 mb-2">Sentiment-Analyse:</h5>
                                <Badge className={
                                    analysis.sentiment_label === 'very_positive' || analysis.sentiment_label === 'positive' 
                                        ? 'bg-green-100 text-green-800' :
                                    analysis.sentiment_label === 'negative' || analysis.sentiment_label === 'very_negative'
                                        ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                }>
                                    {analysis.sentiment_label} {analysis.sentiment_score && `(${analysis.sentiment_score})`}
                                </Badge>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Custom Reminders */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Benutzerdefinierte Erinnerungen
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Existing Reminders */}
                    {analysis.custom_reminders && analysis.custom_reminders.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {analysis.custom_reminders.map((reminder, i) => (
                                <div key={i} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{reminder.reminder_text}</p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                📅 {new Date(reminder.reminder_date).toLocaleDateString('de-DE')}
                                            </p>
                                        </div>
                                        {reminder.completed && (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add New Reminder */}
                    <div className="space-y-3 pt-3 border-t">
                        <input
                            type="date"
                            value={newReminder.reminder_date}
                            onChange={(e) => setNewReminder({ ...newReminder, reminder_date: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md"
                        />
                        <Textarea
                            placeholder="Erinnerungstext..."
                            value={newReminder.reminder_text}
                            onChange={(e) => setNewReminder({ ...newReminder, reminder_text: e.target.value })}
                            rows={2}
                        />
                        <Button
                            onClick={addReminder}
                            disabled={addingReminder}
                            size="sm"
                            className="w-full"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Erinnerung hinzufügen
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Notes */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Edit className="w-4 h-4" />
                        Notizen
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Textarea
                        placeholder="Ihre Notizen zu diesem Vertrag..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                    />
                    <Button
                        onClick={saveNotes}
                        disabled={savingNotes}
                        size="sm"
                    >
                        {savingNotes ? 'Speichert...' : 'Notizen speichern'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}