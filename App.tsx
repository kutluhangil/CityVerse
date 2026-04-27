/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Grid, TileData, BuildingType, CityStats, AIGoal, NewsItem } from './types';
import { GRID_SIZE, BUILDINGS, TICK_RATE_MS, INITIAL_MONEY } from './constants';
import IsoMap from './components/IsoMap';
import UIOverlay from './components/UIOverlay';
import StartScreen from './components/StartScreen';
import { generateCityGoal, generateNewsEvent } from './services/geminiService';

const createInitialGrid = (): Grid => {
  const grid: Grid = [];
  const center = Math.floor(GRID_SIZE / 2);

  for (let y = 0; y < GRID_SIZE; y++) {
    const row: TileData[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push({ x, y, buildingType: BuildingType.None, level: 1 });
    }
    grid.push(row);
  }

  // Pre-build a small intersection and town for the live demo
  for (let x = center - 3; x <= center + 3; x++) {
    grid[center][x].buildingType = BuildingType.Road;
  }
  for (let y = center - 3; y <= center + 3; y++) {
    grid[y][center].buildingType = BuildingType.Road;
  }

  grid[center - 1][center - 1].buildingType = BuildingType.Commercial;
  grid[center - 1][center + 1].buildingType = BuildingType.Residential;
  grid[center + 1][center - 1].buildingType = BuildingType.Residential;
  grid[center + 1][center + 1].buildingType = BuildingType.ParkFountain;

  grid[center - 2][center - 1].buildingType = BuildingType.Commercial;
  grid[center - 2][center + 1].buildingType = BuildingType.Residential;
  
  grid[center + 2][center + 1].buildingType = BuildingType.ParkPlayground;
  grid[center + 2][center - 1].buildingType = BuildingType.Park;

  return grid;
};

