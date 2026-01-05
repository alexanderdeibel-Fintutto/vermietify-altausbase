import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';

function Building({ kubatur }) {
    const length = kubatur.grundriss_laenge || 10;
    const width = kubatur.grundriss_breite || 8;
    const floors = kubatur.anzahl_vollgeschosse || 3;
    const floorHeight = kubatur.geschosshoehe_standard || 2.5;
    const totalHeight = floors * floorHeight;
    
    // Kellergeschoss
    const hasBasement = kubatur.kellergeschoss;
    const basementHeight = hasBasement ? 2.5 : 0;
    
    // Dachform
    const roofType = kubatur.dachform?.toLowerCase() || 'flach';
    const roofAngle = kubatur.dachneigung_grad || 35;
    const roofHeight = roofType === 'sattel' ? (width / 2) * Math.tan((roofAngle * Math.PI) / 180) : 0.3;
    
    return (
        <group>
            {/* Keller */}
            {hasBasement && (
                <mesh position={[0, -basementHeight / 2, 0]}>
                    <boxGeometry args={[length, basementHeight, width]} />
                    <meshStandardMaterial color="#6b6b6b" />
                </mesh>
            )}
            
            {/* Hauptgebäude - Geschosse einzeln */}
            {[...Array(floors)].map((_, i) => (
                <group key={i}>
                    {/* Geschoss-Boden */}
                    <mesh position={[0, i * floorHeight + floorHeight / 2, 0]}>
                        <boxGeometry args={[length, 0.2, width]} />
                        <meshStandardMaterial color="#ffffff" />
                    </mesh>
                    {/* Geschoss-Wände */}
                    <mesh position={[0, i * floorHeight + floorHeight / 2, 0]}>
                        <boxGeometry args={[length, floorHeight, width]} />
                        <meshStandardMaterial 
                            color="#e0e0e0" 
                            transparent 
                            opacity={0.7}
                            wireframe={false}
                        />
                    </mesh>
                    {/* Etagen-Linien */}
                    <mesh position={[0, (i + 1) * floorHeight, 0]}>
                        <boxGeometry args={[length + 0.1, 0.05, width + 0.1]} />
                        <meshStandardMaterial color="#333333" />
                    </mesh>
                </group>
            ))}
            
            {/* Dach */}
            {roofType === 'sattel' ? (
                <group position={[0, totalHeight + roofHeight / 2, 0]}>
                    {/* Dach Vorderseite */}
                    <mesh rotation={[0, 0, Math.atan(roofHeight / (width / 2))]}>
                        <boxGeometry args={[length, Math.sqrt((width / 2) ** 2 + roofHeight ** 2), 0.1]} />
                        <meshStandardMaterial color="#8B4513" />
                    </mesh>
                    {/* Dach Rückseite */}
                    <mesh rotation={[0, 0, -Math.atan(roofHeight / (width / 2))]}>
                        <boxGeometry args={[length, Math.sqrt((width / 2) ** 2 + roofHeight ** 2), 0.1]} />
                        <meshStandardMaterial color="#8B4513" />
                    </mesh>
                </group>
            ) : (
                <mesh position={[0, totalHeight + roofHeight / 2, 0]}>
                    <boxGeometry args={[length, roofHeight, width]} />
                    <meshStandardMaterial color="#999999" />
                </mesh>
            )}
            
            {/* Beschriftungen */}
            <Text
                position={[0, totalHeight + roofHeight + 0.5, 0]}
                fontSize={0.5}
                color="black"
                anchorX="center"
                anchorY="middle"
            >
                {floors} Geschosse
            </Text>
            
            <Text
                position={[length / 2 + 0.5, totalHeight / 2, 0]}
                fontSize={0.4}
                color="black"
                rotation={[0, -Math.PI / 2, 0]}
            >
                {length}m
            </Text>
            
            <Text
                position={[0, totalHeight / 2, width / 2 + 0.5]}
                fontSize={0.4}
                color="black"
            >
                {width}m
            </Text>
        </group>
    );
}

export default function Building3DVisualization({ kubatur }) {
    if (!kubatur.grundriss_laenge || !kubatur.grundriss_breite) {
        return (
            <div className="w-full h-64 bg-slate-100 rounded-lg flex items-center justify-center">
                <p className="text-slate-500">Geben Sie Grundriss-Maße ein für 3D-Ansicht</p>
            </div>
        );
    }
    
    return (
        <div className="w-full h-64 bg-gradient-to-b from-sky-200 to-slate-100 rounded-lg">
            <Canvas camera={{ position: [15, 10, 15], fov: 50 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <Building kubatur={kubatur} />
                <OrbitControls enablePan={false} />
                <gridHelper args={[20, 20, '#cccccc', '#eeeeee']} />
            </Canvas>
        </div>
    );
}