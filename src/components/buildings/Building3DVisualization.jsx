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
    
    // Skalierung für die Darstellung - angepasst für bessere Proportionen
    const maxDimension = Math.max(length, width);
    const scale = maxDimension > 20 ? 120 / maxDimension : 6;
    const isoAngle = Math.PI / 6;
    
    // Isometrische Transformation
    const toIso = (x, y, z) => {
        const isoX = (x - y) * Math.cos(isoAngle) * scale;
        const isoY = (x + y) * Math.sin(isoAngle) * scale - z * scale;
        return { x: isoX, y: isoY };
    };
    
    const viewBoxWidth = 500;
    const viewBoxHeight = 350;
    const centerX = viewBoxWidth / 2;
    const centerY = viewBoxHeight / 2 + 50;
    
    const buildingHeight = (hasBasement ? 2.5 : 0) + floors * floorHeight;
    
    // Fenster generieren
    const generateWindows = (x1, y1, z1, x2, y2, z2, isVertical = true) => {
        const windows = [];
        const floorH = z2 - z1;
        const windowWidth = isVertical ? Math.abs(x2 - x1) : Math.abs(y2 - y1);
        const numWindows = Math.floor(windowWidth / 3);
        
        for (let i = 0; i < numWindows; i++) {
            const offset = (i + 0.5) / numWindows;
            const wx = x1 + (x2 - x1) * offset;
            const wy = y1 + (y2 - y1) * offset;
            const wz1 = z1 + floorH * 0.3;
            const wz2 = z1 + floorH * 0.8;
            
            const p1 = toIso(wx - 0.3, wy, wz1);
            const p2 = toIso(wx + 0.3, wy, wz1);
            const p3 = toIso(wx + 0.3, wy, wz2);
            const p4 = toIso(wx - 0.3, wy, wz2);
            
            windows.push(
                <path
                    key={`window-${i}`}
                    d={`
                        M ${p1.x},${-p1.y}
                        L ${p2.x},${-p2.y}
                        L ${p3.x},${-p3.y}
                        L ${p4.x},${-p4.y}
                        Z
                    `}
                    fill="#bfdbfe"
                    stroke="#3b82f6"
                    strokeWidth="0.5"
                />
            );
        }
        return windows;
    };
    
    return (
        <div className="w-full h-64 bg-gradient-to-br from-sky-200 via-sky-100 to-slate-100 rounded-lg overflow-hidden relative">
            <svg 
                viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} 
                className="w-full h-full"
            >
                <defs>
                    <linearGradient id="wallGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f1f5f9" />
                        <stop offset="100%" stopColor="#e2e8f0" />
                    </linearGradient>
                    
                    <linearGradient id="sideGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#cbd5e1" />
                        <stop offset="100%" stopColor="#94a3b8" />
                    </linearGradient>
                    
                    <linearGradient id="roofGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#dc2626" />
                        <stop offset="100%" stopColor="#991b1b" />
                    </linearGradient>
                    
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
                        <feOffset dx="3" dy="6" result="offsetblur"/>
                        <feComponentTransfer>
                            <feFuncA type="linear" slope="0.2"/>
                        </feComponentTransfer>
                        <feMerge>
                            <feMergeNode/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                
                <g transform={`translate(${centerX}, ${centerY})`}>
                    {/* Bodenschatten */}
                    <ellipse 
                        cx="0" 
                        cy="5" 
                        rx={Math.max(length, width) * scale * 0.7}
                        ry={Math.max(length, width) * scale * 0.25}
                        fill="#000000"
                        opacity="0.15"
                    />
                    
                    {/* Keller */}
                    {hasBasement && (
                        <g>
                            <path
                                d={`
                                    M ${toIso(0, 0, 0).x},${-toIso(0, 0, 0).y}
                                    L ${toIso(length, 0, 0).x},${-toIso(length, 0, 0).y}
                                    L ${toIso(length, 0, 2.5).x},${-toIso(length, 0, 2.5).y}
                                    L ${toIso(0, 0, 2.5).x},${-toIso(0, 0, 2.5).y}
                                    Z
                                `}
                                fill="#78716c"
                                stroke="#57534e"
                                strokeWidth="1.5"
                            />
                            <path
                                d={`
                                    M ${toIso(length, 0, 0).x},${-toIso(length, 0, 0).y}
                                    L ${toIso(length, width, 0).x},${-toIso(length, width, 0).y}
                                    L ${toIso(length, width, 2.5).x},${-toIso(length, width, 2.5).y}
                                    L ${toIso(length, 0, 2.5).x},${-toIso(length, 0, 2.5).y}
                                    Z
                                `}
                                fill="#57534e"
                                stroke="#44403c"
                                strokeWidth="1.5"
                            />
                        </g>
                    )}
                    
                    {/* Hauptgebäude - Geschosse */}
                    {[...Array(floors)].map((_, i) => {
                        const z1 = (hasBasement ? 2.5 : 0) + i * floorHeight;
                        const z2 = z1 + floorHeight;
                        
                        return (
                            <g key={i} filter="url(#shadow)">
                                {/* Vorderseite */}
                                <path
                                    d={`
                                        M ${toIso(0, 0, z1).x},${-toIso(0, 0, z1).y}
                                        L ${toIso(length, 0, z1).x},${-toIso(length, 0, z1).y}
                                        L ${toIso(length, 0, z2).x},${-toIso(length, 0, z2).y}
                                        L ${toIso(0, 0, z2).x},${-toIso(0, 0, z2).y}
                                        Z
                                    `}
                                    fill="url(#wallGradient)"
                                    stroke="#10b981"
                                    strokeWidth="2"
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
                                    fill="url(#sideGradient)"
                                    stroke="#10b981"
                                    strokeWidth="2"
                                />
                                
                                {/* Fenster auf Vorderseite */}
                                {generateWindows(0, 0, z1, length, 0, z2, true)}
                                
                                {/* Geschoss-Nummer auf Vorderseite */}
                                <text 
                                    x={toIso(length / 2, 0, z1 + floorHeight / 2).x} 
                                    y={-toIso(length / 2, 0, z1 + floorHeight / 2).y + 4} 
                                    textAnchor="middle"
                                    fill="#059669"
                                    fontSize="10"
                                    fontWeight="700"
                                    opacity="0.4"
                                >
                                    {i === 0 ? 'EG' : `${i}. OG`}
                                </text>
                            </g>
                        );
                    })}
                    
                    {/* Eingangstür (nur im Erdgeschoss vorne) */}
                    {floors > 0 && (
                        <g>
                            {(() => {
                                const doorZ1 = hasBasement ? 2.5 : 0;
                                const doorZ2 = doorZ1 + floorHeight * 0.8;
                                const doorX = length * 0.3;
                                
                                const d1 = toIso(doorX - 0.5, 0, doorZ1);
                                const d2 = toIso(doorX + 0.5, 0, doorZ1);
                                const d3 = toIso(doorX + 0.5, 0, doorZ2);
                                const d4 = toIso(doorX - 0.5, 0, doorZ2);
                                
                                return (
                                    <path
                                        d={`
                                            M ${d1.x},${-d1.y}
                                            L ${d2.x},${-d2.y}
                                            L ${d3.x},${-d3.y}
                                            L ${d4.x},${-d4.y}
                                            Z
                                        `}
                                        fill="#92400e"
                                        stroke="#78350f"
                                        strokeWidth="1"
                                    />
                                );
                            })()}
                        </g>
                    )}
                    
                    {/* Dach */}
                    {roofType === 'sattel' && (
                        <g filter="url(#shadow)">
                            {(() => {
                                const roofHeight = Math.tan((kubatur.dachneigung_grad || 35) * Math.PI / 180) * (width / 2);
                                const peakZ = buildingHeight + roofHeight;
                                
                                return (
                                    <>
                                        {/* Vordere Dachfläche */}
                                        <path
                                            d={`
                                                M ${toIso(0, 0, buildingHeight).x},${-toIso(0, 0, buildingHeight).y}
                                                L ${toIso(length, 0, buildingHeight).x},${-toIso(length, 0, buildingHeight).y}
                                                L ${toIso(length, width / 2, peakZ).x},${-toIso(length, width / 2, peakZ).y}
                                                L ${toIso(0, width / 2, peakZ).x},${-toIso(0, width / 2, peakZ).y}
                                                Z
                                            `}
                                            fill="url(#roofGradient)"
                                            stroke="#7c2d12"
                                            strokeWidth="2"
                                        />
                                        
                                        {/* Hintere Dachfläche */}
                                        <path
                                            d={`
                                                M ${toIso(0, width, buildingHeight).x},${-toIso(0, width, buildingHeight).y}
                                                L ${toIso(length, width, buildingHeight).x},${-toIso(length, width, buildingHeight).y}
                                                L ${toIso(length, width / 2, peakZ).x},${-toIso(length, width / 2, peakZ).y}
                                                L ${toIso(0, width / 2, peakZ).x},${-toIso(0, width / 2, peakZ).y}
                                                Z
                                            `}
                                            fill="#991b1b"
                                            stroke="#7c2d12"
                                            strokeWidth="2"
                                        />
                                        
                                        {/* Rechte Giebelseite */}
                                        <path
                                            d={`
                                                M ${toIso(length, 0, buildingHeight).x},${-toIso(length, 0, buildingHeight).y}
                                                L ${toIso(length, width, buildingHeight).x},${-toIso(length, width, buildingHeight).y}
                                                L ${toIso(length, width / 2, peakZ).x},${-toIso(length, width / 2, peakZ).y}
                                                Z
                                            `}
                                            fill="#e2e8f0"
                                            stroke="#10b981"
                                            strokeWidth="2"
                                        />
                                        
                                        {/* Dachgaube (wenn DG ausgebaut) */}
                                        {hasAttic && (
                                            <path
                                                d={`
                                                    M ${toIso(length * 0.4, width / 2 - 1, buildingHeight + roofHeight * 0.4).x},${-toIso(length * 0.4, width / 2 - 1, buildingHeight + roofHeight * 0.4).y}
                                                    L ${toIso(length * 0.6, width / 2 - 1, buildingHeight + roofHeight * 0.4).x},${-toIso(length * 0.6, width / 2 - 1, buildingHeight + roofHeight * 0.4).y}
                                                    L ${toIso(length * 0.6, width / 2 - 1, buildingHeight + roofHeight * 0.65).x},${-toIso(length * 0.6, width / 2 - 1, buildingHeight + roofHeight * 0.65).y}
                                                    L ${toIso(length * 0.5, width / 2 - 1, buildingHeight + roofHeight * 0.75).x},${-toIso(length * 0.5, width / 2 - 1, buildingHeight + roofHeight * 0.75).y}
                                                    L ${toIso(length * 0.4, width / 2 - 1, buildingHeight + roofHeight * 0.65).x},${-toIso(length * 0.4, width / 2 - 1, buildingHeight + roofHeight * 0.65).y}
                                                    Z
                                                `}
                                                fill="#f1f5f9"
                                                stroke="#64748b"
                                                strokeWidth="1.5"
                                            />
                                        )}
                                    </>
                                );
                            })()}
                        </g>
                    )}
                    
                    {roofType === 'flach' && (
                        <g filter="url(#shadow)">
                            {/* Oberseite */}
                            <path
                                d={`
                                    M ${toIso(0, 0, buildingHeight).x},${-toIso(0, 0, buildingHeight).y}
                                    L ${toIso(length, 0, buildingHeight).x},${-toIso(length, 0, buildingHeight).y}
                                    L ${toIso(length, width, buildingHeight).x},${-toIso(length, width, buildingHeight).y}
                                    L ${toIso(0, width, buildingHeight).x},${-toIso(0, width, buildingHeight).y}
                                    Z
                                `}
                                fill="#475569"
                                stroke="#334155"
                                strokeWidth="2"
                            />
                            
                            {/* Brüstung */}
                            <path
                                d={`
                                    M ${toIso(length * 0.1, width * 0.1, buildingHeight).x},${-toIso(length * 0.1, width * 0.1, buildingHeight).y}
                                    L ${toIso(length * 0.9, width * 0.1, buildingHeight).x},${-toIso(length * 0.9, width * 0.1, buildingHeight).y}
                                    L ${toIso(length * 0.9, width * 0.9, buildingHeight).x},${-toIso(length * 0.9, width * 0.9, buildingHeight).y}
                                    L ${toIso(length * 0.1, width * 0.9, buildingHeight).x},${-toIso(length * 0.1, width * 0.9, buildingHeight).y}
                                    Z
                                `}
                                fill="none"
                                stroke="#64748b"
                                strokeWidth="1"
                                opacity="0.5"
                            />
                        </g>
                    )}
                    
                    {roofType === 'walm' && (
                        <g filter="url(#shadow)">
                            {(() => {
                                const roofHeight = Math.tan((kubatur.dachneigung_grad || 35) * Math.PI / 180) * (width / 2);
                                const peakZ = buildingHeight + roofHeight;
                                
                                return (
                                    <>
                                        <path
                                            d={`
                                                M ${toIso(0, 0, buildingHeight).x},${-toIso(0, 0, buildingHeight).y}
                                                L ${toIso(length, 0, buildingHeight).x},${-toIso(length, 0, buildingHeight).y}
                                                L ${toIso(length, width / 2, peakZ).x},${-toIso(length, width / 2, peakZ).y}
                                                L ${toIso(0, width / 2, peakZ).x},${-toIso(0, width / 2, peakZ).y}
                                                Z
                                            `}
                                            fill="url(#roofGradient)"
                                            stroke="#7c2d12"
                                            strokeWidth="2"
                                        />
                                        <path
                                            d={`
                                                M ${toIso(length, 0, buildingHeight).x},${-toIso(length, 0, buildingHeight).y}
                                                L ${toIso(length, width, buildingHeight).x},${-toIso(length, width, buildingHeight).y}
                                                L ${toIso(length, width / 2, peakZ).x},${-toIso(length, width / 2, peakZ).y}
                                                Z
                                            `}
                                            fill="#b91c1b"
                                            stroke="#7c2d12"
                                            strokeWidth="2"
                                        />
                                        <path
                                            d={`
                                                M ${toIso(length, width, buildingHeight).x},${-toIso(length, width, buildingHeight).y}
                                                L ${toIso(0, width, buildingHeight).x},${-toIso(0, width, buildingHeight).y}
                                                L ${toIso(0, width / 2, peakZ).x},${-toIso(0, width / 2, peakZ).y}
                                                L ${toIso(length, width / 2, peakZ).x},${-toIso(length, width / 2, peakZ).y}
                                                Z
                                            `}
                                            fill="#991b1b"
                                            stroke="#7c2d12"
                                            strokeWidth="2"
                                        />
                                    </>
                                );
                            })()}
                        </g>
                    )}
                    
                    {/* Maßangaben */}
                    <g>
                        {/* Länge */}
                        <line
                            x1={toIso(0, -1.5, 0).x}
                            y1={-toIso(0, -1.5, 0).y}
                            x2={toIso(length, -1.5, 0).x}
                            y2={-toIso(length, -1.5, 0).y}
                            stroke="#64748b"
                            strokeWidth="1"
                            strokeDasharray="2,2"
                        />
                        <text 
                            x={toIso(length / 2, -1.5, 0).x} 
                            y={-toIso(length / 2, -1.5, 0).y - 4} 
                            textAnchor="middle"
                            fill="#334155"
                            fontSize="12"
                            fontWeight="700"
                        >
                            {length}m
                        </text>
                        
                        {/* Breite */}
                        <line
                            x1={toIso(length + 1.5, 0, 0).x}
                            y1={-toIso(length + 1.5, 0, 0).y}
                            x2={toIso(length + 1.5, width, 0).x}
                            y2={-toIso(length + 1.5, width, 0).y}
                            stroke="#64748b"
                            strokeWidth="1"
                            strokeDasharray="2,2"
                        />
                        <text 
                            x={toIso(length + 1.5, width / 2, 0).x + 15} 
                            y={-toIso(length + 1.5, width / 2, 0).y + 4} 
                            textAnchor="start"
                            fill="#334155"
                            fontSize="12"
                            fontWeight="700"
                        >
                            {width}m
                        </text>
                    </g>
                </g>
            </svg>
            
            {/* Legende */}
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2.5 text-xs space-y-1.5 shadow-lg border border-slate-200">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-slate-100 to-slate-200 border-2 border-emerald-500 rounded-sm"></div>
                    <span className="text-slate-700 font-medium">{floors} {floors === 1 ? 'Geschoss' : 'Geschosse'}</span>
                </div>
                {hasBasement && (
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-stone-500 border border-stone-700 rounded-sm"></div>
                        <span className="text-slate-700">Kellergeschoss</span>
                    </div>
                )}
                {hasAttic && (
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-amber-100 border border-amber-400 rounded-sm"></div>
                        <span className="text-slate-700">DG ausgebaut</span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-br from-red-600 to-red-800 border border-red-900 rounded-sm"></div>
                    <span className="text-slate-700">Dach: {kubatur.dachform || 'Sattel'}</span>
                </div>
                <div className="pt-1.5 mt-1.5 border-t border-slate-200 text-slate-600">
                    Grundfläche: {(length * width).toFixed(0)} m²
                </div>
            </div>
        </div>
    );
}