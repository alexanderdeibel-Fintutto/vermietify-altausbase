import React from 'react';

export default function Building3DVisualization({ kubatur }) {
    if (!kubatur?.grundriss_laenge || !kubatur?.grundriss_breite) {
        return (
            <div className="w-full h-64 bg-slate-100 rounded-lg flex items-center justify-center">
                <p className="text-slate-500">Geben Sie Grundriss-Maße ein für 3D-Ansicht</p>
            </div>
        );
    }
    
    const length = kubatur.grundriss_laenge || 10;
    const width = kubatur.grundriss_breite || 10;
    const floors = kubatur.anzahl_vollgeschosse || 2;
    const floorHeight = kubatur.geschosshoehe_standard || 2.5;
    const hasBasement = kubatur.kellergeschoss;
    const hasAttic = kubatur.dachgeschoss_ausgebaut;
    const roofType = kubatur.dachform?.toLowerCase() || 'sattel';
    const roofAngle = kubatur.dachneigung_grad || 35;
    
    // Skalierung für die Darstellung
    const scale = 8;
    const isoAngle = Math.PI / 6; // 30 Grad für isometrische Projektion
    
    // Isometrische Transformation
    const toIso = (x, y, z) => {
        const isoX = (x - y) * Math.cos(isoAngle) * scale;
        const isoY = (x + y) * Math.sin(isoAngle) * scale - z * scale;
        return { x: isoX, y: isoY };
    };
    
    // Berechne SVG-Dimensionen
    const totalHeight = (hasBasement ? 2.5 : 0) + floors * floorHeight + (hasAttic ? 3 : 0) + 5;
    const viewBoxWidth = 400;
    const viewBoxHeight = 300;
    const centerX = viewBoxWidth / 2;
    const centerY = viewBoxHeight / 2 + 40;
    
    // Gebäude-Eckpunkte
    const corners = {
        bottomFront: toIso(0, 0, 0),
        bottomBack: toIso(0, width, 0),
        bottomRight: toIso(length, 0, 0),
        bottomBackRight: toIso(length, width, 0),
    };
    
    // Höhe ohne Dach
    const buildingHeight = (hasBasement ? 2.5 : 0) + floors * floorHeight;
    
    return (
        <div className="w-full h-64 bg-gradient-to-br from-sky-100 via-slate-50 to-slate-100 rounded-lg overflow-hidden relative">
            <svg 
                viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} 
                className="w-full h-full"
                style={{ transform: 'scale(1.1)' }}
            >
                <defs>
                    {/* Schatten */}
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                        <feOffset dx="2" dy="4" result="offsetblur"/>
                        <feComponentTransfer>
                            <feFuncA type="linear" slope="0.3"/>
                        </feComponentTransfer>
                        <feMerge>
                            <feMergeNode/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    
                    {/* Fenster-Muster */}
                    <pattern id="windows" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <rect x="2" y="2" width="7" height="10" fill="#93c5fd" opacity="0.6"/>
                        <rect x="11" y="2" width="7" height="10" fill="#93c5fd" opacity="0.6"/>
                    </pattern>
                </defs>
                
                <g transform={`translate(${centerX}, ${centerY})`}>
                    {/* Bodenschatten */}
                    <ellipse 
                        cx="0" 
                        cy={-corners.bottomFront.y + 10} 
                        rx={Math.max(Math.abs(corners.bottomRight.x), Math.abs(corners.bottomBack.x)) + 10}
                        ry="20"
                        fill="#000000"
                        opacity="0.1"
                    />
                    
                    {/* Keller (falls vorhanden) */}
                    {hasBasement && (
                        <g>
                            {/* Vorderseite Keller */}
                            <path
                                d={`
                                    M ${corners.bottomFront.x},${-corners.bottomFront.y}
                                    L ${corners.bottomRight.x},${-corners.bottomRight.y}
                                    L ${toIso(length, 0, 2.5).x},${-toIso(length, 0, 2.5).y}
                                    L ${toIso(0, 0, 2.5).x},${-toIso(0, 0, 2.5).y}
                                    Z
                                `}
                                fill="#78716c"
                                stroke="#57534e"
                                strokeWidth="1"
                            />
                            
                            {/* Seitenfläche Keller */}
                            <path
                                d={`
                                    M ${corners.bottomRight.x},${-corners.bottomRight.y}
                                    L ${corners.bottomBackRight.x},${-corners.bottomBackRight.y}
                                    L ${toIso(length, width, 2.5).x},${-toIso(length, width, 2.5).y}
                                    L ${toIso(length, 0, 2.5).x},${-toIso(length, 0, 2.5).y}
                                    Z
                                `}
                                fill="#57534e"
                                stroke="#44403c"
                                strokeWidth="1"
                            />
                        </g>
                    )}
                    
                    {/* Hauptgebäude - Geschosse */}
                    {[...Array(floors)].map((_, i) => {
                        const z1 = (hasBasement ? 2.5 : 0) + i * floorHeight;
                        const z2 = z1 + floorHeight;
                        
                        return (
                            <g key={i}>
                                {/* Vorderseite */}
                                <path
                                    d={`
                                        M ${toIso(0, 0, z1).x},${-toIso(0, 0, z1).y}
                                        L ${toIso(length, 0, z1).x},${-toIso(length, 0, z1).y}
                                        L ${toIso(length, 0, z2).x},${-toIso(length, 0, z2).y}
                                        L ${toIso(0, 0, z2).x},${-toIso(0, 0, z2).y}
                                        Z
                                    `}
                                    fill="url(#windows)"
                                    stroke="#059669"
                                    strokeWidth="1.5"
                                    filter="url(#shadow)"
                                />
                                
                                {/* Seitenfläche */}
                                <path
                                    d={`
                                        M ${toIso(length, 0, z1).x},${-toIso(length, 0, z1).y}
                                        L ${toIso(length, width, z1).x},${-toIso(length, width, z1).y}
                                        L ${toIso(length, width, z2).x},${-toIso(length, width, z2).y}
                                        L ${toIso(length, 0, z2).x},${-toIso(length, 0, z2).y}
                                        Z
                                    `}
                                    fill="#d1fae5"
                                    stroke="#059669"
                                    strokeWidth="1.5"
                                />
                                
                                {/* Geschoss-Trennlinie */}
                                {i < floors - 1 && (
                                    <>
                                        <line
                                            x1={toIso(0, 0, z2).x}
                                            y1={-toIso(0, 0, z2).y}
                                            x2={toIso(length, 0, z2).x}
                                            y2={-toIso(length, 0, z2).y}
                                            stroke="#047857"
                                            strokeWidth="2"
                                        />
                                        <line
                                            x1={toIso(length, 0, z2).x}
                                            y1={-toIso(length, 0, z2).y}
                                            x2={toIso(length, width, z2).x}
                                            y2={-toIso(length, width, z2).y}
                                            stroke="#047857"
                                            strokeWidth="2"
                                        />
                                    </>
                                )}
                            </g>
                        );
                    })}
                    
                    {/* Dach */}
                    {roofType === 'sattel' && (
                        <g>
                            {/* Dachfläche vorne */}
                            <path
                                d={`
                                    M ${toIso(0, 0, buildingHeight).x},${-toIso(0, 0, buildingHeight).y}
                                    L ${toIso(length, 0, buildingHeight).x},${-toIso(length, 0, buildingHeight).y}
                                    L ${toIso(length / 2, 0, buildingHeight + 3).x},${-toIso(length / 2, 0, buildingHeight + 3).y}
                                    Z
                                `}
                                fill="#dc2626"
                                stroke="#991b1b"
                                strokeWidth="1.5"
                            />
                            
                            {/* Dachfläche hinten */}
                            <path
                                d={`
                                    M ${toIso(0, width, buildingHeight).x},${-toIso(0, width, buildingHeight).y}
                                    L ${toIso(length, width, buildingHeight).x},${-toIso(length, width, buildingHeight).y}
                                    L ${toIso(length / 2, width, buildingHeight + 3).x},${-toIso(length / 2, width, buildingHeight + 3).y}
                                    Z
                                `}
                                fill="#b91c1c"
                                stroke="#991b1b"
                                strokeWidth="1.5"
                            />
                            
                            {/* Dachfläche rechts */}
                            <path
                                d={`
                                    M ${toIso(length, 0, buildingHeight).x},${-toIso(length, 0, buildingHeight).y}
                                    L ${toIso(length, width, buildingHeight).x},${-toIso(length, width, buildingHeight).y}
                                    L ${toIso(length / 2, width, buildingHeight + 3).x},${-toIso(length / 2, width, buildingHeight + 3).y}
                                    L ${toIso(length / 2, 0, buildingHeight + 3).x},${-toIso(length / 2, 0, buildingHeight + 3).y}
                                    Z
                                `}
                                fill="#ef4444"
                                stroke="#991b1b"
                                strokeWidth="1.5"
                            />
                        </g>
                    )}
                    
                    {roofType === 'flach' && (
                        <g>
                            {/* Flachdach - Oberseite */}
                            <path
                                d={`
                                    M ${toIso(0, 0, buildingHeight).x},${-toIso(0, 0, buildingHeight).y}
                                    L ${toIso(length, 0, buildingHeight).x},${-toIso(length, 0, buildingHeight).y}
                                    L ${toIso(length, width, buildingHeight).x},${-toIso(length, width, buildingHeight).y}
                                    L ${toIso(0, width, buildingHeight).x},${-toIso(0, width, buildingHeight).y}
                                    Z
                                `}
                                fill="#64748b"
                                stroke="#475569"
                                strokeWidth="1.5"
                            />
                        </g>
                    )}
                    
                    {roofType === 'walm' && (
                        <g>
                            {/* Walmdach - 4 Seiten */}
                            <path
                                d={`
                                    M ${toIso(0, 0, buildingHeight).x},${-toIso(0, 0, buildingHeight).y}
                                    L ${toIso(length, 0, buildingHeight).x},${-toIso(length, 0, buildingHeight).y}
                                    L ${toIso(length / 2, width / 2, buildingHeight + 3).x},${-toIso(length / 2, width / 2, buildingHeight + 3).y}
                                    Z
                                `}
                                fill="#dc2626"
                                stroke="#991b1b"
                                strokeWidth="1.5"
                            />
                            <path
                                d={`
                                    M ${toIso(length, 0, buildingHeight).x},${-toIso(length, 0, buildingHeight).y}
                                    L ${toIso(length, width, buildingHeight).x},${-toIso(length, width, buildingHeight).y}
                                    L ${toIso(length / 2, width / 2, buildingHeight + 3).x},${-toIso(length / 2, width / 2, buildingHeight + 3).y}
                                    Z
                                `}
                                fill="#ef4444"
                                stroke="#991b1b"
                                strokeWidth="1.5"
                            />
                            <path
                                d={`
                                    M ${toIso(length, width, buildingHeight).x},${-toIso(length, width, buildingHeight).y}
                                    L ${toIso(0, width, buildingHeight).x},${-toIso(0, width, buildingHeight).y}
                                    L ${toIso(length / 2, width / 2, buildingHeight + 3).x},${-toIso(length / 2, width / 2, buildingHeight + 3).y}
                                    Z
                                `}
                                fill="#b91c1c"
                                stroke="#991b1b"
                                strokeWidth="1.5"
                            />
                        </g>
                    )}
                    
                    {/* Beschriftungen */}
                    <g className="text-xs">
                        <text 
                            x={toIso(length / 2, -1, 0).x} 
                            y={-toIso(length / 2, -1, 0).y + 5} 
                            textAnchor="middle"
                            fill="#475569"
                            fontSize="11"
                            fontWeight="600"
                        >
                            {length}m
                        </text>
                        <text 
                            x={toIso(length + 1, width / 2, 0).x} 
                            y={-toIso(length + 1, width / 2, 0).y + 5} 
                            textAnchor="middle"
                            fill="#475569"
                            fontSize="11"
                            fontWeight="600"
                        >
                            {width}m
                        </text>
                        <text 
                            x={toIso(-1.5, 0, buildingHeight / 2).x} 
                            y={-toIso(-1.5, 0, buildingHeight / 2).y + 5} 
                            textAnchor="end"
                            fill="#475569"
                            fontSize="11"
                            fontWeight="600"
                        >
                            {floors} {floors === 1 ? 'Geschoss' : 'Geschosse'}
                        </text>
                    </g>
                </g>
            </svg>
            
            {/* Legende */}
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs space-y-1 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-200 border border-emerald-600 rounded-sm"></div>
                    <span className="text-slate-700">Geschosse: {floors}</span>
                </div>
                {hasBasement && (
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-stone-500 rounded-sm"></div>
                        <span className="text-slate-700">Keller</span>
                    </div>
                )}
                {hasAttic && (
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-amber-200 rounded-sm"></div>
                        <span className="text-slate-700">DG ausgebaut</span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-600 rounded-sm"></div>
                    <span className="text-slate-700">Dach: {kubatur.dachform || 'Sattel'}</span>
                </div>
            </div>
        </div>
    );
}