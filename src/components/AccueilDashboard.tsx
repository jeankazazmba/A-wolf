import React from "react";
import { 
  Plus, 
  MapPin, 
  Clock, 
  Check, 
  CheckSquare, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  FileText,
  RotateCcw
} from "lucide-react";
import { Task, Course, Resource } from "../types";
import greetingBannerImg from "../assets/scholarly_goals_peak.png";

interface AccueilDashboardProps {
  setTab: (tab: string) => void;
  userProfile: { name: string; email: string };
  state: {
    courses: Course[];
    tasks: Task[];
    resources: Resource[];
  };
  toggleTask: (id: string) => void;
  triggerNotification: (title: string, message: string, type: "success" | "info" | "warning") => void;
  rightFocusActive: boolean;
  setRightFocusActive: (active: boolean) => void;
  rightFocusSeconds: number;
  setRightFocusSeconds: (seconds: number) => void;
  pomodoroTotalSecs: number;
}

export const AccueilDashboard: React.FC<AccueilDashboardProps> = ({
  setTab,
  userProfile,
  state,
  toggleTask,
  triggerNotification,
  rightFocusActive,
  setRightFocusActive,
  rightFocusSeconds,
  setRightFocusSeconds,
  pomodoroTotalSecs,
}) => {
  // Option to auto-hide past or outdated courses to only show actions ahead
  const [hidePastCourses, setHidePastCourses] = React.useState(true);

  const miniCalendarData = React.useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-indexed
    
    const monthLabel = today.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    const capitalizedMonthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const paddingCount = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust so Monday is first
    
    // Number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    return {
      capitalizedMonthLabel,
      paddingCount,
      daysInMonth,
      todayDate: today.getDate(),
      todayMonth: month,
      todayYear: year
    };
  }, []);

  // Filter courses based on local time and days of week
  const filteredCourses = React.useMemo(() => {
    const rawCourses = state.courses || [];
    if (!hidePastCourses) return rawCourses;

    const dayNamesFr = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const now = new Date();
    // Use simulated or real today's index
    const todayIndex = now.getDay();
    const currentDayOfWeek = dayNamesFr[todayIndex];

    const nowH = now.getHours();
    const nowM = now.getMinutes();

    return rawCourses.filter((course: Course) => {
      const courseDayIndex = dayNamesFr.indexOf(course.day);
      
      // If course is on a previous day of the week, hide it
      if (courseDayIndex >= 0 && courseDayIndex < todayIndex) {
        return false;
      }
      
      // If course is today, check if start hour/minute is in the past
      if (courseDayIndex === todayIndex) {
        const [startH, startM] = course.startTime.split(":").map(Number);
        if (startH < nowH || (startH === nowH && startM < nowM)) {
          return false;
        }
      }
      
      return true;
    });
  }, [state.courses, hidePastCourses]);

  // Deduce real uncompleted tasks for urgent list
  const urgentTasks = state.tasks ? state.tasks.filter(t => !t.completed) : [];

  // Deduce real resources
  const recentResources = state.resources || [];
  return (
    <div className="space-y-6 animate-fade-in" id="dashboard-home-container">
      
      {/* 1. TOP SECTION: Greeting Banner (Left) & Focus (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="home-top-grid">
        
        {/* Left side: Modern welcoming card */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden min-h-[190px] bg-white" id="greeting-panel-minimal">
          {/* Background image illustration */}
          <img 
            src={greetingBannerImg} 
            alt="Défis et atteinte d'objectifs" 
            className="absolute inset-0 w-full h-full object-cover object-[center_35%] select-none"
            referrerPolicy="no-referrer"
          />
          <div className="relative z-20 p-6 md:p-8 flex flex-col justify-center h-full text-purple-950">
            <div>
              <h2 className="text-xl md:text-3xl font-black tracking-tight font-display mb-1.5 text-purple-900">
                Bonjour {userProfile.name} !
              </h2>
              <p className="text-purple-700/95 text-xs md:text-sm font-bold font-sans leading-relaxed max-w-lg">
                Chaque défi d'études relevé aujourd'hui est un pas solide vers la réussite de vos examens et l'accomplissement de vos objectifs.
              </p>
            </div>
          </div>
        </div>

        {/* Right side: Simple Focus Timer with Gradient Ring (purple -> indigo) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between" id="home-top-focus">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-1">
            <h4 className="font-bold text-slate-800 text-xs font-display flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-600 animate-pulse" />
              Session Focus
            </h4>
            <button
              onClick={() => {
                setRightFocusActive(false);
                setRightFocusSeconds(pomodoroTotalSecs);
                triggerNotification("Focus réinitialisé", "La session est réinitialisée à 25:00.", "info");
              }}
              className="text-slate-400 hover:text-purple-600 transition-colors p-1 rounded hover:bg-slate-50 cursor-pointer flex items-center gap-1 text-[9.5px] font-bold"
              title="Réinitialiser"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Remettre</span>
            </button>
          </div>

          <div className="flex items-center justify-center py-3">
            {/* Centered Graphic Focus Ring */}
            <div className="relative flex items-center justify-center shrink-0 w-36 h-36">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
                <defs>
                  <linearGradient id="purpleIndigoGradientRing" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#4338ca" />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="50" stroke="#f8fafc" strokeWidth="6" fill="transparent" />
                <circle 
                  cx="60" 
                  cy="60" 
                  r="50" 
                  stroke="url(#purpleIndigoGradientRing)" 
                  strokeWidth="7" 
                  strokeDasharray="314.16" 
                  strokeDashoffset={314.16 - (314.16 * (rightFocusSeconds / pomodoroTotalSecs))} 
                  strokeLinecap="round"
                  fill="transparent" 
                  className="transition-all duration-1000"
                />
              </svg>
              
              {/* Contents STRECHED directly inside the ring bounds */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <h3 className="text-xl font-black text-slate-800 font-mono tracking-tight leading-none mb-1">
                  {Math.floor(rightFocusSeconds / 60)}:{(rightFocusSeconds % 60).toString().padStart(2, "0")}
                </h3>
                
                <button
                  onClick={() => {
                    setRightFocusActive(!rightFocusActive);
                    triggerNotification(
                      rightFocusActive ? "Focus en pause" : "Focus démarré",
                      rightFocusActive ? "La session de focus est suspendue." : "Session de concentration lancée !",
                      "info"
                    );
                  }}
                  className={`px-3 py-1 font-extrabold text-[10px] rounded-full shadow-sm transition-all text-center cursor-pointer select-none active:scale-95 ${
                    rightFocusActive 
                      ? "bg-amber-500 hover:bg-amber-600 text-white" 
                      : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-100"
                  }`}
                >
                  {rightFocusActive ? "Pause" : "Démarrer"}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 2. RAPID ACTIONS BELT (Flat borderless design with light solid pastel buttons of increased size) */}
      <div className="flex flex-wrap items-center justify-start gap-5 py-2" id="quick-action-belt">
        <button 
          onClick={() => {
            setTab("projects");
            triggerNotification("Créateur de tâches", "Allez dans Projets pour ajouter vos devoirs.", "info");
          }} 
          className="bg-purple-50/70 hover:bg-purple-100/90 text-purple-950 rounded-2xl px-6 py-4 text-sm font-bold transition-all flex items-center gap-3 cursor-pointer shadow-3xs active:scale-95 hover:scale-[1.02]"
        >
          <CheckSquare className="w-5 h-5 text-purple-600" />
          <span>Nouvelle tâche</span>
        </button>

        <button 
          onClick={() => {
            setTab("resources");
            triggerNotification("Créateur de note", "Créez ou modifiez vos fiches d'étude.", "info");
          }} 
          className="bg-purple-50/70 hover:bg-purple-100/90 text-purple-950 rounded-2xl px-6 py-4 text-sm font-bold transition-all flex items-center gap-3 cursor-pointer shadow-3xs active:scale-95 hover:scale-[1.02]"
        >
          <FileText className="w-5 h-5 text-purple-600" />
          <span>Note rapide</span>
        </button>

        <button 
          onClick={() => {
            setRightFocusActive(true);
            triggerNotification("Focus instantané", "Votre minuteur de focus démarre immédiatement.", "info");
          }} 
          className="bg-purple-50/70 hover:bg-purple-100/90 text-purple-950 rounded-2xl px-6 py-4 text-sm font-bold transition-all flex items-center gap-3 cursor-pointer shadow-3xs active:scale-95 hover:scale-[1.02]"
        >
          <Clock className="w-5 h-5 text-purple-600" />
          <span>Focus maintenant</span>
        </button>

        <button 
          onClick={() => {
            setTab("schedule");
            triggerNotification("Emploi du temps", "Modifiez ou planifiez un événement.", "info");
          }} 
          className="bg-purple-50/70 hover:bg-purple-100/90 text-purple-950 rounded-2xl px-6 py-4 text-sm font-bold transition-all flex items-center gap-3 cursor-pointer shadow-3xs active:scale-95 hover:scale-[1.02]"
        >
          <CalendarIcon className="w-5 h-5 text-purple-600" />
          <span>Nouvel événement</span>
        </button>
      </div>

      {/* 3. MIDDLE ROW: Emploi du temps de ce jour, Mes tâches, Rappel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="home-middle-row">
        
        {/* Col 1: Emploi du temps de ce jour - Continuous Vertical Timeline Design */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between" id="middle-day-schedule">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h4 className="font-bold text-slate-800 text-sm font-display">Emploi du temps</h4>
              <button 
                onClick={() => {
                  setHidePastCourses(!hidePastCourses);
                  triggerNotification(
                    hidePastCourses ? "Affichage complet" : "Masquage intelligent",
                    hidePastCourses ? "Toutes les séances de la semaine sont affichées." : "Les séances passées ou obsolètes de la semaine sont désormais masquées.",
                    "info"
                  );
                }} 
                className={`text-[9.5px] font-black px-2 py-0.5 rounded-full border cursor-pointer transition-all ${
                  hidePastCourses 
                    ? "bg-purple-100 text-purple-800 border-purple-200" 
                    : "bg-slate-50 text-slate-500 border-slate-200"
                }`}
                title={hidePastCourses ? "Désactiver le masquage automatique" : "Activer le masquage automatique des cours passés"}
              >
                {hidePastCourses ? "Filtre actif" : "Tout afficher"}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mb-5">
              {hidePastCourses ? "Vos cours d'actualité programmés" : "Tous vos cours de la semaine"}
            </p>

            <div className="relative pl-5 border-l-2 border-purple-200 ml-3 space-y-5 my-3">
              {filteredCourses.slice(0, 3).map((course: Course) => (
                <div key={course.id} className="relative group">
                  {/* Bullet node on timeline */}
                  <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full border-2 border-purple-600 bg-white group-hover:bg-purple-600 group-hover:scale-110 transition-all duration-200 shadow-sm" />
                  
                  <div className="flex items-start justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <h5 className="font-bold text-slate-850 text-[11.5px] leading-tight group-hover:text-purple-700 transition-colors uppercase tracking-tight">{course.title}</h5>
                      <p className="text-[9.5px] text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {course.room} • {course.day}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-bold shrink-0 bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded leading-tight">
                      {course.startTime}
                    </span>
                  </div>
                </div>
              ))}
              {filteredCourses.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-6">Aucun cours à afficher.</p>
              )}
            </div>
          </div>

          <button 
            onClick={() => setTab("schedule")} 
            className="w-full mt-4 py-2 bg-purple-50/50 hover:bg-purple-100/50 border border-purple-100/40 hover:border-purple-200 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-bold text-purple-700 cursor-pointer"
          >
            <span>Voir tout l'emploi du temps</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Col 2: Mes tâches */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between" id="middle-tasks-center">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h4 className="font-bold text-slate-800 text-sm font-display">Mes Tâches</h4>
            </div>
            <p className="text-[10px] text-slate-400 mb-3.5">Travaux d'études prioritaires en cours</p>

            <div className="divide-y divide-slate-100">
              {state.tasks.slice(0, 3).map((task: Task) => (
                <div key={task.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => {
                        toggleTask(task.id);
                        triggerNotification(
                          task.completed ? "Tâche relancée" : "Tâche complétée",
                          `La tâche "${task.title}" a été mise à jour.`,
                          "success"
                        );
                      }}
                      className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center cursor-pointer ${
                        task.completed ? "bg-gradient-to-br from-purple-600 to-indigo-600 border-transparent text-white" : "border-slate-300 hover:border-purple-400"
                      }`}
                    >
                      {task.completed && <Check className="w-2.5 h-2.5" />}
                    </button>
                    <span className={`font-bold truncate select-none text-[11px] ${task.completed ? "line-through text-slate-400" : "text-slate-700"}`}>
                      {task.title}
                    </span>
                  </div>
                  <span className={`shrink-0 text-[8.5px] font-bold px-1.5 py-0.5 rounded ${
                    task.priority === "Haute" ? "bg-rose-50 text-rose-600 animate-pulse" : task.priority === "Moyenne" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
              {state.tasks.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-6">Aucune tâche en cours.</p>
              )}
            </div>
          </div>

          <button 
            onClick={() => setTab("projects")} 
            className="w-full mt-4 py-2 bg-purple-50/50 hover:bg-purple-100/50 border border-purple-100/40 hover:border-purple-200 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-bold text-purple-700 cursor-pointer"
          >
            <span>Gérer toutes les tâches</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Col 3: Rappel */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between" id="middle-reminders-list">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h4 className="font-bold text-slate-800 text-sm font-display">Rappels urgents</h4>
            </div>
            <p className="text-[10px] text-slate-400 mb-3.5">Relances automatiques et rendus planifiés</p>

            <div className="divide-y divide-slate-100">
              {urgentTasks.slice(0, 3).map((rem) => (
                <div key={rem.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <h5 className="font-bold text-[11px] text-slate-800 truncate">{rem.title}</h5>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">{rem.date || "Pas de date"}</p>
                  </div>
                  <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                    rem.priority === "Haute" ? "bg-rose-50 text-rose-600 animate-pulse" : rem.priority === "Moyenne" ? "bg-amber-50 text-amber-600" : "bg-purple-50 text-purple-600"
                  }`}>
                    {rem.priority || "Moyenne"}
                  </span>
                </div>
              ))}
              {urgentTasks.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-6">Aucun devoir urgent ou en attente.</p>
              )}
            </div>
          </div>

          <button 
            onClick={() => setTab("projects")} 
            className="w-full mt-4 py-2 bg-purple-50/50 hover:bg-purple-100/50 border border-purple-100/40 hover:border-purple-200 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-bold text-purple-700 cursor-pointer"
          >
            <span>Voir tous les rappels</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* 4. BOTTOM ROW: Notes récentes, Statistiques, Calendar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="home-bottom-grid-row">
        
        {/* Sub 1: Notes récentes */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between" id="bottom-resources-preview">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h4 className="font-bold text-slate-800 text-sm font-display">Notes récentes</h4>
            </div>
            <p className="text-[10px] text-slate-400 mb-3.5">Fiches d'études & résumés de cours</p>

            <div className="space-y-2.5">
              {recentResources.slice(0, 3).map((res) => (
                <div key={res.id} onClick={() => setTab("resources")} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-3 text-xs cursor-pointer hover:bg-purple-50/20 transition-all">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <div className="min-w-0">
                      <h5 className="font-bold text-slate-800 truncate text-[11px]">{res.title}</h5>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">{res.category}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                </div>
              ))}
              {recentResources.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-6">Aucune note de cours sauvegardée.</p>
              )}
            </div>
          </div>

          <button 
            onClick={() => setTab("resources")} 
            className="w-full mt-4 py-2 bg-purple-50/50 hover:bg-purple-100/50 border border-purple-100/40 hover:border-purple-200 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-bold text-purple-700 cursor-pointer"
          >
            <span>Ouvrir toutes les notes</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sub 2: Statistiques (Real Graphic / Spline Area Chart with Figures) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between" id="bottom-studies-stats">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h4 className="font-bold text-slate-800 text-sm font-display">Statistiques</h4>
              <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full font-mono">Live</span>
            </div>
            <p className="text-[10px] text-slate-400 mb-4">Progression générale d'apprentissage (Heures d'étude)</p>

            {/* Custom Premium Spline Vector Graph with Axis & Floating Numbers */}
            <div className="relative pt-2" id="stats-spline-chart">
               <svg viewBox="0 0 300 100" className="w-full h-24 overflow-visible" preserveAspectRatio="none">
                 <defs>
                   <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                     <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                   </linearGradient>
                   <linearGradient id="purpleIndigoGradientRing" x1="0%" y1="0%" x2="100%" y2="100%">
                     <stop offset="0%" stopColor="#a855f7" />
                     <stop offset="100%" stopColor="#4338ca" />
                   </linearGradient>
                 </defs>
                 
                 {/* Y-Axis text labels */}
                 <text x="2" y="14" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace">8h</text>
                 <text x="2" y="54" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace">4h</text>
                 <text x="2" y="94" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace">0h</text>

                 {/* Grid lines shifted to make space for Y axis */}
                 <line x1="20" y1="10" x2="295" y2="10" stroke="#f1f5f9" strokeWidth="1" />
                 <line x1="20" y1="50" x2="295" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                 <line x1="20" y1="90" x2="295" y2="90" stroke="#f8fafc" strokeWidth="1" />
                 
                 {/* Transparent Gradient Area under path */}
                 <path 
                   d="M 40,75 C 60,62 70,55 80,50 C 100,40 110,33 120,30 C 135,25 145,70 160,65 C 175,60 185,15 200,10 C 215,5 225,50 240,45 C 255,40 265,35 280,30 L 280,90 L 40,90 Z" 
                   fill="url(#chartGradient)" 
                 />
                 
                 {/* Spline stroke */}
                 <path 
                   d="M 40,75 C 60,62 70,55 80,50 C 100,40 110,33 120,30 C 135,25 145,70 160,65 C 175,60 185,15 200,10 C 215,5 225,50 240,45 C 255,40 265,35 280,30" 
                   fill="none" 
                   stroke="url(#purpleIndigoGradientRing)" 
                   strokeWidth="3.5" 
                   strokeLinecap="round"
                 />
                 
                 {/* Dynamic floating figures labels customized above nodes */}
                 <text x="110" y="24" fill="#8b5cf6" fontSize="7.5" fontWeight="bold" fontFamily="monospace">6.0h</text>
                 <text x="190" y="3" fill="#4338ca" fontSize="8" fontWeight="bold" fontFamily="monospace">8.0h</text>
                 <text x="232" y="38" fill="#854d0e" fontSize="7.5" fontWeight="bold" fontFamily="monospace">4.5h</text>
                 <text x="272" y="23" fill="#4f46e5" fontSize="7.5" fontWeight="bold" fontFamily="monospace">6h</text>

                 {/* Dot pointers with pulse and tag */}
                 <circle cx="200" cy="10" r="4.5" fill="#4338ca" stroke="#ffffff" strokeWidth="2" className="drop-shadow-sm" />
                 <circle cx="120" cy="30" r="3.5" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />
                 <circle cx="240" cy="45" r="3.5" fill="#ca8a04" stroke="#ffffff" strokeWidth="1.5" />
                 <circle cx="280" cy="30" r="3.5" fill="#6366f1" stroke="#ffffff" strokeWidth="1.5" />
               </svg>
               
               {/* Days labels perfectly aligned to X metrics */}
               <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-2 font-mono pl-[32px] pr-[12px]">
                 <span>Lun</span>
                 <span>Mar</span>
                 <span>Mer</span>
                 <span>Jeu</span>
                 <span>Ven</span>
                 <span>Sam</span>
                 <span>Dim</span>
               </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex items-center justify-between text-xs mt-4">
              <span className="font-bold text-slate-600">Performance hebdo</span>
              <span className="text-purple-700 font-bold font-mono text-xs">
                +18% de productivité
              </span>
            </div>
          </div>

          <button 
            onClick={() => setTab("focus")} 
            className="w-full mt-4 py-2 bg-purple-50/50 hover:bg-purple-100/50 border border-purple-100/40 hover:border-purple-200 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-bold text-purple-700 cursor-pointer"
          >
            <span>Voir les statistiques détaillées</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sub 3: Calendar - Miniature interactive calendar of the month */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between" id="bottom-calendars-sync">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h4 className="font-bold text-slate-800 text-sm font-display">Agenda</h4>
            </div>
            <p className="text-[10px] text-slate-400 mb-3.5">Calendrier mensuel actif • {miniCalendarData.capitalizedMonthLabel}</p>

            {/* Mini Month Grid Calendar */}
            <div className="p-2 border border-slate-100 rounded-2xl bg-slate-50/50">
              <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                {["L", "M", "M", "J", "V", "S", "D"].map((d, index) => (
                  <span key={index} className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-widest">{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {/* Empty Days padding starting on Monday */}
                {Array(miniCalendarData.paddingCount).fill(null).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-6 w-full" />
                ))}
                {/* Days in current month */}
                {Array.from({ length: miniCalendarData.daysInMonth }, (_, i) => i + 1).map((day) => {
                  const isToday = day === miniCalendarData.todayDate;
                  const isEventDay = [3, 10, 15, 22].includes(day);
                  return (
                    <div 
                      key={`day-${day}`}
                      onClick={() => triggerNotification(`Jour ${day} ${miniCalendarData.capitalizedMonthLabel}`, `Aucun examen d'études prévu ce jour. Reste concentré !`, "info")}
                      className={`h-6 w-full text-[10px] font-bold flex flex-col items-center justify-center rounded-lg relative cursor-pointer transition-all ${
                        isToday 
                          ? "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-sm font-black" 
                          : "text-slate-700 hover:bg-purple-55/60 hover:text-purple-700"
                      }`}
                    >
                      <span>{day}</span>
                      {isEventDay && !isToday && (
                        <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-indigo-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <button 
            onClick={() => setTab("calendars")} 
            className="w-full mt-4 py-2 bg-purple-50/50 hover:bg-purple-100/50 border border-purple-100/40 hover:border-purple-200 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-bold text-purple-700 cursor-pointer"
          >
            <span>Gérer mes calendriers</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* 5. FOOTER: Motivational message (message de motivation à la fin) */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden" id="home-motivation-footer">
        <div className="absolute inset-0 bg-white/5 opacity-10" />
        <div className="relative z-10">
          <h5 className="font-extrabold text-sm font-display">La citation inspirante du jour</h5>
          <p className="text-xs text-purple-100 max-w-2xl leading-relaxed mt-0.5">
            "Le succès n'est pas le fruit du hasard. C'est du travail acharné, de la persévérance, de l'apprentissage, de l'étude, de l'abnégation, et surtout de l'amour de ce que l'on fait."
          </p>
        </div>
        <button 
          onClick={() => triggerNotification("Inspiration active !", "Reste positif et donne ton maximum pour réussir aujourd'hui.", "success")}
          className="bg-white hover:bg-purple-50 text-purple-700 font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer relative z-10 shrink-0"
        >
          Je reste inspiré !
        </button>
      </div>

    </div>
  );
};
