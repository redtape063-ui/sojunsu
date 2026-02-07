/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text3D, Center, Float } from '@react-three/drei';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../../store';
import { GameObject, ObjectType, LANE_WIDTH, SPAWN_DISTANCE, REMOVE_DISTANCE, GameStatus } from '../../types';
import { audio } from '../System/Audio';

// Nature Geometries
const LOG_GEO = new THREE.CylinderGeometry(0.4, 0.4, 3, 8); // Sideways cylinder
const ROCK_GEO = new THREE.DodecahedronGeometry(0.8, 0);
const TREE_TRUNK_GEO = new THREE.CylinderGeometry(0.3, 0.5, 1.5, 6);
const TREE_LEAVES_GEO = new THREE.ConeGeometry(1.5, 3, 6);

// Shop Geometries
const SHOP_FRAME_GEO = new THREE.BoxGeometry(1, 5, 1);
const SHOP_ROOF_GEO = new THREE.ConeGeometry(3, 2, 4);

const FONT_URL = "https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_bold.typeface.json";

// Distance between "Question Rows"
const QUESTION_INTERVAL = 150; 

const getRandomLane = (laneCount: number) => {
    const max = Math.floor(laneCount / 2);
    return Math.floor(Math.random() * (max * 2 + 1)) - max;
};

