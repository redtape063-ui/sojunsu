/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useEffect } from 'react';
import { Heart, Trophy, MapPin, ShoppingBag, ArrowUpCircle, Shield, Activity, PlusCircle, Play, Calculator } from 'lucide-react';
import { useStore } from '../../store';
import { GameStatus, ShopItem, RUN_SPEED_BASE } from '../../types';
import { audio } from '../System/Audio';

// Available Shop Items
const SHOP_ITEMS: ShopItem[] = [
    {
        id: 'DOUBLE_JUMP',
        name: 'DOUBLE JUMP',
        description: 'Jump again in mid-air to reach higher!',
        cost: 1000,
        icon: ArrowUpCircle,
        oneTime: true
    },
    {
        id: 'MAX_LIFE',
        name: 'EXTRA HEART',
        description: 'Permanently adds a heart slot and heals you.',
        cost: 1500,
        icon: Activity
    },
    {
        id: 'HEAL',
        name: 'FIRST AID',
        description: 'Restores 1 Heart instantly.',
        cost: 800,
        icon: PlusCircle
    },
    {
        id: 'IMMORTAL',
        name: 'SUPER STAR',
        description: 'Use to become invincible for 5s!',
        cost: 2500,
        icon: Shield,
        oneTime: true
    }
];

const ShopScreen: React.FC = () => {
    const { score, buyItem, closeShop, hasDoubleJump, hasImmortality } = useStore();
    const [items, setItems] = useState<ShopItem[]>([]);

    useEffect(() => {
        let pool = SHOP_ITEMS.filter(item => {
            if (item.id === 'DOUBLE_JUMP' && hasDoubleJump) return false;
            if (item.id === 'IMMORTAL' && hasImmortality) return false;
            return true;
        });
        setItems(pool);
    }, []);

    return (
        <div className="absolute inset-0 bg-green-900/90 z-[100] text-white pointer-events-auto backdrop-blur-md overflow-y-auto font-game">
             <div className="flex flex-col items-center justify-center min-h-full py-8 px-4">
                 <h2 className="text-4xl md:text-5xl font-bold text-yellow-300 mb-2 drop-shadow-md">NATURE SHOP</h2>
                 <div className="flex items-center text-white mb-8 bg-green-800 px-6 py-2 rounded-full border border-green-600">
                     <span className="text-xl mr-2">POINTS:</span>
                     <span className="text-2xl font-bold text-yellow-300">{score.toLocaleString()}</span>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full mb-8">
                     {items.map(item => {
                         const Icon = item.icon;
                         const canAfford = score >= item.cost;
                         return (
                             <div key={item.id} className="bg-green-800/80 border-2 border-green-600 p-6 rounded-2xl flex flex-col items-center text-center shadow-lg hover:scale-105 transition-transform">
                                 <div className="bg-green-700 p-4 rounded-full mb-4">
                                     <Icon className="w-8 h-8 text-yellow-300" />
                                 </div>
                                 <h3 className="text-xl font-bold mb-2 text-white">{item.name}</h3>
                                 <p className="text-green-200 text-sm mb-4 h-12 flex items-center justify-center">{item.description}</p>
                                 <button 
                                    onClick={() => buyItem(item.id as any, item.cost)}
                                    disabled={!canAfford}
                                    className={`px-6 py-3 rounded-xl font-bold w-full text-base shadow-md transition-colors ${
                                        canAfford 
                                        ? 'bg-yellow-400 text-green-900 hover:bg-yellow-300' 
                                        : 'bg-gray-600 cursor-not-allowed opacity-50'
                                    }`}
                                 >
                                     {item.cost} PTS
                                 </button>
                             </div>
                         );
                     })}
                 </div>

                 <button 
                    onClick={closeShop}
                    className="flex items-center px-10 py-4 bg-blue-500 text-white font-bold text-xl rounded-full hover:bg-blue-400 transition-all shadow-lg border-b-4 border-blue-700 active:border-b-0 active:translate-y-1"
                 >
                     CONTINUE RUN <Play className="ml-2 w-6 h-6" fill="white" />
                 </button>
             </div>
        </div>
    );
};

