const fs = require('fs');

const content = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useRef } from 'react';
import { BuildingType, CityStats, AIGoal, NewsItem } from '../types';
import { BUILDINGS } from '../constants';
import { Sun, CloudRain, CloudSnow, Search } from 'lucide-react';

interface UIOverlayProps {
  stats: CityStats;
  selectedTool: BuildingType;
  onSelectTool: (type: BuildingType) => void;
  currentGoal: AIGoal | null;
  newsFeed: NewsItem[];
  onClaimReward: () => void;
  isGeneratingGoal: boolean;
  aiEnabled: boolean;
  maxCars: number;
  setMaxCars: (n: number) => void;
}

const tools = [
  BuildingType.Demolish,
  BuildingType.Road,
  BuildingType.Residential,
  BuildingType.Commercial,
  BuildingType.Industrial,
  BuildingType.Park,
  BuildingType.ParkPlayground,
  BuildingType.ParkFountain,
  BuildingType.Upgrade,
  BuildingType.Inspect,
];

const IsoIcon = ({ type, isDemolish }: { type: BuildingType, isDemolish: boolean }) => {
  if (isDemolish) {
     return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md transition-transform group-hover:scale-110">
           <polygon points="10,40 50,20 90,40 50,60" fill="#ef4444" opacity="0.8"/>
           <polygon points="10,40 50,60 50,90 10,70" fill="#dc2626" opacity="0.8"/>
           <polygon points="50,60 90,40 90,70 50,90" fill="#991b1b" opacity="0.8"/>
           <path d="M 30,50 L 70,70 M 30,70 L 70,50" stroke="white" strokeWidth="6" strokeLinecap="round" />
        </svg>
     )
  }
  if (type === BuildingType.Inspect) {
     return <Search size={26} strokeWidth={3} className="text-white drop-shadow-lg transition-transform group-hover:scale-110" />
  }
  if (type === BuildingType.Road) {
     return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md pb-1 transition-transform group-hover:scale-110">
           <polygon points="10,50 50,30 90,50 50,70" fill="#475569" />
           <polygon points="10,50 50,70 50,80 10,60" fill="#334155" />
           <polygon points="50,70 90,50 90,60 50,80" fill="#1e293b" />
           <line x1="30" y1="40" x2="70" y2="60" stroke="#fbbf24" strokeWidth="2.5" strokeDasharray="5 5" />
        </svg>
     );
  }
  if (type === BuildingType.Upgrade) {
     return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md transition-transform group-hover:scale-110">
           <polygon points="10,45 50,25 90,45 50,65" fill="#fbbf24" />
           <polygon points="10,45 50,65 50,85 10,65" fill="#f59e0b" />
           <polygon points="50,65 90,45 90,65 50,85" fill="#d97706" />
           <path d="M 50,75 L 50,40 M 40,50 L 50,35 L 60,50" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
     )
  }
  if (type === BuildingType.Residential) {
     return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md pb-1 transition-transform group-hover:scale-110" style={{ transform: 'translateY(5%)' }}>
           <polygon points="20,55 50,70 50,90 20,75" fill="#f1f5f9" />
           <polygon points="50,70 80,55 80,75 50,90" fill="#cbd5e1" />
           <polygon points="10,50 50,30 50,70" fill="#ef4444" />
           <polygon points="50,70 50,30 90,50" fill="#dc2626" />
           <polygon points="10,50 50,30 90,50 50,70" fill="#f87171" opacity="0.2"/>
        </svg>
     )
  }
  if (type === BuildingType.Commercial) {
     return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md pb-1 transition-transform group-hover:scale-110" style={{ transform: 'translateY(5%)' }}>
           <polygon points="10,45 50,65 50,85 10,65" fill="#93c5fd" />
           <polygon points="50,65 90,45 90,65 50,85" fill="#60a5fa" />
           <polygon points="10,45 50,25 90,45 50,65" fill="#e2e8f0" />
           <polygon points="20,50 45,62.5 45,75 20,62.5" fill="#1e40af" opacity="0.6"/>
           <polygon points="55,62.5 80,50 80,62.5 55,75" fill="#1e40af" opacity="0.6"/>
        </svg>
     )
  }
  if (type === BuildingType.Industrial) {
     return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md pb-1 transition-transform group-hover:scale-110" style={{ transform: 'translateY(5%)' }}>
           <polygon points="10,45 50,65 50,85 10,65" fill="#fde047" />
           <polygon points="50,65 90,45 90,65 50,85" fill="#eab308" />
           <polygon points="10,45 50,25 90,45 50,65" fill="#fef08a" />
           <polygon points="35,10 43,6 51,10 51,35 43,39 35,35" fill="#94a3b8" />
           <polygon points="35,10 43,14 51,10" fill="#cbd5e1" opacity="0.5" />
           <polygon points="55,15 63,11 71,15 71,45 63,49 55,45" fill="#94a3b8" />
           <polygon points="55,15 63,19 71,15" fill="#cbd5e1" opacity="0.5" />
        </svg>
     )
  }
  if (type === BuildingType.Park) {
     return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md pb-1 transition-transform group-hover:scale-110">
           <polygon points="10,50 50,30 90,50 50,70" fill="#86efac" />
           <polygon points="10,50 50,70 50,80 10,60" fill="#4ade80" />
           <polygon points="50,70 90,50 90,60 50,80" fill="#22c55e" />
           <polygon points="50,15 35,45 65,45" fill="#22c55e" />
           <polygon points="50,15 65,45 50,50" fill="#16a34a" />
        </svg>
     )
  }
  if (type === BuildingType.ParkPlayground) {
     return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md pb-1 transition-transform group-hover:scale-110">
           <polygon points="10,50 50,30 90,50 50,70" fill="#86efac" />
           <polygon points="10,50 50,70 50,80 10,60" fill="#4ade80" />
           <polygon points="50,70 90,50 90,60 50,80" fill="#22c55e" />
           <circle cx="45" cy="40" r="10" fill="#fbbf24" />
           <rect x="55" y="30" width="8" height="15" fill="#ef4444" />
        </svg>
     )
  }
  if (type === BuildingType.ParkFountain) {
     return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md pb-1 transition-transform group-hover:scale-110">
           <polygon points="10,50 50,30 90,50 50,70" fill="#86efac" />
           <polygon points="10,50 50,70 50,80 10,60" fill="#4ade80" />
           <polygon points="50,70 90,50 90,60 50,80" fill="#22c55e" />
           <ellipse cx="50" cy="45" rx="18" ry="9" fill="#94a3b8" />
           <ellipse cx="50" cy="44" rx="16" ry="7" fill="#3b82f6" opacity="0.9" />
           <path d="M 50,44 Q 40,25 45,44 M 50,44 Q 60,25 55,44 M 50,44 L 50,20" stroke="#bfdbfe" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
     )
  }
  return <div className="w-full h-full bg-gray-500 rounded-sm"></div>;
}

