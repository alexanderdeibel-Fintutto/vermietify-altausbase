import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, AlertTriangle, Calendar, TrendingUp } from 'lucide-react';
import ContractUploadForm from '../components/documents/ContractUploadForm';
import ContractAnalysisDetail from '../components/documents/ContractAnalysisDetail';
import ExpiringContractsWidget from '../components/documents/ExpiringContractsWidget';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const CONTRACT_TYPE_LABELS = {
    lease: 'Mietvertrag',
    employment: 'Arbeitsvertrag',
    service: 'Servicevertrag',
    purchase: 'Kaufvertrag',
    partnership: 'Partnerschaftsvertrag',
    other: 'Sonstiges'
};

export default function ContractAnalysis() {
    const [analyses, setAnalyses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAnalysisId, setSelectedAnalysisId] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        expiring_soon: 0,
        high_risk: 0
    });

    useEffect(() => {
        loadAnalyses();

        // Subscribe to updates
        const unsubscribe = base44.entities.ContractAnalysis.subscribe((event) => {
            if (event.type === 'create') {
                setAnalyses(prev => [event.data, ...prev]);
            } else if (event.type === 'update') {
                setAnalyses(prev => prev.map(a => a.id === event.id ? event.data : a));
            } else if (event.type === 'delete') {
                setAnalyses(prev => prev.filter(a => a.id !== event.id));
            }
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        // Calculate stats
        const total = analyses.length;
        const expiring_soon = analyses.filter(a => a.is_expiring_soon).length;
        const high_risk = analyses.filter(a => a.risk_score >= 70).length;
        setStats({ total, expiring_soon, high_risk });
    }, [analyses]);

    async function loadAnalyses() {
        try {
            const data = await base44.entities.ContractAnalysis.list('-created_date', 50);
            setAnalyses(data || []);
        } catch (error) {
            console.error('Failed to load analyses:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleViewDetails = (id) => {
        setSelectedAnalysisId(id);
        setShowDetail(true);
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">KI-Vertragsanalyse</h1>
                <p className="text-gray-600 mt-1">Automatische Analyse und Überwachung Ihrer Verträge</p>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <span className="text-2xl font-bold">{stats.total}</span>
                        </div>
                        <p className="text-sm text-gray-600">Analysierte Verträge</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Calendar className="w-5 h-5 text-orange-600" />
                            <span className="text-2xl font-bold">{stats.expiring_soon}</span>
                        </div>
                        <p className="text-sm text-gray-600">Enden bald</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <span className="text-2xl font-bold">{stats.high_risk}</span>
                        </div>
                        <p className="text-sm text-gray-600">Hohes Risiko</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Upload Form */}
                <div className="lg:col-span-1">
                    <ContractUploadForm onUploadComplete={loadAnalyses} />
                </div>

                {/* Expiring Contracts */}
                <div className="lg:col-span-2">
                    <ExpiringContractsWidget 
                        limit={5} 
                        onViewDetails={handleViewDetails}
                    />
                </div>
            </div>

            {/* Recent Analyses */}
            <Card>
                <CardHeader>
                    <CardTitle>Alle Analysen</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Lädt...</div>
                    ) : analyses.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            Noch keine Verträge analysiert
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {analyses.map(analysis => (
                                <div
                                    key={analysis.id}
                                    className="p-4 border rounded-lg hover:bg-gray-50 transition cursor-pointer"
                                    onClick={() => handleViewDetails(analysis.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-semibold">{analysis.document_name}</h4>
                                                {analysis.analysis_status === 'analyzing' && (
                                                    <Badge className="bg-blue-100 text-blue-800">
                                                        Analysiert...
                                                    </Badge>
                                                )}
                                                {analysis.is_expiring_soon && (
                                                    <Badge className="bg-orange-100 text-orange-800">
                                                        ⚠️ Endet bald
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                                <Badge variant="outline">
                                                    {CONTRACT_TYPE_LABELS[analysis.contract_type]}
                                                </Badge>
                                                {analysis.contract_end_date && (
                                                    <span>
                                                        Endet: {new Date(analysis.contract_end_date).toLocaleDateString('de-DE')}
                                                    </span>
                                                )}
                                                {analysis.risk_score !== undefined && (
                                                    <Badge className={
                                                        analysis.risk_score >= 70 ? 'bg-red-100 text-red-800' :
                                                        analysis.risk_score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                                    }>
                                                        Risiko: {analysis.risk_score}
                                                    </Badge>
                                                )}
                                            </div>
                                            {analysis.risk_clauses && analysis.risk_clauses.length > 0 && (
                                                <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    {analysis.risk_clauses.length} Risikoklausel(n) erkannt
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    {selectedAnalysisId && (
                        <ContractAnalysisDetail analysisId={selectedAnalysisId} />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}