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
    const basementHeight = 2.5;
    const hasAttic = kubatur.dachgeschoss_ausgebaut;
    const roofType = kubatur.dachform?.toLowerCase() || 'sattel';
    const roofAngle = kubatur.dachneigung_grad || 35;
    
    // Berechne Dachhöhe basierend auf Dachneigung
    const roofHeight = roofType === 'flach' ? 0.3 : (width / 2) * Math.tan((roofAngle * Math.PI) / 180);
    
    // Gesamthöhe berechnen
    const totalHeight = (hasBasement ? basementHeight : 0) + floors * floorHeight + roofHeight;
    
    // SVG Dimensionen
    const svgWidth = 600;
    const svgHeight = 400;
    const margin = 80;
    const buildingWidth = 200;
    const scale = Math.min((svgHeight - margin * 2) / totalHeight, buildingWidth / Math.max(length, width));
    
    // Startposition
    const startX = margin + 50;
    const startY = svgHeight - margin;
    
    return (
        <div className="w-full h-80 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg overflow-hidden relative border border-slate-200">
            <svg 
                viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                className="w-full h-full"
            >
                <defs>
                    <pattern id="brickPattern" x="0" y="0" width="30" height="15" patternUnits="userSpaceOnUse">
                        <rect width="30" height="15" fill="#f1f5f9"/>
                        <rect width="14" height="6" x="1" y="1" fill="#cbd5e1" opacity="0.3"/>
                        <rect width="14" height="6" x="15" y="8" fill="#cbd5e1" opacity="0.3"/>
                    </pattern>
                    
                    <pattern id="roofTiles" x="0" y="0" width="20" height="10" patternUnits="userSpaceOnUse">
                        <rect width="20" height="10" fill="#dc2626"/>
                        <line x1="0" y1="10" x2="20" y2="10" stroke="#7c2d12" strokeWidth="1"/>
                    </pattern>
                </defs>
                
                {/* Gebäude-Querschnitt */}
                <g>
                    {/* Keller */}
                    {hasBasement && (
                        <>
                            <rect
                                x={startX}
                                y={startY - basementHeight * scale}
                                width={buildingWidth}
                                height={basementHeight * scale}
                                fill="#78716c"
                                stroke="#44403c"
                                strokeWidth="2"
                            />
                            <text
                                x={startX - 15}
                                y={startY - basementHeight * scale / 2 + 5}
                                textAnchor="end"
                                fontSize="14"
                                fontWeight="600"
                                fill="#57534e"
                            >
                                KG
                            </text>
                            {/* Höhenmaß Keller */}
                            <line
                                x1={startX + buildingWidth + 20}
                                y1={startY}
                                x2={startX + buildingWidth + 20}
                                y2={startY - basementHeight * scale}
                                stroke="#64748b"
                                strokeWidth="1.5"
                                markerEnd="url(#arrowEnd)"
                                markerStart="url(#arrowStart)"
                            />
                            <text
                                x={startX + buildingWidth + 35}
                                y={startY - basementHeight * scale / 2 + 5}
                                fontSize="12"
                                fill="#475569"
                                fontWeight="500"
                            >
                                {basementHeight}m
                            </text>
                        </>
                    )}
                    
                    {/* Geschosse */}
                    {[...Array(floors)].map((_, i) => {
                        const floorY = startY - (hasBasement ? basementHeight * scale : 0) - (i + 1) * floorHeight * scale;
                        const isEG = i === 0;
                        
                        return (
                            <g key={i}>
                                <rect
                                    x={startX}
                                    y={floorY}
                                    width={buildingWidth}
                                    height={floorHeight * scale}
                                    fill="url(#brickPattern)"
                                    stroke="#10b981"
                                    strokeWidth="2.5"
                                />
                                
                                {/* Fenster */}
                                {[1, 2, 3, 4].map((windowNum) => (
                                    <rect
                                        key={windowNum}
                                        x={startX + (buildingWidth / 5) * windowNum - 10}
                                        y={floorY + floorHeight * scale * 0.25}
                                        width={20}
                                        height={floorHeight * scale * 0.5}
                                        fill="#bfdbfe"
                                        stroke="#3b82f6"
                                        strokeWidth="1.5"
                                        rx="2"
                                    />
                                ))}
                                
                                {/* Eingangstür nur im EG */}
                                {isEG && (
                                    <rect
                                        x={startX + 25}
                                        y={floorY + floorHeight * scale * 0.2}
                                        width={18}
                                        height={floorHeight * scale * 0.75}
                                        fill="#92400e"
                                        stroke="#78350f"
                                        strokeWidth="1.5"
                                        rx="1"
                                    />
                                )}
                                
                                {/* Geschoss-Label */}
                                <text
                                    x={startX - 15}
                                    y={floorY + floorHeight * scale / 2 + 5}
                                    textAnchor="end"
                                    fontSize="14"
                                    fontWeight="600"
                                    fill="#059669"
                                >
                                    {isEG ? 'EG' : `${i}.OG`}
                                </text>
                                
                                {/* Höhenmaß nur beim ersten Geschoss */}
                                {i === 0 && (
                                    <>
                                        <line
                                            x1={startX + buildingWidth + 20}
                                            y1={floorY + floorHeight * scale}
                                            x2={startX + buildingWidth + 20}
                                            y2={floorY}
                                            stroke="#64748b"
                                            strokeWidth="1.5"
                                            markerEnd="url(#arrowEnd)"
                                            markerStart="url(#arrowStart)"
                                        />
                                        <text
                                            x={startX + buildingWidth + 35}
                                            y={floorY + floorHeight * scale / 2 + 5}
                                            fontSize="12"
                                            fill="#475569"
                                            fontWeight="500"
                                        >
                                            {floorHeight}m
                                        </text>
                                    </>
                                )}
                                
                                {/* Geschosstrennung */}
                                {i < floors - 1 && (
                                    <line
                                        x1={startX}
                                        y1={floorY}
                                        x2={startX + buildingWidth}
                                        y2={floorY}
                                        stroke="#047857"
                                        strokeWidth="2"
                                    />
                                )}
                            </g>
                        );
                    })}
                    
                    {/* Dach */}
                    {roofType === 'sattel' && (
                        <>
                            {/* Dachfläche */}
                            <path
                                d={`
                                    M ${startX},${startY - (hasBasement ? basementHeight * scale : 0) - floors * floorHeight * scale}
                                    L ${startX + buildingWidth / 2},${startY - (hasBasement ? basementHeight * scale : 0) - floors * floorHeight * scale - roofHeight * scale}
                                    L ${startX + buildingWidth},${startY - (hasBasement ? basementHeight * scale : 0) - floors * floorHeight * scale}
                                    Z
                                `}
                                fill="url(#roofTiles)"
                                stroke="#7c2d12"
                                strokeWidth="2.5"
                            />
                            
                            {/* Dachgaube bei ausgebautem DG */}
                            {hasAttic && (
                                <g>
                                    <rect
                                        x={startX + buildingWidth * 0.35}
                                        y={startY - (hasBasement ? basementHeight * scale : 0) - floors * floorHeight * scale - roofHeight * scale * 0.4}
                                        width={buildingWidth * 0.15}
                                        height={roofHeight * scale * 0.3}
                                        fill="#f1f5f9"
                                        stroke="#64748b"
                                        strokeWidth="1.5"
                                    />
                                    <rect
                                        x={startX + buildingWidth * 0.37}
                                        y={startY - (hasBasement ? basementHeight * scale : 0) - floors * floorHeight * scale - roofHeight * scale * 0.38}
                                        width={buildingWidth * 0.11}
                                        height={roofHeight * scale * 0.25}
                                        fill="#bfdbfe"
                                        stroke="#3b82f6"
                                        strokeWidth="1"
                                        rx="1"
                                    />
                                </g>
                            )}
                            
                            {/* DG Label bei ausgebautem Dach */}
                            {hasAttic && (
                                <text
                                    x={startX - 15}
                                    y={startY - (hasBasement ? basementHeight * scale : 0) - floors * floorHeight * scale - roofHeight * scale * 0.3}
                                    textAnchor="end"
                                    fontSize="14"
                                    fontWeight="600"
                                    fill="#f59e0b"
                                >
                                    DG
                                </text>
                            )}
                        </>
                    )}
                    
                    {roofType === 'flach' && (
                        <rect
                            x={startX}
                            y={startY - (hasBasement ? basementHeight * scale : 0) - floors * floorHeight * scale - roofHeight * scale}
                            width={buildingWidth}
                            height={roofHeight * scale}
                            fill="#475569"
                            stroke="#334155"
                            strokeWidth="2.5"
                        />
                    )}
                    
                    {roofType === 'walm' && (
                        <path
                            d={`
                                M ${startX - 10},${startY - (hasBasement ? basementHeight * scale : 0) - floors * floorHeight * scale}
                                L ${startX + buildingWidth / 2},${startY - (hasBasement ? basementHeight * scale : 0) - floors * floorHeight * scale - roofHeight * scale}
                                L ${startX + buildingWidth + 10},${startY - (hasBasement ? basementHeight * scale : 0) - floors * floorHeight * scale}
                                Z
                            `}
                            fill="url(#roofTiles)"
                            stroke="#7c2d12"
                            strokeWidth="2.5"
                        />
                    )}
                    
                    {/* Gesamthöhen-Maß */}
                    <g>
                        <defs>
                            <marker id="arrowEnd" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                                <polygon points="0,2 5,5 0,8" fill="#475569"/>
                            </marker>
                            <marker id="arrowStart" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                                <polygon points="10,2 5,5 10,8" fill="#475569"/>
                            </marker>
                        </defs>
                        
                        <line
                            x1={startX + buildingWidth + 70}
                            y1={startY}
                            x2={startX + buildingWidth + 70}
                            y2={startY - totalHeight * scale}
                            stroke="#334155"
                            strokeWidth="2"
                            markerEnd="url(#arrowEnd)"
                            markerStart="url(#arrowStart)"
                        />
                        
                        <text
                            x={startX + buildingWidth + 90}
                            y={startY - (totalHeight * scale) / 2 + 5}
                            fontSize="16"
                            fill="#1e293b"
                            fontWeight="700"
                        >
                            {totalHeight.toFixed(1)}m
                        </text>
                    </g>
                    
                    {/* Bodenmarkierung */}
                    <line
                        x1={startX - 30}
                        y1={startY}
                        x2={startX + buildingWidth + 100}
                        y2={startY}
                        stroke="#94a3b8"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                    />
                    
                    {/* Grundriss-Breite Indikator (Tiefe des Gebäudes) */}
                    <g opacity="0.6">
                        <path
                            d={`
                                M ${startX + buildingWidth + 30},${startY - (hasBasement ? basementHeight * scale : 0) - 10}
                                L ${startX + buildingWidth + 60},${startY - (hasBasement ? basementHeight * scale : 0) - 30}
                                L ${startX + buildingWidth + 60},${startY - (hasBasement ? basementHeight * scale : 0) - floors * floorHeight * scale - 30}
                                L ${startX + buildingWidth + 30},${startY - (hasBasement ? basementHeight * scale : 0) - floors * floorHeight * scale - 10}
                                Z
                            `}
                            fill="#cbd5e1"
                            stroke="#94a3b8"
                            strokeWidth="1.5"
                        />
                    </g>
                </g>
                
                {/* Titel */}
                <text
                    x="20"
                    y="30"
                    fontSize="18"
                    fontWeight="700"
                    fill="#1e293b"
                >
                    Schnittansicht
                </text>
            </svg>
            
            {/* Legende */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 text-sm space-y-2 shadow-lg border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-emerald-500 rounded"></div>
                    <span className="text-slate-700 font-medium">Geschosse: {floors}</span>
                </div>
                {hasBasement && (
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-stone-500 border border-stone-700 rounded"></div>
                        <span className="text-slate-700">Kellergeschoss</span>
                    </div>
                )}
                {hasAttic && (
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-amber-100 border border-amber-400 rounded"></div>
                        <span className="text-slate-700">DG ausgebaut</span>
                    </div>
                )}
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gradient-to-br from-red-600 to-red-800 border border-red-900 rounded"></div>
                    <span className="text-slate-700">Dach: {kubatur.dachform || 'Sattel'}</span>
                </div>
                <div className="pt-2 mt-2 border-t border-slate-200 space-y-1">
                    <div className="flex justify-between gap-8">
                        <span className="text-slate-600">Grundfläche:</span>
                        <span className="font-semibold text-slate-800">{(length * width).toFixed(1)} m²</span>
                    </div>
                    <div className="flex justify-between gap-8">
                        <span className="text-slate-600">L × B:</span>
                        <span className="font-semibold text-slate-800">{length} × {width} m</span>
                    </div>
                </div>
            </div>
        </div>
    );
}