function App() {
  // --- Game State ---
  const [gameStarted, setGameStarted] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  const [grid, setGrid] = useState<Grid>(createInitialGrid);
  const [stats, setStats] = useState<CityStats>({ money: INITIAL_MONEY, population: 0, day: 1, happiness: 100, weather: 'sunny' });
  const [selectedTool, setSelectedTool] = useState<BuildingType>(BuildingType.Road);
  const [maxCars, setMaxCars] = useState(6);
  const [inspectedTile, setInspectedTile] = useState<{x: number, y: number} | null>(null);
  
  // --- AI State ---
  const [currentGoal, setCurrentGoal] = useState<AIGoal | null>(null);
  const [isGeneratingGoal, setIsGeneratingGoal] = useState(false);
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>([]);
  const [demolishedTiles, setDemolishedTiles] = useState<{x: number, y: number, id: number, type?: BuildingType, level?: number, color?: string}[]>([]);
  
  // Refs for accessing state inside intervals without dependencies
  const gridRef = useRef(grid);
  const statsRef = useRef(stats);
  const goalRef = useRef(currentGoal);
  const aiEnabledRef = useRef(aiEnabled);

  // Sync refs
  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { statsRef.current = stats; }, [stats]);
  useEffect(() => { goalRef.current = currentGoal; }, [currentGoal]);
  useEffect(() => { aiEnabledRef.current = aiEnabled; }, [aiEnabled]);

  // --- AI Logic Wrappers ---

  const addNewsItem = useCallback((item: NewsItem) => {
    setNewsFeed(prev => [...prev.slice(-12), item]); // Keep last few
  }, []);

  const fetchNewGoal = useCallback(async () => {
    if (isGeneratingGoal || !aiEnabledRef.current) return;
    setIsGeneratingGoal(true);
    // Short delay for visual effect
    await new Promise(r => setTimeout(r, 500));
    
    const newGoal = await generateCityGoal(statsRef.current, gridRef.current);
    if (newGoal) {
      setCurrentGoal(newGoal);
    } else {
      // Retry soon if failed, but only if AI still enabled
      if(aiEnabledRef.current) setTimeout(fetchNewGoal, 5000);
    }
    setIsGeneratingGoal(false);
  }, [isGeneratingGoal]); 

  const fetchNews = useCallback(async () => {
    // chance to fetch news per tick
    if (!aiEnabledRef.current || Math.random() > 0.15) return; 
    const news = await generateNewsEvent(statsRef.current, null);
    if (news) {
      addNewsItem(news);
      if (news.type === 'negative') {
        setStats(prev => ({ ...prev, happiness: Math.max(0, prev.happiness - 10) }));
      } else if (news.type === 'positive') {
        setStats(prev => ({ ...prev, happiness: Math.min(100, prev.happiness + 5) }));
      }
    }
  }, [addNewsItem]);


  // --- Initial Setup ---
  useEffect(() => {
    if (!gameStarted) return;

    addNewsItem({ id: Date.now().toString(), text: "Welcome to SkyMetropolis. Terrain generation complete.", type: 'positive' });
    
    if (aiEnabled) {
      // @google/genai-api-key-fix: The API key's availability is a hard requirement and should not be checked in the UI.
      fetchNewGoal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted]);


  // --- Game Loop ---
  useEffect(() => {
    if (!gameStarted) return;

    const intervalId = setInterval(() => {
      // 1. Calculate income/pop gen
      let dailyIncome = 0;
      let dailyPopGrowth = 0;
      let buildingCounts: Record<string, number> = {};

      gridRef.current.flat().forEach(tile => {
        if (tile.buildingType !== BuildingType.None) {
          const config = BUILDINGS[tile.buildingType];
          const levelMultiplier = tile.level || 1;
          dailyIncome += config.incomeGen * levelMultiplier;
          dailyPopGrowth += config.popGen * levelMultiplier;
          buildingCounts[tile.buildingType] = (buildingCounts[tile.buildingType] || 0) + levelMultiplier;
        }
      });

      // Cap population growth by residential count just for some logic
      const resCount = buildingCounts[BuildingType.Residential] || 0;
      const parkCount = buildingCounts[BuildingType.Park] || 0;
      const playCount = buildingCounts[BuildingType.ParkPlayground] || 0;
      const fountCount = buildingCounts[BuildingType.ParkFountain] || 0;
      const indCount = buildingCounts[BuildingType.Industrial] || 0;
      const comCount = buildingCounts[BuildingType.Commercial] || 0;

      const maxPop = resCount * 50; // 50 people per house max

      // Happiness impacts pop growth multiplier (0.5x to 1.5x)
      const happinessMultiplier = Math.max(0.2, statsRef.current.happiness / 60);

      // 2. Update Stats
      setStats(prev => {
        let newPop = prev.population + (dailyPopGrowth * happinessMultiplier);
        if (newPop > maxPop) newPop = maxPop; // limit
        if (resCount === 0 && prev.population > 0) newPop = Math.max(0, prev.population - 5); // people leave if no homes

        // Calculate building variety
        const buildingTypesPresent = Object.keys(buildingCounts).length;
        const varietyBonus = buildingTypesPresent * 2;

        const parksPerCapitaBonus = prev.population > 0 ? ((parkCount + playCount*3 + fountCount*5) / (prev.population / 100)) * 10 : 0;
        
        let newWeather = prev.weather;
        if (Math.random() > 0.8) {
           const choices: ('sunny' | 'rainy' | 'snowy')[] = ['sunny', 'sunny', 'rainy', 'snowy'];
           const nextWeather = choices[Math.floor(Math.random() * choices.length)];
           if (nextWeather !== newWeather) {
               newWeather = nextWeather;
               if (newWeather === 'rainy' && Math.random() > 0.3) {
                   addNewsItem({id: Date.now().toString()+Math.random(), text: "Citizen: 'Make sure to bring an umbrella today!'", type: 'neutral'});
               } else if (newWeather === 'snowy' && Math.random() > 0.3) {
                   addNewsItem({id: Date.now().toString()+Math.random(), text: "Citizen: 'The snow is beautiful, but the roads are slippery.'", type: 'neutral'});
               } else if (newWeather === 'sunny' && prev.weather !== 'sunny') {
                   addNewsItem({id: Date.now().toString()+Math.random(), text: "Citizen: 'Finally, some clear skies!'", type: 'positive'});
               }
           }
        }
        
        let weatherMod = 0;
        if (newWeather === 'rainy') weatherMod = -5;
        if (newWeather === 'snowy') weatherMod = -2;
        if (newWeather === 'sunny') weatherMod = 2;

        let targetHappiness = 50 + varietyBonus + Math.min(30, parksPerCapitaBonus) + (comCount * 2) - (indCount * 4) + weatherMod;
        if (newPop > 0 && resCount > 0 && newPop >= maxPop * 0.9) {
           targetHappiness -= 15; // overcrowding
        }
        targetHappiness = Math.max(0, Math.min(100, targetHappiness));

        const currentHap = prev.happiness !== undefined ? prev.happiness : 100;
        let newHappiness = currentHap;
        if (Math.abs(targetHappiness - currentHap) > 1) {
             newHappiness = Math.round(currentHap + (targetHappiness - currentHap) * 0.1);
             
             // Dynamic citizen feedback purely based on happiness swings
             if (targetHappiness < currentHap - 10 && Math.random() > 0.5) {
                 addNewsItem({id: Date.now().toString()+Math.random(), text: "Citizen: 'The city feels so bleak lately...'", type: 'negative'});
             } else if (targetHappiness > currentHap + 10 && Math.random() > 0.5) {
                 addNewsItem({id: Date.now().toString()+Math.random(), text: "Citizen: 'Things are really looking up around here!'", type: 'positive'});
             }
        }

        const newStats = {
          money: prev.money + dailyIncome,
          population: newPop,
          day: prev.day + 1,
          happiness: newHappiness,
          weather: newWeather,
        };
        
        // 3. Check Goal Completion
        const goal = goalRef.current;
        if (aiEnabledRef.current && goal && !goal.completed) {
          let isMet = false;
          if (goal.targetType === 'money' && newStats.money >= goal.targetValue) isMet = true;
          if (goal.targetType === 'population' && newStats.population >= goal.targetValue) isMet = true;
          if (goal.targetType === 'happiness' && newStats.happiness >= goal.targetValue) isMet = true;
          if (goal.targetType === 'building_count' && goal.buildingType) {
            if ((buildingCounts[goal.buildingType] || 0) >= goal.targetValue) isMet = true;
          }

          if (isMet) {
            setCurrentGoal({ ...goal, completed: true });
          }
        }

        return newStats;
      });

      // 4. Trigger news
      fetchNews();

    }, TICK_RATE_MS);

    return () => clearInterval(intervalId);
  }, [fetchNews, gameStarted]);


  // --- Interaction Logic ---

  const handleTileClick = useCallback((x: number, y: number) => {
    if (!gameStarted) return; // Prevent clicking through start screen

    const currentGrid = gridRef.current;
    const currentStats = statsRef.current;
    const tool = selectedTool; // Capture current tool
    
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;

    const currentTile = currentGrid[y][x];
    const buildingConfig = BUILDINGS[tool];

    // Demolish logic
    if (tool === BuildingType.Demolish) {
      if (currentTile.buildingType !== BuildingType.None) {
        const demolishCost = BUILDINGS[BuildingType.Demolish].cost;
        if (currentStats.money >= demolishCost) {
            const newGrid = currentGrid.map(row => [...row]);
            // If it reached a high level, maybe give some refund
            const baseCost = BUILDINGS[currentTile.buildingType]?.cost || 0;
            const refund = Math.floor(baseCost * 0.5) + (currentTile.level && currentTile.level > 1 ? (currentTile.level - 1) * 25 : 0);
            newGrid[y][x] = { ...currentTile, buildingType: BuildingType.None, level: 1 };
            setGrid(newGrid);
            setStats(prev => ({ ...prev, money: prev.money - demolishCost + refund }));
            
            // Trigger animation
            const id = Date.now();
            setDemolishedTiles(prev => [...prev, {x, y, id, type: currentTile.buildingType, level: currentTile.level, color: BUILDINGS[currentTile.buildingType].color}]);
            setTimeout(() => {
                setDemolishedTiles(prev => prev.filter(dt => dt.id !== id));
            }, 2000);

            if (refund > 0) {
               addNewsItem({id: Date.now().toString(), text: `Refund of $${refund} received for demolishing upgraded building.`, type: 'positive'});
            }
        } else {
            addNewsItem({id: Date.now().toString(), text: "Cannot afford demolition costs.", type: 'negative'});
        }
      }
      return;
    }

    if (tool === BuildingType.Inspect) {
      if (currentTile.buildingType !== BuildingType.None && currentTile.buildingType !== BuildingType.Road) {
        setInspectedTile({x, y});
      } else {
        setInspectedTile(null);
      }
      return;
    }

    const checkRadius = (type: BuildingType, radius: number): boolean => {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx === 0 && dy === 0) continue;
          const cx = x + dx;
          const cy = y + dy;
          if (cx >= 0 && cx < GRID_SIZE && cy >= 0 && cy < GRID_SIZE) {
            if (currentGrid[cy][cx].buildingType === type) return true;
          }
        }
      }
      return false;
    };

    // Placement Logic
    if (currentTile.buildingType === BuildingType.None) {
      // Validate placement
      if (tool !== BuildingType.Road && tool !== BuildingType.Park) {
        if (!checkRadius(BuildingType.Road, 1)) {
          addNewsItem({id: Date.now().toString() + Math.random(), text: "Buildings must be placed next to a road.", type: 'negative'});
          return;
        }
      }

      if (tool === BuildingType.Industrial && checkRadius(BuildingType.Residential, 3)) {
        addNewsItem({id: Date.now().toString() + Math.random(), text: "Zoning error: Industrial cannot be within 3 blocks of Residential.", type: 'neutral'});
        return;
      }
      
      if (tool === BuildingType.Residential && checkRadius(BuildingType.Industrial, 3)) {
        addNewsItem({id: Date.now().toString() + Math.random(), text: "Zoning error: Residential cannot be within 3 blocks of Industrial.", type: 'neutral'});
        return;
      }

      if (currentStats.money >= buildingConfig.cost) {
        // Deduct cost
        setStats(prev => ({ ...prev, money: prev.money - buildingConfig.cost }));
        
        // Place building
        const newGrid = currentGrid.map(row => [...row]);
        newGrid[y][x] = { ...currentTile, buildingType: tool };
        setGrid(newGrid);
        
        if (tool === BuildingType.Park || tool === BuildingType.ParkFountain || tool === BuildingType.ParkPlayground) {
           addNewsItem({id: Date.now().toString() + Math.random(), text: `Citizen: "Finally, a new place to relax! Love the new ${buildingConfig.name}."`, type: 'positive'});
        } else if (tool === BuildingType.Industrial) {
           addNewsItem({id: Date.now().toString() + Math.random(), text: `Citizen: "Great for the economy, but I hope the smog isn't too bad..."`, type: 'neutral'});
        }
      } else {
        // Not enough money feedback
        addNewsItem({id: Date.now().toString() + Math.random(), text: `Treasury insufficient for ${buildingConfig.name}.`, type: 'negative'});
      }
    }
  }, [selectedTool, addNewsItem, gameStarted]);

  const handleClaimReward = () => {
    if (currentGoal && currentGoal.completed) {
      setStats(prev => ({ ...prev, money: prev.money + currentGoal.reward }));
      addNewsItem({id: Date.now().toString(), text: `Goal achieved! ${currentGoal.reward} deposited to treasury.`, type: 'positive'});
      setCurrentGoal(null);
      fetchNewGoal();
    }
  };

  const handleStart = (enabled: boolean) => {
    setAiEnabled(enabled);
    setGameStarted(true);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden selection:bg-transparent selection:text-transparent bg-sky-900">
      {/* 3D Rendering Layer - Always visible now, providing background for start screen */}
      <IsoMap 
        grid={grid} 
        onTileClick={handleTileClick} 
        hoveredTool={selectedTool}
        population={stats.population}
        weather={stats.weather}
        maxCars={maxCars}
        demolishedTiles={demolishedTiles}
      />
      
      {/* Start Screen Overlay */}
      {!gameStarted && (
        <StartScreen onStart={handleStart} />
      )}

      {/* UI Layer */}
      {gameStarted && (
        <>
          {/* Inspector Modal */}
      {inspectedTile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm shadow-2xl" onClick={() => setInspectedTile(null)}>
          <div className="bg-gray-900 border border-gray-600 rounded-xl p-6 w-full max-w-sm text-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">Building Inspector</h2>
              <button onClick={() => setInspectedTile(null)} className="text-gray-400 hover:text-white">&times;</button>
            </div>
            {(() => {
               const tile = grid[inspectedTile.y][inspectedTile.x];
               const bConfig = BUILDINGS[tile.buildingType];
               const currentLevel = tile.level || 1;
               const maxLevel = 3;
               const upgradeCost = 100 * currentLevel;
               
               const levelNames = ['Standard', 'Enhanced', 'Premium'];
               const currentName = levelNames[currentLevel - 1];
               const nextName = currentLevel < maxLevel ? levelNames[currentLevel] : 'Max';

               const handleUpgrade = () => {
                  if (currentLevel >= maxLevel) return;
                  if (stats.money >= upgradeCost) {
                      const newGrid = grid.map(row => [...row]);
                      newGrid[inspectedTile.y][inspectedTile.x] = { ...tile, level: currentLevel + 1 };
                      setGrid(newGrid);
                      setStats(prev => ({ ...prev, money: prev.money - upgradeCost }));
                      addNewsItem({id: Date.now().toString(), text: `Citizen: "Wow, the new ${bConfig.name} upgrade to ${nextName} looks amazing!"`, type: 'positive'});
                      setInspectedTile(null); // Close modal
                  } else {
                      addNewsItem({id: Date.now().toString(), text: "Insufficient funds to upgrade building.", type: 'negative'});
                  }
               };

               return (
                 <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-400 uppercase tracking-widest">Type</span>
                        <span className="text-lg font-mono font-bold" style={{color: bConfig.color}}>{bConfig.name}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-400 uppercase tracking-widest">Level</span>
                        <div className="flex gap-2">
                           {[1, 2, 3].map(l => (
                             <div key={l} className={`w-1/3 h-2 rounded ${l <= currentLevel ? 'bg-purple-500' : 'bg-gray-700'}`}/>
                           ))}
                        </div>
                        <span className="text-sm mt-1">{currentName}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-gray-800 rounded p-3 text-sm">
                        <div className="flex flex-col">
                           <span className="text-gray-400">Income</span>
                           <span className={bConfig.incomeGen > 0 ? "text-green-400 font-bold" : ""}>{bConfig.incomeGen * currentLevel > 0 ? '+' : ''}{bConfig.incomeGen * currentLevel} / day</span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-gray-400">Population</span>
                           <span className={bConfig.popGen > 0 ? "text-blue-400 font-bold" : ""}>{bConfig.popGen * currentLevel > 0 ? '+' : ''}{bConfig.popGen * currentLevel} / max</span>
                        </div>
                    </div>
                    {currentLevel < maxLevel ? (
                        <button
                          onClick={handleUpgrade}
                          disabled={stats.money < upgradeCost}
                          className={`mt-4 w-full py-3 rounded font-bold uppercase tracking-widest text-sm transition-colors ${stats.money >= upgradeCost ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                        >
                           Upgrade to {nextName} (${upgradeCost})
                        </button>
                    ) : (
                        <button
                          onClick={() => {
                              // Auto Demolish when max level is reached and clicked
                              const x = inspectedTile.x;
                              const y = inspectedTile.y;
                              const currentTile = grid[y][x];
                              const demolishCost = BUILDINGS[BuildingType.Demolish].cost;
                              const refund = (currentTile.level && currentTile.level > 1) ? (currentTile.level - 1) * 20 : 0;
                              
                              if (stats.money >= demolishCost) {
                                  const newGrid = grid.map(row => [...row]);
                                  newGrid[y][x] = { ...currentTile, buildingType: BuildingType.None, level: 1 };
                                  setGrid(newGrid);
                                  setStats(prev => ({ ...prev, money: prev.money - demolishCost + refund }));
                                  setInspectedTile(null); // close modal
                                  
                                  const id = Date.now();
                                  setDemolishedTiles(prev => [...prev, {x, y, id, type: currentTile.buildingType, level: currentTile.level, color: BUILDINGS[currentTile.buildingType].color}]);
                                  setTimeout(() => {
                                      setDemolishedTiles(prev => prev.filter(dt => dt.id !== id));
                                  }, 2000);
                                  
                                  if (refund > 0) {
                                     addNewsItem({id: Date.now().toString(), text: `Redeveloped a max level building for a $${refund} refund!`, type: 'positive'});
                                  }
                              }
                          }}
                          disabled={stats.money < BUILDINGS[BuildingType.Demolish].cost}
                          className="mt-4 w-full py-3 rounded bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-widest text-sm text-center transition-colors shadow-lg"
                        >
                           Redevelop (Demolish)
                        </button>
                    )}
                 </div>
               );
            })()}
          </div>
        </div>
      )}
      <UIOverlay
          stats={stats}
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
          currentGoal={currentGoal}
          newsFeed={newsFeed}
          onClaimReward={handleClaimReward}
          isGeneratingGoal={isGeneratingGoal}
          aiEnabled={aiEnabled}
          maxCars={maxCars}
          setMaxCars={setMaxCars}
        />
        </>
      )}

      {/* CSS for animations and utility */}
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .mask-image-b { -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%); mask-image: linear-gradient(to bottom, transparent 0%, black 15%); }
        
        /* Vertical text for toolbar label */
        .writing-mode-vertical { writing-mode: vertical-rl; text-orientation: mixed; }
        
        /* Custom scrollbar for news */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
}

export default App;