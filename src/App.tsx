/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Plus, 
  MapPin, 
  Clock, 
  Download, 
  Trash2, 
  Sparkles, 
  Check, 
  CheckSquare, 
  Volume2, 
  VolumeX, 
  Flame, 
  Coffee, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Users, 
  FileText, 
  Archive, 
  ExternalLink,
  Info,
  Radio
} from "lucide-react";
import { CollabProvider, useCollab } from "./context/CollabContext";
import { NavigationSidebar } from "./components/NavigationSidebar";
import { Navbar } from "./components/Navbar";
import brandLogo from "./assets/logo.png";
import { ScheduleView } from "./components/ScheduleView";
import { FocusZone } from "./components/FocusZone";
import { NotepadView } from "./components/NotepadView";
import { InteractiveTasksWithEmail } from "./components/InteractiveTasksWithEmail";
import { TaskCenter } from "./components/TaskCenter";
import { CalendarsView } from "./components/CalendarsView";
import { RemindersView } from "./components/RemindersView";
import { AccueilDashboard } from "./components/AccueilDashboard";
import { LoginView } from "./components/LoginView";
import { Task, Course, Resource, AppNotification } from "./types";
import { motion, AnimatePresence } from "motion/react";

function MainDashboardContent({ currentTab, setTab, searchQuery, setSearchQuery }: { 
  currentTab: string; 
  setTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return typeof window !== "undefined" ? window.innerWidth < 1024 : false;
  });

  const { 
    state, 
    userProfile, 
    addTask, 
    toggleTask, 
    triggerNotification, 
    deleteResource,
    clearNotifications,
    currentUser,
    isAuthLoading,
    loginWithGoogle
  } = useCollab();

  // --- Home Dashboard Split Screen Layout ---
  // If tab is "accueil", we render the exact dashboard from the user image!
  
  // Right sidebar "À faire" filter state
  const [rightTaskFilter, setRightTaskFilter] = useState<"Tout" | "Devoirs" | "Examens" | "Projets">("Tout");
  const [isAddingRightTask, setIsAddingRightTask] = useState(false);
  const [rightTaskTitle, setRightTaskTitle] = useState("");
  const [rightTaskPriority, setRightTaskPriority] = useState<"Haute" | "Moyenne" | "Basse">("Haute");
  const [rightTaskCategory, setRightTaskCategory] = useState<"Devoirs" | "Examens" | "Projets">("Devoirs");

  // Focus Section circular timer states (syncing with a secondary mini focus panel in right sidebar)
  const [rightFocusActive, setRightFocusActive] = useState(false);
  const [rightFocusSeconds, setRightFocusSeconds] = useState(25 * 60);
  const pomodoroTotalSecs = 25 * 60;
  
  React.useEffect(() => {
    let focusInterval: any = null;
    if (rightFocusActive) {
      focusInterval = setInterval(() => {
        setRightFocusSeconds((prev) => {
          if (prev <= 1) {
            setRightFocusActive(false);
            triggerNotification("Focus Pomodoro terminé ! 🎉", "Félicitations pour ces 25 minutes de concentration !", "success");
            return pomodoroTotalSecs;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (focusInterval) clearInterval(focusInterval);
    }
    return () => {
      if (focusInterval) clearInterval(focusInterval);
    };
  }, [rightFocusActive, triggerNotification]);

  if (isAuthLoading) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999]" id="auth-loading-screen">
        <div className="w-16 h-16 border-4 border-slate-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView loginWithGoogle={loginWithGoogle} />;
  }

  const handleCreateRightTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rightTaskTitle.trim()) return;
    addTask(
      rightTaskTitle.trim(),
      rightTaskCategory,
      "Demain • 23:59",
      rightTaskPriority
    );
    setRightTaskTitle("");
    setIsAddingRightTask(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Haute": return "text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded";
      case "Moyenne": return "text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded";
      default: return "text-blue-500 font-bold bg-blue-50 px-2 py-0.5 rounded";
    }
  };

  const rightTasksFiltered = state.tasks.filter((task) => {
    const matchesCategory = rightTaskFilter === "Tout" || task.category === rightTaskFilter;
    const matchesQuery = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const getFileIcon = (type: string) => {
    if (type === "zip") return <Archive className="w-4 h-4 text-amber-500" />;
    return <FileText className="w-4 h-4 text-red-500" />;
  };

  // Switch display depending on tab selection
  const renderFocalTab = () => {
    switch (currentTab) {
      case "schedule":
        return <ScheduleView />;
      case "resources":
        return <NotepadView />;
      case "projects":
        return <InteractiveTasksWithEmail />;
      case "focus":
        return <FocusZone />;
      case "calendars":
        return <CalendarsView />;
      case "tasks":
        return <TaskCenter />;
      default: {
        return (
          <AccueilDashboard 
            setTab={setTab} 
            userProfile={userProfile}
            state={state}
            toggleTask={toggleTask}
            triggerNotification={triggerNotification}
            rightFocusActive={rightFocusActive}
            setRightFocusActive={setRightFocusActive}
            rightFocusSeconds={rightFocusSeconds}
            setRightFocusSeconds={setRightFocusSeconds}
            pomodoroTotalSecs={pomodoroTotalSecs}
          />
        );
      }

      case "old_default_discarded": {
        // "accueil" selection - Rich Dashboard Layout identical to screenshot
        return (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in" id="dashboard-home-grid">
            
            {/* LEFT AREA: 2 Columns */}
            <div className="xl:col-span-2 space-y-6 flex flex-col justify-between">
              
              {/* TIMETABLE WEEK PREVIEW CARD (Emploi du temps widget matching) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm" id="home-employment-preview">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm font-display leading-none">Emploi du temps</h4>
                    <p className="text-[11px] text-slate-400 mt-1 font-sans">Aujourd'hui, Lundi 14 Mai • Semaine intensive</p>
                  </div>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                    <button onClick={() => setTab("schedule")} className="px-2.5 py-1 text-slate-650 hover:text-slate-900">
                      Ouvrir l'agenda entier
                    </button>
                  </div>
                </div>

                {/* Highly compact list view calendar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="compact-courses-flow">
                  {state.courses.slice(0, 4).map((course: Course) => (
                    <div 
                      key={course.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between ${course.color}`}
                    >
                      <div>
                        <h5 className="font-bold text-xs truncate leading-snug">{course.title}</h5>
                        <p className="text-[10px] opacity-80 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" /> {course.room} | Jour: {course.day}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-bold shrink-0 bg-white/70 px-2 py-0.5 rounded border border-slate-200/50 text-slate-700">
                        {course.startTime} - {course.endTime}
                      </span>
                    </div>
                  ))}
                </div>
                          {/* RECENT NOTES WIDGET (Fiches & Notes de cours récentes) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm" id="home-resources-preview">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-slate-800 text-sm font-display">Fiches d'études récentes</h4>
                  <button onClick={() => setTab("resources")} className="text-xs text-purple-600 hover:text-indigo-600 font-bold cursor-pointer">
                    Voir tout
                  </button>
                </div>

                <div className="divide-y divide-slate-100" id="recent-resources-list">
                  {[
                    { title: "Résumé Réseaux de Neurones", category: "Informatique" },
                    { title: "Formules d'Intégration et Dérivées", category: "Mathématiques" },
                    { title: "Vocabulaire Anglais C1 Study List", category: "Anglais" },
                  ].map((res, idx) => (
                    <div key={idx} onClick={() => setTab("resources")} className="py-2.5 flex items-center justify-between gap-4 group text-xs cursor-pointer hover:bg-slate-50/50 px-1 rounded-lg transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg group-hover:bg-purple-50 transition-colors shrink-0">
                          <FileText className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-slate-800 truncate leading-snug">{res.title}</h5>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Matière: <span className="font-bold text-slate-500 font-mono">{res.category}</span>
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                  ))}
                </div>
              </div>

              {/* TASKS & MAIL REMINDERS COMPACT VIEW */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm" id="home-projects-preview">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-slate-800 text-sm font-display">Tâches & Rappels emails</h4>
                  <button onClick={() => setTab("projects")} className="text-xs text-purple-600 hover:text-indigo-600 font-bold cursor-pointer">
                    Voir tout
                  </button>
                </div>

                <div className="divide-y divide-slate-100" id="compact-peers-list font-sans">
                  {[
                    { title: "Soumettre le TP de Programmation Avancée", category: "Informatique", due: "Demain", prio: "Haute" },
                    { title: "Fiche d'exercices d'Algèbre Linéaire", category: "Mathématiques", due: "30 Mai", prio: "Moyenne" },
                    { title: "Préparer l'exposé d'Anglais C1", category: "Anglais", due: "02 Juin", prio: "Basse" },
                  ].map((task, idx) => (
                    <div 
                       key={idx} 
                       onClick={() => setTab("projects")}
                       className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/50 transition-colors cursor-pointer px-1 rounded-lg"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg shrink-0">
                          <CheckSquare className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-slate-800 truncate leading-snug">{task.title}</h5>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                            <span 
                              className={`w-2 h-2 rounded-full inline-block shrink-0 ${
                                task.category === "Mathématiques" ? "bg-indigo-500" :
                                task.category === "Informatique" ? "bg-emerald-500" :
                                task.category === "Anglais" ? "bg-amber-500" : "bg-slate-400"
                              }`} 
                              title={task.category}
                            />
                            <span>Échéance : <span className="font-semibold text-slate-500">{task.due}</span></span>
                          </div>
                        </div>
                      </div>
                      
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        task.prio === "Haute" ? "bg-rose-50 text-rose-600" : task.prio === "Moyenne" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                      }`}>
                        {task.prio}
                      </span>
                    </div>
                  ))}
                </div>
              </div>              </div>

              {/* CALENDARS EXTERNAL SYNC BOTTOM BLOCK */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-purple-50/10 to-indigo-50/10" id="home-calendars-preview">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-purple-600 animate-pulse shrink-0" />
                  <div>
                    <h5 className="font-bold text-xs text-slate-800">Synchronisation des calendriers</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Vos flux d'agendas Google Agenda, Outlook et Apple Calendar au même endroit.</p>
                  </div>
                </div>

                <div className="flex gap-4 text-[10px] font-bold text-slate-500 font-mono">
                  <span className="flex items-center gap-1">🟢 GOOGLE</span>
                  <span className="flex items-center gap-1">🟢 OUTLOOK</span>
                  <span className="flex items-center gap-1">🟢 APPLE</span>
                </div>

                <button 
                  onClick={() => setTab("calendars")}
                  className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-3.5 py-1.5 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Gérer les connexions
                </button>
              </div>

            </div>

            {/* RIGHT SIDE PANEL: 1 Column */}
            <div className="xl:col-span-1 space-y-6">

              {/* --- RIGHT COMPONET 1: TO-DO SECTOR (À faire) --- */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4" id="right-panel-tasks">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm font-display leading-none">À faire</h4>
                  <button onClick={() => setTab("tasks")} className="text-[11px] text-purple-600 hover:text-indigo-600 font-bold">
                    Voir tout
                  </button>
                </div>

                {/* mini task categories filter badges row */}
                <div className="flex gap-1 bg-slate-100 p-0.5 rounded-xl text-[10px]">
                  {["Tout", "Devoirs", "Examens", "Projets"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setRightTaskFilter(f as any)}
                      className={`grow text-center py-1 rounded-lg font-bold transition-all ${
                        rightTaskFilter === f
                          ? "bg-white text-purple-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* Nouvelle tâche modal / form inline box */}
                {isAddingRightTask ? (
                  <form onSubmit={handleCreateRightTask} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-2xs">
                    <input
                      type="text"
                      required
                      placeholder="Objet de la révision..."
                      value={rightTaskTitle}
                      onChange={(e) => setRightTaskTitle(e.target.value)}
                      className="bg-white border border-slate-250 rounded-lg w-full px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 text-xs"
                    />
                    <div className="grid grid-cols-2 gap-1.5">
                      <select
                        value={rightTaskCategory}
                        onChange={(e: any) => setRightTaskCategory(e.target.value)}
                        className="bg-white border border-slate-200 rounded px-1.5 py-1"
                      >
                        <option value="Devoirs">Devoirs</option>
                        <option value="Examens">Examens</option>
                        <option value="Projets">Projets</option>
                      </select>
                      <select
                        value={rightTaskPriority}
                        onChange={(e: any) => setRightTaskPriority(e.target.value)}
                        className="bg-white border border-slate-200 rounded px-1.5 py-1 text-red-500 font-bold"
                      >
                        <option value="Haute">🔴 Haute</option>
                        <option value="Moyenne">🟡 Moyenne</option>
                        <option value="Basse">🔵 Basse</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button type="button" onClick={() => setIsAddingRightTask(false)} className="px-2 py-1 text-slate-500 hover:text-slate-900">
                        Annuler
                      </button>
                      <button type="submit" className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold px-2 py-1 rounded">
                        Ajouter
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsAddingRightTask(true)}
                    className="w-full py-2 bg-slate-50 border border-dashed border-slate-200 rounded-xl hover:border-purple-400 text-slate-500 hover:text-purple-700 font-bold text-xs inline-flex items-center justify-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Nouvelle tâche
                  </button>
                )}

                {/* compact tasks entries list */}
                <div className="divide-y divide-slate-100" id="home-compact-tasks-feed">
                  {rightTasksFiltered.slice(0, 4).map((task: Task) => (
                    <div 
                      key={task.id}
                      className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/50 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center cursor-pointer ${
                            task.completed ? "bg-gradient-to-br from-purple-600 to-indigo-600 border-transparent text-white" : "border-slate-300 hover:border-purple-400"
                          }`}
                        >
                          {task.completed && <Check className="w-2.5 h-2.5" />}
                        </button>
                        <span className={`font-bold truncate select-none leading-none ${task.completed ? "line-through text-slate-400" : "text-slate-700"}`}>
                          {task.title}
                        </span>
                      </div>

                      <span className={`shrink-0 text-[9px] uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* --- RIGHT COMPONENT 2: FOCUS SECTOR (Pomodoro Ring) --- */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4" id="right-panel-focus">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm font-display leading-none">Focus</h4>
                  <button onClick={() => setTab("focus")} className="text-[11px] text-purple-600 hover:text-indigo-600 font-bold">
                    Mode complet
                  </button>
                </div>

                <div className="flex justify-around items-center gap-2 bg-slate-50 p-1.5 rounded-xl text-[10px] font-bold text-slate-500">
                  <span className="text-purple-700 font-extrabold px-2.5 py-1 bg-white rounded-lg shadow-sm">Pomodoro</span>
                  <span>Ambiance</span>
                  <span>Stopwatch</span>
                </div>

                <div className="flex items-center justify-around py-2">
                  {/* Small Ring SVG countdown display */}
                  <div className="relative flex items-center justify-center">
                    <svg className="w-28 h-28 transform -rotate-90">
                      <circle cx="56" cy="56" r="48" stroke="#f1f5f9" strokeWidth="4" fill="transparent" />
                      <circle 
                        cx="56" 
                        cy="56" 
                        r="48" 
                        stroke="#a855f7" 
                        strokeWidth="6" 
                        strokeDasharray="301.59" 
                        strokeDashoffset="95" 
                        fill="transparent" 
                        className="animate-pulse"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <h3 className="text-xl font-extrabold text-slate-850 font-mono tracking-tighter">25:00</h3>
                      <span className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">Pomodoro 1/4</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <button
                      onClick={() => {
                        setTab("focus");
                        triggerNotification("Démarrage focus", "Mode Focus initialisé !", "info");
                      }}
                      className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-lg shadow-sm block w-full transition-colors cursor-pointer text-center"
                    >
                      Démarrer
                    </button>
                    <button
                      onClick={() => alert("Pomodoro remis à 25:00")}
                      className="px-4 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-lg block w-full text-center transition-colors hover:text-slate-900 cursor-pointer"
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>
              </div>

              {/* --- RIGHT COMPONENT 3: UPCOMING REMINDERS (Rappels à venir) --- */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4" id="right-panel-reminders">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm font-display leading-none">Rappels à venir</h4>
                  <button onClick={() => setTab("projects")} className="text-[11px] text-purple-600 hover:text-indigo-600 font-bold">
                    Voir tout
                  </button>
                </div>

                <div className="divide-y divide-slate-100" id="home-compact-reminders-feed">
                  {[
                    { title: "Examen de Mathématiques", date: "20 Mai • 08:00", days: "Dans 6 Jours", emoji: "📘" },
                    { title: "Rendu Projet IA", date: "24 Mai • 14:00", days: "Dans 10 Jours", emoji: "🚀" },
                    { title: "Devoir d'Informatique", date: "28 Mai • 23:59", days: "Dans 14 Jours", emoji: "💻" },
                  ].map((rem, index) => (
                    <div 
                      key={index}
                      className="py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base shrink-0 select-none">{rem.emoji}</span>
                        <div className="min-w-0">
                          <h5 className="font-bold text-[11px] text-slate-800 truncate leading-snug">{rem.title}</h5>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">{rem.date}</p>
                        </div>
                      </div>

                      <span className="text-[9px] font-bold font-mono text-purple-700 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded-full shrink-0">
                        {rem.days}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        );
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden font-sans relative">
      
      {/* Dynamic left Navigation sidebar */}
      <NavigationSidebar 
        currentTab={currentTab} 
        setTab={setTab} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Backdrop overlay for mobile screens when expanded */}
      {!isSidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-35 lg:hidden cursor-pointer"
          onClick={() => setIsSidebarCollapsed(true)}
          id="sidebar-mobile-backdrop"
        />
      )}

      {/* Main Content Workspace flow */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Navbar */}
        <Navbar 
          setTab={setTab} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />

        {/* Inner dynamic canvas view */}
        <main className={`flex-1 p-4 md:p-6 ${["resources", "projects"].includes(currentTab) ? "overflow-hidden" : "overflow-y-auto"}`} id="primary-workspace">
          {renderFocalTab()}
        </main>
      </div>

    </div>
  );
}

export default function App() {
  const [currentTab, setTab] = useState("accueil");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSplash, setShowSplash] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <CollabProvider>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
            className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999] select-none"
            id="app-splash-screen"
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="flex flex-col items-center gap-6"
            >
              {/* Larger centered logo with no shadows or borders */}
              <div className="w-48 h-48 md:w-64 md:h-64 flex items-center justify-center bg-white">
                <img 
                  src={brandLogo} 
                  alt="A-Wolf Logo" 
                  className="w-full h-full object-contain" 
                  referrerPolicy="no-referrer" 
                />
              </div>
              
              {/* Sleek loading line indicator */}
              <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden mt-2 relative">
                <motion.div 
                  className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-purple-600 to-indigo-600"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MainDashboardContent 
        currentTab={currentTab} 
        setTab={setTab} 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
      />
    </CollabProvider>
  );
}
