import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Settings, 
  Plus, 
  Check, 
  Trash2, 
  Sparkles, 
  Clock, 
  Volume2, 
  Moon, 
  RefreshCw, 
  ArrowRight,
  Lightbulb,
  X 
} from "lucide-react";
import { useCollab } from "../context/CollabContext";
import { motion, AnimatePresence } from "motion/react";
import {
  subscribeReminders,
  saveReminderToCloud,
  removeReminderFromCloud
} from "../lib/firestoreSync";

interface ReminderItem {
  id: string;
  title: string;
  time: string; // e.g., "18:00" or date
  dateGroup: "Aujourd'hui" | "Demain" | "Plus tard";
  dateText: string; // "14 Mai 2024" etc.
  subtitle: string;
  category: "Cours" | "Devoirs & Examens" | "Projets & Réunions" | "Personnels" | "Rappels récurrents";
  importance: "high" | "medium" | "low"; // importants, modérés, faible
  completed: boolean;
  colorBg: string; // background color prefix
}

const defaultReminders: ReminderItem[] = [
  // Aujourd'hui
  { id: "rem1", title: "Mathématiques - Devoir", time: "18:00", dateGroup: "Aujourd'hui", dateText: "14 Mai 2024", subtitle: "Réviser les exercices du chapitre 3", category: "Cours", importance: "high", completed: false, colorBg: "bg-blue-600" },
  { id: "rem2", title: "Projet IA - Réunion", time: "14:00", dateGroup: "Aujourd'hui", dateText: "14 Mai 2024", subtitle: "Préparer le point d'avancement", category: "Projets & Réunions", importance: "medium", completed: false, colorBg: "bg-purple-600" },
  { id: "rem3", title: "Rendre Le Devoir Physique", time: "23:59", dateGroup: "Aujourd'hui", dateText: "14 Mai 2024", subtitle: "Chapitre 4 - Mécanique", category: "Devoirs & Examens", importance: "high", completed: false, colorBg: "bg-rose-500" },
  { id: "rem4", title: "Lire le chapitre 5 d'Algorithmique", time: "20:30", dateGroup: "Aujourd'hui", dateText: "14 Mai 2024", subtitle: "Arbres et graphes", category: "Cours", importance: "low", completed: false, colorBg: "bg-orange-500" },
  { id: "rem5", title: "Appeler le groupe pour le TP", time: "16:00", dateGroup: "Aujourd'hui", dateText: "14 Mai 2024", subtitle: "Physique - Ondes", category: "Projets & Réunions", importance: "medium", completed: false, colorBg: "bg-emerald-500" },
  
  // Demain
  { id: "rem6", title: "Cours d'Informatique", time: "14:00", dateGroup: "Demain", dateText: "15 Mai 2024", subtitle: "Structures de données", category: "Cours", importance: "medium", completed: false, colorBg: "bg-blue-605 bg-blue-600" },
  { id: "rem7", title: "Préparer la présentation", time: "10:00", dateGroup: "Demain", dateText: "15 Mai 2024", subtitle: "Projet Web", category: "Projets & Réunions", importance: "high", completed: false, colorBg: "bg-purple-600" },
  { id: "rem8", title: "Rappel hebdomadaire", time: "18:00", dateGroup: "Demain", dateText: "15 Mai 2024", subtitle: "Faire le bilan de la semaine", category: "Rappels récurrents", importance: "low", completed: false, colorBg: "bg-emerald-500" },
  
  // Plus tard
  { id: "rem9", title: "Réviser pour l'examen", time: "20 Mai", dateGroup: "Plus tard", dateText: "20 Mai 2024", subtitle: "Mathématiques", category: "Devoirs & Examens", importance: "high", completed: false, colorBg: "bg-blue-600" },
  { id: "rem10", title: "Payer l'abonnement internet", time: "25 Mai", dateGroup: "Plus tard", dateText: "25 Mai 2024", subtitle: "Maison", category: "Personnels", importance: "low", completed: false, colorBg: "bg-orange-500" }
];

