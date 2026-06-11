import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Check, 
  MapPin, 
  BookOpen, 
  Users, 
  Briefcase, 
  Video, 
  Calendar as CalendarIcon, 
  AlertCircle,
  Clock,
  Sparkles,
  X,
  RefreshCw,
  Search,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { useCollab } from "../context/CollabContext";
import { motion, AnimatePresence } from "motion/react";
import { 
  googleSignIn, 
  getAccessToken, 
  initAuth, 
  logout as googleLogout,
  fetchGoogleCalendarEvents,
  writeGoogleCalendarEvent,
  GoogleCalendarEvent,
  isRunningInIframe
} from "../lib/googleAuth";

interface CalendarEvent {
  id: string;
  title: string;
  type: "Cours" | "Devoirs" | "Projets" | "Réunions" | "Rappels" | "Autres";
  time: string;
  day: number; // Day fallback
  subject: string;
  color: string; // Theme color classes
  room?: string;
  dateStr?: string; // e.g. YYYY-MM-DD
}

export const CalendarsView: React.FC = () => {
  const { triggerNotification, currentUser, isAuthLoading } = useCollab();

  // Active view tab: Mois, Semaine, Jour, Agenda
  const [activeView, setActiveView] = useState<"Mois" | "Semaine" | "Jour" | "Agenda">("Mois");

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Checkbox filters matching mockup
  const [filters, setFilters] = useState({
    Cours: true,
    Devoirs: true,
    Projets: true,
    Réunions: true,
    Rappels: true,
    Autres: true,
  });

  // Dynamic Date tracking (Starts on today's date)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Google Calendar Integration states
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showGoogleInGrid, setShowGoogleInGrid] = useState(true);
  const [syncToGCal, setSyncToGCal] = useState(true);
  const [authError, setAuthError] = useState<{ code?: string; message?: string; showHelp: boolean } | null>(null);

  // Initialize auth listener and restore session
  useEffect(() => {
    const unsubscribe = initAuth(
      async (firebaseUser, accessToken) => {
        setUser(firebaseUser);
        setToken(accessToken);
        try {
          setIsSyncing(true);
          const eventsList = await fetchGoogleCalendarEvents(accessToken);
          setGoogleEvents(eventsList);
          triggerNotification("Agenda Google synchronisé", `${eventsList.length} événements Google importés.`, "success");
        } catch (e) {
          console.error("Calendars login sync issues:", e);
        } finally {
          setIsSyncing(false);
        }
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsSyncing(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        const eventsList = await fetchGoogleCalendarEvents(result.accessToken);
        setGoogleEvents(eventsList);
        triggerNotification(
          "Agenda Google connecté",
          `${eventsList.length} événements importés avec succès !`,
          "success"
        );
      }
    } catch (err: any) {
      console.error("Login failure caught in Calendars:", err);
      const isIframe = isRunningInIframe();
      const errCode = err.code || "";
      const errMsg = err.message || "";
      
      const isPopupError = 
        errCode === "auth/popup-closed-by-user" || 
        errCode === "auth/cancelled-popup-request" ||
        errMsg.includes("popup-closed-by-user") ||
        errMsg.includes("cancelled-popup-request");

      const isNetworkError =
        errCode === "auth/network-request-failed" ||
        errMsg.includes("network-request-failed");

      const isPopupOrNetworkError = isPopupError || isNetworkError;
        
      setAuthError({
        code: errCode,
        message: errMsg,
        showHelp: isPopupOrNetworkError || isIframe
      });
      
      let finalMessage = "Impossible de synchroniser l'agenda Google.";
      if (isPopupError) {
        finalMessage = "La fenêtre d'authentification a été fermée ou bloquée par l'aperçu. Ouvrez un nouvel onglet.";
      } else if (isNetworkError) {
        finalMessage = "La requête réseau a échoué. Veuillez utiliser un nouvel onglet pour lier Google Agenda.";
      }
      
      triggerNotification(
        "Erreur de connexion", 
        finalMessage, 
        "warning"
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGoogleLogout = async () => {
    if (confirm("Voulez-vous déconnecter votre compte Google Agenda de l'application ?")) {
      await googleLogout();
      setUser(null);
      setToken(null);
      setGoogleEvents([]);
      triggerNotification("Agenda déconnecté", "Votre agenda Google a bien été détaché.", "info");
    }
  };

  const handleManualSync = async () => {
    if (!token) return;
    setIsSyncing(true);
    try {
      const eventsList = await fetchGoogleCalendarEvents(token);
      setGoogleEvents(eventsList);
      triggerNotification(
        "Mise à jour réussie",
        `${eventsList.length} événements synchronisés depuis votre agenda Google.`,
        "success"
      );
    } catch (err: any) {
      console.error(err);
      triggerNotification("Erreur de synchronisation", "La mise à jour de l'agenda a échoué.", "warning");
    } finally {
      setIsSyncing(false);
    }
  };

  // Calendar events state linked dynamically to Firestore or LocalStorage for offline fallback
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("awolf_calendar_events_backup");
    if (saved) {
      try {
        setEvents(JSON.parse(saved));
      } catch (e) {
        setEvents([]);
      }
    } else {
      setEvents([]);
    }
  }, []);

  // Modal form addition state
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventType, setNewEventType] = useState<any>("Cours");
  const [newEventDay, setNewEventDay] = useState(15);
  const [newEventTime, setNewEventTime] = useState("10:00");

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    // Strips emojis and rooms out of input
    const cleanTitle = newEventTitle.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, "").trim();

    let targetCol = "bg-indigo-50 border-indigo-100 text-indigo-700";
    if (newEventType === "Devoirs") targetCol = "bg-rose-50 border-rose-100 text-rose-700";
    else if (newEventType === "Projets") targetCol = "bg-blue-50 border-blue-105 text-blue-700";
    else if (newEventType === "Réunions") targetCol = "bg-purple-50 border-purple-100 text-purple-700";
    else if (newEventType === "Rappels") targetCol = "bg-orange-50 border-orange-100 text-orange-700";
    else if (newEventType === "Autres") targetCol = "bg-emerald-50 border-emerald-100 text-emerald-700";

    const formattedDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(newEventDay).padStart(2, "0")}`;

    const customEvent: CalendarEvent = {
      id: "ev_" + Date.now(),
      title: cleanTitle,
      type: newEventType,
      time: newEventTime,
      day: Number(newEventDay),
      subject: newEventType,
      color: targetCol,
      dateStr: formattedDateStr
    };

    const startDateTime = new Date(`${formattedDateStr}T${newEventTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 65 * 60 * 1000); // ~1 Hour duration

    if (token && syncToGCal) {
      writeGoogleCalendarEvent(
        token,
        cleanTitle,
        `Créé automatiquement par l'application d'étude de ${user?.displayName || "l'étudiant"}. Catégorie : ${newEventType}`,
        startDateTime.toISOString(),
        endDateTime.toISOString(),
        "Plan d'études"
      ).then((gEvent) => {
        setGoogleEvents(prev => [...prev, gEvent]);
        triggerNotification(
          "Exportation active Réussie",
          `L'événement "${cleanTitle}" a été transmis en temps réel à votre Google Agenda.`,
          "success"
        );
      }).catch(err => {
        console.error("GCal sync error writing:", err);
        triggerNotification(
          "Synchro GCal Échouée",
          "Sauvegarde en cours sur votre base d'étude locale uniquement.",
          "warning"
        );
      });
    }

    const updatedEvents = [...events, customEvent];
    setEvents(updatedEvents);
    localStorage.setItem("awolf_calendar_events_backup", JSON.stringify(updatedEvents));

    setIsOpenAddModal(false);
    setNewEventTitle("");
    triggerNotification(
      "Événement enregistré",
      `"${cleanTitle}" programmé le ${newEventDay} ${currentDate.toLocaleDateString("fr-FR", { month: "long" })}.`,
      "success"
    );
  };

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters({ ...filters, [key]: !filters[key] });
  };

  // Convert Google events to CalendarEvent objects dynamically
  const gcalCalendarEvents: CalendarEvent[] = showGoogleInGrid && googleEvents.length > 0
    ? (googleEvents
        .map(ev => {
          if ((ev as any).day !== undefined && (ev as any).color !== undefined) {
            return ev as unknown as CalendarEvent;
          }
          const startStr = ev.start?.dateTime || ev.start?.date;
          if (!startStr) return null;
          const startDate = new Date(startStr);
          const dayVal = startDate.getDate();
          
          const formatTime = (date: Date) => {
            const hh = date.getHours().toString().padStart(2, "0");
            const mm = date.getMinutes().toString().padStart(2, "0");
            return `${hh}:${mm}`;
          };

          return {
            id: `gcal_evt_${ev.id}`,
            title: ev.summary || "Google Agenda",
            type: "Autres" as const,
            time: formatTime(startDate),
            day: dayVal,
            subject: "Google Agenda",
            color: "bg-fuchsia-50 border-fuchsia-100 text-fuchsia-750 font-sans"
          };
        })
        .filter(c => c !== null) as CalendarEvent[])
    : [];

  const allVisibleEvents = [...events, ...gcalCalendarEvents];

  const upcomingVisibleEvents = allVisibleEvents
    .map((event) => {
      const eventDate = event.dateStr
        ? new Date(event.dateStr)
        : new Date(currentDate.getFullYear(), currentDate.getMonth(), event.day || currentDate.getDate());
      return { ...event, eventDate };
    })
    .filter((event) => !Number.isNaN(event.eventDate.getTime()))
    .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime() || a.time.localeCompare(b.time))
    .slice(0, 5);

  const categorySummary = [
    { label: "Cours", count: allVisibleEvents.filter((event) => event.type === "Cours").length, dot: "bg-indigo-600 text-indigo-600" },
    { label: "Devoirs", count: allVisibleEvents.filter((event) => event.type === "Devoirs").length, dot: "bg-rose-500 text-rose-500" },
    { label: "Projets", count: allVisibleEvents.filter((event) => event.type === "Projets").length, dot: "bg-blue-600 text-blue-600" },
    { label: "Réunions", count: allVisibleEvents.filter((event) => event.type === "Réunions").length, dot: "bg-purple-600 text-purple-600" },
    { label: "Rappels", count: allVisibleEvents.filter((event) => event.type === "Rappels").length, dot: "bg-orange-500 text-orange-500" },
    { label: "Autres", count: allVisibleEvents.filter((event) => event.type === "Autres").length, dot: "bg-slate-400 text-slate-400" },
  ];

  // Find current month cells dynamically
  const getCalendarCells = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed month
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Day of week of the first day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const startDayOfWeek = firstDay.getDay();
    // Adjust layout for Monday as 0 select
    const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    
    const cells: { day: number; currentMonth: boolean; date: Date }[] = [];
    
    // Previous month filler days
    const prevMonthEnd = new Date(year, month, 0).getDate();
    for (let i = adjustedStartDay - 1; i >= 0; i--) {
      const d = prevMonthEnd - i;
      cells.push({ day: d, currentMonth: false, date: new Date(year, month - 1, d) });
    }
    
    // Current month days
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
    }
    
    // Next month filler days (fill up to complete exactly 42 cells)
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      cells.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
    }
    
    return cells;
  };

  const calendarCells = getCalendarCells(currentDate);

  // Deduced filtered events in active cell Date
  const getEventsForDay = (cellDate: Date) => {
    return allVisibleEvents.filter(e => {
      // Basic text search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (!e.title.toLowerCase().includes(query)) return false;
      }
      
      const eventDate = e.dateStr ? new Date(e.dateStr) : new Date(new Date().getFullYear(), new Date().getMonth(), e.day || new Date().getDate());
      const isSameDay = 
        eventDate.getDate() === cellDate.getDate() &&
        eventDate.getMonth() === cellDate.getMonth() &&
        eventDate.getFullYear() === cellDate.getFullYear();
      
      if (!isSameDay) return false;

      if (e.id.startsWith("gcal_evt_")) {
        return showGoogleInGrid;
      }
      return filters[e.type as keyof typeof filters];
    });
  };

  return (
    <div className="space-y-6 font-sans text-slate-800" id="calendars-root-view">
      
      {/* ================= HEADER SECTION ================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-1 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight font-display flex items-center gap-2 hover:opacity-90 transition-opacity">
              <CalendarIcon className="w-6 h-6 text-purple-600" />
              <span>Calendrier</span>
            </h2>
          </div>
          <p className="text-[12px] text-slate-400 font-medium mt-1">
            Visualise ton mois, tes événements et ne manque rien d'important.
          </p>
        </div>

        {/* Dynamic high end search widget input to match modern mock */}
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher un événement... | ⌘ K"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-400 placeholder:text-slate-400 transition-all font-semibold"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <button
            onClick={() => setIsOpenAddModal(true)}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-5 py-3 rounded-2xl cursor-pointer shadow-md shadow-purple-600/10 hover:shadow-lg hover:shadow-purple-600/20 active:scale-98 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Nouveau</span>
          </button>
        </div>
      </div>

      {/* ================= CONTROLS ROW ================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-1 bg-white rounded-2xl border border-slate-100 p-3.5 shadow-3xs">
        {/* Left controls: Today button, Chevrons, month toggle */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => {
              setCurrentDate(new Date());
              triggerNotification("Retour", "Date repositionnée à aujourd'hui", "info");
            }}
            className="px-4 py-2 bg-slate-50 border border-slate-205/65 text-slate-700 hover:text-slate-900 font-extrabold text-xs rounded-xl cursor-pointer transition-all active:scale-95 shadow-3xs"
          >
            Aujourd'hui
          </button>
          
          <div className="flex items-center bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/40">
            <button 
              onClick={() => {
                const prevM = new Date(currentDate);
                prevM.setMonth(currentDate.getMonth() - 1);
                setCurrentDate(prevM);
                triggerNotification("Précédent", `Mois modifié : ${prevM.toLocaleDateString("fr-FR", { month: "long" })}`, "info");
              }}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                const nextM = new Date(currentDate);
                nextM.setMonth(currentDate.getMonth() + 1);
                setCurrentDate(nextM);
                triggerNotification("Suivant", `Mois modifié : ${nextM.toLocaleDateString("fr-FR", { month: "long" })}`, "info");
              }}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button className="flex items-center gap-1.5 text-slate-900 font-extrabold text-sm pl-2 cursor-pointer border-l border-slate-200 ml-1 py-1">
            <span>{currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }).charAt(0).toUpperCase() + currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }).slice(1)}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Right view segment list controller */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 w-full sm:w-auto overflow-x-auto scrollbar-none">
          {(["Mois", "Semaine", "Jour", "Agenda"] as const).map(tab => {
            const isActive = activeView === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveView(tab);
                  triggerNotification("Vue", `Basculement à la vue : ${tab}`, "info");
                }}
                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  isActive 
                    ? "bg-gradient-to-r from-purple-650 to-indigo-650 bg-purple-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= MAIN COLUMN GRID SECTIONS ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Column Calendar Grid (Takes 3 columns default) */}
        <div className="xl:col-span-3 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-3xs flex flex-col justify-between" id="large-monthly-grid-card">
          
          {activeView === "Mois" ? (
            <>
              {/* Calendar week header tags */}
              <div className="grid grid-cols-7 text-center text-[11px] font-black tracking-wider text-slate-705 uppercase border-b border-slate-100 pb-3">
                <div>Lun</div>
                <div>Mar</div>
                <div>Mer</div>
                <div>Jeu</div>
                <div>Ven</div>
                <div>Sam</div>
                <div>Dim</div>
              </div>

              {/* Monthly grid cell structure */}
              <div className="grid grid-cols-7 gap-1 pt-2 min-h-[500px]" id="monthly-days-grid">
                {calendarCells.map((cell, index) => {
                  const cellEvents = getEventsForDay(cell.date);
                  const today = new Date();
                  const isToday = cell.currentMonth && 
                                  cell.date.getDate() === today.getDate() && 
                                  cell.date.getMonth() === today.getMonth() && 
                                  cell.date.getFullYear() === today.getFullYear();
                  const isSelected = cell.currentMonth && cell.date.getDate() === currentDate.getDate() && cell.date.getMonth() === currentDate.getMonth() && cell.date.getFullYear() === currentDate.getFullYear();

                  return (
                    <div
                      key={index}
                      onClick={() => cell.currentMonth && setCurrentDate(cell.date)}
                      className={`border border-slate-100 p-2 min-h-24 transition-all cursor-pointer flex flex-col justify-between rounded-xl relative ${
                        cell.currentMonth ? "bg-white" : "bg-slate-50/20 text-slate-300"
                      } ${
                        isSelected ? "ring-2 ring-purple-600/10 bg-purple-50/15" : "hover:bg-slate-50/30"
                      }`}
                    >
                      <div className="flex justify-between items-center bg-transparent">
                        {/* Circle visual identifier */}
                        <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10.5px] font-black font-sans transition-all ${
                          isToday 
                            ? "bg-purple-600 text-white shadow-sm shadow-purple-600/20" 
                            : isSelected ? "text-purple-600 bg-purple-50" : "text-slate-700"
                        }`}>
                          {cell.day}
                        </span>

                        {/* Excess warning label */}
                        {cellEvents.length > 2 && (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-50 p-0.5 px-1.5 rounded-md border border-slate-200/50">
                            +{cellEvents.length - 2}
                          </span>
                        )}
                      </div>

                      {/* Cell event horizontal summaries, cleaned of emojis/room name as ordered */}
                      <div className="space-y-1 mt-2.5 flex-1 overflow-hidden flex flex-col justify-end">
                        {cellEvents.slice(0, 2).map(ev => (
                          <div
                            key={ev.id}
                            className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-lg border truncate leading-tight flex flex-col shrink-0 ${ev.color}`}
                            title={`${ev.title}`}
                          >
                            <span className="truncate">{ev.title}</span>
                            <span className="text-[8px] font-mono opacity-75">{ev.time}</span>
                          </div>
                        ))}
                        {cellEvents.length > 2 && (
                          <span className="text-[8.5px] text-slate-400 font-extrabold italic block pl-1">
                            + {cellEvents.length - 2} autre{cellEvents.length - 2 > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : activeView === "Semaine" ? (
            <div className="flex flex-col gap-4">
              {/* Weekly week header tags with active and today highlighted */}
              <div className="grid grid-cols-7 text-center text-[11px] font-black tracking-wider text-slate-705 uppercase border-b border-slate-100 pb-3" id="weekly-days-header">
                {(() => {
                  const current = new Date(currentDate);
                  const dayOfWeek = current.getDay();
                  const distance = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                  const monday = new Date(current);
                  monday.setDate(current.getDate() + distance);

                  const daysList: Date[] = [];
                  for (let i = 0; i < 7; i++) {
                    const nextDay = new Date(monday);
                    nextDay.setDate(monday.getDate() + i);
                    daysList.push(nextDay);
                  }

                  return daysList.map((wd, i) => {
                    const dayName = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][wd.getDay()];
                    const today = new Date();
                    const isToday = wd.getDate() === today.getDate() && 
                                    wd.getMonth() === today.getMonth() && 
                                    wd.getFullYear() === today.getFullYear();
                    const isSelected = wd.getDate() === currentDate.getDate() && wd.getMonth() === currentDate.getMonth() && wd.getFullYear() === currentDate.getFullYear();
                    return (
                      <div key={i} className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => setCurrentDate(wd)}>
                        <span className="text-[10px] text-slate-400">{dayName}</span>
                        <span className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                          isToday ? "bg-purple-600 text-white shadow-sm shadow-purple-600/30" : isSelected ? "bg-purple-100 text-purple-750 font-bold" : "text-slate-750"
                        }`}>
                          {wd.getDate()}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Weekly Event list cells */}
              <div className="grid grid-cols-7 gap-2.5 pt-1.5 min-h-[460px]" id="weekly-events-grid">
                {(() => {
                  const current = new Date(currentDate);
                  const dayOfWeek = current.getDay();
                  const distance = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                  const monday = new Date(current);
                  monday.setDate(current.getDate() + distance);

                  const daysList: Date[] = [];
                  for (let i = 0; i < 7; i++) {
                    const nextDay = new Date(monday);
                    nextDay.setDate(monday.getDate() + i);
                    daysList.push(nextDay);
                  }

                  return daysList.map((wd, index) => {
                    const dayEvents = getEventsForDay(wd);
                    return (
                      <div 
                        key={index} 
                        onClick={() => setCurrentDate(wd)}
                        className="bg-slate-50/60 border border-slate-100/80 p-2 rounded-2xl flex flex-col gap-2 min-h-[400px] hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <div className="space-y-1.5 flex-1">
                          {dayEvents.map(ev => (
                            <div key={ev.id} className={`text-[10px] font-bold p-2 rounded-lg border leading-snug flex flex-col ${ev.color}`}>
                              <span className="truncate">{ev.title}</span>
                              <span className="text-[8px] font-mono opacity-80 mt-0.5">{ev.time}</span>
                            </div>
                          ))}
                          {dayEvents.length === 0 && (
                            <p className="text-[10px] text-slate-300 italic text-center pt-10">Aucun événement</p>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          ) : activeView === "Jour" ? (
            <div className="space-y-4 min-h-[500px] p-2" id="daily-timeline-grid">
              <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 flex justify-between items-center mb-1">
                <div>
                  <h3 className="text-xs font-black text-purple-800 uppercase tracking-wide">Planing de la journée</h3>
                  <p className="text-[11px] text-purple-650 font-bold mt-0.5">{currentDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
                <span className="text-[10px] font-black bg-purple-150 text-purple-750 px-3 py-1 bg-purple-100 rounded-full">{getEventsForDay(currentDate).length} événement(s)</span>
              </div>

              <div className="divide-y divide-slate-100/80 max-h-[420px] overflow-y-auto pr-1">
                {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"].map((h, i) => {
                  const matchingEvents = getEventsForDay(currentDate).filter(ev => {
                    const evHour = ev.time.split(":")[0];
                    const hHour = h.split(":")[0];
                    return evHour === hHour;
                  });

                  return (
                    <div key={i} className="py-3 flex gap-4 text-xs items-center">
                      <span className="font-mono text-slate-400 w-12 text-right tracking-tight">{h}</span>
                      <div className="flex-1 flex flex-col gap-1.5 min-h-12 justify-center border-l-2 border-slate-100 pl-4">
                        {matchingEvents.map(ev => (
                          <div key={ev.id} className={`p-2.5 rounded-xl border flex justify-between items-center gap-3 ${ev.color}`}>
                            <div className="min-w-0">
                              <h5 className="font-extrabold text-[11px] truncate">{ev.title}</h5>
                              <p className="text-[9px] opacity-80 mt-0.5">{ev.time} {ev.room ? `• ${ev.room}` : ""}</p>
                            </div>
                            <span className="text-[8px] font-mono opacity-75 uppercase bg-white/40 px-1.5 py-0.5 rounded-md shrink-0">{ev.type}</span>
                          </div>
                        ))}
                        {matchingEvents.length === 0 && (
                          <span className="text-[10px] text-slate-300 italic">Libre</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4 min-h-[500px]" id="agenda-chronological-view">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Fil des événements</span>
                <span className="text-[10px] font-black font-mono bg-slate-200 text-slate-600 px-3 py-1 rounded-full">
                  {(() => {
                    const agendaEvents = allVisibleEvents.filter(e => {
                      if (searchQuery.trim()) {
                        const query = searchQuery.toLowerCase();
                        if (!e.title.toLowerCase().includes(query)) return false;
                      }
                      if (!e.id.startsWith("gcal_evt_")) {
                        return filters[e.type as keyof typeof filters];
                      }
                      return showGoogleInGrid;
                    });
                    return agendaEvents.length;
                  })()} actifs
                </span>
              </div>
              
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {(() => {
                  const agendaEvents = allVisibleEvents.filter(e => {
                    if (searchQuery.trim()) {
                      const query = searchQuery.toLowerCase();
                      if (!e.title.toLowerCase().includes(query)) return false;
                    }
                    if (!e.id.startsWith("gcal_evt_")) {
                      return filters[e.type as keyof typeof filters];
                    }
                    return showGoogleInGrid;
                  }).sort((a, b) => {
                    const dateA = a.dateStr ? new Date(a.dateStr) : new Date(new Date().getFullYear(), new Date().getMonth(), a.day || new Date().getDate());
                    const dateB = b.dateStr ? new Date(b.dateStr) : new Date(new Date().getFullYear(), new Date().getMonth(), b.day || new Date().getDate());
                    return dateA.getTime() - dateB.getTime() || a.time.localeCompare(b.time);
                  });

                  return agendaEvents.map(ev => {
                    const evDate = ev.dateStr ? new Date(ev.dateStr) : new Date(new Date().getFullYear(), new Date().getMonth(), ev.day || new Date().getDate());
                    return (
                      <div key={ev.id} className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between md:items-center gap-4 transition-all hover:translate-x-1 ${ev.color}`}>
                        <div className="min-w-0">
                          <span className="text-[9px] uppercase font-black tracking-wider opacity-75">{ev.type}</span>
                          <h4 className="font-extrabold text-[12px] truncate mt-0.5">{ev.title}</h4>
                          <p className="text-[10px] opacity-80 mt-1 font-mono">
                            {evDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} à {ev.time} {ev.room ? `• Salle ${ev.room}` : ""}
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            setCurrentDate(evDate);
                            setActiveView("Jour");
                          }}
                          className="text-[10px] bg-white text-slate-800 font-extrabold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer self-start md:self-auto shrink-0"
                        >
                          Aller au jour
                        </button>
                      </div>
                    );
                  });
                })()}

                {allVisibleEvents.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-12">Aucun événement ne correspond aux filtres ou à la recherche.</p>
                )}
              </div>
            </div>
          )}

          {/* Tiny centered legend indicators */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-[10.5px] font-bold text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-600" /> Cours</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Devoirs / Examens</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-600" /> Projets</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-600" /> Réunions</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400" /> Autres</span>
          </div>

        </div>

        {/* Right column sidebar widgets */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* Widget A: Compact Month Calendar Picker representation */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-3xs" id="sidebar-mini-cal">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-extrabold text-xs text-slate-900 font-display flex items-center gap-1">
                {currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }).charAt(0).toUpperCase() + currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }).slice(1)} <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </span>
              <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-0.5">
                <button 
                  onClick={() => {
                    const prevD = new Date(currentDate);
                    prevD.setMonth(currentDate.getMonth() - 1);
                    setCurrentDate(prevD);
                    triggerNotification("Précédent", `Mois précédent : ${prevD.toLocaleDateString("fr-FR", { month: "long" })}`, "info");
                  }}
                  className="p-1 hover:bg-white text-slate-400 hover:text-slate-700 rounded transition-colors"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button 
                  onClick={() => {
                    const nextD = new Date(currentDate);
                    nextD.setMonth(currentDate.getMonth() + 1);
                    setCurrentDate(nextD);
                    triggerNotification("Suivant", `Mois suivant : ${nextD.toLocaleDateString("fr-FR", { month: "long" })}`, "info");
                  }}
                  className="p-1 hover:bg-white text-slate-400 hover:text-slate-700 rounded transition-colors"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 text-center text-[10px] font-black mt-3 text-slate-400">
              <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
            </div>

            <div className="grid grid-cols-7 text-center text-[10px] font-bold gap-y-2 mt-2 bg-slate-50/50 p-2.5 rounded-xl">
              {calendarCells.map((cell, idx) => {
                const isSelected = cell.currentMonth && cell.date.getDate() === currentDate.getDate() && cell.date.getMonth() === currentDate.getMonth() && cell.date.getFullYear() === currentDate.getFullYear();
                const today = new Date();
                const isTodayReal = cell.currentMonth && 
                                    cell.date.getDate() === today.getDate() && 
                                    cell.date.getMonth() === today.getMonth() && 
                                    cell.date.getFullYear() === today.getFullYear();

                return (
                  <span
                    key={idx}
                    onClick={() => cell.currentMonth && setCurrentDate(cell.date)}
                    className={`cursor-pointer transition-all flex items-center justify-center rounded-full w-5 text-[9px] h-5 mx-auto ${
                      !cell.currentMonth 
                        ? "text-slate-300 pointer-events-none" 
                        : isSelected 
                          ? "bg-purple-600 text-white font-black shadow-xs shrink-0" 
                          : isTodayReal 
                            ? "bg-purple-100 text-purple-750 font-extrabold border border-purple-200 shrink-0" 
                            : "text-slate-700 hover:text-purple-600"
                    }`}
                  >
                    {cell.day}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Widget B: Upcoming events listing precisely formatted as bullet items without emojis */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-3xs space-y-4" id="upcoming-bullets-sidebar">
            <div className="flex items-center justify-between pb-1">
              <h4 className="font-extrabold text-[12px] text-slate-900 uppercase tracking-wider">
                Événements à venir
              </h4>
              <button 
                onClick={() => setActiveView("Agenda")}
                className="text-[10px] text-purple-600 font-extrabold hover:underline"
              >
                Voir tout
              </button>
            </div>

            {upcomingVisibleEvents.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-500 text-center">
                Ajoute un événement ou connecte Google Agenda pour voir tes prochaines échéances ici.
              </div>
            ) : (
              <div className="space-y-3.5">
                {upcomingVisibleEvents.map((item, index) => {
                  const dotClass = item.type === "Cours" ? "bg-indigo-600" :
                    item.type === "Devoirs" ? "bg-rose-500" :
                    item.type === "Projets" ? "bg-blue-600" :
                    item.type === "Réunions" ? "bg-purple-600" :
                    item.type === "Rappels" ? "bg-orange-500" : "bg-slate-400";
                  return (
                    <div key={item.id || index} className="flex items-start gap-2.5 py-0.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${dotClass}`} />
                      <div className="min-w-0">
                        <h5 className="font-extrabold text-[11.5px] text-slate-800 leading-tight truncate">{item.title}</h5>
                        <span className="text-[10px] text-slate-400 font-semibold block">{item.eventDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} • {item.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Widget C: Categories counters exactly matching requested rows */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-3xs space-y-4" id="categories-counters-sidebar">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-[12px] text-slate-900 uppercase tracking-wider">
                Catégories
              </h4>
              <button 
                onClick={() => setIsOpenAddModal(true)}
                className="text-[10px] text-purple-600 font-extrabold hover:underline"
              >
                Gérer
              </button>
            </div>

            <div className="space-y-2.5">
              {categorySummary.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 text-xs font-semibold hover:bg-slate-50/50 rounded-lg px-1 transition-all">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${cat.dot}`} />
                    <span className="text-slate-700 font-bold">{cat.label}</span>
                  </div>
                  <span className="text-[10px] font-black font-mono bg-slate-100 text-slate-500 py-0.5 px-2 rounded-md">
                    {cat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* ================= BOTTOM METRIC ROW: UNIFIED SYNCHRONISATION REGION ================= */}
      <div className="bg-gradient-to-r from-purple-50/70 to-indigo-50/70 border border-purple-100 rounded-2xl p-5 shadow-3xs flex flex-col md:flex-row items-center justify-between gap-5 mt-4" id="calendars-sync-block">
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-xl bg-purple-650 bg-purple-600 text-white flex items-center justify-center text-xl shrink-0 shadow-md shadow-purple-650/15">
            <CalendarIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 font-display">Synchroniser ton calendrier</h3>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">
              Connecte ton agenda Google, Outlook ou Apple pour tout centraliser au même endroit.
            </p>
          </div>
        </div>

        {/* Buttons to authenticate or ligate agenda platforms */}
        <div className="flex flex-wrap items-center gap-2.5 cursor-pointer">
          {/* A. Google Agenda with dynamic sync status connected with googleAuth.ts */}
          <button
            onClick={user ? handleGoogleLogout : handleGoogleLogin}
            disabled={isSyncing}
            className={`px-4.5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer active:scale-95 hover:scale-[1.02] shadow-3xs border ${
              user 
                ? "bg-white text-slate-900 border-slate-300 shadow-sm" 
                : "bg-white hover:bg-slate-55 text-slate-700 border-slate-200"
            }`}
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 block shrink-0">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            <span>{isSyncing ? "Connexion..." : user ? `${user.displayName || "Google"} connecté` : "Google Agenda"}</span>
          </button>

          {/* B. Outlook static helper */}
          <button
            onClick={() => {
              triggerNotification("Connexion Outlook", "La connexion Outlook arrive bientôt dans la version premium de A Wolf !", "info");
            }}
            className="px-4.5 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer active:scale-95 hover:scale-[1.02] shadow-3xs"
          >
            {/* Outlook classic Blue icon */}
            <span className="w-4 h-4 bg-blue-500 rounded-sm text-white text-[9px] font-extrabold flex items-center justify-center">O</span>
            <span>Outlook</span>
          </button>

          {/* C. Apple Calendar static helper */}
          <button
            onClick={() => {
              triggerNotification("Connexion Apple", "La synchronisation Apple iCloud Calendar arrive très prochainement !", "info");
            }}
            className="px-4.5 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer active:scale-95 hover:scale-[1.02] shadow-3xs"
          >
            {/* Apple custom classic icon */}
            <span className="w-4 h-4 bg-orange-500 rounded-sm text-white text-[9px] font-extrabold flex items-center justify-center">iCal</span>
            <span>Apple Calendar</span>
          </button>
        </div>

        {/* Auth Help block specifically optimized for iframe settings */}
        {authError?.showHelp && !user && (
          <div className="w-full p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl mt-2 text-left space-y-1.5 md:hidden">
            <p className="text-[10px] text-amber-700 leading-normal font-semibold">
              ⚠️ L'aperçu intégré bloque les connexions Google. Ouvrez l'application dans un nouvel onglet pour autoriser l'agenda.
            </p>
            <button
              onClick={() => window.open(window.location.href, "_blank")}
              className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[9px] rounded-lg transition-colors"
            >
              Ouvrir dans un nouvel onglet
            </button>
          </div>
        )}
      </div>

      {/* SIMULATED EVENT ADDITION MODAL POPUP */}
      <AnimatePresence>
        {isOpenAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 shadow-xl relative space-y-4"
            >
              <button 
                onClick={() => setIsOpenAddModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-900 font-display flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" /> Planifier un événement
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold font-sans">Enregistre des cours, évaluations ou échéance de révisions (sans emojis).</p>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs text-slate-650 font-semibold">
                
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-slate-450 font-bold tracking-wider">Titre de l'événement</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: TD Traitement du signal"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase text-slate-450 font-bold tracking-wider">Catégorie</label>
                    <select
                      value={newEventType}
                      onChange={(e) => setNewEventType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none font-bold text-slate-700"
                    >
                      <option value="Cours">Cours</option>
                      <option value="Devoirs">Devoirs / Examens</option>
                      <option value="Projets">Projets</option>
                      <option value="Réunions">Réunions</option>
                      <option value="Autres">Autres</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase text-slate-450 font-bold tracking-wider">Heure de début</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 14:00"
                      value={newEventTime}
                      onChange={(e) => setNewEventTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-slate-450 font-bold tracking-wider">Jour de {currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    required
                    value={newEventDay}
                    onChange={(e) => setNewEventDay(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs font-semibold"
                  />
                </div>

                {token && (
                  <div className="flex items-center gap-2.5 py-2 px-3 bg-fuchsia-50/40 border border-fuchsia-100 rounded-xl">
                    <input
                      type="checkbox"
                      id="sync-to-gcal-cb"
                      checked={syncToGCal}
                      onChange={(e) => setSyncToGCal(e.target.checked)}
                      className="w-4 h-4 text-purple-650 bg-slate-50 border-slate-200 rounded cursor-pointer accent-purple-600"
                    />
                    <label htmlFor="sync-to-gcal-cb" className="text-[10.5px] font-black text-purple-800 cursor-pointer select-none">
                      Exporter également vers mon Google Agenda personnel
                    </label>
                  </div>
                )}

                <div className="flex gap-2.5 justify-end pt-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsOpenAddModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold cursor-pointer transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold hover:shadow-lg transition-all cursor-pointer shadow-md shadow-purple-600/10"
                  >
                    Enregistrer
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
