/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { ReactThreeFiber } from '@react-three/fiber';
import * as THREE from 'three';

export enum GameStatus {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  SHOP = 'SHOP',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export enum ObjectType {
  OBSTACLE = 'OBSTACLE', // Logs/Rocks
  COIN = 'COIN',         // Floating stars/coins
  MATH_ANSWER = 'MATH_ANSWER', // Bubble with number
  SHOP_PORTAL = 'SHOP_PORTAL',
  TREE = 'TREE' // Decor
}

export interface GameObject {
  id: string;
  type: ObjectType;
  position: [number, number, number]; // x, y, z
  active: boolean;
  value?: number; // For math answers
  isCorrect?: boolean; // Is this the right answer?
  color?: string;
  points?: number;
}

export interface MathProblem {
    num1: number;
    num2: number;
    answer: number;
}

export const LANE_WIDTH = 2.5; // Slightly wider for ease
export const JUMP_HEIGHT = 2.5;
export const RUN_SPEED_BASE = 16.0; // Kid friendly speed
export const SPAWN_DISTANCE = 120;
export const REMOVE_DISTANCE = 20;

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    icon: any; 
    oneTime?: boolean;
}

// Augment JSX namespace to include Three.js elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: ReactThreeFiber.Object3DNode<THREE.AmbientLight, typeof THREE.AmbientLight>;
      pointLight: ReactThreeFiber.Object3DNode<THREE.PointLight, typeof THREE.PointLight>;
      directionalLight: ReactThreeFiber.Object3DNode<THREE.DirectionalLight, typeof THREE.DirectionalLight>;
      group: ReactThreeFiber.Object3DNode<THREE.Group, typeof THREE.Group>;
      mesh: ReactThreeFiber.Object3DNode<THREE.Mesh, typeof THREE.Mesh>;
      meshStandardMaterial: ReactThreeFiber.MaterialNode<THREE.MeshStandardMaterial, typeof THREE.MeshStandardMaterial>;
      meshBasicMaterial: ReactThreeFiber.MaterialNode<THREE.MeshBasicMaterial, typeof THREE.MeshBasicMaterial>;
      meshPhysicalMaterial: ReactThreeFiber.MaterialNode<THREE.MeshPhysicalMaterial, typeof THREE.MeshPhysicalMaterial>;
      planeGeometry: ReactThreeFiber.BufferGeometryNode<THREE.PlaneGeometry, typeof THREE.PlaneGeometry>;
      circleGeometry: ReactThreeFiber.BufferGeometryNode<THREE.CircleGeometry, typeof THREE.CircleGeometry>;
      sphereGeometry: ReactThreeFiber.BufferGeometryNode<THREE.SphereGeometry, typeof THREE.SphereGeometry>;
      cylinderGeometry: ReactThreeFiber.BufferGeometryNode<THREE.CylinderGeometry, typeof THREE.CylinderGeometry>;
      coneGeometry: ReactThreeFiber.BufferGeometryNode<THREE.ConeGeometry, typeof THREE.ConeGeometry>;
    }
  }
}
