import React from 'react';

export default function Building3DVisualization({ kubatur }) {
    // Key zur Erzwingung von Re-Render bei Änderungen
    const vizKey = React.useMemo(() => {
        return JSON.stringify({
            l: kubatur?.grundriss_laenge,
            b: kubatur?.grundriss_breite,
            f: kubatur?.anzahl_vollgeschosse,
            fh: kubatur?.geschosshoehe_standard,
            kb: kubatur?.kellergeschoss,
            da: kubatur?.dachgeschoss_ausgebaut,
            df: kubatur?.dachform,
            dn: kubatur?.dachneigung_grad
        });
    }, [kubatur]);
    
    if (!kubatur?.grundriss_laenge || !kubatur?.grundriss_breite) {
        return (
            <div className="w-full h-64 bg-slate-100 rounded-lg flex items-center justify-center">
                <p className="text-slate-500">Geben Sie Grundriss-Maße ein für 3D-Ansicht</p>
            </div>
        );
    }
    
    const width = kubatur.grundriss_breite || 10;
    const floors = kubatur.anzahl_vollgeschosse || 2;
    const floorHeight = kubatur.geschosshoehe_standard || 2.5;
    const hasBasement = kubatur.kellergeschoss;
    const basementHeight = 2.5;
    const hasAttic = kubatur.dachgeschoss_ausgebaut;
    const roofType = kubatur.dachform?.toLowerCase() || 'sattel';
    const roofAngle = kubatur.dachneigung_grad || 35;
    
    // Dachhöhe berechnen
    const roofHeight = roofType === 'flach' ? 0.5 : (width / 2) * Math.tan((roofAngle * Math.PI) / 180);
    
    // Gesamthöhe
    const totalBuildingHeight = (hasBasement ? basementHeight : 0) + floors * floorHeight;
    const totalHeight = totalBuildingHeight + roofHeight;
    
    // SVG Dimensionen und Skalierung
    const svgWidth = 500;
    const svgHeight = 350;
    const buildingWidth = 220;
    const scale = Math.min(200 / totalHeight, 1.2);
    const scaledTotalHeight = totalHeight * scale * 10;
    
    const startX = 100;
    const startY = svgHeight - 60;
    
    return (
        <div key={vizKey} className="w-full h-80 bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-lg overflow-hidden relative border border-slate-200">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
                <defs>
                    <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                        <polygon points="0,1 4,4 0,7" fill="#475569"/>
                    </marker>
                </defs>
                
                {/* Titel */}
                <text x="20" y="25" fontSize="16" fontWeight="700" fill="#1e293b">
                    Schnittansicht
                </text>
                
                {/* Boden-Linie */}
                <line
                    x1={startX - 40}
                    y1={startY + 1}
                    x2={startX + buildingWidth + 120}
                    y2={startY + 1}
                    stroke="#64748b"
                    strokeWidth="2"
                />
                
                {/* Keller */}
                {hasBasement && (
                    <>
                        <rect
                            x={startX}
                            y={startY - basementHeight * scale * 10}
                            width={buildingWidth}
                            height={basementHeight * scale * 10}
                            fill="#a8a29e"
                            stroke="#57534e"
                            strokeWidth="2"
                        />
                        
                        {/* Geschoss-Linie oben */}
                        <line
                            x1={startX}
                            y1={startY - basementHeight * scale * 10}
                            x2={startX + buildingWidth}
                            y2={startY - basementHeight * scale * 10}
                            stroke="#44403c"
                            strokeWidth="2"
                            strokeDasharray="8,4"
                        />
                        
                        {/* Label KG */}
                        <text
                            x={startX + buildingWidth / 2}
                            y={startY - basementHeight * scale * 5 + 6}
                            textAnchor="middle"
                            fontSize="18"
                            fontWeight="700"
                            fill="#44403c"
                        >
                            KG
                        </text>
                    </>
                )}
                
                {/* Geschosse */}
                {[...Array(floors)].map((_, i) => {
                    const bottomY = startY - (hasBasement ? basementHeight * scale * 10 : 0) - (i + 1) * floorHeight * scale * 10;
                    const topY = startY - (hasBasement ? basementHeight * scale * 10 : 0) - i * floorHeight * scale * 10;
                    const floorLabel = i === 0 ? 'EG' : `${i}.OG`;
                    
                    // Hellere Farben abwechselnd
                    const fillColor = i % 2 === 0 ? '#e2e8f0' : '#cbd5e1';
                    
                    return (
                        <g key={i}>
                            <rect
                                x={startX}
                                y={bottomY}
                                width={buildingWidth}
                                height={floorHeight * scale * 10}
                                fill={fillColor}
                                stroke="#10b981"
                                strokeWidth="2"
                            />
                            
                            {/* Geschoss-Trennlinie (gestrichelt) */}
                            {i < floors - 1 && (
                                <line
                                    x1={startX}
                                    y1={bottomY}
                                    x2={startX + buildingWidth}
                                    y2={bottomY}
                                    stroke="#059669"
                                    strokeWidth="1.5"
                                    strokeDasharray="8,4"
                                />
                            )}
                            
                            {/* Geschoss-Label */}
                            <text
                                x={startX + buildingWidth / 2}
                                y={(topY + bottomY) / 2 + 6}
                                textAnchor="middle"
                                fontSize="18"
                                fontWeight="700"
                                fill="#047857"
                            >
                                {floorLabel}
                            </text>
                        </g>
                    );
                })}
                
                {/* Dach */}
                {roofType === 'sattel' && (
                    <>
                        <path
                            d={`
                                M ${startX},${startY - totalBuildingHeight * scale * 10}
                                L ${startX + buildingWidth / 2},${startY - totalBuildingHeight * scale * 10 - roofHeight * scale * 10}
                                L ${startX + buildingWidth},${startY - totalBuildingHeight * scale * 10}
                                Z
                            `}
                            fill="#ea580c"
                            stroke="#9a3412"
                            strokeWidth="2.5"
                        />
                        
                        {/* Dachgaube bei ausgebautem DG */}
                        {hasAttic && (
                            <>
                                <rect
                                    x={startX + buildingWidth * 0.35}
                                    y={startY - totalBuildingHeight * scale * 10 - roofHeight * scale * 4}
                                    width={buildingWidth * 0.18}
                                    height={roofHeight * scale * 3}
                                    fill="#e2e8f0"
                                    stroke="#64748b"
                                    strokeWidth="1.5"
                                />
                                <rect
                                    x={startX + buildingWidth * 0.37}
                                    y={startY - totalBuildingHeight * scale * 10 - roofHeight * scale * 3.8}
                                    width={buildingWidth * 0.14}
                                    height={roofHeight * scale * 2.5}
                                    fill="#93c5fd"
                                    stroke="#3b82f6"
                                    strokeWidth="1"
                                />
                                
                                {/* DG Label */}
                                <text
                                    x={startX + buildingWidth / 2}
                                    y={startY - totalBuildingHeight * scale * 10 - roofHeight * scale * 5 + 6}
                                    textAnchor="middle"
                                    fontSize="16"
                                    fontWeight="700"
                                    fill="#9a3412"
                                >
                                    DG
                                </text>
                            </>
                        )}
                    </>
                )}
                
                {roofType === 'flach' && (
                    <rect
                        x={startX}
                        y={startY - totalBuildingHeight * scale * 10 - roofHeight * scale * 10}
                        width={buildingWidth}
                        height={roofHeight * scale * 10}
                        fill="#475569"
                        stroke="#334155"
                        strokeWidth="2"
                    />
                )}
                
                {roofType === 'walm' && (
                    <path
                        d={`
                            M ${startX - 15},${startY - totalBuildingHeight * scale * 10}
                            L ${startX + buildingWidth / 2},${startY - totalBuildingHeight * scale * 10 - roofHeight * scale * 10}
                            L ${startX + buildingWidth + 15},${startY - totalBuildingHeight * scale * 10}
                            Z
                        `}
                        fill="#ea580c"
                        stroke="#9a3412"
                        strokeWidth="2.5"
                    />
                )}
                
                {/* Vertikale Maßlinie rechts */}
                <g>
                    {/* Hauptlinie */}
                    <line
                        x1={startX + buildingWidth + 50}
                        y1={startY}
                        x2={startX + buildingWidth + 50}
                        y2={startY - scaledTotalHeight}
                        stroke="#334155"
                        strokeWidth="2"
                    />
                    
                    {/* Pfeile oben und unten */}
                    <line
                        x1={startX + buildingWidth + 50}
                        y1={startY}
                        x2={startX + buildingWidth + 45}
                        y2={startY - 8}
                        stroke="#334155"
                        strokeWidth="2"
                    />
                    <line
                        x1={startX + buildingWidth + 50}
                        y1={startY}
                        x2={startX + buildingWidth + 55}
                        y2={startY - 8}
                        stroke="#334155"
                        strokeWidth="2"
                    />
                    
                    <line
                        x1={startX + buildingWidth + 50}
                        y1={startY - scaledTotalHeight}
                        x2={startX + buildingWidth + 45}
                        y2={startY - scaledTotalHeight + 8}
                        stroke="#334155"
                        strokeWidth="2"
                    />
                    <line
                        x1={startX + buildingWidth + 50}
                        y1={startY - scaledTotalHeight}
                        x2={startX + buildingWidth + 55}
                        y2={startY - scaledTotalHeight + 8}
                        stroke="#334155"
                        strokeWidth="2"
                    />
                    
                    {/* Maßtext */}
                    <text
                        x={startX + buildingWidth + 70}
                        y={startY - scaledTotalHeight / 2 + 6}
                        fontSize="18"
                        fontWeight="700"
                        fill="#1e293b"
                    >
                        {totalHeight.toFixed(1)} Meter
                    </text>
                    
                    {/* Einzelne Geschosshöhen-Markierungen */}
                    {hasBasement && (
                        <>
                            <line
                                x1={startX + buildingWidth + 45}
                                y1={startY - basementHeight * scale * 10}
                                x2={startX + buildingWidth + 50}
                                y2={startY - basementHeight * scale * 10}
                                stroke="#334155"
                                strokeWidth="2"
                            />
                            <text
                                x={startX + buildingWidth + 60}
                                y={startY - basementHeight * scale * 5 + 4}
                                fontSize="11"
                                fill="#64748b"
                            >
                                {basementHeight}m
                            </text>
                        </>
                    )}
                    
                    {[...Array(floors)].map((_, i) => {
                        const y = startY - (hasBasement ? basementHeight * scale * 10 : 0) - (i + 1) * floorHeight * scale * 10;
                        return (
                            <g key={i}>
                                <line
                                    x1={startX + buildingWidth + 45}
                                    y1={y}
                                    x2={startX + buildingWidth + 50}
                                    y2={y}
                                    stroke="#334155"
                                    strokeWidth="2"
                                />
                                {i === 0 && (
                                    <text
                                        x={startX + buildingWidth + 60}
                                        y={y + floorHeight * scale * 5 + 4}
                                        fontSize="11"
                                        fill="#64748b"
                                    >
                                        {floorHeight}m
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </g>
            </svg>
            
            {/* Legende unten links */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border border-slate-200">
                <div className="text-xs text-slate-600 mb-2 font-semibold">Gebäudedaten</div>
                <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-slate-300 border-2 border-emerald-600 rounded"></div>
                        <span className="text-slate-700">{floors} {floors === 1 ? 'Geschoss' : 'Geschosse'}</span>
                    </div>
                    {hasBasement && (
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-stone-400 border border-stone-700 rounded"></div>
                            <span className="text-slate-700">Kellergeschoss</span>
                        </div>
                    )}
                    {hasAttic && (
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-orange-200 border border-orange-500 rounded"></div>
                            <span className="text-slate-700">DG ausgebaut</span>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-orange-500 border border-orange-800 rounded"></div>
                        <span className="text-slate-700">Dach: {kubatur.dachform || 'Sattel'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}