import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, Volume2, VolumeX, Keyboard, Send, Trash2, X, MessageSquare, ShieldAlert } from "lucide-react";
import { getZoyaResponse, getZoyaAudio, resetZoyaSession } from "./services/geminiService";
import { processCommand } from "./services/commandService";
import { LiveSessionManager } from "./services/liveService";
import Visualizer from "./components/Visualizer";
import PermissionModal from "./components/PermissionModal";
import { playPCM } from "./utils/audioUtils";
import { motion, AnimatePresence } from "motion/react";

// Pre-emptive fetch fix as fallback
if (typeof window !== 'undefined') {
  try {
    const originalFetch = window.fetch;
    if (Object.getOwnPropertyDescriptor(window, 'fetch')?.get && !Object.getOwnPropertyDescriptor(window, 'fetch')?.set) {
      Object.defineProperty(window, 'fetch', {
        get: () => originalFetch,
        set: () => { console.warn("Blocked attempt to overwrite read-only fetch"); },
        configurable: true
      });
    }
  } catch (e) {
    // Already defined or restricted
  }
}

type AppState = "idle" | "listening" | "processing" | "speaking";

interface ChatMessage {
  id: string;
  sender: "user" | "zoya";
  text: string;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("zoya_chat_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    return [];
  });
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
    localStorage.setItem("zoya_chat_history", JSON.stringify(messages));
  }, [messages]);

  const [isMuted, setIsMuted] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const liveSessionRef = useRef<LiveSessionManager | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, appState]);

  const handleTextCommand = useCallback(async (finalTranscript: string) => {
    if (!finalTranscript.trim()) {
      setAppState("idle");
      return;
    }

    setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "user", text: finalTranscript }]);
    
    if (isSessionActive && liveSessionRef.current) {
      liveSessionRef.current.sendText(finalTranscript);
      return;
    }

    setAppState("processing");
    const commandResult = processCommand(finalTranscript);
    let responseText = "";

    try {
      if (commandResult.isBrowserAction) {
        responseText = commandResult.action;
        setMessages((prev) => [...prev, { id: Date.now().toString() + "-z", sender: "zoya", text: responseText }]);
        
        if (!isMuted) {
          setAppState("speaking");
          const audioBase64 = await getZoyaAudio(responseText);
          if (audioBase64) {
            await playPCM(audioBase64);
          }
        }
        setAppState("idle");
        setTimeout(() => {
          if (commandResult.url) {
            window.open(commandResult.url, "_blank");
          }
        }, 1500);
      } else {
        responseText = await getZoyaResponse(finalTranscript, messagesRef.current);
        setMessages((prev) => [...prev, { id: Date.now().toString() + "-z", sender: "zoya", text: responseText }]);
        
        if (!isMuted) {
          setAppState("speaking");
          const audioBase64 = await getZoyaAudio(responseText);
          if (audioBase64) {
            await playPCM(audioBase64);
          }
        }
        setAppState("idle");
      }
    } catch (err) {
      console.error("Command processing error:", err);
      setAppState("idle");
    }
  }, [isMuted, isSessionActive]);

  useEffect(() => {
    return () => {
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = async () => {
    if (isSessionActive) {
      setIsSessionActive(false);
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
        liveSessionRef.current = null;
      }
      setAppState("idle");
      resetZoyaSession();
    } else {
      try {
        setIsSessionActive(true);
        resetZoyaSession();
        
        const session = new LiveSessionManager();
        session.isMuted = isMuted;
        liveSessionRef.current = session;
        
        session.onStateChange = (state) => {
          setAppState(state);
        };
        
        session.onMessage = (sender, text) => {
          setMessages((prev) => [...prev, { id: Date.now().toString() + "-" + sender, sender, text }]);
        };
        
        session.onCommand = (url) => {
          setTimeout(() => {
            window.open(url, "_blank");
          }, 1000);
        };

        await session.start();
      } catch (e) {
        console.error("Failed to start session", e);
        setShowPermissionModal(true);
        setIsSessionActive(false);
        setAppState("idle");
      }
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    handleTextCommand(textInput);
    setTextInput("");
    setShowTextInput(false);
  };

  const clearHistory = () => {
    if (confirm("Purge all neural logs? This action is irreversible.")) {
      setMessages([]);
      localStorage.removeItem("zoya_chat_history");
      resetZoyaSession();
    }
  };

  return (
    <div className="h-[100dvh] w-screen bg-[#020202] text-white flex flex-col font-sans relative overflow-hidden m-0 p-0 selection-rose">
      {/* Background Ambience & Grid */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none z-[60]" />
      <div className="absolute inset-0 bg-grid opacity-[0.02] pointer-events-none z-0" />
      <div className="scanline z-[55] opacity-20" />
      
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-indigo-950/20 blur-[180px] rounded-full animate-float-slow animate-glow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-rose-950/20 blur-[180px] rounded-full animate-float animate-glow" style={{ animationDelay: '-7s' }} />
      </div>

      {/* HUD Corner Elements */}
      <div className="absolute top-0 left-0 w-12 h-12 sm:w-24 sm:h-24 border-t-2 border-l-2 border-rose-500/30 m-2 sm:m-4 pointer-events-none z-[70] rounded-tl-xl sm:rounded-tl-3xl opacity-50 sm:opacity-100" />
      <div className="absolute top-0 right-0 w-12 h-12 sm:w-24 sm:h-24 border-t-2 border-r-2 border-indigo-500/30 m-2 sm:m-4 pointer-events-none z-[70] rounded-tr-xl sm:rounded-tr-3xl opacity-50 sm:opacity-100" />
      <div className="absolute bottom-0 left-0 w-12 h-12 sm:w-24 sm:h-24 border-b-2 border-l-2 border-cyan-500/30 m-2 sm:m-4 pointer-events-none z-[70] rounded-bl-xl sm:rounded-bl-3xl opacity-50 sm:opacity-100" />
      <div className="absolute bottom-0 right-0 w-12 h-12 sm:w-24 sm:h-24 border-b-2 border-r-2 border-rose-500/30 m-2 sm:m-4 pointer-events-none z-[70] rounded-br-xl sm:rounded-br-3xl opacity-50 sm:opacity-100" />

      {/* Decorative HUD Lines */}
      <div className="absolute top-1/2 left-4 h-32 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent z-[70] hidden xl:block" />
      <div className="absolute top-1/2 right-4 h-32 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent z-[70] hidden xl:block" />

      <AnimatePresence>
        {showPermissionModal && (
          <PermissionModal onClose={() => setShowPermissionModal(false)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="relative w-full flex justify-between items-center z-50 px-5 py-4 sm:px-8 sm:py-6 md:px-12 lg:px-20 border-none transition-all">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 sm:gap-5 group cursor-pointer"
          onClick={() => window.location.reload()}
        >
          <div className="relative">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-rose-500 via-indigo-600 to-cyan-500 p-[1.5px] shadow-[0_0_30px_rgba(244,63,94,0.3)] transition-transform group-hover:scale-110">
              <div className="w-full h-full rounded-[11px] sm:rounded-[14.5px] bg-black flex items-center justify-center font-black text-xl sm:text-2xl text-white">
                Z
              </div>
            </div>
            {isSessionActive && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 border-2 border-black rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tighter text-white flex items-center gap-2">
              ZOYA <span className="text-[8px] sm:text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 px-1.5 py-0.5 rounded-md tracking-widest font-mono">CORE_VX</span>
            </h1>
            <p className="text-[7px] sm:text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-white/20 font-black">Neural Interface Interface</p>
          </div>
        </motion.div>

        <div className="flex items-center gap-2 sm:gap-4">
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: "rgba(99,102,241,0.15)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all border ${showHistory ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-white/5 border-white/10 text-white/30'}`}
          >
            <MessageSquare size={18} className="sm:w-[22px] sm:h-[22px]" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: isMuted ? "rgba(244,63,94,0.2)" : "rgba(34,211,238,0.15)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all border ${isMuted ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]'}`}
          >
            {isMuted ? <VolumeX size={18} className="sm:w-[22px] sm:h-[22px]" /> : <Volume2 size={18} className="sm:w-[22px] sm:h-[22px]" />}
          </motion.button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 relative flex flex-col lg:flex-row overflow-hidden z-10">
        
        {/* Core HUD Area */}
        <section className={`
          flex-1 relative flex items-center justify-center transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1)
          ${showHistory ? 'lg:pr-[400px]' : ''}
        `}>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none scale-100 sm:scale-110">
            <Visualizer state={appState} />
          </div>

          <div className="absolute bottom-4 sm:bottom-12 flex flex-col items-center gap-4 sm:gap-6 z-20">
            <AnimatePresence mode="wait">
              {appState !== "idle" && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  className={`
                    px-5 py-2 sm:px-8 sm:py-3 rounded-xl sm:rounded-2xl glass-dark border flex items-center gap-3 sm:gap-4 shadow-2xl backdrop-blur-3xl
                    ${appState === "listening" ? "border-rose-500/30 text-rose-400" : "border-cyan-500/30 text-cyan-400"}
                  `}
                >
                  {appState === "listening" ? (
                    <>
                      <div className="flex gap-1 items-center h-3 sm:h-4">
                        {[1, 2, 3].map(i => (
                          <motion.span key={i} animate={{ height: [4, 16, 4] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }} className="w-0.5 sm:w-1 bg-rose-500 rounded-full" />
                        ))}
                      </div>
                      <span className="text-[9px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">Capturing Intent</span>
                    </>
                  ) : appState === "processing" ? (
                    <>
                      <Loader2 className="animate-spin w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-[9px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">Syncing Synapses</span>
                    </>
                  ) : (
                    <>
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
                      <span className="text-[9px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">Audio Synthesis</span>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Sidebar History Drawer */}
        <AnimatePresence>
          {showHistory && (
            <motion.aside 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 200 }}
              className="fixed lg:absolute top-0 right-0 h-full w-full sm:w-[320px] md:w-[450px] bg-black/90 backdrop-blur-3xl border-l border-white/10 z-[100] flex flex-col shadow-[-30px_0_100px_rgba(0,0,0,1)]"
            >
              <div className="p-6 sm:p-10 pb-4 sm:pb-8 flex justify-between items-end border-b border-white/10 relative">
                <div className="absolute top-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-l-2 border-indigo-500/50 m-2" />
                <div>
                  <h3 className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.6em] text-indigo-400 mb-2 sm:mb-3 ml-1">STREAMS_0x1</h3>
                  <p className="text-xl sm:text-3xl font-black text-white italic tracking-tighter uppercase">DATA LOGS</p>
                </div>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-2 sm:p-3.5 hover:bg-white/10 rounded-xl sm:rounded-2xl transition-all text-white/30 hover:text-rose-500 border border-white/10"
                >
                  <X size={20} className="sm:w-[26px] sm:h-[26px]" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-10 scrollbar-hide flex flex-col gap-8 sm:gap-10 bg-noise opacity-[0.98]">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-10 space-y-4 sm:space-y-8 py-20 sm:py-32">
                    <ShieldAlert size={48} className="sm:w-[80px] sm:h-[80px] text-indigo-400" strokeWidth={0.5} />
                    <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.5em] sm:tracking-[0.8em]">Transmission_Null</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <motion.div 
                      key={msg.id}
                      initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                    >
                      <div className={`
                        group relative max-w-[95%] px-4 py-3 sm:px-7 sm:py-5 rounded-2xl sm:rounded-[32px] text-xs sm:text-[13px] leading-[1.6] sm:leading-[1.8] transition-all border
                        ${msg.sender === "user" 
                          ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-100 rounded-tr-none" 
                          : "bg-white/[0.02] border-white/20 text-rose-50 rounded-tl-none font-medium shadow-lg"}
                      `}>
                        <div className="absolute top-1.5 right-3 text-[7px] opacity-10 font-mono hidden group-hover:block uppercase tracking-widest">
                          {msg.sender === 'user' ? 'USR' : 'ZOYA'}
                        </div>
                        {msg.text}
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/10 mt-2 sm:mt-4 px-2 sm:px-3 flex items-center gap-1.5 sm:gap-2">
                        <span className={`w-1 h-1 rounded-full ${msg.sender === 'user' ? 'bg-indigo-500' : 'bg-rose-500'}`} />
                        {msg.sender === "user" ? "UPLINK_STX" : "SYNC_ACK"}
                      </span>
                    </motion.div>
                  ))
                )}
                <div ref={messagesEndRef} className="h-4 sm:h-8" />
              </div>

              <div className="p-6 sm:p-10 pt-0 mt-auto bg-black/40">
                <button
                  onClick={clearHistory}
                  disabled={messages.length === 0}
                  className="w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/20 text-rose-500/50 hover:text-rose-400 transition-all text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] disabled:opacity-0"
                >
                  SYSTEM_MEMORY_WIPE
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>

      {/* Controller Block */}
      <footer className="relative w-full pb-8 sm:pb-14 md:pb-24 px-4 sm:px-6 flex flex-col items-center z-50">
        
        <AnimatePresence>
          {showTextInput && (
            <motion.form 
              initial={{ opacity: 0, y: 60, filter: 'blur(30px)', scale: 0.9 }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
              exit={{ opacity: 0, y: 60, filter: 'blur(30px)', scale: 0.9 }}
              onSubmit={handleTextSubmit}
              className="absolute top-[-90px] sm:top-[-110px] w-full max-w-2xl px-4 sm:px-6 flex items-center gap-3 sm:gap-5"
            >
              <div className="flex-1 glass-dark rounded-3xl sm:rounded-[40px] border border-white/20 p-1.5 sm:p-2.5 pl-6 sm:pl-10 flex items-center shadow-2xl group overflow-hidden">
                <input 
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="COMMAND..."
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/10 text-xs sm:text-lg font-black italic tracking-[0.1em] py-3 sm:py-4 uppercase"
                  autoFocus
                />
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!textInput.trim()}
                  className="w-10 h-10 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[28px] bg-gradient-to-br from-brand-rose via-brand-indigo to-brand-cyan disabled:opacity-10 flex items-center justify-center transition-all shadow-xl"
                >
                  <Send size={16} className="sm:w-[24px] sm:h-[24px] text-white" strokeWidth={3} />
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-4 sm:gap-8 md:gap-12">
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.08)" }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowTextInput(!showTextInput)}
            className={`p-4 sm:p-7 rounded-[22px] sm:rounded-[35px] transition-all border ${showTextInput ? 'bg-brand-rose/20 border-brand-rose/60 text-brand-rose' : 'bg-white/5 border-white/10 text-white/30'}`}
          >
            {showTextInput ? <X size={20} className="sm:w-[28px] sm:h-[28px]" /> : <Keyboard size={20} className="sm:w-[28px] sm:h-[28px]" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleListening}
            className={`
              relative group flex items-center gap-4 sm:gap-10 px-8 py-5 sm:px-16 sm:py-8 rounded-3xl sm:rounded-[45px] font-black tracking-[0.2em] sm:tracking-[0.5em] italic transition-all duration-700 shadow-2xl overflow-hidden border-2
              ${
                isSessionActive
                  ? "bg-brand-rose/10 text-brand-rose border-brand-rose/50 shadow-[0_0_40px_rgba(244,63,94,0.3)]"
                  : "bg-white text-black border-white hover:shadow-[0_0_50px_rgba(255,255,255,0.2)]"
              }
            `}
          >
            <div className="absolute inset-0 bg-noise opacity-5 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-rose/20 via-brand-indigo/10 to-brand-cyan/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative flex items-center gap-3 sm:gap-6">
              {isSessionActive ? (
                <>
                  <div className="relative">
                    <MicOff size={22} className="sm:w-[32px] sm:h-[32px]" strokeWidth={3} />
                    <motion.div 
                      animate={{ scale: [1, 2, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-brand-rose/40 -z-10 blur-md"
                    />
                  </div>
                  <span className="text-[10px] sm:text-xl font-black">STOP</span>
                </>
              ) : (
                <>
                  <Mic size={22} className="sm:w-[32px] sm:h-[32px]" strokeWidth={3} />
                  <span className="text-[10px] sm:text-xl font-black uppercase">LINK</span>
                </>
              )}
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.08)" }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowHistory(!showHistory)}
            className={`p-4 sm:p-7 rounded-[22px] sm:rounded-[35px] transition-all border ${showHistory ? 'bg-brand-indigo/20 border-brand-indigo/60 text-brand-indigo' : 'bg-white/5 border-white/10 text-white/30'}`}
          >
            <MessageSquare size={20} className="sm:w-[28px] sm:h-[28px]" />
          </motion.button>
        </div>
        
        {/* HUD Metrics - Only on Desktop */}
        <div className="absolute bottom-6 flex items-center gap-10 opacity-20 font-mono text-[9px] tracking-[0.5em] hidden xl:flex font-black uppercase">
          <div className="flex items-center gap-2"><div className="w-1 h-1 bg-brand-rose rounded-full" /> CPU_LOAD: 21%</div>
          <div className="flex items-center gap-2"><div className="w-1 h-1 bg-brand-indigo rounded-full" /> SYN_SENS: 0.99</div>
          <div className="flex items-center gap-2"><div className="w-1 h-1 bg-brand-cyan rounded-full" /> LINK_STBL: 100%</div>
        </div>
      </footer>
    </div>
  );
}
