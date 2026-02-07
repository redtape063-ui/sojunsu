/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Cloud, Sky } from '@react-three/drei';
import { useStore } from '../../store';
import { LANE_WIDTH } from '../../types';

const Clouds: React.FC = () => {
    return (
        <group position={[0, 10, -50]}>
            <Cloud position={[-10, 2, -10]} speed={0.2} opacity={0.5} segments={10} bounds={[10, 2, 2]} />
            <Cloud position={[10, 5, -20]} speed={0.2} opacity={0.5} segments={10} bounds={[10, 2, 2]} />
            <Cloud position={[0, 8, -40]} speed={0.1} opacity={0.3} segments={10} bounds={[20, 2, 5]} />
        </group>
    );
}

const MovingGrass: React.FC = () => {
    const speed = useStore(state => state.speed);
    const meshRef = useRef<THREE.Mesh>(null);
    const offsetRef = useRef(0);
    
    useFrame((state, delta) => {
        if (meshRef.current) {
             const activeSpeed = speed > 0 ? speed : 2;
             offsetRef.current += activeSpeed * delta;
             
             // Texture scroll effect for infinite ground
             const texture = (meshRef.current.material as THREE.MeshStandardMaterial).map;
             if (texture) {
                 texture.offset.y = -(offsetRef.current * 0.05) % 1;
             }
        }
    });

    // Create a simple noise texture for grass detail
    const grassTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#4ade80'; // Base Green
            ctx.fillRect(0,0,512,512);
            // Add noise
            for(let i=0; i<5000; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#22c55e' : '#86efac';
                const x = Math.random() * 512;
                const y = Math.random() * 512;
                const w = Math.random() * 4;
                const h = Math.random() * 4;
                ctx.fillRect(x,y,w,h);
            }
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(10, 20); // Tile it
        return tex;
    }, []);

    return (
        <group>
            {/* Main Grass Plane */}
            <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -50]} receiveShadow>
                <planeGeometry args={[100, 200]} />
                <meshStandardMaterial 
                    map={grassTexture}
                    color="#ffffff"
                    roughness={1}
                />
            </mesh>
            
            {/* Dirt Path */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -20]} receiveShadow>
                 <planeGeometry args={[8, 200]} />
                 <meshStandardMaterial color="#d6d3d1" roughness={1} />
            </mesh>
        </group>
    );
};

const LaneMarkers: React.FC = () => {
    const { laneCount } = useStore();
    const separators = useMemo(() => {
        const lines: number[] = [];
        // 3 lanes = 2 dividers. Lane width 2.5.
        // Lanes at -2.5, 0, 2.5
        // Dividers at -1.25, 1.25
        const startX = -((laneCount * LANE_WIDTH) / 2) + (LANE_WIDTH / 2);
        
        for (let i = 0; i < laneCount - 1; i++) {
            lines.push(startX + (i * LANE_WIDTH));
        }
        return lines;
    }, [laneCount]);

    return (
        <group position={[0, 0, -20]}>
            {separators.map((x, i) => (
                <mesh key={i} position={[x, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
                    <planeGeometry args={[0.1, 200]} />
                    <meshBasicMaterial color="#ffffff" opacity={0.5} transparent />
                </mesh>
            ))}
        </group>
    )
}

export const Environment: React.FC = () => {
  return (
    <>
      <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
      <ambientLight intensity={0.6} color="#ffffff" />
      <directionalLight 
        position={[50, 50, 20]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize={[1024, 1024]} 
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      <Clouds />
      <MovingGrass />
      <LaneMarkers />
    </>
  );
};