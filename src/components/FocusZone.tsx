import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Flame, 
  Clock, 
  Sparkles,
  Award,
  Plus,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Hourglass,
  ChevronDown,
  Volume1,
  Target,
  CheckCircle2,
  ListTodo,
  TrendingUp,
  FileText,
  Sliders,
  Music,
  Maximize2,
  SkipBack,
  SkipForward,
  Waves,
  CloudRain,
  Radio
} from "lucide-react";
import { useCollab } from "../context/CollabContext";
import { subscribeFocusSessions, saveFocusSessionToCloud, FirestoreFocusSession } from "../lib/firestoreSync";
import { motion, AnimatePresence } from "motion/react";

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface FocusTask {
  id: string;
  title: string;
  priority: "Haute" | "Moyenne" | "Basse";
  module: string;
  subTasks: SubTask[];
}

export const FocusZone: React.FC = () => {
  const { triggerNotification, currentUser, isAuthLoading } = useCollab();

  // Active view tab in focus zone: "Pomodoro" | "Focus long" | "Personnalisé"
  const [activeTab, setActiveTab] = useState<"Pomodoro" | "Focus long" | "Personnalisé">("Pomodoro");

  // Timer configurations (in minutes) corresponding to tab type
  const [pomodoroLength, setPomodoroLength] = useState(25);
  const [longFocusLength, setLongFocusLength] = useState(50);
  const [customFocusLength, setCustomFocusLength] = useState(15);

  // Core timer states
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Stats tracked
  const [todaySessions, setTodaySessions] = useState(0);
  const [completedTasksCount, setCompletedTasksCount] = useState(3);
  const [cyclesToday, setCyclesToday] = useState(0);
  const [streakDays, setStreakDays] = useState(7);

  const [focusSessions, setFocusSessions] = useState<FirestoreFocusSession[]>([]);

  // Real-time listener for focus session history log
  useEffect(() => {
    if (currentUser) {
      const unsub = subscribeFocusSessions(currentUser.uid, (cloudSessions) => {
        const sorted = [...cloudSessions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setFocusSessions(sorted);
        
        // Dynamically compute stats from user history!
        const todayStr = new Date().toDateString();
        const todayCount = sorted.filter(s => new Date(s.timestamp).toDateString() === todayStr).length;
        setTodaySessions(todayCount);
        setCyclesToday(Math.min(todayCount, 6));
      });
      return () => unsub();
    } else {
      // Local clean fallback for non-auth sessions
      const defaultLogs: FirestoreFocusSession[] = [];
      setFocusSessions(defaultLogs);
      setTodaySessions(0);
      setCyclesToday(0);
    }
  }, [currentUser]);

  // Sound options
  const [activeAmbiance, setActiveAmbiance] = useState<"none" | "lofi" | "rain" | "theta" | "ocean" | "white">("none");
  const [ambientSound, setAmbientSound] = useState<"Pluie douce" | "Café calme" | "Silence">("Pluie douce");
  const [volume, setVolume] = useState(40);
  const [isMuted, setIsMuted] = useState(false);
  const [doNotDisturb, setDoNotDisturb] = useState(true);

  // Modal custom interval state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Selected task state corresponding directly to right-sidebar "Session en cours"
  const [tasks, setTasks] = useState<FocusTask[]>([]);

  const [activeTaskId, setActiveTaskId] = useState<string>("");
  const activeTask = tasks.find(t => t.id === activeTaskId) || tasks[0] || null;

  // Text inputs
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Refs for Synthesized Ambient Sound Board (Web Audio API)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const rainSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const lofiIntervalRef = useRef<any>(null);
  const thetaOscsRef = useRef<OscillatorNode[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Synchronize timer whenever the active tab changes or lengths are adjusted
  useEffect(() => {
    let targetMinutes = 25;
    if (activeTab === "Pomodoro") targetMinutes = pomodoroLength;
    else if (activeTab === "Focus long") targetMinutes = longFocusLength;
    else if (activeTab === "Personnalisé") targetMinutes = customFocusLength;
    
    setTimeRemaining(targetMinutes * 60);
    setIsPlaying(false);
  }, [activeTab, pomodoroLength, longFocusLength, customFocusLength]);

  // Tab switcher cycler (activated by circular timer's left/right arrow buttons)
  const handlePrevTab = () => {
    const tabs: ("Pomodoro" | "Focus long" | "Personnalisé")[] = ["Pomodoro", "Focus long", "Personnalisé"];
    const currentIdx = tabs.indexOf(activeTab);
    const nextIdx = (currentIdx - 1 + tabs.length) % tabs.length;
    setActiveTab(tabs[nextIdx]);
    triggerNotification("Mode de Focus", `Démarrage du mode ${tabs[nextIdx]}`, "info");
  };

  const handleNextTab = () => {
    const tabs: ("Pomodoro" | "Focus long" | "Personnalisé")[] = ["Pomodoro", "Focus long", "Personnalisé"];
    const currentIdx = tabs.indexOf(activeTab);
    const nextIdx = (currentIdx + 1) % tabs.length;
    setActiveTab(tabs[nextIdx]);
    triggerNotification("Mode de Focus", `Démarrage du mode ${tabs[nextIdx]}`, "info");
  };

  // Main countdown logical process
  useEffect(() => {
    if (isPlaying) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setIsPlaying(false);
            handleSessionCompletedComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isPlaying]);

  const handleSessionCompletedComplete = () => {
    // Increment completed counts
    setTodaySessions(prev => prev + 1);
    setCyclesToday(prev => Math.min(prev + 1, 6));
    
    // Play sweet synth chime
    try {
      const ringCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ringOsc = ringCtx.createOscillator();
      const ringGain = ringCtx.createGain();
      ringOsc.type = "sine";
      ringOsc.frequency.setValueAtTime(880, ringCtx.currentTime); // high tone A5
      ringOsc.frequency.exponentialRampToValueAtTime(1320, ringCtx.currentTime + 0.35); // ramp up to E6
      ringGain.gain.setValueAtTime(0.15, ringCtx.currentTime);
      ringGain.gain.exponentialRampToValueAtTime(0.01, ringCtx.currentTime + 0.4);
      ringOsc.connect(ringGain);
      ringGain.connect(ringCtx.destination);
      ringOsc.start();
      ringOsc.stop(ringCtx.currentTime + 0.55);
    } catch (e) {
      console.warn(e);
    }

    const durationMin = activeTab === "Pomodoro" ? pomodoroLength : activeTab === "Focus long" ? longFocusLength : customFocusLength;
    const sessionType = activeTab === "Focus long" ? "Long" : "Pomodoro";

    if (currentUser) {
      const sessionId = `fs_${Date.now()}`;
      saveFocusSessionToCloud(currentUser.uid, {
        id: sessionId,
        duration: durationMin,
        timestamp: new Date().toISOString(),
        taskRef: activeTask ? activeTask.title : "Tâche de concentration",
        type: sessionType
      });
    } else {
      const newLocalSession: FirestoreFocusSession = {
        id: `fs_local_${Date.now()}`,
        duration: durationMin,
        timestamp: new Date().toISOString(),
        taskRef: activeTask ? activeTask.title : "Tâche de concentration",
        type: sessionType,
        ownerId: ""
      };
      setFocusSessions(prev => [newLocalSession, ...prev]);
    }

    triggerNotification(
      "Session de concentration terminée !",
      "Excellent effort, gardez ce superbe élan !",
      "success"
    );
  };

  // Convert seconds remaining to elegant readable string (MM:SS)
  const formatTime = (seconds: number) => {
    const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
    const ss = (seconds % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  // Target max seconds calculated dynamically
  const getMaxSeconds = () => {
    if (activeTab === "Pomodoro") return pomodoroLength * 60;
    if (activeTab === "Focus long") return longFocusLength * 60;
    return customFocusLength * 60;
  };

  // Donut SVG circumference and calculation
  const totalDuration = getMaxSeconds();
  const ratio = totalDuration > 0 ? (timeRemaining / totalDuration) : 0;
  const strokeDashoffset = 565 - (565 * ratio); // 2 * PI * r (r=90, circumference is ~565)

  // Subtask toggling function that coordinates right-sidebar task checklist
  const toggleSubTask = (taskId: string, subTaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedSubs = t.subTasks.map(st => {
          if (st.id === subTaskId) {
            return { ...st, completed: !st.completed };
          }
          return st;
        });

    // Determine if all subtasks are finished to show notification
        const completedCount = updatedSubs.filter(stub => stub.completed).length;
        if (completedCount === updatedSubs.length) {
          triggerNotification("Tâche accomplie !", `Félicitations pour avoir complété toutes les sous-tâches de : ${t.title}`, "success");
        }

        return { ...t, subTasks: updatedSubs };
      }
      return t;
    }));
  };

  // Quick addition of subtask
  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !activeTaskId) return;

    setTasks(prev => prev.map(t => {
      if (t.id === activeTaskId) {
        const newSt: SubTask = {
          id: "sub_" + Date.now(),
          title: newTaskTitle.trim(),
          completed: false
        };
        return {
          ...t,
          subTasks: [...t.subTasks, newSt]
        };
      }
      return t;
    }));

    setNewTaskTitle("");
    triggerNotification("Sous-tâche ajoutée", "Une nouvelle cible de sous-étape a été enregistrée.", "success");
  };

  // Task creation helper
  const handleAddNewTask = (title: string, priority: "Haute" | "Moyenne" | "Basse") => {
    const customTask: FocusTask = {
      id: "task_" + Date.now(),
      title,
      priority,
      module: "Focus",
      subTasks: []
    };
    setTasks(prev => [customTask, ...prev]);
    setActiveTaskId(customTask.id);
    triggerNotification("Tâche créée", `Concentration ajustée sur : "${title}"`, "success");
  };

  // --- Web Audio API Study Ambient Synthesizer Engine ---
  const stopAmbientSynth = () => {
    // Clear lofi scheduler
    if (lofiIntervalRef.current) {
      clearInterval(lofiIntervalRef.current);
      lofiIntervalRef.current = null;
    }
    // Stop rain sound source
    if (rainSourceRef.current) {
      try {
        rainSourceRef.current.stop();
      } catch {}
      rainSourceRef.current = null;
    }
    // Stop theta sound sources
    thetaOscsRef.current.forEach(osc => {
      try {
        osc.stop();
      } catch {}
    });
    thetaOscsRef.current = [];
  };

  const startAmbientSynth = (type: "lofi" | "rain" | "theta" | "ocean" | "white") => {
    stopAmbientSynth();

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Main volume node
      const masterNode = ctx.createGain();
      const currentGain = isMuted ? 0 : (volume / 100) * 0.2;
      masterNode.gain.setValueAtTime(currentGain, ctx.currentTime);
      masterNode.connect(ctx.destination);
      gainNodeRef.current = masterNode;

      if (type === "rain") {
        // Generate authentic pinkish rain white noise
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const rand = Math.random() * 2 - 1;
          data[i] = (lastOut * 0.95 + rand * 0.05); // lowpass brownian-approximation filter
          lastOut = data[i];
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const lpFilter = ctx.createBiquadFilter();
        lpFilter.type = "lowpass";
        lpFilter.frequency.value = 850;

        source.connect(lpFilter);
        lpFilter.connect(masterNode);
        source.start();
        rainSourceRef.current = source;
      } 
      else if (type === "theta") {
        // Binaural brain waves (Left & Right frequency offset for deep cognitive focus)
        const leftOsc = ctx.createOscillator();
        const rightOsc = ctx.createOscillator();
        const merger = ctx.createChannelMerger(2);

        // Slow Theta frequency around 140Hz inside left ear
        leftOsc.type = "sine";
        leftOsc.frequency.setValueAtTime(140, ctx.currentTime);

        // 146Hz in right ear generates a binaural beat of 6Hz (Deep therapeutic focus state)
        rightOsc.type = "sine";
        rightOsc.frequency.setValueAtTime(146, ctx.currentTime);

        // Lowpass filters to make it exceedingly smooth and gentle
        const filterL = ctx.createBiquadFilter();
        const filterR = ctx.createBiquadFilter();
        filterL.type = "lowpass"; filterL.frequency.value = 180;
        filterR.type = "lowpass"; filterR.frequency.value = 180;

        leftOsc.connect(filterL);
        rightOsc.connect(filterR);

        filterL.connect(merger, 0, 0);
        filterR.connect(merger, 0, 1);

        merger.connect(masterNode);

        leftOsc.start();
        rightOsc.start();

        thetaOscsRef.current = [leftOsc, rightOsc];
      } 
      else if (type === "ocean") {
        // Generate noise buffer
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const rand = Math.random() * 2 - 1;
          data[i] = (lastOut * 0.98 + rand * 0.02); // very warm brownian noise
          lastOut = data[i];
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        // Bandpass/lowpass filter to sweep
        const sweepFilter = ctx.createBiquadFilter();
        sweepFilter.type = "lowpass";
        sweepFilter.frequency.value = 400;

        // LFO (Low-Frequency Oscillator) to control filter frequency automatically
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // ~8 seconds swell cycle

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(250, ctx.currentTime); // sweep range

        lfo.connect(lfoGain);
        lfoGain.connect(sweepFilter.frequency);

        source.connect(sweepFilter);
        sweepFilter.connect(masterNode);

        lfo.start();
        source.start();

        // Keep references to clean up
        rainSourceRef.current = source;
        thetaOscsRef.current = [lfo as any];
      }
      else if (type === "white") {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const lpFilter = ctx.createBiquadFilter();
        lpFilter.type = "lowpass";
        lpFilter.frequency.value = 1000;

        source.connect(lpFilter);
        lpFilter.connect(masterNode);
        source.start();
        rainSourceRef.current = source;
      }
      else if (type === "lofi") {
        // Beautiful, soothing retro synthesized lofi loop engine
        let step = 0;
        const playBeat = () => {
          const now = ctx.currentTime;
          
          // Warm jazz electric-piano chords generated via combined sine wave oscillators
          if (step === 0 || step === 2) {
            // Step 0: C Major/E minor, Step 2: F Major/A minor
            const chordFreqs = step === 0 ? [130.81, 164.81, 196.00] : [174.61, 220.00, 261.63];
            chordFreqs.forEach(freq => {
              const osc = ctx.createOscillator();
              const oscGain = ctx.createGain();
              osc.type = "sine";
              osc.frequency.setValueAtTime(freq, now);
              
              // Soft progressive attack and decay envelope
              oscGain.gain.setValueAtTime(0, now);
              oscGain.gain.linearRampToValueAtTime(0.04, now + 0.15);
              oscGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
              
              osc.connect(oscGain);
              oscGain.connect(masterNode);
              osc.start(now);
              osc.stop(now + 1.45);
            });
          }

          // Soft low organic kick sound
          if (step % 2 === 0) {
            const kickOsc = ctx.createOscillator();
            const kickGain = ctx.createGain();
            kickOsc.frequency.setValueAtTime(120, now);
            kickOsc.frequency.exponentialRampToValueAtTime(45, now + 0.1);
            kickGain.gain.setValueAtTime(0.24, now);
            kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            kickOsc.connect(kickGain);
            kickGain.connect(masterNode);
            kickOsc.start(now);
            kickOsc.stop(now + 0.15);
          }

          // Gentle ambient shaker
          if (step % 2 === 1) {
            const shakeOsc = ctx.createOscillator();
            const shakeGain = ctx.createGain();
            shakeOsc.type = "triangle";
            shakeOsc.frequency.setValueAtTime(250, now);
            shakeGain.gain.setValueAtTime(0.06, now);
            shakeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            shakeOsc.connect(shakeGain);
            shakeGain.connect(masterNode);
            shakeOsc.start(now);
            shakeOsc.stop(now + 0.1);
          }

          step = (step + 1) % 4;
        };

        playBeat();
        lofiIntervalRef.current = setInterval(playBeat, 780); // ~77 BPM chill cadence
      }

    } catch (e) {
      console.warn("Failed synth audio environment startup:", e);
    }
  };

  // Adjust output volume live
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      const activeGain = isMuted ? 0 : (volume / 100) * 0.2;
      gainNodeRef.current.gain.setValueAtTime(activeGain, audioCtxRef.current.currentTime);
    }
  }, [volume, isMuted]);

  // Handle active music click/toggles
  const handleToggleAmbiance = (type: "none" | "lofi" | "rain" | "theta" | "ocean" | "white") => {
    if (activeAmbiance === type || type === "none") {
      setActiveAmbiance("none");
      stopAmbientSynth();
      triggerNotification("Ambiance sonore", "Audio désactivé.", "info");
    } else {
      setActiveAmbiance(type);
      startAmbientSynth(type);
      const titleLabel = 
        type === "lofi" ? "Lo-fi Beats" : 
        type === "rain" ? "Pluie douce" : 
        type === "theta" ? "Ondes Thêta" : 
        type === "ocean" ? "Vagues d'océan" : "Bruit blanc";
      triggerNotification("Ambiance activée", `Génération sonore de "${titleLabel}" initiée.`, "success");
    }
  };

  // Clean ambient audio interval components on absolute lifecycle exit
  useEffect(() => {
    return () => {
      stopAmbientSynth();
      clearInterval(timerIntervalRef.current);
    };
  }, []);

  return (
    <div className="space-y-6 font-sans text-slate-800" id="focus-modern-screen">
      
      {/* ================= TOP HEADER AREA ================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-100 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight font-display flex items-center gap-2">
              <span>Focus</span>
              <Target className="w-6 h-6 text-indigo-500" />
            </h1>
          </div>
          <p className="text-[13px] text-slate-400 font-medium mt-1">
            Concentre-toi. Élimine les distractions. Accomplis l'essentiel.
          </p>
        </div>

        {/* Dynamic header indicator stats */}
        <div className="flex items-center gap-4 bg-white border border-slate-100 px-4 py-2 rounded-2xl shadow-3xs text-xs font-semibold text-slate-550 shrink-0">
          <div className="flex items-center gap-1.5 border-r border-slate-100 pr-3.5">
            <Clock className="w-4 h-4 text-purple-600" />
            <span>Nouveau cycle</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="text-slate-800 font-extrabold font-mono">7 jours</span>
          </div>
        </div>
      </div>

      {/* ================= TWO-COLUMN CORE FOCUS CONTAINER ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column Area (8 Cols) - Progress circle timer, Control console & Bottom 3 cards row */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main card centering the circular countdown */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-3xs" id="central-timer-console">
            
            {/* Glowing peripheral gradients to replicate layout */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-50/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-50/10 rounded-full blur-3xl pointer-events-none" />

            {/* Premium segmented tabs of timer mode matching design mockup visually */}
            <div className="flex bg-slate-100/95 p-1 rounded-2xl font-bold text-[11.5px] select-none shadow-3xs mb-8" id="timer-mode-selector">
              {(["Pomodoro", "Focus long", "Personnalisé"] as const).map((tab) => {
                const isActive = activeTab === tab;
                const Icon = tab === "Focus long" ? Hourglass : tab === "Personnalisé" ? Sliders : Flame;
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setIsPlaying(false);
                      triggerNotification("Ajustement de session", `Basculement sur l'intervalle ${tab}`, "info");
                    }}
                    className={`px-5 py-2.5 rounded-xl font-extrabold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs select-none ${
                      isActive
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/10"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab}</span>
                  </button>
                );
              })}
            </div>

            {/* Glowing ring visualization & big numbers */}
            <div className="relative flex items-center justify-center w-80 h-80 md:w-[380px] md:h-[380px] shrink-0 selection:bg-transparent select-none">
              
              {/* Radial gradient backing */}
              <div className="absolute inset-4 rounded-full border border-slate-50 bg-slate-50/20" />
              
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 300 300">
                <defs>
                  <linearGradient id="purpleIndigoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#c084fc" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                  <linearGradient id="blueEmeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>

                {/* Background track circle */}
                <circle
                  cx="150"
                  cy="150"
                  r="120"
                  stroke="#f1f5f9"
                  strokeWidth="6"
                  fill="transparent"
                />
                
                {/* Primary colored glowing gradient stroke progress */}
                <circle
                  cx="150"
                  cy="150"
                  r="120"
                  stroke={`url(#${activeTab === "Focus long" ? "blueEmeraldGradient" : "purpleIndigoGradient"})`}
                  strokeWidth="10"
                  strokeLinecap="round"
                  fill="transparent"
                  strokeDasharray="754"
                  strokeDashoffset={754 - (754 * ratio)}
                  className="transition-all duration-300 shadow-md"
                />
              </svg>

              {/* Exact numerical countdown, styled identically with mockup */}
              <div className="absolute text-center flex flex-col items-center justify-center">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#a78bfa] text-purple-400">
                  Focus sur ton objectif
                </span>

                <h1 className="text-6xl font-black leading-none text-slate-900 font-mono tracking-tighter mt-1 select-all cursor-text">
                  {formatTime(timeRemaining)}
                </h1>

                {/* Violet pill button link */}
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="mt-3.5 bg-purple-50 hover:bg-purple-100 text-purple-600 text-[11px] px-3.5 py-1.5 rounded-full font-black flex items-center gap-1.5 transition-all"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Ajuster la session</span>
                </button>
              </div>

              {/* Symmetrical SkipBack / SkipForward layout buttons for previous/next session */}
              <button 
                onClick={handlePrevTab}
                className="absolute left-[-28px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-slate-100 bg-white hover:bg-slate-50 text-slate-500 shadow-3xs flex items-center justify-center cursor-pointer transition-colors"
                title="Précédent"
              >
                <SkipBack className="w-4 h-4 text-purple-650 text-purple-500" />
              </button>

              <button 
                onClick={handleNextTab}
                className="absolute right-[-28px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-slate-100 bg-white hover:bg-slate-50 text-slate-500 shadow-3xs flex items-center justify-center cursor-pointer transition-colors"
                title="Suivant"
              >
                <SkipForward className="w-4 h-4 text-purple-650 text-purple-500" />
              </button>
            </div>

            {/* Giant play toggle under the circle as in mockup */}
            <div className="mt-8 relative z-25">
              <button
                onClick={() => {
                  setIsPlaying(!isPlaying);
                  triggerNotification(
                    isPlaying ? "Session suspendue" : "Concentration lancée !",
                    isPlaying ? "Le compte à rebours est suspendu." : "Ne vous dispersez pas, restez concentré !",
                    isPlaying ? "info" : "success"
                  );
                }}
                className="w-16 h-16 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center cursor-pointer shadow-lg shadow-purple-600/30 hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                title={isPlaying ? "Mettre en pause" : "Démarrer"}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 text-white fill-current" />
                ) : (
                  <Play className="w-7 h-7 text-white fill-current ml-1" />
                )}
              </button>
            </div>

            {/* Goal Capsule overlay */}
            <div className="mt-8 bg-slate-50 border border-slate-100/90 rounded-2xl p-4.5 w-full max-w-sm flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                ObjectifDuJour
              </span>
              <p className="font-extrabold text-[#312e81] text-indigo-900 text-sm mt-1">
                {activeTask ? activeTask.title : "Aucun objectif actif"}
              </p>
              {activeTask && (
                <span className="text-[10.5px] text-slate-450 text-slate-400 font-semibold block mt-0.5">
                  {activeTask.subTasks.filter(s => s.completed).length} / {activeTask.subTasks.length} tâche{activeTask.subTasks.length > 1 ? "s" : ""} terminée{activeTask.subTasks.filter(s => s.completed).length > 1 ? "s" : ""}
                </span>
              )}
            </div>

          </div>

          {/* Symmetrical Bottom Triple Cards (Ambiance, Sons, Mode) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="focus-actions-triple-row">
            
            {/* Card 1: Ambiance with real sound and music waves! */}
            <div className="bg-white border border-slate-205 border-slate-200/95 rounded-2xl p-4.5 shadow-3xs flex flex-col justify-between min-h-64" id="cap-ambiance">
              <div>
                <h3 className="font-black text-slate-900 text-sm tracking-tight">Ambiance</h3>
                <p className="text-[10px] text-slate-450 text-slate-400 font-medium">Bruit de fond live synthétisé</p>
              </div>

              {/* Scrollable list of 5 synthesized ambient profiles */}
              <div className="space-y-1.5 my-2.5 max-h-[175px] overflow-y-auto scrollbar-thin pr-0.5">
                {[
                  { id: "lofi", label: "Lo-fi Beats", desc: "Synthèse live", icon: Music },
                  { id: "theta", label: "Ondes Thêta", desc: "Relaxation / Focus", icon: Sparkles },
                  { id: "rain", label: "Pluie douce", desc: "Pluie relaxante", icon: CloudRain },
                  { id: "ocean", label: "Vagues d'océan", desc: "Effet ressif marin", icon: Waves },
                  { id: "white", label: "Bruit blanc", desc: "Bruit de fond pur", icon: Radio }
                ].map((sound) => {
                  const Icon = sound.icon;
                  const isCurrent = activeAmbiance === sound.id;
                  return (
                    <div 
                      key={sound.id}
                      onClick={() => handleToggleAmbiance(sound.id as any)}
                      className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                        isCurrent 
                          ? "bg-purple-50/70 border-purple-200" 
                          : "bg-slate-50/50 hover:bg-slate-50 border-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isCurrent ? "bg-purple-600 text-white" : "bg-slate-105 bg-slate-100 text-slate-450"
                        }`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-[11px] text-slate-800 leading-tight truncate">{sound.label}</h4>
                          <span className="text-[8.5px] text-slate-400 font-mono block leading-none">{sound.desc}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0 ${
                          isCurrent ? "bg-purple-600 text-white" : "bg-white text-slate-400 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {isCurrent ? <Pause className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current ml-0.5" />}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Tiny music visualizer bars if playing */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-50">
                <span className="font-semibold uppercase tracking-wider font-mono text-[8.5px]">Synthesizer active:</span>
                <div className="flex items-end gap-0.5 h-3">
                  <span className={`w-0.5 bg-violet-600 rounded-full ${activeAmbiance !== "none" ? "animate-bounce" : "h-1"}`} style={{ height: activeAmbiance !== "none" ? "12px" : "3px", animationDelay: "0.1s" }} />
                  <span className={`w-0.5 bg-violet-600 rounded-full ${activeAmbiance !== "none" ? "animate-bounce" : "h-1.5"}`} style={{ height: activeAmbiance !== "none" ? "8px" : "4px", animationDelay: "0.3s" }} />
                  <span className={`w-0.5 bg-violet-500 rounded-full ${activeAmbiance !== "none" ? "animate-bounce" : "h-1"}`} style={{ height: activeAmbiance !== "none" ? "10px" : "2px", animationDelay: "0.5s" }} />
                  <span className={`w-0.5 bg-indigo-500 rounded-full ${activeAmbiance !== "none" ? "animate-bounce" : "h-2"}`} style={{ height: activeAmbiance !== "none" ? "6px" : "5px", animationDelay: "0.2s" }} />
                </div>
              </div>
            </div>

            {/* Card 2: Sons - Dropdown bruitages, custom linear volume bar layout */}
            <div className="bg-white border border-slate-205 border-slate-200/95 rounded-2xl p-4.5 shadow-3xs flex flex-col justify-between min-h-48" id="cap-sons-selection">
              <div>
                <h3 className="font-black text-slate-900 text-sm tracking-tight font-display">Sons</h3>
                <p className="text-[10px] text-slate-400 font-medium">Bruitage ambiant</p>
              </div>

              {/* Selector box */}
              <div className="relative mt-2">
                <select
                  value={ambientSound}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setAmbientSound(val);
                    if (val === "Pluie douce") handleToggleAmbiance("rain");
                    else if (val === "Silence") handleToggleAmbiance("none");
                    else handleToggleAmbiance("theta");
                  }}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-slate-700 font-extrabold text-[11px] focus:outline-none appearance-none"
                >
                  <option value="Pluie douce">Pluie douce</option>
                  <option value="Café calme">Ondes Thêta</option>
                  <option value="Silence">Silence</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450 pointer-events-none" />
              </div>

              {/* Volume scale matching mockup */}
              <div className="flex items-center gap-2 pt-4">
                <Volume1 className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="flex-1 accent-purple-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                />
                <Volume2 className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* Card 3: Mode with solid purple toggle */}
            <div className="bg-white border border-slate-205 border-slate-200/95 rounded-2xl p-4.5 shadow-3xs flex flex-col justify-between min-h-48" id="cap-ne-pas-deranger">
              <div>
                <h3 className="font-black text-slate-900 text-sm tracking-tight font-display">Mode</h3>
                <p className="text-[10px] text-slate-400 font-medium">Ne pas déranger</p>
              </div>

              <div className="py-2">
                <p className="text-[11px] text-slate-500 leading-tight">
                  Bloque les notifications indésirables et favorise un focus ininterrompu.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-1">
                <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">
                  {doNotDisturb ? "Actif" : "Inactif"}
                </span>

                {/* Styled solid toggle switch */}
                <button
                  type="button"
                  onClick={() => {
                    setDoNotDisturb(!doNotDisturb);
                    triggerNotification(
                      doNotDisturb ? "Notifications activées" : "Mode Ne pas déranger activé",
                      doNotDisturb ? "Vous recevrez à nouveau des alertes." : "Toutes les notifications de collaboration sont réduites au silence.",
                      "info"
                    );
                  }}
                  className={`w-11 h-6 rounded-full p-0.5 transition-all outline-none border cursor-pointer flex items-center ${
                    doNotDisturb 
                      ? "bg-purple-600 border-purple-600 justify-end" 
                      : "bg-slate-200 border-slate-200 justify-start"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-xs block" />
                </button>
              </div>
            </div>

          </div>

          {/* Incentives widget line: Cycles aujourd'hui, Quote column, Série actuelle */}
          <div className="bg-[#f8fafc] border border-slate-100/90 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-5 mt-4" id="focus-bottom-incentives-line">
            
            {/* Left: Cycles gauge donut */}
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 flex items-center justify-center shrink-0 select-none">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="24" cy="24" r="19" stroke="#e2e8f0" strokeWidth="4" fill="transparent" />
                  <circle cx="24" cy="24" r="19" stroke="#3b82f6" strokeWidth="4" fill="transparent" strokeDasharray="120" strokeDashoffset={120 - (120 * cyclesToday) / 6} strokeLinecap="round" />
                </svg>
                <span className="absolute text-[11px] font-black text-slate-800 font-mono">
                  {cyclesToday}/6
                </span>
              </div>
              <div>
                <h4 className="text-[11.5px] font-black text-slate-900 leading-tight">Cycles aujourd'hui</h4>
                <p className="text-[9.5px] text-slate-400 font-semibold">Progrès quotidien</p>
              </div>
            </div>

            {/* Center quote */}
            <div className="flex-1 md:border-l md:border-slate-200/90 md:pl-5 py-2.5 text-center md:text-left">
              <h4 className="text-[12px] font-extrabold text-[#111827] text-slate-900">Garde le cap !</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-snug font-medium">
                Chaque session te rapproche de tes objectifs.
              </p>
            </div>

            {/* Right streak layout with solid background */}
            <div className="bg-[#fffbeb] border border-amber-100 px-4 py-2 rounded-xl flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center text-md shrink-0 font-bold shadow-xs shadow-amber-500/10">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block leading-none">
                  Série actuelle
                </span>
                <span className="text-[12.5px] text-amber-700 font-black font-sans leading-tight mt-0.5 block">
                  7 jours
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column Area (4 Cols) - Session en cours sub-checklist & statistics */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Widget 1: Session en cours details */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-3xs flex flex-col justify-between" id="widget-active-subtasks">
            
            <div className="pb-3 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 font-mono">
                SessionEnCours
              </h3>
              <span className="text-[10.5px] text-slate-450 text-slate-400 font-mono font-bold">
                00:00:00
              </span>
            </div>

            {/* Active task label details */}
            <div className="py-4 space-y-4">
              {activeTask ? (
                <>
                  <div>
                    <span className="text-[9.5px] uppercase text-slate-400 font-bold block font-mono">
                      Tâche sélectionnée
                    </span>
                    <div className="flex items-start justify-between gap-2.5 mt-2.5">
                      <div>
                        <h4 className="font-black text-slate-900 text-sm leading-tight flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                          <span>{activeTask.title}</span>
                        </h4>
                        <span className="inline-block text-[11px] font-extrabold mt-1 text-purple-600">
                          {activeTask.module}
                        </span>
                      </div>

                      <span className={`text-[9.5px] px-2 py-1 rounded-lg font-black shrink-0 ${
                        activeTask.priority === "Haute" 
                          ? "bg-rose-50 text-rose-600 border border-rose-100" 
                          : "bg-blue-50 text-blue-600 border border-blue-100"
                      }`}>
                        {activeTask.priority}
                      </span>
                    </div>
                  </div>

                  {/* Sub-steps loop indicator */}
                  <div className="space-y-2 pt-2 border-t border-slate-50">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-[10.5px] font-black text-slate-450 text-slate-400">
                        Sous-tâches
                      </span>
                      <span className="text-[10.5px] font-bold text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded-md">
                        {activeTask.subTasks.filter(st => st.completed).length} / {activeTask.subTasks.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {activeTask.subTasks.map((sub) => (
                        <div
                          key={sub.id}
                          onClick={() => toggleSubTask(activeTask.id, sub.id)}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border border-slate-50 hover:bg-slate-50 cursor-pointer transition-all ${
                            sub.completed ? "bg-slate-50/50 opacity-60" : "bg-white"
                          }`}
                        >
                          <button
                            type="button"
                            className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center transition-all ${
                              sub.completed 
                                ? "bg-blue-500 border-blue-500 text-white" 
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {sub.completed && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
                          </button>
                          <span className={`text-[11.5px] truncate ${sub.completed ? "line-through text-slate-400" : "text-slate-700 font-bold"}`}>
                            {sub.title}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Subtask addition form inline */}
                    <form onSubmit={handleAddSubtask} className="flex gap-2 pt-2">
                      <input
                        type="text"
                        required
                        placeholder="Ajouter une étape..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="flex-1 bg-slate-50/70 border border-slate-205 border-slate-200/90 rounded-xl px-3 py-2 text-[11px] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-650 cursor-pointer px-3 rounded-xl flex items-center justify-center text-xs"
                      >
                        <Plus className="w-4 h-4 text-slate-600" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="bg-slate-50/75 rounded-2xl p-4 text-center border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Créer une tâche focus</span>
                  <p className="text-xs text-slate-500 mb-3 leading-relaxed">Ajoutez un premier objectif d'études pour activer le suivi des sous-étapes.</p>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const inputEl = e.currentTarget.elements.namedItem("taskTitle") as HTMLInputElement;
                    const priorityEl = e.currentTarget.elements.namedItem("taskPriority") as HTMLSelectElement;
                    if (inputEl && inputEl.value.trim()) {
                      handleAddNewTask(inputEl.value.trim(), priorityEl.value as any);
                      inputEl.value = "";
                    }
                  }} className="space-y-2 text-left">
                    <input
                      name="taskTitle"
                      type="text"
                      required
                      placeholder="Nom de l'objectif (ex: Rapport d'IA)"
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <select name="taskPriority" className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs focus:outline-none flex-1 font-semibold text-slate-600">
                        <option value="Haute">Haute</option>
                        <option value="Moyenne">Moyenne</option>
                        <option value="Basse">Basse</option>
                      </select>
                      <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer">
                        Créer
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Changer de tache selection list dropdown helper */}
            <div className="pt-3 border-t border-slate-50 flex flex-col gap-2">
              <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                Changer de tâche cible :
              </label>
              <select
                value={activeTaskId}
                disabled={tasks.length === 0}
                onChange={(e) => {
                  setActiveTaskId(e.target.value);
                  triggerNotification("Cible modifiée 🎯", "Concentration redirigée vers une autre tâche de session.", "info");
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-extrabold text-slate-705 text-slate-700 focus:outline-none disabled:opacity-50"
              >
                {tasks.length === 0 ? (
                  <option value="">Aucune tâche disponible</option>
                ) : (
                  tasks.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.priority})
                    </option>
                  ))
                )}
              </select>
            </div>

          </div>

          {/* Widget 2: Statistiques de focus */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-3xs space-y-4 font-sans" id="widget-global-stats">
            
            <div className="flex items-center justify-between pb-1 border-b border-slate-50">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 font-mono">
                StatistiquesDeFocus
              </h3>
              
              <div className="flex items-center gap-1 text-slate-500 text-[11px] font-extrabold font-mono uppercase bg-transparent p-0">
                <span>Aujourd'hui</span>
              </div>
            </div>

            {/* Visual 2x2 statistics boxes */}
            <div className="grid grid-cols-2 gap-3.5">
              
              {/* Box 1 */}
              <div className="bg-[#f8fafc]/80 border border-slate-100 p-3 rounded-2xl">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-extrabold uppercase">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>Temps de focus</span>
                </div>
                <h4 className="text-lg font-black text-slate-900 mt-2 font-mono">2h 45m</h4>
                <span className="text-[9.5px] font-black text-emerald-600 block mt-1 leading-none font-mono">
                  ↑ 18% <span className="text-slate-400 font-semibold font-sans font-medium text-[9px]">vs hier</span>
                </span>
              </div>

              {/* Box 2 */}
              <div className="bg-[#f8fafc]/80 border border-slate-100 p-3 rounded-2xl">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-extrabold uppercase">
                  <Target className="w-3.5 h-3.5 text-[#a78bfa] text-purple-500" />
                  <span>Sessions</span>
                </div>
                <h4 className="text-lg font-black text-slate-900 mt-2 font-mono">{todaySessions}</h4>
                <span className="text-[9.5px] font-black text-emerald-600 block mt-1 leading-none font-mono">
                  ↑ 12% <span className="text-slate-400 font-semibold font-sans font-medium text-[9px]">vs hier</span>
                </span>
              </div>

              {/* Box 3 */}
              <div className="bg-[#f8fafc]/80 border border-slate-100 p-3 rounded-2xl">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-extrabold uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Tâches min</span>
                </div>
                <h4 className="text-lg font-black text-slate-900 mt-2 font-mono">{completedTasksCount}</h4>
                <span className="text-[9.5px] font-black text-emerald-600 block mt-1 leading-none font-mono">
                  ↑ 20% <span className="text-slate-400 font-semibold font-sans font-medium text-[9px]">vs hier</span>
                </span>
              </div>

              {/* Box 4 */}
              <div className="bg-[#f8fafc]/80 border border-slate-100 p-3 rounded-2xl">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-extrabold uppercase">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                  <span>Productivité</span>
                </div>
                <h4 className="text-lg font-black text-slate-900 mt-2 font-mono">87%</h4>
                <span className="text-[9.5px] font-black text-emerald-600 block mt-1 leading-none font-mono">
                  ↑ 9% <span className="text-slate-400 font-semibold font-sans font-medium text-[9px]">vs hier</span>
                </span>
              </div>

            </div>

          </div>

          {/* Widget 3: Historique des sessions */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-3xs space-y-4" id="widget-history-logs">
            
            <div className="flex items-center justify-between pb-1 border-b border-slate-50">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 font-mono">
                HistoriqueDesSessions
              </h3>
              
              <button 
                onClick={() => triggerNotification("Historique complet", "Historique de 30 jours exporté.", "info")}
                className="text-[10px] text-purple-650 font-black hover:underline cursor-pointer"
              >
                Voir tout
              </button>
            </div>

            {/* List entries */}
            <div className="space-y-3">
              {focusSessions.length === 0 ? (
                <div className="text-center py-4 text-xs font-semibold text-slate-400">
                  Aucune session terminée pour le moment.
                </div>
              ) : (
                focusSessions.slice(0, 5).map((log, index) => {
                  const displayDate = (() => {
                    try {
                      const d = new Date(log.timestamp);
                      const now = new Date();
                      if (d.toDateString() === now.toDateString()) {
                        return `Aujourd'hui, ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
                      }
                      const yesterday = new Date(now);
                      yesterday.setDate(now.getDate() - 1);
                      if (d.toDateString() === yesterday.toDateString()) {
                        return `Hier, ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
                      }
                      return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) + ", " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                    } catch (e) {
                      return "Récemment";
                    }
                  })();

                  const colorClass = log.type === "Long" ? "bg-emerald-50 text-emerald-600" : (index % 2 === 0 ? "bg-purple-50 text-purple-600" : "bg-amber-50 text-amber-600");

                  return (
                    <div key={log.id || index} className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition-colors text-xs font-semibold">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center text-sm shrink-0`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-slate-900 font-black text-[11px] leading-tight truncate w-32">{log.taskRef || "Focus session"}</h5>
                          <span className="text-[9.5px] text-slate-400 block mt-0.5">{displayDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                          {log.duration}m
                        </span>
                        <span className="w-4 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[8.5px] font-black h-4">
                          ✓
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>

      </div>

      {/* ================= SETTINGS OVERLAY MODAL ================= */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm p-6 shadow-xl relative space-y-4"
            >
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-900 font-display flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-purple-600" /> Paramètres d'intervalles
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold">Configure tes durées de focus d'ici.</p>
              </div>

              <div className="space-y-3.5 text-xs text-slate-600 font-semibold">
                
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider">Durée Pomodoro (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={pomodoroLength}
                    onChange={(e) => setPomodoroLength(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-1 focus:ring-purple-500 outline-none font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider">Durée Focus Long (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={longFocusLength}
                    onChange={(e) => setLongFocusLength(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-1 focus:ring-purple-500 outline-none font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider">Durée Personnalisé (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={customFocusLength}
                    onChange={(e) => setCustomFocusLength(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-1 focus:ring-purple-500 outline-none font-bold"
                  />
                </div>

                <div className="flex gap-2.5 justify-end pt-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-650 rounded-xl hover:bg-slate-50 font-extrabold cursor-pointer transition-all"
                  >
                    Fermer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsOpen(false);
                      triggerNotification("Intervalles enregistrés", "Les durées de session ont été configurées.", "success");
                    }}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-extrabold hover:shadow-lg transition-all cursor-pointer shadow-md"
                  >
                    Enregistrer
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