const WeatherWidget = ({ weather }: { weather: string }) => {
  const isRainy = weather === 'rainy';
  const isSnowy = weather === 'snowy';
  const isSunny = !isRainy && !isSnowy;

  return (
    <div className={\`relative flex items-center justify-center w-8 h-8 rounded-full border shadow-lg backdrop-blur-md transition-all duration-1000
      \${isRainy ? 'border-blue-400/50 bg-blue-900/40 text-blue-400' :
        isSnowy ? 'border-indigo-300/50 bg-indigo-900/40 text-white' :
        'border-yellow-400/50 bg-yellow-900/30 text-yellow-400'}\`}
    >
      {isSunny && <Sun size={18} className="animate-[spin_15s_linear_infinite]" />}
      {isRainy && (
        <div className="relative flex items-center justify-center h-full w-full">
          <CloudRain size={16} className="absolute -top-[1px] opacity-90 drop-shadow-md" />
          <div className="absolute top-[18px] flex gap-[2px]">
            <div className="w-[1.5px] h-[6px] bg-blue-300 rounded-full animate-[bounce_1s_infinite]"></div>
            <div className="w-[1.5px] h-[6px] bg-blue-300 rounded-full animate-[bounce_1s_infinite_0.2s]"></div>
            <div className="w-[1.5px] h-[6px] bg-blue-300 rounded-full animate-[bounce_1s_infinite_0.4s]"></div>
          </div>
        </div>
      )}
      {isSnowy && (
        <div className="relative flex items-center justify-center h-full w-full">
           <CloudSnow size={16} className="absolute -top-[1px] opacity-90 drop-shadow-md" />
           <div className="absolute top-[18px] flex gap-[3px]">
             <div className="w-[3px] h-[3px] bg-white rounded-full animate-[pulse_1.5s_infinite]"></div>
             <div className="w-[3px] h-[3px] bg-white rounded-full animate-[pulse_1.5s_infinite_0.5s]"></div>
             <div className="w-[3px] h-[3px] bg-white rounded-full animate-[pulse_1.5s_infinite_1s]"></div>
           </div>
        </div>
      )}
    </div>
  );
}

const ToolButton: React.FC<{
  type: BuildingType;
  isSelected: boolean;
  onClick: () => void;
  money: number;
}> = ({ type, isSelected, onClick, money }) => {
  const config = BUILDINGS[type];
  const canAfford = money >= config.cost;
  const isDemolish = type === BuildingType.Demolish;

  return (
    <button
      onClick={onClick}
      disabled={!isDemolish && !canAfford}
      className={\`
        group relative flex flex-col items-center justify-between p-1 md:p-2 rounded-xl transition-all shadow-md flex-shrink-0
        w-[4.8rem] h-20 md:w-[5.2rem] md:h-[6rem] outline-none
        border \${isSelected 
            ? 'border-white/80 bg-gradient-to-b from-white/20 to-white/5 scale-105 z-10 shadow-[0_0_20px_rgba(255,255,255,0.2)] ring-2 ring-white/30' 
            : 'border-slate-600/50 bg-slate-800/80 hover:bg-slate-700/80 hover:border-slate-500/80'}
        \${!isDemolish && !canAfford ? 'opacity-40 cursor-not-allowed grayscale-[0.6]' : 'cursor-pointer'}
      \`}
      title={config.description}
    >
      <div className="w-9 h-9 md:w-11 md:h-11 flex items-center justify-center pointer-events-none mt-1">
         <IsoIcon type={type} isDemolish={isDemolish} />
      </div>

      <div className="flex flex-col items-center gap-0 w-full pointer-events-none mb-0.5">
        <span className="text-[9px] md:text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-md leading-none text-center">
            {config.name}
        </span>
        <div className="flex flex-col items-center mt-[1px]">
          {config.cost > 0 && (
            <span className={\`text-[9px] font-mono leading-none font-bold \${canAfford ? 'text-yellow-400' : 'text-red-400'}\`}>-$\${config.cost}</span>
          )}
          {(config.incomeGen !== 0 || config.popGen !== 0) && (
              <div className="flex gap-1 bg-black/40 px-1 py-[1.5px] rounded border border-white/5 shadow-inner mt-[2px]">
                 {config.incomeGen !== 0 && <span className={\`text-[8px] font-mono leading-none \${config.incomeGen > 0 ? 'text-green-400' : 'text-red-400'}\`}>{config.incomeGen > 0 ? '+' : ''}\${config.incomeGen}/d</span>}
                 {config.popGen > 0 && <span className="text-[8px] font-mono leading-none text-blue-300">+{config.popGen}👤</span>}
              </div>
          )}
        </div>
      </div>
    </button>
  );
};

const UIOverlay: React.FC<UIOverlayProps> = ({
  stats,
  selectedTool,
  onSelectTool,
  currentGoal,
  newsFeed,
  onClaimReward,
  isGeneratingGoal,
  aiEnabled,
  maxCars,
  setMaxCars
}) => {
  const newsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (newsRef.current) {
      newsRef.current.scrollTop = newsRef.current.scrollHeight;
    }
  }, [newsFeed]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 md:p-4 font-sans z-10">
      
      {/* Top Bar: Stats & Goal */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start pointer-events-auto gap-3 w-full max-w-full">
        
        {/* Stats */}
        <div className="bg-slate-900/90 text-white p-2 md:p-3 rounded-2xl border border-slate-700 shadow-2xl backdrop-blur-xl flex gap-3 md:gap-6 items-center justify-between w-full md:w-auto mt-1 md:mt-0">
          <div className="flex flex-col pl-2">
            <span className="text-[8px] md:text-[10px] text-gray-400 uppercase font-bold tracking-widest leading-tight">Treasury</span>
            <span className="text-xl md:text-2xl font-black text-green-400 font-mono drop-shadow-md leading-none mt-1">\${stats.money.toLocaleString()}</span>
          </div>
          <div className="w-px h-8 md:h-10 bg-slate-700/80"></div>
          <div className="flex flex-col pl-1">
            <span className="text-[8px] md:text-[10px] text-gray-400 uppercase font-bold tracking-widest leading-tight">Citizens</span>
            <span className="text-lg md:text-xl font-bold text-blue-300 font-mono drop-shadow-md leading-none mt-1">{stats.population.toLocaleString()}</span>
          </div>
          <div className="w-px h-8 md:h-10 bg-slate-700/80"></div>
          <div className="flex flex-col pr-1 items-end">
             <span className="text-[8px] md:text-[10px] text-gray-400 uppercase font-bold tracking-widest leading-tight">Day</span>
             <span className="text-lg md:text-xl font-bold text-white font-mono leading-none mt-1">{stats.day}</span>
          </div>
          <div className="w-px h-8 md:h-10 bg-slate-700/80"></div>
          <div className="flex flex-col pr-1 items-end">
             <span className="text-[8px] md:text-[10px] text-gray-400 uppercase font-bold tracking-widest leading-tight">Joy</span>
             <span className={\`text-lg md:text-xl font-bold font-mono leading-none mt-1 \${stats.happiness >= 60 ? 'text-green-300' : stats.happiness < 40 ? 'text-red-400' : 'text-yellow-300'}\`}>{stats.happiness}%</span>
          </div>
          <div className="w-px h-8 md:h-10 bg-slate-700/80"></div>
          <div className="flex flex-col items-center pr-2">
             <span className="text-[8px] md:text-[10px] text-gray-400 uppercase font-bold tracking-widest leading-tight mb-1">Weather</span>
             <WeatherWidget weather={stats.weather} />
          </div>
        </div>

        {/* AI Goal Panel */}
        <div className={\`w-full md:w-80 bg-slate-900/90 text-white rounded-2xl border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)] backdrop-blur-xl overflow-hidden transition-all \${!aiEnabled ? 'opacity-80 grayscale-[0.5]' : ''}\`}>
          <div className="bg-indigo-900/40 px-3 md:px-4 py-2 flex justify-between items-center border-b border-slate-700">
            <span className="font-bold uppercase text-[10px] md:text-xs tracking-widest flex items-center gap-2">
              {aiEnabled ? (
                <>
                  <span className={\`w-2 h-2 rounded-full shadow-[0_0_5px_currentColor] \${isGeneratingGoal ? 'bg-yellow-400 text-yellow-400 animate-ping' : 'bg-cyan-400 text-cyan-400 animate-pulse'}\`}></span>
                  AI Advisor
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  Sandbox
                </>
              )}
            </span>
            {isGeneratingGoal && aiEnabled && <span className="text-[10px] animate-pulse text-yellow-300 font-mono">Thinking...</span>}
          </div>
          
          <div className="p-3 md:p-4">
            {aiEnabled ? (
              currentGoal ? (
                <>
                  <p className="text-sm font-medium text-slate-200 mb-2 md:mb-3 leading-snug drop-shadow-md">"{currentGoal.description}"</p>
                  
                  <div className="flex justify-between items-center mt-2 bg-slate-950/60 p-2 rounded-xl border border-slate-700/50 shadow-inner">
                    <div className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider font-semibold">
                      Goal: <span className="font-mono text-white tracking-normal ml-1">
                        {currentGoal.targetType === 'building_count' ? BUILDINGS[currentGoal.buildingType!].name : 
                         currentGoal.targetType === 'money' ? '$' : 'Pop.'} {currentGoal.targetValue}
                      </span>
                    </div>
                    <div className="text-[11px] md:text-xs text-yellow-400 font-bold font-mono bg-yellow-900/30 px-2 py-1 rounded-md border border-yellow-600/40 shadow-sm">
                      +\${currentGoal.reward}
                    </div>
                  </div>
  
                  {currentGoal.completed && (
                    <button
                      onClick={onClaimReward}
                      className="mt-3 w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold py-2 px-4 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all animate-bounce text-xs uppercase tracking-widest border border-green-400/50"
                    >
                      Collect Reward
                    </button>
                  )}
                </>
              ) : (
                <div className="text-xs text-gray-400 py-3 italic flex items-center justify-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200"></span>
                  </span>
                  Analyzing grid data...
                </div>
              )
            ) : (
              <div className="text-xs md:text-sm text-slate-400 py-1 text-center font-mono">
                 Free play active.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar: Tools & News */}
      <div className="flex flex-col-reverse md:flex-row md:justify-between md:items-end pointer-events-auto mt-auto gap-3 w-full max-w-full pb-2 md:pb-0">
        
        <div className="flex gap-1 md:gap-2 bg-slate-900/85 p-1.5 md:p-2 rounded-2xl border border-slate-700/80 backdrop-blur-xl shadow-2xl w-full md:w-auto overflow-x-auto no-scrollbar justify-start items-center">
          <div className="flex gap-1.5 md:gap-2 min-w-max px-1">
            {tools.map((type) => (
              <ToolButton
                key={type}
                type={type}
                isSelected={selectedTool === type}
                onClick={() => onSelectTool(type)}
                money={stats.money}
              />
            ))}
          </div>
        </div>

        {/* Traffic Controls hidden on mobile to declutter */}
        <div className="hidden md:flex flex-col gap-2 p-2.5 bg-slate-900/85 rounded-2xl border border-slate-700/80 backdrop-blur-xl shadow-2xl items-center justify-center min-w-[120px]">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">Traffic Cap</div>
          <div className="flex items-center gap-4">
             <button onClick={() => setMaxCars(Math.max(0, maxCars - 2))} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold transition-colors">-</button>
             <span className="text-white font-mono text-lg font-bold w-6 text-center">{maxCars}</span>
             <button onClick={() => setMaxCars(Math.min(50, maxCars + 2))} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold transition-colors">+</button>
          </div>
        </div>

        {/* News Feed */}
        <div className="w-full md:w-80 h-28 md:h-36 bg-slate-900/85 text-white rounded-2xl border border-slate-700/80 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden relative">
          <div className="bg-slate-800/80 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-slate-700 flex justify-between items-center z-20 shadow-sm">
            <span>City Feed</span>
            <span className={\`w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor] \${aiEnabled ? 'bg-red-500 text-red-500 animate-pulse' : 'bg-gray-500'}\`}></span>
          </div>
          
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-20 z-10"></div>
          
          <div ref={newsRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 text-[10px] md:text-xs font-mono scroll-smooth z-20">
            {newsFeed.length === 0 && <div className="text-gray-500 italic text-center mt-6">No active news stream.</div>}
            {newsFeed.map((news) => (
              <div key={news.id} className={\`
                border-l-2 pl-3 py-1 transition-all animate-fade-in leading-relaxed relative
                \${news.type === 'positive' ? 'border-emerald-500 text-emerald-200 bg-emerald-900/10' : ''}
                \${news.type === 'negative' ? 'border-rose-500 text-rose-200 bg-rose-900/10' : ''}
                \${news.type === 'neutral' ? 'border-blue-400 text-blue-200 bg-blue-900/10' : ''}
              \`}>
                <span className="opacity-50 text-[9px] absolute top-1 right-2">{new Date(Number(news.id.split('.')[0])).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                <span className="pr-10 block">{news.text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default UIOverlay;
`;

fs.writeFileSync('components/UIOverlay.tsx', content);
