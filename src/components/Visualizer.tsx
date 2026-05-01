import React from "react";
import { motion, AnimatePresence } from "motion/react";

type VisualizerState = "idle" | "listening" | "processing" | "speaking";

interface VisualizerProps {
  state: VisualizerState;
}

export default function Visualizer({ state }: VisualizerProps) {
  const getTheme = () => {
    switch (state) {
      case "listening":
        return { color: "#f43f5e", glow: "rgba(244,63,94,0.4)", border: "border-rose-500/30", text: "SIGNAL_CAPTURE" };
      case "processing":
        return { color: "#22d3ee", glow: "rgba(34,211,238,0.4)", border: "border-cyan-500/30", text: "NEURAL_SYNC" };
      case "speaking":
        return { color: "#6366f1", glow: "rgba(99,102,241,0.4)", border: "border-indigo-500/30", text: "VOICE_SYNTH" };
      default:
        return { color: "#ffffff", glow: "rgba(255,255,255,0.05)", border: "border-white/10", text: "NEXUS_STBY" };
    }
  };

  const theme = getTheme();

  return (
    <div className="relative w-full h-full flex items-center justify-center perspective-1000">
      {/* Dynamic Background Glow */}
      <motion.div
        animate={{ 
          scale: state === "idle" ? 1 : 1.4,
          opacity: state === "idle" ? 0.2 : 0.5,
          backgroundColor: theme.color
        }}
        transition={{ duration: 2, ease: "easeInOut" }}
        className="absolute w-72 h-72 md:w-[500px] md:h-[500px] rounded-full blur-[140px] transition-all duration-1000"
      />

      {/* Main Rings System */}
      <div className="relative flex items-center justify-center w-[240px] h-[240px] sm:w-[300px] sm:h-[300px] md:w-[450px] md:h-[450px] lg:w-[500px] lg:h-[500px]">
        
        {/* Tech Grid Overlays */}
        <div className="absolute inset-0 bg-grid opacity-5 rounded-full" />
        
        {/* Scanning Line */}
        <div className="scanline rounded-full opacity-30" />

        {/* Outer Orbitals with Data Bits */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={`outer-${i}`}
            animate={{ 
              rotate: i % 2 === 0 ? 360 : -360,
              scale: state !== "idle" ? 1 + (i * 0.08) : 1
            }}
            transition={{ duration: 25 + (i * 12), repeat: Infinity, ease: "linear" }}
            className={`absolute inset-0 rounded-full border-[1px] ${theme.border} opacity-20`}
            style={{ width: `${100 + (i * 10)}%`, height: `${100 + (i * 10)}%` }}
          >
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white opacity-40 shadow-[0_0_10px_white]`} />
            {state !== 'idle' && i === 1 && (
              <div className="absolute top-[20%] left-0 text-[8px] font-mono text-white/20 whitespace-nowrap tracking-widest hidden sm:block">
                0x{Math.random().toString(16).slice(2, 10).toUpperCase()}
              </div>
            )}
          </motion.div>
        ))}

        {/* Floating Hexagons or Tech Shards */}
        <div className="absolute inset-0 pointer-events-none scale-75 sm:scale-100">
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <motion.div
              key={angle}
              animate={{
                opacity: state !== 'idle' ? [0.1, 0.4, 0.1] : 0.05,
                scale: state !== 'idle' ? [1, 1.1, 1] : 1
              }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
              style={{
                transform: `rotate(${angle}deg) translateY(-140px)`,
              }}
              className="absolute top-1/2 left-1/2 -ml-2 -mt-2 sm:translate-y-[-220px]"
            >
              <div className={`w-3 h-3 md:w-4 md:h-4 border border-white/20 rotate-45 flex items-center justify-center`}>
                <div className={`w-0.5 h-0.5 md:w-1 md:h-1 bg-${state === 'idle' ? 'white/20' : 'brand-rose'}`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Inner Core System */}
        <motion.div 
          animate={{ 
            scale: state === "listening" ? [1, 1.15, 1] : state === "speaking" ? [1, 1.08, 1] : 1,
            boxShadow: `0 0 ${state === "idle" ? 30 : 80}px ${theme.color}22`
          }}
          transition={{ duration: 0.6, repeat: state === "idle" ? 0 : Infinity }}
          className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-64 md:h-64 rounded-full flex items-center justify-center z-10 p-1"
        >
          {/* Glass Layer */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl border border-white/20 rounded-full z-20 shadow-[inset_0_0_50px_rgba(255,255,255,0.05)] overflow-hidden">
            {/* Spinning Arc Overlay */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[10%] border-t-2 border-brand-rose/40 rounded-full blur-[1px]"
            />
          </div>
          
          {/* Core Content */}
          <div className="relative z-30 flex flex-col items-center">
            <motion.div 
              animate={{ opacity: state !== "idle" ? [0.4, 1, 0.4] : 0.4 }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-[7px] sm:text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] text-white/40 mb-2 sm:mb-3 font-mono"
            >
              {theme.text}
            </motion.div>
            <div className="relative">
              <motion.div
                layout
                className="text-2xl sm:text-4xl md:text-6xl font-black tracking-tighter text-white transition-all italic"
                style={{ textShadow: state !== 'idle' ? `0 0 30px ${theme.color}` : 'none' }}
              >
                {state === 'idle' ? 'ZOYA' : 'SYNC'}
              </motion.div>
              {state !== 'idle' && (
                <motion.div 
                  animate={{ scaleX: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -bottom-2 left-0 w-full h-[1px] bg-white opacity-50 origin-left"
                />
              )}
            </div>
            
            {/* Visualizer Bars */}
            <div className="mt-4 sm:mt-8 flex gap-1 sm:gap-2 h-3 sm:h-4 items-center">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <motion.div
                  key={i}
                  animate={state !== 'idle' ? { 
                    height: [4, 15, 4],
                    backgroundColor: theme.color,
                    opacity: [0.3, 1, 0.3]
                  } : { height: 2, backgroundColor: "rgba(255,255,255,0.1)", opacity: 1 }}
                  transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.08 }}
                  className="w-[2px] sm:w-[3px] rounded-full shadow-[0_0_8px_currentColor]"
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Global HUD Text Readouts */}
        {state !== 'idle' && (
          <div className="absolute w-full h-full pointer-events-none opacity-40 font-mono text-[8px] hidden md:block">
            <div className="absolute top-0 right-0 tracking-widest">LATENCY: 12ms</div>
            <div className="absolute bottom-0 left-0 tracking-widest">BITRATE: 120kbps</div>
          </div>
        )}

      </div>
    </div>
  );
}
