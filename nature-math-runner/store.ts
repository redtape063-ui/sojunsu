/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { create } from 'zustand';
import { GameStatus, RUN_SPEED_BASE, MathProblem } from './types';

interface GameState {
  status: GameStatus;
  score: number;
  lives: number;
  maxLives: number;
  speed: number;
  level: number;
  laneCount: number;
  distance: number;
  
  // Math Game State
  currentProblem: MathProblem;
  solvedCount: number;
  
  // Inventory / Abilities
  hasDoubleJump: boolean;
  hasImmortality: boolean;
  isImmortalityActive: boolean;

  // Actions
  startGame: () => void;
  restartGame: () => void;
  takeDamage: () => void;
  addScore: (amount: number) => void;
  submitAnswer: (value: number) => boolean; // Returns true if correct
  
  setStatus: (status: GameStatus) => void;
  setDistance: (dist: number) => void;
  
  // Shop / Abilities
  buyItem: (type: 'DOUBLE_JUMP' | 'MAX_LIFE' | 'HEAL' | 'IMMORTAL', cost: number) => boolean;
  openShop: () => void;
  closeShop: () => void;
  activateImmortality: () => void;
}

const generateNewProblem = (level: number): MathProblem => {
    // 2-digit + 2-digit
    // Difficulty scales slightly with level
    const min = 10;
    const max = 45 + (level * 5); // Level 1: up to 50, Level 2: 55, etc.
    
    const num1 = Math.floor(Math.random() * (max - min + 1)) + min;
    const num2 = Math.floor(Math.random() * (max - min + 1)) + min;
    
    return {
        num1,
        num2,
        answer: num1 + num2
    };
};

export const useStore = create<GameState>((set, get) => ({
  status: GameStatus.MENU,
  score: 0,
  lives: 3,
  maxLives: 3,
  speed: 0,
  level: 1,
  laneCount: 3,
  distance: 0,
  
  currentProblem: { num1: 10, num2: 10, answer: 20 },
  solvedCount: 0,
  
  hasDoubleJump: false,
  hasImmortality: false,
  isImmortalityActive: false,

  startGame: () => {
      const initialProblem = generateNewProblem(1);
      set({ 
        status: GameStatus.PLAYING, 
        score: 0, 
        lives: 3, 
        maxLives: 3,
        speed: RUN_SPEED_BASE,
        level: 1,
        laneCount: 3,
        distance: 0,
        hasDoubleJump: false,
        hasImmortality: false,
        isImmortalityActive: false,
        solvedCount: 0,
        currentProblem: initialProblem
      });
  },

  restartGame: () => {
      const initialProblem = generateNewProblem(1);
      set({ 
        status: GameStatus.PLAYING, 
        score: 0, 
        lives: 3, 
        maxLives: 3,
        speed: RUN_SPEED_BASE,
        level: 1,
        laneCount: 3,
        distance: 0,
        currentProblem: initialProblem,
        solvedCount: 0,
        isImmortalityActive: false
      });
  },

  setStatus: (status) => set({ status }),

  takeDamage: () => {
      const { lives, status, hasImmortality } = get();
      if (status !== GameStatus.PLAYING) return;
      
      const newLives = lives - 1;
      if (newLives <= 0) {
          set({ lives: 0, status: GameStatus.GAME_OVER, speed: 0 });
      } else {
          set({ lives: newLives });
      }
  },

  addScore: (amount) => set(state => ({ score: state.score + amount })),

  submitAnswer: (value) => {
      const { currentProblem, level, solvedCount } = get();
      
      if (value === currentProblem.answer) {
          // Correct!
          const newSolved = solvedCount + 1;
          const newLevel = Math.floor(newSolved / 5) + 1; // Level up every 5 problems
          
          set(state => ({
              score: state.score + 500,
              solvedCount: newSolved,
              level: newLevel,
              currentProblem: generateNewProblem(newLevel),
              // Increase speed slightly with level
              speed: RUN_SPEED_BASE + (newLevel * 1.5)
          }));
          return true;
      } else {
          // Wrong!
          get().takeDamage();
          return false;
      }
  },

  setDistance: (dist) => set({ distance: dist }),

  openShop: () => set({ status: GameStatus.SHOP }),
  closeShop: () => set({ status: GameStatus.PLAYING }),

  buyItem: (id, cost) => {
      const state = get();
      if (state.score >= cost) {
          const updates: Partial<GameState> = { score: state.score - cost };
          
          if (id === 'DOUBLE_JUMP') updates.hasDoubleJump = true;
          if (id === 'MAX_LIFE') {
              updates.maxLives = state.maxLives + 1;
              updates.lives = state.lives + 1;
          }
          if (id === 'HEAL') updates.lives = Math.min(state.lives + 1, state.maxLives);
          if (id === 'IMMORTAL') updates.hasImmortality = true;

          set(updates);
          return true;
      }
      return false;
  },

  activateImmortality: () => {
      const { hasImmortality, isImmortalityActive } = get();
      if (hasImmortality && !isImmortalityActive) {
          set({ isImmortalityActive: true, hasImmortality: false });
          setTimeout(() => {
              set({ isImmortalityActive: false });
          }, 5000);
      }
  }
}));