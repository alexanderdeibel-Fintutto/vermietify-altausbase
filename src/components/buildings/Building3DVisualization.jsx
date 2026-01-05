import React from 'react';
import { Card } from '@/components/ui/card';
import { Box, Maximize } from 'lucide-react';

export default function Building3DVisualization({ kubatur }) {
    if (!kubatur?.grundriss_laenge || !kubatur?.grundriss_breite) {
        return (
            <div className="w-full h-64 bg-slate-100 rounded-lg flex items-center justify-center">
                <p className="text-slate-500">Geben Sie Grundriss-Maße ein für 3D-Ansicht</p>
            </div>
        );
    }
    
    const length = kubatur.grundriss_laenge || 0;
    const width = kubatur.grundriss_breite || 0;
    const floors = kubatur.anzahl_vollgeschosse || 0;
    const hasBasement = kubatur.kellergeschoss;
    const hasAttic = kubatur.dachgeschoss_ausgebaut;
    
    return (
        <Card className="w-full p-6 bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Box className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                    <h4 className="font-semibold text-slate-800">Gebäude-Übersicht</h4>
                    <p className="text-sm text-slate-500">Schematische Darstellung</p>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Grundfläche</span>
                        <span className="font-semibold text-slate-800">{length} × {width} m</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Vollgeschosse</span>
                        <span className="font-semibold text-slate-800">{floors}</span>
                    </div>
                    {kubatur.geschosshoehe_standard && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Geschosshöhe</span>
                            <span className="font-semibold text-slate-800">{kubatur.geschosshoehe_standard} m</span>
                        </div>
                    )}
                </div>
                
                <div className="space-y-3">
                    {hasBasement && (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span className="text-sm text-slate-600">Kellergeschoss vorhanden</span>
                        </div>
                    )}
                    {hasAttic && (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span className="text-sm text-slate-600">Dachgeschoss ausgebaut</span>
                        </div>
                    )}
                    {kubatur.dachform && (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                            <span className="text-sm text-slate-600">Dachform: {kubatur.dachform}</span>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Visual representation */}
            <div className="mt-6 flex items-end justify-center gap-2 h-32">
                {hasBasement && (
                    <div className="w-16 h-6 bg-slate-400 rounded-b-lg"></div>
                )}
                <div className="flex flex-col items-center gap-0.5">
                    {[...Array(floors)].map((_, i) => (
                        <div 
                            key={i} 
                            className="w-24 h-8 bg-emerald-200 border-2 border-emerald-300 flex items-center justify-center"
                        >
                            <span className="text-xs text-emerald-700 font-medium">{floors - i}. OG</span>
                        </div>
                    ))}
                    {hasAttic && (
                        <div className="w-0 h-0 border-l-[48px] border-l-transparent border-r-[48px] border-r-transparent border-b-[24px] border-b-amber-300"></div>
                    )}
                </div>
            </div>
        </Card>
    );
}