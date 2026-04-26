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
  
  // --- AI State ---
  const [currentGoal, setCurrentGoal] = useState<AIGoal | null>(null);
  const [isGeneratingGoal, setIsGeneratingGoal] = useState(false);
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>([]);
  
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
           newWeather = choices[Math.floor(Math.random() * choices.length)];
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

    // Bulldoze logic
    if (tool === BuildingType.None) {
      if (currentTile.buildingType !== BuildingType.None) {
        const demolishCost = 5;
        if (currentStats.money >= demolishCost) {
            const newGrid = currentGrid.map(row => [...row]);
            newGrid[y][x] = { ...currentTile, buildingType: BuildingType.None };
            setGrid(newGrid);
            setStats(prev => ({ ...prev, money: prev.money - demolishCost }));
            // Sound effect here
        } else {
            addNewsItem({id: Date.now().toString(), text: "Cannot afford demolition costs.", type: 'negative'});
        }
      }
      return;
    }

    // Upgrade Logic
    if (tool === BuildingType.Upgrade) {
       if (currentTile.buildingType !== BuildingType.None && currentTile.buildingType !== BuildingType.Road) {
           const currentLevel = currentTile.level || 1;
           if (currentLevel >= 3) {
                addNewsItem({id: Date.now().toString() + Math.random(), text: "Building is already at max level.", type: 'neutral'});
                return;
           }
           const upgradeCost = 100 * currentLevel;
           if (currentStats.money >= upgradeCost) {
               const newGrid = currentGrid.map(row => [...row]);
               newGrid[y][x] = { ...currentTile, level: currentLevel + 1 };
               setGrid(newGrid);
               setStats(prev => ({ ...prev, money: prev.money - upgradeCost }));
               addNewsItem({id: Date.now().toString() + Math.random(), text: `Citizen: "Wow, the new ${BUILDINGS[currentTile.buildingType].name} upgrade looks amazing!"`, type: 'positive'});
           } else {
               addNewsItem({id: Date.now().toString() + Math.random(), text: "Insufficient funds to upgrade building.", type: 'negative'});
           }
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
      />
      
      {/* Start Screen Overlay */}
      {!gameStarted && (
        <StartScreen onStart={handleStart} />
      )}

      {/* UI Layer */}
      {gameStarted && (
        <UIOverlay
          stats={stats}
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
          currentGoal={currentGoal}
          newsFeed={newsFeed}
          onClaimReward={handleClaimReward}
          isGeneratingGoal={isGeneratingGoal}
          aiEnabled={aiEnabled}
        />
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