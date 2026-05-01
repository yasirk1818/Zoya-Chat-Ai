import React from "react";
import { MicOff, X, ShieldAlert, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

interface PermissionModalProps {
  onClose: () => void;
}

export default function PermissionModal({ onClose }: PermissionModalProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-3xl p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        className="w-full max-w-lg glass-dark rounded-[40px] p-10 shadow-[0_40px_120px_rgba(0,0,0,0.8)] flex flex-col items-center text-center relative overflow-hidden border border-white/10"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50" />
        
        <div className="w-24 h-24 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-10 relative">
          <MicOff size={40} className="text-rose-400 relative z-10" />
          <motion.div 
            animate={{ opacity: [0.1, 0.4, 0.1], scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full"
          />
        </div>

        <h2 className="text-3xl font-black text-white mb-4 tracking-tight px-4">
          Neural Uplink <span className="text-rose-500">Severed</span>
        </h2>
        
        <p className="text-rose-50/40 text-sm mb-10 leading-relaxed max-w-[320px] font-medium uppercase tracking-wider">
          Microphone access is required to establish a stable connection with Zoya's consciousness.
        </p>

        <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 text-left w-full mb-10 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert size={14} className="text-indigo-400" />
            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em]">Restoration Protocol</p>
          </div>
          <ol className="text-xs text-white/50 list-decimal pl-5 space-y-4 font-semibold tracking-wide">
            <li>Locate the <span className="text-rose-400">Lock Icon</span> or <span className="text-rose-400">Shield</span> in your browser's address bar.</li>
            <li>Identify <span className="text-indigo-400 font-black">Microphone</span> settings.</li>
            <li>Switch priority to <span className="text-rose-400 font-black">ALLOW</span> and re-initialize.</li>
          </ol>
        </div>

        <div className="flex flex-col sm:flex-row w-full gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.reload()}
            className="flex-1 py-5 px-6 bg-white text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-rose-50 transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/5"
          >
            <RefreshCw size={14} />
            Re-Initialize
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 py-5 px-6 bg-white/5 text-white/40 font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-white/10 transition-colors border border-white/5 flex items-center justify-center gap-2"
          >
            <X size={14} />
            Dismiss
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