export const LevelManager: React.FC = () => {
  const { 
    status, 
    speed, 
    addScore,
    submitAnswer,
    laneCount,
    setDistance,
    openShop,
    currentProblem
  } = useStore();
  
  const objectsRef = useRef<GameObject[]>([]);
  const [renderTrigger, setRenderTrigger] = useState(0);
  const prevStatus = useRef(status);

  const playerObjRef = useRef<THREE.Object3D | null>(null);
  const distanceTraveled = useRef(0);
  const nextQuestionDist = useRef(50); // First question at 50m

  // Handle resets
  useEffect(() => {
    const isRestart = (status === GameStatus.PLAYING && prevStatus.current !== GameStatus.PLAYING && prevStatus.current !== GameStatus.SHOP);
    
    if (isRestart) {
        objectsRef.current = [];
        distanceTraveled.current = 0;
        nextQuestionDist.current = 50;
        setRenderTrigger(t => t + 1);
    }
    prevStatus.current = status;
  }, [status]);

  useFrame((state) => {
      if (!playerObjRef.current) {
          const group = state.scene.getObjectByName('PlayerGroup');
          if (group && group.children.length > 0) {
              playerObjRef.current = group.children[0];
          }
      }
  });

  useFrame((state, delta) => {
    if (status !== GameStatus.PLAYING) return;

    const safeDelta = Math.min(delta, 0.05); 
    const dist = speed * safeDelta;
    
    distanceTraveled.current += dist;
    setDistance(distanceTraveled.current);

    let hasChanges = false;
    let playerPos = new THREE.Vector3(0, 0, 0);
    
    if (playerObjRef.current) {
        playerObjRef.current.getWorldPosition(playerPos);
    }

    // 1. Move & Update Objects
    const currentObjects = objectsRef.current;
    const keptObjects: GameObject[] = [];

    for (const obj of currentObjects) {
        const prevZ = obj.position[2];
        obj.position[2] += dist;
        
        // Tree parallax (Decor only)
        if (obj.type === ObjectType.TREE) {
            keptObjects.push(obj); // Always keep trees until they despawn
            if (obj.position[2] > REMOVE_DISTANCE) {
                // remove
            } else {
                continue; // Skip collision for trees (they are on sidelines)
            }
        }

        let keep = true;
        if (obj.active && obj.type !== ObjectType.TREE) {
            // Collision Logic
            const zThreshold = 1.5;
            const inZZone = (prevZ < playerPos.z + zThreshold) && (obj.position[2] > playerPos.z - zThreshold);
            
            if (obj.type === ObjectType.SHOP_PORTAL) {
                 const dz = Math.abs(obj.position[2] - playerPos.z);
                 if (dz < 2) {
                     openShop();
                     obj.active = false;
                     keep = false;
                     hasChanges = true;
                 }
            } else if (inZZone) {
                const dx = Math.abs(obj.position[0] - playerPos.x);
                if (dx < 1.0) {
                    // Vertical check
                    const playerBottom = playerPos.y;
                    const playerTop = playerPos.y + 1.8;
                    
                    let objBottom = obj.position[1] - 0.5;
                    let objTop = obj.position[1] + 0.5;
                    
                    // Specific heights
                    if (obj.type === ObjectType.OBSTACLE) { objBottom = 0; objTop = 1.0; } // Log height
                    if (obj.type === ObjectType.MATH_ANSWER) { objBottom = 0.5; objTop = 2.5; }

                    const isHit = (playerBottom < objTop) && (playerTop > objBottom);

                    if (isHit) {
                        if (obj.type === ObjectType.MATH_ANSWER) {
                            // Math Logic
                            const correct = submitAnswer(obj.value || 0);
                            if (correct) {
                                audio.playLetterCollect(); // Reuse positive sound
                                // Clear other answers in this row to avoid confusion/double hits
                                const rowZ = obj.position[2];
                                objectsRef.current.forEach(o => {
                                    if (o.type === ObjectType.MATH_ANSWER && Math.abs(o.position[2] - rowZ) < 2) {
                                        o.active = false;
                                    }
                                });
                            } else {
                                audio.playDamage();
                            }
                        } else if (obj.type === ObjectType.OBSTACLE) {
                            window.dispatchEvent(new Event('player-hit'));
                        } else if (obj.type === ObjectType.COIN) {
                            addScore(50);
                            audio.playGemCollect();
                        }
                        
                        obj.active = false;
                        keep = false;
                        hasChanges = true;
                    }
                }
            }
        }

        if (obj.position[2] > REMOVE_DISTANCE) {
            keep = false;
            hasChanges = true;
        }

        if (keep) keptObjects.push(obj);
    }

    // 2. Spawning Logic
    let furthestZ = -20;
    const playFieldObjects = keptObjects.filter(o => o.type !== ObjectType.TREE);
    if (playFieldObjects.length > 0) {
        furthestZ = Math.min(...playFieldObjects.map(o => o.position[2]));
    }

    if (furthestZ > -SPAWN_DISTANCE) {
        const spawnZ = Math.min(furthestZ - 20, -SPAWN_DISTANCE);
        
        // Spawn Decor (Trees) independently
        if (Math.random() < 0.3) {
            keptObjects.push({
                id: uuidv4(),
                type: ObjectType.TREE,
                position: [6 + Math.random() * 4, 0, spawnZ], // Right side
                active: true,
                color: '#22c55e'
            });
        }
        if (Math.random() < 0.3) {
            keptObjects.push({
                id: uuidv4(),
                type: ObjectType.TREE,
                position: [-6 - Math.random() * 4, 0, spawnZ], // Left side
                active: true,
                color: '#22c55e'
            });
        }

        // Check if Question Row is due
        if (distanceTraveled.current >= nextQuestionDist.current) {
            // SPAWN QUESTION ROW
            // 3 Bubbles: 1 Correct, 2 Wrong
            const correctAnswer = currentProblem.answer;
            // Generate wrong answers that are close but not equal
            const wrong1 = correctAnswer + Math.floor(Math.random() * 10) - 5 || correctAnswer + 1;
            const wrong2 = correctAnswer + Math.floor(Math.random() * 10) - 5 || correctAnswer - 1;
            const answers = [correctAnswer, wrong1, wrong2];
            
            // Shuffle
            for (let i = answers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [answers[i], answers[j]] = [answers[j], answers[i]];
            }

            // Assign to lanes (-1, 0, 1)
            [-1, 0, 1].forEach((laneIdx, i) => {
                const val = answers[i];
                keptObjects.push({
                    id: uuidv4(),
                    type: ObjectType.MATH_ANSWER,
                    position: [laneIdx * LANE_WIDTH, 1.5, spawnZ],
                    active: true,
                    value: val,
                    isCorrect: val === correctAnswer,
                    color: val === correctAnswer ? '#ffffff' : '#eeeeee'
                });
            });

            nextQuestionDist.current += QUESTION_INTERVAL;
            hasChanges = true;

        } else if (Math.random() < 0.4) {
            // SPAWN OBSTACLES / COINS
            const isObstacle = Math.random() > 0.3;
            const lane = getRandomLane(laneCount);
            
            if (isObstacle) {
                keptObjects.push({
                    id: uuidv4(),
                    type: ObjectType.OBSTACLE,
                    position: [lane * LANE_WIDTH, 0.4, spawnZ],
                    active: true,
                    color: '#8B4513' // Brown Log
                });
            } else {
                 keptObjects.push({
                    id: uuidv4(),
                    type: ObjectType.COIN,
                    position: [lane * LANE_WIDTH, 1.5, spawnZ],
                    active: true,
                    color: '#ffd700'
                });
            }
            hasChanges = true;
        } else if (Math.random() < 0.05) {
             // Rare Shop Portal
             keptObjects.push({
                id: uuidv4(),
                type: ObjectType.SHOP_PORTAL,
                position: [0, 0, spawnZ],
                active: true
            });
            hasChanges = true;
        }
    }

    if (hasChanges) {
        objectsRef.current = keptObjects;
        setRenderTrigger(t => t + 1);
    }
  });

  return (
    <group>
      {objectsRef.current.map(obj => {
        if (!obj.active) return null;
        return <GameEntity key={obj.id} data={obj} />;
      })}
    </group>
  );
};

