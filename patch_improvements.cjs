const fs = require('fs');

// Patch App.tsx Demoish
let appPath = 'App.tsx';
let appContent = fs.readFileSync(appPath, 'utf8');

const demolishTarget = `            const refund = currentTile.level && currentTile.level > 1 ? (currentTile.level - 1) * 20 : 0;
            newGrid[y][x] = { ...currentTile, buildingType: BuildingType.None, level: 1 };
            setGrid(newGrid);
            setStats(prev => ({ ...prev, money: prev.money - demolishCost + refund }));`;
            
const demolishReplace = `            const baseCost = BUILDINGS[currentTile.buildingType]?.cost || 0;
            const refund = Math.floor(baseCost * 0.5) + (currentTile.level && currentTile.level > 1 ? (currentTile.level - 1) * 25 : 0);
            newGrid[y][x] = { ...currentTile, buildingType: BuildingType.None, level: 1 };
            setGrid(newGrid);
            setStats(prev => ({ ...prev, money: prev.money - demolishCost + refund }));`;

appContent = appContent.replace(demolishTarget, demolishReplace);

fs.writeFileSync(appPath, appContent);

// Patch UIOverlay.tsx
let uiPath = 'components/UIOverlay.tsx';
let uiContent = fs.readFileSync(uiPath, 'utf8');

const importTarget = `import { BUILDINGS } from '../constants';`;
const importReplace = `import { BUILDINGS } from '../constants';\nimport { Pickaxe, Milestone, Home, Store, Factory, TreePine, Trees, Waves, Search, ArrowUpCircle } from 'lucide-react';`;
uiContent = uiContent.replace(importTarget, importReplace);

const toolButtonTarget = `      <div className="w-6 h-6 md:w-8 md:h-8 rounded mb-0.5 md:mb-1 border border-black/30 shadow-inner flex items-center justify-center overflow-hidden" style={{ backgroundColor: isDemolish ? 'transparent' : bgColor }}>
        {isDemolish && <div className="w-full h-full bg-red-600 text-white flex justify-center items-center font-bold text-base md:text-lg">✕</div>}
        {type === BuildingType.Road && <div className="w-full h-2 bg-gray-800 transform -rotate-45"></div>}
      </div>
      <span className="text-[8px] md:text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-md leading-none">{config.name}</span>
      {config.cost > 0 && (
        <span className={\`text-[8px] md:text-[10px] font-mono leading-none \${canAfford ? 'text-green-300' : 'text-red-400'}\`}>$\${config.cost}</span>
      )}`;
      
const toolButtonReplace = `      <div className="w-6 h-6 md:w-8 md:h-8 rounded mb-0.5 md:mb-1 border border-black/30 shadow-inner flex items-center justify-center overflow-hidden" style={{ backgroundColor: isDemolish ? 'transparent' : bgColor }}>
        {type === BuildingType.Demolish && <div className="w-full h-full bg-red-600 text-white flex justify-center items-center"><Pickaxe size={16} /></div>}
        {type === BuildingType.Inspect && <div className="w-full h-full bg-purple-500 text-white flex justify-center items-center"><Search size={16} className="text-white" /></div>}
        {type === BuildingType.Upgrade && <div className="w-full h-full bg-yellow-500 text-white flex justify-center items-center"><ArrowUpCircle size={16} className="text-white" /></div>}
        {type === BuildingType.Road && <Milestone size={18} className="text-gray-100" />}
        {type === BuildingType.Residential && <Home size={18} className="text-white" />}
        {type === BuildingType.Commercial && <Store size={18} className="text-white" />}
        {type === BuildingType.Industrial && <Factory size={18} className="text-white" />}
        {type === BuildingType.Park && <TreePine size={18} className="text-white" />}
        {type === BuildingType.ParkPlayground && <Trees size={18} className="text-white" />}
        {type === BuildingType.ParkFountain && <Waves size={18} className="text-white" />}
      </div>
      <span className="text-[8px] md:text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-md leading-none">{config.name}</span>
      <div className="flex flex-col items-center gap-0.5 text-[8px] md:text-[9px]">
        {config.cost > 0 && (
          <span className={\`font-mono leading-none \${canAfford ? 'text-yellow-300' : 'text-red-400'}\`}>-$\${config.cost}</span>
        )}
        {(config.incomeGen !== 0 || config.popGen !== 0) && (
            <div className="flex gap-1 bg-black/40 px-1 rounded-sm">
               {config.incomeGen !== 0 && <span className={\`font-mono leading-none \${config.incomeGen > 0 ? 'text-green-400' : 'text-red-400'}\`}>{config.incomeGen > 0 ? '+' : ''}\${config.incomeGen}/d</span>}
               {config.popGen > 0 && <span className="font-mono leading-none text-blue-300">+{config.popGen} 👤</span>}
            </div>
        )}
      </div>`;
uiContent = uiContent.replace(toolButtonTarget, toolButtonReplace);

fs.writeFileSync(uiPath, uiContent);
console.log("Patched App and UI Overlay");
