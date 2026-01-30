import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader, AlertTriangle, CheckCircle, Download, ExternalLink } from 'lucide-react';

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
            }
        } catch (error) {
            console.error('Failed to load analysis:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader className="w-6 h-6 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-600">Analyse läuft...</span>
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
                            <Car