export const HUD: React.FC = () => {
  const { score, lives, maxLives, status, level, restartGame, startGame, distance, isImmortalityActive, currentProblem, solvedCount } = useStore();

  const containerClass = "absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 z-50 font-game";

  if (status === GameStatus.SHOP) return <ShopScreen />;

  if (status === GameStatus.MENU) {
      return (
          <div className="absolute inset-0 flex items-center justify-center z-[100] bg-sky-300/50 backdrop-blur-sm p-4 pointer-events-auto">
              <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-white transform hover:scale-[1.01] transition-transform">
                <div className="bg-sky-400 p-8 flex flex-col items-center">
                     <Calculator className="w-20 h-20 text-white mb-4 drop-shadow-md" />
                     <h1 className="text-5xl font-black text-white drop-shadow-md text-center mb-2 font-game">NATURE MATH</h1>
                     <p className="text-sky-100 text-xl font-bold mb-6">RUN & SOLVE!</p>
                     
                     <button 
                          onClick={() => { audio.init(); startGame(); }}
                          className="w-full max-w-xs group relative px-8 py-5 bg-yellow-400 text-yellow-900 font-black text-2xl rounded-2xl hover:bg-yellow-300 transition-all shadow-[0_4px_0_rgb(180,83,9)] active:shadow-none active:translate-y-1"
                        >
                            <span className="flex items-center justify-center">
                                START GAME <Play className="ml-3 w-6 h-6 fill-current" />
                            </span>
                        </button>
                        
                        <p className="mt-6 text-white/80 font-bold bg-sky-500/50 px-4 py-2 rounded-lg text-sm">
                            Use Arrow Keys or Swipe to Move
                        </p>
                </div>
              </div>
          </div>
      );
  }

  if (status === GameStatus.GAME_OVER) {
      return (
          <div className="absolute inset-0 bg-black/80 z-[100] text-white pointer-events-auto backdrop-blur-sm flex items-center justify-center font-game">
              <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border-4 border-white/20 flex flex-col items-center max-w-md w-full">
                <h1 className="text-5xl font-black text-red-400 mb-6 drop-shadow-md">TRY AGAIN!</h1>
                
                <div className="w-full space-y-3 mb-8">
                    <div className="bg-black/40 p-4 rounded-xl flex justify-between items-center">
                        <span className="text-gray-300 flex items-center"><Trophy className="mr-2 w-5 h-5"/> Score</span>
                        <span className="text-2xl font-bold text-yellow-400">{score}</span>
                    </div>
                    <div className="bg-black/40 p-4 rounded-xl flex justify-between items-center">
                        <span className="text-gray-300 flex items-center"><Calculator className="mr-2 w-5 h-5"/> Solved</span>
                        <span className="text-2xl font-bold text-green-400">{solvedCount}</span>
                    </div>
                </div>

                <button 
                  onClick={() => { audio.init(); restartGame(); }}
                  className="px-10 py-4 bg-green-500 text-white font-black text-xl rounded-full hover:bg-green-400 transition-all shadow-lg border-b-4 border-green-700 active:border-b-0 active:translate-y-1"
                >
                    PLAY AGAIN
                </button>
              </div>
          </div>
      );
  }

  return (
    <div className={containerClass}>
        {/* Header */}
        <div className="flex justify-between items-start w-full">
            <div className="flex flex-col">
                <div className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-full border-2 border-white/40">
                    <span className="text-4xl font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
                        {score.toLocaleString()}
                    </span>
                </div>
            </div>
            
            <div className="flex space-x-1">
                {[...Array(maxLives)].map((_, i) => (
                    <Heart 
                        key={i} 
                        className={`w-8 h-8 md:w-10 md:h-10 ${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-400/50 fill-gray-400/50'} drop-shadow-sm`} 
                    />
                ))}
            </div>
        </div>
        
        {/* Math Problem Display - Center Top */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4">
            <div className="bg-white/90 backdrop-blur border-4 border-blue-400 rounded-2xl p-4 shadow-xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                <span className="text-4xl md:text-5xl font-black text-gray-800 tracking-wider">
                    {currentProblem.num1} + {currentProblem.num2} = <span className="text-blue-500">?</span>
                </span>
            </div>
            <div className="text-center mt-2">
                <span className="bg-black/40 text-white px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm">
                    LEVEL {level}
                </span>
            </div>
        </div>

        {/* Active Powerup */}
        {isImmortalityActive && (
             <div className="absolute top-48 left-1/2 transform -translate-x-1/2 bg-yellow-400/90 text-yellow-900 px-6 py-2 rounded-full font-bold text-xl animate-pulse flex items-center border-2 border-white shadow-lg">
                 <Shield className="mr-2 w-6 h-6" /> INVINCIBLE
             </div>
        )}

        {/* Bottom Info */}
        <div className="w-full flex justify-between items-end opacity-80">
             <div className="bg-black/30 px-4 py-1 rounded-full text-white font-bold flex items-center">
                <MapPin className="w-4 h-4 mr-2" /> {Math.floor(distance)}m
             </div>
        </div>
    </div>
  );
};