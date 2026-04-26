/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Cpu, ChevronRight, Activity, Zap, Layers, Focus } from 'lucide-react';

interface StartScreenProps {
  onStart: (aiEnabled: boolean) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 200 } }
};

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [aiEnabled, setAiEnabled] = useState(true);

  return (
    <div className="absolute inset-0 z-50 flex pointer-events-auto font-sans overflow-hidden">
      
      {/* Left Panel: Premium SaaS Layout */}
      <motion.div 
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', damping: 35, stiffness: 200 }}
        className="w-full md:w-[45vw] lg:w-[40vw] h-full bg-[#050505]/95 backdrop-blur-3xl relative border-r border-white/5 flex flex-col justify-center px-8 md:px-16"
      >
        <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-cyan-900/20 to-transparent pointer-events-none"></div>

        <motion.div variants={containerVariants} initial="hidden" animate="show" className="relative z-10 max-w-lg">
          
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-cyan-100">Premium Alpha Engine</span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="font-display text-5xl md:text-7xl font-bold leading-[0.9] tracking-tighter text-white mb-6">
            Build the Future.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
              Powered by AI.
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-gray-400 text-base md:text-lg mb-10 leading-relaxed font-light">
            Step into the role of Mayor in a procedurally generated metropolis where Artificial Intelligence drives the economy, dictates city goals, and creates breaking news.
          </motion.p>

          {/* AI Toggle Box */}
          <motion.div variants={itemVariants} className="bg-white/[0.03] p-5 md:p-6 rounded-2xl border border-white/10 mb-10 hover:bg-white/[0.05] transition-colors relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-cyan-500/5 group-hover:to-cyan-500/10 transition-colors"></div>
            
            <label className="flex items-start md:items-center justify-between cursor-pointer relative z-10 w-full">
              <div className="flex gap-4 items-center">
                <div className={`p-3 rounded-xl border transition-colors ${aiEnabled ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                  <Cpu size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-lg text-white">Gemini Advisor</span>
                  <span className="text-sm text-gray-500">Dynamic quests & civilian feedback</span>
                </div>
              </div>
              
              <div className="relative flex-shrink-0 mt-2 md:mt-0 ml-4">
                <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={aiEnabled}
                    onChange={(e) => setAiEnabled(e.target.checked)}
                />
                <div className="w-12 h-6 bg-gray-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-white border border-gray-700"></div>
              </div>
            </label>
          </motion.div>

          {/* CTA */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 mb-12">
            <button 
              onClick={() => onStart(aiEnabled)}
              className="flex-1 flex items-center justify-center gap-3 py-4 px-8 rounded-full font-bold tracking-tight text-white transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 animate-bg-pan bg-[length:200%_auto] z-0 opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute inset-[2px] bg-black/50 rounded-full z-0 group-hover:bg-black/30 transition-colors"></div>
              <span className="relative z-10">Initialize Simulation</span>
              <ChevronRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* Feature Micro-Labels */}
          <motion.div variants={itemVariants} className="flex gap-8 border-t border-white/10 pt-8">
            <div className="flex flex-col gap-2">
              <Activity size={16} className="text-cyan-400" />
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Dynamic Econ</span>
            </div>
            <div className="flex flex-col gap-2">
              <Layers size={16} className="text-blue-400" />
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Procedural Gen</span>
            </div>
            <div className="flex flex-col gap-2">
              <Zap size={16} className="text-amber-400" />
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Live Traffic</span>
            </div>
          </motion.div>

        </motion.div>
      </motion.div>

      {/* Right Panel: Transparent view with Live Preview Badge */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 2 }}
        className="hidden md:flex flex-1 relative pointer-events-none"
      >
         <div className="absolute bottom-12 right-12 flex items-center gap-3 px-5 py-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
            <Focus size={16} className="text-cyan-400" />
            <span className="text-xs uppercase tracking-widest font-bold text-white">Live Engine Preview</span>
         </div>
      </motion.div>

    </div>
  );
};

export default StartScreen;