const GameEntity: React.FC<{ data: GameObject }> = React.memo(({ data }) => {
    const groupRef = useRef<THREE.Group>(null);
    const { laneCount } = useStore();

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.position.set(data.position[0], 0, data.position[2]);
            
            if (data.type === ObjectType.MATH_ANSWER || data.type === ObjectType.COIN) {
                groupRef.current.rotation.y += 0.02;
                groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 3 + data.position[0]) * 0.2;
            }
        }
    });

    return (
        <group ref={groupRef} position={[data.position[0], 0, data.position[2]]}>
            <group position={[0, data.position[1], 0]}>
                {/* --- OBSTACLE (Log/Rock) --- */}
                {data.type === ObjectType.OBSTACLE && (
                    <group>
                        {/* Log */}
                        <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow geometry={LOG_GEO}>
                             <meshStandardMaterial color="#5D4037" roughness={0.9} />
                        </mesh>
                        {/* End caps */}
                        <mesh position={[1.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                             <circleGeometry args={[0.38, 16]} />
                             <meshStandardMaterial color="#8D6E63" />
                        </mesh>
                        <mesh position={[-1.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                             <circleGeometry args={[0.38, 16]} />
                             <meshStandardMaterial color="#8D6E63" />
                        </mesh>
                    </group>
                )}

                {/* --- MATH ANSWER (Bubble) --- */}
                {data.type === ObjectType.MATH_ANSWER && (
                    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                        <mesh>
                            <sphereGeometry args={[1, 32, 32]} />
                            <meshPhysicalMaterial 
                                color="#ffffff" 
                                transmission={0.6}
                                thickness={1}
                                roughness={0}
                                clearcoat={1}
                            />
                        </mesh>
                        <Center>
                             <Text3D font={FONT_URL} size={0.8} height={0.1}>
                                {data.value}
                                <meshStandardMaterial color="#000000" />
                             </Text3D>
                        </Center>
                    </Float>
                )}

                {/* --- COIN (Star) --- */}
                {data.type === ObjectType.COIN && (
                     <mesh rotation={[0, 0, 0]}>
                         <cylinderGeometry args={[0.5, 0.5, 0.1, 5]} />
                         <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
                     </mesh>
                )}

                {/* --- TREE (Decor) --- */}
                {data.type === ObjectType.TREE && (
                    <group position={[0, 1.5, 0]}>
                        <mesh position={[0, -0.75, 0]} castShadow geometry={TREE_TRUNK_GEO}>
                             <meshStandardMaterial color="#5D4037" />
                        </mesh>
                        <mesh position={[0, 1, 0]} castShadow geometry={TREE_LEAVES_GEO}>
                             <meshStandardMaterial color="#22c55e" />
                        </mesh>
                         <mesh position={[0, 2.5, 0]} scale={[0.8, 0.8, 0.8]} castShadow geometry={TREE_LEAVES_GEO}>
                             <meshStandardMaterial color="#4ade80" />
                        </mesh>
                    </group>
                )}

                {/* --- SHOP PORTAL --- */}
                {data.type === ObjectType.SHOP_PORTAL && (
                    <group>
                        <mesh position={[0, 2, 0]} geometry={SHOP_FRAME_GEO}>
                             <meshStandardMaterial color="#8B4513" />
                        </mesh>
                        <mesh position={[0, 5, 0]} geometry={SHOP_ROOF_GEO}>
                             <meshStandardMaterial color="#ef4444" />
                        </mesh>
                        <Center position={[0, 3, 0.6]}>
                             <Text3D font={FONT_URL} size={0.5} height={0.1}>
                                 SHOP
                                 <meshStandardMaterial color="#ffff00" />
                             </Text3D>
                         </Center>
                    </group>
                )}
            </group>
        </group>
    );
});