export const RemindersView: React.FC = () => {
  const { triggerNotification, currentUser, isAuthLoading } = useCollab();

  // Active sub-tab inside Rappels
  const [activeTab, setActiveTab] = useState<"À venir" | "Terminés" | "Tout">("À venir");

  // Filter option check states matching mockup
  const [filters, setFilters] = useState({
    Cours: true,
    "Devoirs & Examens": true,
    "Projets & Réunions": true,
    Personnels: true,
    "Rappels récurrents": true,
  });

  // State carrying reminder items
  const [reminders, setReminders] = useState<ReminderItem[]>([]);

  // Real-time listener on Firestore Reminders
  useEffect(() => {
    if (currentUser) {
      const unsub = subscribeReminders(currentUser.uid, (cloud) => {
        if (cloud.length > 0) {
          const mapped: ReminderItem[] = cloud.map(r => ({
            id: r.id,
            title: r.title,
            time: r.time || "12:00",
            dateGroup: (r.dateGroup || "Aujourd'hui") as any,
            dateText: r.dateText || "14 Mai 2024",
            subtitle: r.subtitle || "",
            category: (r.category || "Cours") as any,
            importance: (r.importance || "medium") as any,
            completed: r.completed,
            colorBg: r.colorBg || "bg-blue-600"
          }));
          setReminders(mapped);
        } else {
          setReminders([]);
        }
      });
      return () => unsub();
    } else if (!isAuthLoading) {
      setReminders([]);
    }
  }, [currentUser, isAuthLoading]);

  // Settings mock states
  const [defaultReminderTime, setDefaultReminderTime] = useState("15 minutes avant");
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dontDisturb, setDontDisturb] = useState(false);

  // Modal create reminder states
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newTime, setNewTime] = useState("18:00");
  const [newGroup, setNewGroup] = useState<"Aujourd'hui" | "Demain" | "Plus tard">("Aujourd'hui");
  const [newCategory, setNewCategory] = useState<any>("Cours");
  const [newImportance, setNewImportance] = useState<"high" | "medium" | "low">("high");

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    let targetBg = "bg-blue-600";
    if (newCategory === "Devoirs & Examens") targetBg = "bg-rose-500";
    else if (newCategory === "Projets & Réunions") targetBg = "bg-purple-600";
    else if (newCategory === "Rappels récurrents") targetBg = "bg-emerald-500";
    else if (newCategory === "Personnels") targetBg = "bg-orange-500";

    const custom: ReminderItem = {
      id: "rem_" + Date.now(),
      title: newTitle.trim(),
      time: newTime,
      dateGroup: newGroup,
      dateText: newGroup === "Aujourd'hui" ? "14 Mai 2024" : newGroup === "Demain" ? "15 Mai 2024" : "Fin Mai 2024",
      subtitle: newSubtitle.trim() || "Notes complémentaires",
      category: newCategory,
      importance: newImportance,
      completed: false,
      colorBg: targetBg,
    };

    setReminders([custom, ...reminders]);
    if (currentUser) {
      saveReminderToCloud(currentUser.uid, {
        id: custom.id,
        title: custom.title,
        deadline: custom.time,
        completed: custom.completed,
        active: !custom.completed,
        time: custom.time,
        dateGroup: custom.dateGroup,
        dateText: custom.dateText,
        subtitle: custom.subtitle,
        category: custom.category,
        importance: custom.importance,
        colorBg: custom.colorBg
      });
    }
    setIsOpenAddModal(false);
    setNewTitle("");
    setNewSubtitle("");
    triggerNotification(
      "Rappel Programmé 🔔",
      `Le rappel "${newTitle}" est actif et configuré.`,
      "success"
    );
  };

  const handleToggleCompleted = (id: string, currentStatus: boolean) => {
    const item = reminders.find(r => r.id === id);
    if (item) {
      const nextCompleted = !item.completed;
      setReminders(prev => prev.map(item => item.id === id ? { ...item, completed: nextCompleted } : item));
      if (currentUser) {
        saveReminderToCloud(currentUser.uid, {
          ...item,
          deadline: item.time,
          completed: nextCompleted,
          active: !nextCompleted
        });
      }
    }
    triggerNotification(
      currentStatus ? "Sélection rétablie" : "Rappel Terminé ✅",
      currentStatus ? "Rappel re-marqué à faire." : "Rappel archivé dans Terminés.",
      "success"
    );
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(prev => prev.filter(item => item.id !== id));
    if (currentUser) {
      removeReminderFromCloud(id);
    }
    triggerNotification("Suppression effectuée", "Rappel supprimé.", "warning");
  };

  // Compute live items matching category filter and active tabs
  const filteredReminders = reminders.filter(item => {
    // 1. Checkbox layer filters
    const layerAllowed = filters[item.category as keyof typeof filters];
    
    // 2. Tab filters
    let tabAllowed = true;
    if (activeTab === "À venir") tabAllowed = !item.completed;
    else if (activeTab === "Terminés") tabAllowed = item.completed;
    // (If "Tout", let both through)

    return layerAllowed && tabAllowed;
  });

  // Calculate statistics for visual ring
  // Under the mockup design, "Rappels du jour" displays total active/pending reminders
  const listTodayActive = reminders.filter(r => r.dateGroup === "Aujourd'hui" && !r.completed);
  const countToday = listTodayActive.length;

  const countImportant = listTodayActive.filter(r => r.importance === "high").length;
  const countModerate = listTodayActive.filter(r => r.importance === "medium").length;
  const countLow = listTodayActive.filter(r => r.importance === "low").length;

  // Render group list for grouping title rendering
  const groupsToRender = ["Aujourd'hui", "Demain", "Plus tard"] as const;

  return (
    <div className="space-y-6 font-sans text-slate-800" id="reminders-root-view">
      
      {/* Banner / Title view row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display flex items-center gap-2">
            🔔 Rappels
          </h2>
          <p className="text-xs text-slate-500 mt-1">Ne manquez plus rien grâce à vos rappels et notifications d'études.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => {
              setDontDisturb(!dontDisturb);
              triggerNotification(
                "Mode Ne Pas Déranger",
                dontDisturb ? "Flux de notifications réactivé." : "Toutes les alarmes sonores sont silencieuses.",
                "info"
              );
            }}
            className={`p-2.5 border rounded-xl hover:bg-slate-50 cursor-pointer transition-colors ${
              dontDisturb ? "border-amber-250 bg-amber-50 text-amber-600" : "border-slate-200 text-slate-500"
            }`}
            title="Sourdine / Ne Pas Déranger"
          >
            <Moon className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsOpenAddModal(true)}
            className="flex items-center gap-1.5 bg-violet-605 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-md shadow-violet-850/10 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nouveau rappel
          </button>
        </div>
      </div>

      {/* Main Grid: list items and sidebar widget columns */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: Main lists groupings (Takes 3 Columns) */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* Subtabs filters: À venir, Terminés, Tout */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl font-bold text-xs w-max" id="reminders-tabs-bar">
            {(["À venir", "Terminés", "Tout"] as const).map(tab => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    triggerNotification("Triage de liste", `Affichage : "${tab}"`, "info");
                  }}
                  className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                    isActive 
                      ? "bg-violet-600 text-white shadow-sm font-extrabold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Grouped Lists layout */}
          <div className="space-y-6" id="reminders-milestones-stack">
            {groupsToRender.map(group => {
              const groupItems = filteredReminders.filter(item => item.dateGroup === group);
              if (groupItems.length === 0) return null;

              // Compute human timeline label matching mockup layout
              let groupLabel = "Aujourd'hui — 14 Mai 2024";
              if (group === "Demain") groupLabel = "Demain — 15 Mai 2024";
              else if (group === "Plus tard") groupLabel = "Plus tard";

              return (
                <div key={group} className="space-y-3" id={`group-box-${group}`}>
                  
                  {/* Category Title Heading */}
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl px-4 border">
                    <h4 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-widest font-mono">
                      {groupLabel}
                    </h4>
                    <span className="text-[10px] bg-white border border-slate-200 text-slate-500 font-extrabold px-2 py-0.5 rounded-full shadow-2xs font-mono">
                      {groupItems.length} {groupItems.length > 1 ? "rappels" : "rappel"}
                    </span>
                  </div>

                  {/* List cards content */}
                  <div className="space-y-2.5">
                    {groupItems.map(item => (
                      <motion.div
                        layout
                        key={item.id}
                        className={`p-4 bg-white border border-slate-200/80 hover:border-violet-200 rounded-2xl flex items-center justify-between gap-4 transition-all group/card shadow-2xs ${
                          item.completed ? "opacity-60 bg-slate-50/50" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          
                          {/* Checkbox badge circle */}
                          <div 
                            onClick={() => handleToggleCompleted(item.id, item.completed)}
                            className={`w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${
                              item.completed 
                                ? "bg-violet-600 border-violet-600 text-white" 
                                : "border-slate-300 hover:border-violet-500"
                            }`}
                          >
                            {item.completed && <Check className="w-3.5 h-3.5 border-none" />}
                          </div>

                          {/* Colored circular glyph representation */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ${item.colorBg} shadow-sm font-mono text-xs font-bold font-display`}>
                            {item.title[0]}
                          </div>

                          <div className="min-w-0">
                            <h4 className={`font-extrabold text-xs text-slate-800 truncate leading-snug flex items-center gap-1.5 ${
                              item.completed ? "line-through text-slate-400 font-normal" : ""
                            }`}>
                              {item.title}
                            </h4>
                            <p className="text-[10px] text-slate-405 text-slate-400 font-sans mt-0.5 truncate">{item.subtitle}</p>
                          </div>

                        </div>

                        {/* Timing details with notification bells */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[10px] font-bold font-mono text-slate-600 bg-slate-50 px-2 py-0.5 border border-slate-150 rounded dark:bg-slate-900/15">
                            {item.time}
                          </span>
                          
                          <Bell className={`w-3.5 h-3.5 ${
                            item.importance === "high" ? "text-rose-500 animate-pulse" :
                            item.importance === "medium" ? "text-amber-500" : "text-slate-300"
                          }`} />

                          <button
                            onClick={() => handleDeleteReminder(item.id)}
                            className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover/card:opacity-100 transition-all cursor-pointer"
                            title="Supprimer ce rappel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                </div>
              );
            })}

            <button 
              onClick={() => alert("Tous vos rappels hebdomadaires et d'agenda sont indexés dans cette vue.")}
              className="w-full text-center py-2.5 border border-dashed border-slate-200 text-slate-500 hover:text-slate-850 font-bold hover:border-violet-400 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Voir tous les rappels
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Sidebar widgets (Filtres, Paramètres, Astuce) */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* A. Rappels du jour Circle Gauge inside card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4" id="rappels-du-jour-card">
            <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest leading-none">
              Rappels du jour
            </h4>

            {/* Circular Gauge Ring SVG */}
            <div className="flex flex-col items-center justify-center py-3">
              <div className="relative flex items-center justify-center">
                {/* Visual stacked rings */}
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="54" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                  
                  {/* High level severity ring segment (e.g. 50%) */}
                  <circle 
                    cx="64" 
                    cy="64" 
                    r="54" 
                    stroke="#ef4444" 
                    strokeWidth="8" 
                    strokeDasharray="339.29" 
                    strokeDashoffset={339.29 - (339.29 * 0.45)} 
                    fill="transparent" 
                    className="transition-all duration-500"
                  />

                  {/* Medium severity segment (e.g. 30%) */}
                  <circle 
                    cx="64" 
                    cy="64" 
                    r="54" 
                    stroke="#eab308" 
                    strokeWidth="8" 
                    strokeDasharray="339.29" 
                    strokeDashoffset={339.29 - (339.29 * 0.25)} 
                    fill="transparent" 
                    className="transition-all duration-500 rotate-45 transform origin-center"
                  />
                </svg>
                
                <div className="absolute text-center bg-white w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-xs">
                  <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tighter leading-none">
                    {countToday}
                  </h3>
                  <span className="text-[8px] text-slate-405 text-slate-400 uppercase tracking-wider font-bold mt-1">rappels</span>
                </div>
              </div>

              {/* Legend of ring */}
              <div className="w-full grid grid-cols-3 gap-1 pt-4 border-t border-slate-50 mt-3.5 text-[10px] font-semibold text-slate-500 text-center">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {countImportant}
                  </span>
                  <span className="text-[8.5px] uppercase text-slate-400 tracking-wider">importants</span>
                </div>
                <div className="space-y-0.5 border-x border-slate-100">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {countModerate}
                  </span>
                  <span className="text-[8.5px] uppercase text-slate-400 tracking-wider">modérés</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-450 bg-slate-400" /> {countLow}
                  </span>
                  <span className="text-[8.5px] uppercase text-slate-400 tracking-wider">faibles</span>
                </div>
              </div>

            </div>

          </div>

          {/* B. Filtres matching design exactly */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4" id="mes-rappels-filters">
            <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest leading-none">
              Filtres
            </h4>

            <div className="space-y-3" id="filters-tickboxes">
              {(Object.keys(filters) as Array<keyof typeof filters>).map(key => {
                const isSelected = filters[key];
                return (
                  <div
                    key={key}
                    onClick={() => {
                      setFilters({ ...filters, [key]: !filters[key] });
                      triggerNotification("Filtre activé", `Visibilité "${String(key)}" ajustée`, "info");
                    }}
                    className="flex justify-between items-center text-xs font-semibold cursor-pointer select-none"
                  >
                    <span className={`text-medium transition-colors ${isSelected ? "text-slate-850 font-bold" : "text-slate-400 line-through"}`}>
                      {key}
                    </span>

                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${
                      isSelected
                        ? "bg-violet-605 bg-violet-600 border-violet-600 text-white"
                        : "border-slate-300"
                    }`}>
                      {isSelected && <Check className="w-2.5 h-2.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* C. Paramètres widget matching design exactly */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4" id="default-notif-options">
            <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest leading-none">
              Paramètres
            </h4>

            {/* List preferences with responsive control clicks */}
            <div className="space-y-3 pt-1.5 font-sans" id="param-list">
              
              {/* Row 1: timing */}
              <div 
                onClick={() => {
                  const nextOpt = defaultReminderTime === "15 minutes avant" ? "30 minutes avant" : "15 minutes avant";
                  setDefaultReminderTime(nextOpt);
                  triggerNotification("Heure de rappel", `Ajustée à: ${nextOpt}`, "info");
                }}
                className="flex items-start gap-2.5 group cursor-pointer"
              >
                <Clock className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-[11px] text-slate-800 group-hover:text-violet-655 leading-tight">Heure de rappel par défaut</h5>
                  <span className="text-[10px] text-slate-400 block font-medium mt-0.5">{defaultReminderTime}</span>
                </div>
              </div>

              {/* Row 2: Recurrences */}
              <div 
                onClick={() => {
                  setRecurrenceEnabled(!recurrenceEnabled);
                  triggerNotification("Rappels récurrents", recurrenceEnabled ? "Rappels désactivés" : "Rappels réactivés", "info");
                }}
                className="flex items-start gap-2.5 group cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-[11px] text-slate-800 group-hover:text-violet-655 leading-tight">Rappels récurrents</h5>
                  <span className="text-[10px] text-slate-400 block font-medium mt-0.5">
                    {recurrenceEnabled ? "Activés" : "Inactifs"}
                  </span>
                </div>
              </div>

              {/* Row 3: Sounds */}
              <div 
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  triggerNotification("Alertes sonores", soundEnabled ? "Son désactivé." : "Vibrations & Son activé", "info");
                }}
                className="flex items-start gap-2.5 group cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-[11px] text-slate-800 group-hover:text-violet-655 leading-tight">Sons & notifications</h5>
                  <span className="text-[10px] text-slate-400 block font-medium mt-0.5">
                    {soundEnabled ? "Son activé" : "Désactivé"}
                  </span>
                </div>
              </div>

              {/* Row 4: Do not disturb */}
              <div 
                onClick={() => {
                  setDontDisturb(!dontDisturb);
                  triggerNotification("Ne pas déranger", !dontDisturb ? "Activé" : "Désactivé", "info");
                }}
                className="flex items-start gap-2.5 group cursor-pointer"
              >
                <Moon className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-[11px] text-slate-800 group-hover:text-violet-655 leading-tight">Ne pas déranger</h5>
                  <span className="text-[10px] text-slate-400 block font-medium mt-0.5">
                    {dontDisturb ? "Détecté" : "Désactivé"}
                  </span>
                </div>
              </div>

            </div>

            <button 
              onClick={() => {
                triggerNotification("Alerte configuration", "Redirection aux paramètres avancés", "info");
                alert("Vous recevrez les notifications académiques directement sur votre terminal relié !");
              }}
              className="w-full text-center hover:bg-slate-50 border border-slate-205 text-slate-700 font-bold text-xs py-2 rounded-xl cursor-pointer"
            >
              Gérer les paramètres
            </button>
          </div>

          {/* D. Astuce card matching layout exactly */}
          <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-5 space-y-2 text-xs" id="astuces-bulbs-flow">
            <h5 className="font-extrabold text-slate-905 text-amber-900 flex items-center gap-1.5 font-display text-[11px] uppercase tracking-wider">
              <Lightbulb className="w-4 h-4 text-amber-500 animate-swing shrink-0" /> Astuce
            </h5>
            <p className="leading-normal text-amber-800 text-[11px] font-medium">
              Vous pouvez créer des rappels depuis n'importe quelle section en cliquant sur l'icône rappel.
            </p>
            <button 
              onClick={() => alert("Chaque icône de cloche / rappel sur les cours vous permet d'enregistrer une notification locale instantanée.")}
              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-600 hover:text-amber-800 cursor-pointer hover:underline mt-1 pt-0.5 font-mono"
            >
              En savoir plus <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

      {/* NEW REMINDER POPUP MODAL */}
      <AnimatePresence>
        {isOpenAddModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 shadow-xl relative space-y-4"
            >
              <button 
                onClick={() => setIsOpenAddModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-900 font-display flex items-center gap-1.5 animate-pulse">
                  <Sparkles className="w-4 h-4 text-violet-650 text-violet-600" /> Ajouter un Nouveau Rappel
                </h3>
                <p className="text-[11px] text-slate-400 font-sans">Ne ratez aucune épreuve grâce au gestionnaire intelligent.</p>
              </div>

              <form onSubmit={handleCreateReminder} className="space-y-3.5 text-xs text-slate-650 font-semibold">
                
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-slate-450 font-bold tracking-wider">Titre du rappel</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Réviser Mécanique Chapitre 4"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 focus:outline-none focus:ring-1 focus:ring-violet-500 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-slate-450 font-bold tracking-wider">Description ou Notes</label>
                  <textarea
                    placeholder="Saisissez vos instructions complexes ici..."
                    value={newSubtitle}
                    onChange={(e) => setNewSubtitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 focus:outline-none focus:ring-1 focus:ring-violet-500 text-xs h-16 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase text-slate-450 font-bold tracking-wider">Échéance</label>
                    <select
                      value={newGroup}
                      onChange={(e) => setNewGroup(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-705 focus:outline-none"
                    >
                      <option value="Aujourd'hui">Aujourd'hui</option>
                      <option value="Demain">Demain</option>
                      <option value="Plus tard">Plus tard</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase text-slate-450 font-bold tracking-wider">Heure / Date</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 18:00 or 22 Mai"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 focus:outline-none focus:ring-1 focus:ring-violet-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase text-slate-450 font-bold tracking-wider">Catégorie référente</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-705 focus:outline-none"
                    >
                      <option value="Cours">Cours</option>
                      <option value="Devoirs & Examens">Devoirs & Examens</option>
                      <option value="Projets & Réunions">Projets & Réunions</option>
                      <option value="Personnels">Personnels</option>
                      <option value="Rappels récurrents">Rappels récurrents</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase text-slate-450 font-bold tracking-wider">Priorité d'Alerte</label>
                    <select
                      value={newImportance}
                      onChange={(e) => setNewImportance(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-705 focus:outline-none"
                    >
                      <option value="high">🔴 Important (Haute)</option>
                      <option value="medium">🟡 Modéré (Moyenne)</option>
                      <option value="low">🔵 Faible (Basse)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2.5 justify-end pt-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsOpenAddModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-violet-605 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold hover:shadow-md cursor-pointer"
                  >
                    Enregistrer le rappel
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
