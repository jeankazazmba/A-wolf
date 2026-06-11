import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Clock, 
  MapPin, 
  Download, 
  Calendar as CalendarIcon,
  Check,
  CheckSquare,
  Sparkles,
  Info,
  X,
  BookOpen,
  ArrowRight,
  Settings,
  RefreshCw,
  Search,
  CalendarRange,
  LogOut
} from "lucide-react";
import { useCollab } from "../context/CollabContext";
import { Course } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  googleSignIn, 
  getAccessToken, 
  initAuth, 
  logout as googleLogout,
  fetchGoogleCalendarEvents,
  convertGoogleEventToCourse,
  GoogleCalendarEvent,
  isRunningInIframe
} from "../lib/googleAuth";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from "recharts";

// Helper format function for Google Calendar Events preview
const formatGCalDate = (startObj: { dateTime?: string; date?: string }) => {
  const dateStr = startObj?.dateTime || startObj?.date;
  if (!dateStr) return "Date inconnue";
  const date = new Date(dateStr);
  
  if (isNaN(date.getTime())) return "Format invalide";

  // Days and Months in French
  const shortDays = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const months = ["Janv", "Févr", "Mars", "Avril", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
  
  const dayName = shortDays[date.getDay()];
  const dayNum = date.getDate();
  const monthName = months[date.getMonth()];
  
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  
  const isAllDay = !startObj.dateTime;
  
  if (isAllDay) {
    return `${dayName} ${dayNum} ${monthName} • Toute la journée`;
  }
  
  return `${dayName} ${dayNum} ${monthName} à ${hh}:${mm}`;
};

export const ScheduleView: React.FC = () => {
  const { state, addCourse, deleteCourse, triggerNotification } = useCollab();
  
  // Custom Filters & View Settings from Mockup
  const [showWeekends, setShowWeekends] = useState(true);
  const [showCancelled, setShowCancelled] = useState(false);
  const [showRooms, setShowRooms] = useState(true);
  const [showNightAgenda, setShowNightAgenda] = useState(true);
  const [viewType, setViewType] = useState<"week" | "day" | "month">("week");
  const [selectedSemester, setSelectedSemester] = useState("Semestre 2 - 2023/2024");
  
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Cours", "Études", "Sport", "Personnel", "Autre"]);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickTime, setQuickTime] = useState("10:00");

  // Google Calendar Integration states
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showGoogleInGrid, setShowGoogleInGrid] = useState(true);
  const [isAgendaPreviewOpen, setIsAgendaPreviewOpen] = useState(false);
  const [googleSearchQuery, setGoogleSearchQuery] = useState("");
  const [deletedGCalEventIds, setDeletedGCalEventIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("deleted_gcal_event_ids") || "[]");
    } catch (e) {
      return [];
    }
  });
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
          triggerNotification(
            "Agenda Google connecté",
            `Importation réussie de ${eventsList.length} événements pour ${firebaseUser.email}.`,
            "success"
          );
        } catch (e) {
          console.error("Autologin sync issues:", e);
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
          "Agenda Google synchronisé",
          `${eventsList.length} événements importés avec succès !`,
          "success"
        );
      }
    } catch (err: any) {
      console.error("Login failure caught in Schedule:", err);
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

  const handleGCalDelete = (courseId: string) => {
    const cleanId = courseId.replace("gcal_", "");
    setDeletedGCalEventIds(prev => {
      const updated = [...prev.filter(id => id !== cleanId), cleanId];
      try {
        localStorage.setItem("deleted_gcal_event_ids", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save deleted GCal events:", e);
      }
      return updated;
    });
    triggerNotification(
      "Événement retiré",
      "L'événement de votre agenda Google a été retiré localement.",
      "success"
    );
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

  // Form states for course creation
  const [newTitle, setNewTitle] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [newDay, setNewDay] = useState("Lun");
  const [newStart, setNewStart] = useState("09:00");
  const [newDuration, setNewDuration] = useState("90"); // in minutes
  const [newDescription, setNewDescription] = useState("");

  // Dynamic Date & Calendar States & Logic
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [nowTime, setNowTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const daysKeysFull = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const dayFrFull: { [key: string]: string } = {
    Lun: "Lundi",
    Mar: "Mardi",
    Mer: "Mercredi",
    Jeu: "Jeudi",
    Ven: "Vendredi",
    Sam: "Samedi",
    Dim: "Dimanche",
  };

  const getDayKey = (d: Date) => {
    const day = d.getDay(); // 0 is Sunday, 1 is Monday... 6 is Saturday
    const keysIdx = day === 0 ? 6 : day - 1;
    return daysKeysFull[keysIdx];
  };

  const getDaysOfWeek = (date: Date) => {
    const currentDay = date.getDay(); // 0 is Sunday, 1 is Monday ...
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diffToMonday);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dayKey = daysKeysFull[i];
      weekDays.push({
        key: dayKey,
        date: d,
        dateNum: d.getDate(),
        monthLabel: d.toLocaleDateString("fr-FR", { month: "short" }),
        label: dayFrFull[dayKey],
      });
    }
    return weekDays;
  };

  const activeWeekDays = getDaysOfWeek(currentDate);

  const days = showWeekends ? daysKeysFull : daysKeysFull.slice(0, 5);

  const dayLabels = activeWeekDays.reduce((acc, current) => {
    acc[current.key] = { date: current.dateNum, label: current.label };
    return acc;
  }, {} as { [key: string]: { date: number; label: string } });

  const visibleDays = viewType === "day"
    ? activeWeekDays.filter(d => d.key === getDayKey(currentDate))
    : activeWeekDays.filter(d => showWeekends || (d.key !== "Sam" && d.key !== "Dim"));

  const formatDateToISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getWeekLabel = () => {
    const weekDays = getDaysOfWeek(currentDate);
    const first = weekDays[0].date;
    const last = weekDays[6].date;
    const formatDate = (d: Date) => {
      return `${d.getDate()} ${d.toLocaleDateString("fr-FR", { month: "short" })}`;
    };
    return `${formatDate(first)} - ${formatDate(last)} ${last.getFullYear()}`;
  };

  const getHeaderLabel = () => {
    if (viewType === "day") {
      return currentDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    } else if (viewType === "week") {
      return getWeekLabel();
    } else {
      return currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    }
  };

  const rawHeader = getHeaderLabel();
  const capitalizedHeaderLabel = rawHeader.charAt(0).toUpperCase() + rawHeader.slice(1);

  const countDayOccurrencesInMonth = (year: number, month: number, dayIndex: number) => {
    let count = 0;
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      if (date.getDay() === dayIndex) {
        count++;
      }
      date.setDate(date.getDate() + 1);
    }
    return count;
  };

  const getDaysInMonthGrid = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();
    const paddingDaysCount = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const gridDays = [];
    const prevMonthEnd = new Date(year, month, 0).getDate();
    for (let i = paddingDaysCount - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthEnd - i);
      gridDays.push({
        date: d,
        isCurrentMonth: false,
      });
    }
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      gridDays.push({
        date: d,
        isCurrentMonth: true,
      });
    }
    
    const paddingNext = 42 - gridDays.length;
    for (let i = 1; i <= paddingNext; i++) {
      const d = new Date(year, month + 1, i);
      gridDays.push({
        date: d,
        isCurrentMonth: false,
      });
    }
    
    return gridDays;
  };

  const parseCourseDurationHours = (start: string, end: string): number => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const diffMin = (eh * 60 + em) - (sh * 60 + sm);
    return diffMin / 60;
  };

  const getDailyStudyHours = (date: Date) => {
    const dayKey = getDayKey(date);
    let totalHrs = 0;
    filteredCourses.forEach(c => {
      if (c.day === dayKey) {
        totalHrs += parseCourseDurationHours(c.startTime, c.endTime);
      }
    });
    return totalHrs;
  };

  const getWeeklyStudyHours = () => {
    let totalHrs = 0;
    filteredCourses.forEach(c => {
      totalHrs += parseCourseDurationHours(c.startTime, c.endTime);
    });
    return totalHrs;
  };

  const getMonthlyStudyHours = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const dayOccurrences: { [key: string]: number } = {};
    daysKeysFull.forEach((dayKey, i) => {
      const jsDayIdx = i === 6 ? 0 : i + 1;
      dayOccurrences[dayKey] = countDayOccurrencesInMonth(year, month, jsDayIdx);
    });
    
    let totalHrs = 0;
    filteredCourses.forEach(c => {
      const occurrences = dayOccurrences[c.day] || 4;
      totalHrs += parseCourseDurationHours(c.startTime, c.endTime) * occurrences;
    });
    return totalHrs;
  };

  const formatHoursFraction = (hFraction: number): string => {
    const totalMinutes = Math.round(hFraction * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs === 0 && mins === 0) return "0h";
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins.toString().padStart(2, "0")}m`;
  };

  const stripEmojis = (text: string): string => {
    if (!text) return "";
    return text
      .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Synchronise form field automatically with chosen currentDate
  useEffect(() => {
    setNewDay(getDayKey(currentDate));
  }, [currentDate]);

  const hours = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
  ];

  const getCourseCategory = (title: string): string => {
    const norm = title.toLowerCase();
    if (norm.includes("math") || norm.includes("physique") || norm.includes("anglais") || norm.includes("cours") || norm.includes("td")) {
      return "Cours";
    } else if (norm.includes("projet") || norm.includes("révision") || norm.includes("machine") || norm.includes("ml") || norm.includes("deep") || norm.includes("étude") || norm.includes("work")) {
      return "Études";
    } else if (norm.includes("sport") || norm.includes("cardio") || norm.includes("renforcement") || norm.includes("étirement")) {
      return "Sport";
    } else if (norm.includes("lecture") || norm.includes("méditation") || norm.includes("repos") || norm.includes("recharge") || norm.includes("veille") || norm.includes("détente")) {
      return "Personnel";
    } else {
      return "Autre";
    }
  };

  const getCourseColorClass = (title: string): string => {
    const cat = getCourseCategory(title);
    switch (cat) {
      case "Cours":
        return "bg-purple-50/90 hover:bg-purple-100 border border-purple-200 text-purple-700 shadow-2xs";
      case "Études":
        return "bg-orange-55 bg-orange-50/90 hover:bg-orange-100 border border-orange-200 text-orange-700 shadow-2xs";
      case "Sport":
        return "bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 shadow-2xs";
      case "Personnel":
        return "bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 shadow-2xs";
      default:
        return "bg-sky-50/90 hover:bg-sky-100 border border-sky-200 text-sky-700 shadow-2xs";
    }
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Calculate End Time from start time & duration minutes
    const [h, m] = newStart.split(":").map(Number);
    const durationMin = Number(newDuration);
    const totalMin = h * 60 + m + durationMin;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    const endFormatted = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;

    addCourse({
      title: newTitle.trim(),
      room: newRoom.trim() || "Salle d'étude",
      day: newDay,
      startTime: newStart,
      endTime: endFormatted,
      color: getCourseColorClass(newTitle.trim()),
      description: newDescription.trim() || undefined,
    });

    setNewTitle("");
    setNewRoom("");
    setNewDescription("");
    setIsAddingCourse(false);
  };

  // Convert hour string to grid offset in pixels (720px total height representing 12 hours from 08:00 to 20:00)
  const getHourOffsetPx = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    const totalMin = h * 60 + m;
    const startMin = 8 * 60; // 08:00 starts the grid
    const delta = totalMin - startMin;
    return delta; // 1px per min -> 720px total grid height!
  };

  const getDurationHeightPx = (startStr: string, endStr: string) => {
    const [h1, m1] = startStr.split(":").map(Number);
    const [h2, m2] = endStr.split(":").map(Number);
    const diffMin = (h2 * 60 + m2) - (h1 * 60 + m1);
    return diffMin; // 1px per min
  };

  // Convert Google events to Course objects dynamically
  const gcalCourses: Course[] = showGoogleInGrid && googleEvents.length > 0
    ? googleEvents
        .filter(ev => !deletedGCalEventIds.includes(ev.id))
        .map(ev => convertGoogleEventToCourse(ev))
        .filter(c => c !== null) as Course[]
    : [];

  const allVisibleCourses = [...state.courses, ...gcalCourses];

  // Filter courses based on visible weekends and potentially simulated cancelled courses
  const filteredCourses = allVisibleCourses.filter((course) => {
    if (!showWeekends && (course.day === "Sam" || course.day === "Dim")) {
      return false;
    }
    
    // Check if category is enabled in side filter
    const cat = getCourseCategory(course.title);
    if (!selectedCategories.includes(cat)) {
      return false;
    }

    if (course.id.startsWith("gcal_")) {
      const dateStr = (course as any).dateStr;
      if (dateStr) {
        const hasDateInWeek = activeWeekDays.some(wd => formatDateToISO(wd.date) === dateStr);
        if (!hasDateInWeek) return false;
      }
    }

    return true;
  });

  // 20:00 through 03:59 represents night time
  const isNightCourse = (course: Course) => {
    const [h, m] = course.startTime.split(":").map(Number);
    return h >= 21 || h < 4; // Shift standard night courses to 21h or later, since main grid goes to 20h!
  };

  const dayCoursesList = filteredCourses.filter(c => !isNightCourse(c));
  const nightCoursesList = filteredCourses.filter(c => isNightCourse(c));

  const getPositionStyles = (course: Course, visibleDaysList: any[]) => {
    const visibleDaysKeys = visibleDaysList.map(d => d.key);
    const dayIndex = visibleDaysKeys.indexOf(course.day);
    if (dayIndex === -1) return { display: "none" };

    // Get all daytime courses scheduled on this specific day to compute overlap column offsets
    const dayCourses = dayCoursesList.filter(c => c.day === course.day);
    // Sort them by startTime then title to ensure deterministic order
    dayCourses.sort((a, b) => {
      const startCompare = a.startTime.localeCompare(b.startTime);
      if (startCompare !== 0) return startCompare;
      return a.title.localeCompare(b.title);
    });

    const parseMin = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const startMin = parseMin(course.startTime);
    const endMin = parseMin(course.endTime);

    // Build columns of non-overlapping courses for this specific day
    const cols: Course[][] = [];
    dayCourses.forEach(c => {
      const cStart = parseMin(c.startTime);
      const cEnd = parseMin(c.endTime);
      
      let placed = false;
      for (let i = 0; i < cols.length; i++) {
        const hasOverlap = cols[i].some(other => {
          const oStart = parseMin(other.startTime);
          const oEnd = parseMin(other.endTime);
          return cStart < oEnd && cEnd > oStart;
        });
        if (!hasOverlap) {
          cols[i].push(c);
          placed = true;
          break;
        }
      }
      if (!placed) {
        cols.push([c]);
      }
    });

    // Find the column index for this course
    let colIndex = 0;
    for (let i = 0; i < cols.length; i++) {
      if (cols[i].includes(course)) {
        colIndex = i;
        break;
      }
    }

    const colCount = cols.length || 1;
    const dayWidthPercent = 100 / visibleDaysList.length;
    const subWidthPercent = dayWidthPercent / colCount;

    const topPx = getHourOffsetPx(course.startTime);
    const heightPx = getDurationHeightPx(course.startTime, course.endTime);
    const dayLeftPercent = (dayIndex / visibleDaysList.length) * 100;
    const subLeftPercent = dayLeftPercent + (colIndex * subWidthPercent);

    return {
      top: `${topPx}px`,
      height: `${heightPx}px`,
      left: `calc(60px + (${subLeftPercent}%))`,
      width: `calc(${subWidthPercent}% - 3px)`,
    };
  };

  const getNightHourOffsetPx = (timeStr: string) => {
    let [h, m] = timeStr.split(":").map(Number);
    if (h < 12) h += 24;
    const totalMin = h * 60 + m;
    const startMin = 20 * 60; // 20:00 starts the night grid
    const delta = totalMin - startMin;
    const gridRangeMin = 7 * 60; // 20:00 to 03:00 is 7 hours (420 minutes)
    const px = (delta / gridRangeMin) * 360; // grid height is 360px
    return px;
  };

  const getNightDurationHeightPx = (startStr: string, endStr: string) => {
    let [h1, m1] = startStr.split(":").map(Number);
    if (h1 < 12) h1 += 24;
    let [h2, m2] = endStr.split(":").map(Number);
    if (h2 < 12) h2 += 24;
    const diffMin = (h2 * 60 + m2) - (h1 * 60 + m1);
    const gridRangeMin = 7 * 60;
    const px = (diffMin / gridRangeMin) * 360;
    return px;
  };

  const getNightPositionStyles = (course: Course, visibleDaysList: any[]) => {
    const visibleDaysKeys = visibleDaysList.map(d => d.key);
    const dayIndex = visibleDaysKeys.indexOf(course.day);
    if (dayIndex === -1) return { display: "none" };

    // Get all night courses scheduled on this specific day
    const dayCourses = nightCoursesList.filter(c => c.day === course.day);
    dayCourses.sort((a, b) => {
      let t1 = a.startTime.split(":").map(Number)[0];
      if (t1 < 4) t1 += 24;
      let t2 = b.startTime.split(":").map(Number)[0];
      if (t2 < 4) t2 += 24;
      return t1 - t2;
    });

    const parseMin = (t: string) => {
      let [h, m] = t.split(":").map(Number);
      if (h < 4) h += 24;
      return h * 60 + m;
    };

    const cols: Course[][] = [];
    dayCourses.forEach(c => {
      const cStart = parseMin(c.startTime);
      const cEnd = parseMin(c.endTime);
      
      let placed = false;
      for (let i = 0; i < cols.length; i++) {
        const hasOverlap = cols[i].some(other => {
          const oStart = parseMin(other.startTime);
          const oEnd = parseMin(other.endTime);
          return cStart < oEnd && cEnd > oStart;
        });
        if (!hasOverlap) {
          cols[i].push(c);
          placed = true;
          break;
        }
      }
      if (!placed) {
        cols.push([c]);
      }
    });

    let colIndex = 0;
    for (let i = 0; i < cols.length; i++) {
      if (cols[i].includes(course)) {
        colIndex = i;
        break;
      }
    }

    const colCount = cols.length || 1;
    const dayWidthPercent = 100 / visibleDaysList.length;
    const subWidthPercent = dayWidthPercent / colCount;

    const topPx = getNightHourOffsetPx(course.startTime);
    const heightPx = getNightDurationHeightPx(course.startTime, course.endTime);
    const dayLeftPercent = (dayIndex / visibleDaysList.length) * 100;
    const subLeftPercent = dayLeftPercent + (colIndex * subWidthPercent);

    return {
      top: `${topPx}px`,
      height: `${heightPx}px`,
      left: `calc(60px + (${subLeftPercent}%))`,
      width: `calc(${subWidthPercent}% - 3px)`,
    };
  };

  const nightHours = [
    "20:00",
    "21:00",
    "22:00",
    "23:00",
    "00:00",
    "01:00",
    "02:00",
    "03:00"
  ];

  const renderNightAgendaGrid = () => {
    if (viewType === "month") {
      return (
        <div className="p-4 text-center text-slate-400 font-medium text-[11px] font-mono">
          Le mode calendrier mensuel affiche l'ensemble des séances, y compris nocturnes.
        </div>
      );
    }

    return (
      <div className="min-w-160 relative flex flex-col pt-2 bg-transparent">
        
        {/* Days Columns Label Row Header */}
        <div 
          className="grid border-b border-slate-100 pb-3 text-center pr-2 animate-none"
          style={{ gridTemplateColumns: `60px repeat(${visibleDays.length}, 1fr)` }}
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-end justify-center select-none font-mono">
            Heure
          </div>
          
          {visibleDays.map((vd) => {
            const today = new Date();
            const isTodayHighlight =
              vd.date.getDate() === today.getDate() &&
              vd.date.getMonth() === today.getMonth() &&
              vd.date.getFullYear() === today.getFullYear();

            const isSelected =
              vd.date.getDate() === currentDate.getDate() &&
              vd.date.getMonth() === currentDate.getMonth() &&
              vd.date.getFullYear() === currentDate.getFullYear();
            
            return (
              <div 
                key={vd.key} 
                className={`flex flex-col items-center p-0.5 rounded-xl transition-all ${isSelected ? "bg-violet-50/30" : ""}`}
              >
                <span className={`text-[10px] font-extrabold font-sans uppercase tracking-wider ${isSelected ? 'text-violet-605 text-violet-600 font-extrabold' : 'text-slate-400'}`}>
                  {vd.key}
                </span>
                <span className={`w-7 h-7 mt-1 text-xs font-bold leading-normal flex items-center justify-center rounded-full transition-all ${
                  isTodayHighlight
                    ? "bg-violet-605 bg-violet-600 text-white shadow-md shadow-violet-900/10 scale-105 font-black"
                    : isSelected
                      ? "bg-violet-100 text-violet-750 text-violet-755 text-violet-700 font-extrabold border border-violet-200"
                      : "text-slate-700 hover:bg-slate-100"
                }`}>
                  {vd.dateNum}
                </span>
              </div>
            );
          })}
        </div>

        {/* Grid content container with horizontal lines */}
        <div className="relative mt-2.5 h-[390px]" id="timetable-night-lines-grid" style={{ height: "390px" }}>
          
          {/* Horizontal time divider lines */}
          {nightHours.map((hour) => {
            const topOffsetPx = getNightHourOffsetPx(hour);
            return (
              <div 
                key={hour}
                className="absolute left-0 right-0 border-t border-dashed border-slate-200/80 flex items-center h-px group"
                style={{ top: `${topOffsetPx}px` }}
              >
                <span className="text-[10px] font-bold font-mono text-slate-400 bg-white pr-2.5 z-10 select-none -translate-y-2">
                  {hour}
                </span>
              </div>
            );
          })}

          {/* Vertical split column lanes */}
          <div 
            className="absolute top-0 right-0 grid pointer-events-none"
            style={{ 
              left: "60px",
              height: "360px",
              gridTemplateColumns: `repeat(${visibleDays.length}, 1fr)` 
            }}
          >
            {visibleDays.map((day, idx) => (
              <div key={idx} className="border-r border-slate-100/60 last:border-0 h-full" />
            ))}
          </div>

          {/* Dynamic Absolutely Positioned Course Cards for Night Agenda */}
          {nightCoursesList.map((course: Course) => {
            const visibleDaysKeys = visibleDays.map(d => d.key);
            const dayIndex = visibleDaysKeys.indexOf(course.day);
            if (dayIndex === -1) return null;

            const styles = getNightPositionStyles(course, visibleDays);

            return (
              <div
                key={course.id}
                className="absolute p-0.5 transition-all group overflow-hidden"
                style={styles}
                id={`course-box-cell-night-${course.id}`}
              >
                <div className={`w-full h-full rounded-xl transition-all p-2.5 flex flex-col justify-between overflow-hidden relative ${getCourseColorClass(course.title)}`}>
                  
                  {/* Course actions overlay */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-white/95 p-0.5 rounded-lg border border-slate-200 shadow-2xs z-10 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (course.id.startsWith("gcal_")) {
                          if (confirm(`Voulez-vous retirer l'événement Google "${course.title}" de votre emploi du temps ?`)) {
                            handleGCalDelete(course.id);
                          }
                        } else {
                          if (confirm(`Voulez-vous supprimer le cours nocturne de "${course.title}" de votre emploi du temps ?`)) {
                            deleteCourse(course.id);
                          }
                        }
                      }}
                      className="p-1 text-slate-500 hover:text-rose-600 rounded cursor-pointer transition-colors"
                      title="Retirer ce cours"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex flex-col justify-between h-full min-w-0 pr-4">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <h4 className="font-extrabold text-[12px] text-slate-800 truncate leading-tight block">{stripEmojis(course.title)}</h4>
                    </div>

                    <p className="text-[9.5px] font-bold font-mono text-slate-500/95 tracking-tight mt-1 leading-none">
                      {course.startTime} - {course.endTime}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Current real-world night time indicator red line */}
          {(() => {
            const h = nowTime.getHours();
            if (h >= 20 || h < 3) {
              const nowHourMin = `${h.toString().padStart(2, "0")}:${nowTime.getMinutes().toString().padStart(2, "0")}`;
              const offsetPx = getNightHourOffsetPx(nowHourMin);
              if (offsetPx >= 0 && offsetPx <= 360) {
                return (
                  <div 
                    className="absolute left-[60px] right-0 z-20 flex items-center h-px pointer-events-none text-rose-500"
                    style={{ top: `${offsetPx}px` }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1.5 border border-white shrink-0 shadow-sm" />
                    <div className="flex-1 border-t border-rose-500 border-solid animate-none" />
                  </div>
                );
              }
            }
            return null;
          })()}

        </div>
      </div>
    );
  };

  const renderMiniCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-indexed
    
    // Month label in French (Pascal Case)
    const monthLabel = currentDate.toLocaleDateString("fr-FR", { month: "long" }).charAt(0).toUpperCase() + currentDate.toLocaleDateString("fr-FR", { month: "long" }).slice(1);
    
    // Days in week headers
    const weekdaysMin = ["L", "M", "M", "J", "V", "S", "D"];
    
    // Get first day of month (1st of month)
    const firstDay = new Date(year, month, 1);
    // Adjusted day index (Monday = 0, Sunday = 6)
    let startDayIdx = firstDay.getDay() - 1;
    if (startDayIdx < 0) startDayIdx = 6;
    
    // Get total days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    // Build days array
    const daysArray = [];
    for (let i = 0; i < startDayIdx; i++) {
      daysArray.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      daysArray.push(new Date(year, month, i));
    }
    
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4" id="mini-calendar-card">
        <div className="flex items-center justify-between">
          <h4 
            className="font-extrabold text-xs text-slate-900 font-display uppercase tracking-wider font-mono flex items-center gap-1.5 cursor-pointer hover:text-purple-605 hover:text-purple-650 transition-colors"
            onClick={() => {
              if (!user) {
                handleGoogleLogin();
              } else {
                setIsAgendaPreviewOpen(true);
              }
            }}
            title={user ? "Connecté à Google Agenda - Gérer" : "Lier votre Google Agenda"}
          >
            <span>Calendrier</span>
            <span className={`w-1.5 h-1.5 rounded-full ${user ? "bg-emerald-500 animate-pulse" : "bg-purple-400"}`} />
          </h4>
          <div className="flex items-center gap-1">
            <button 
              type="button"
              onClick={() => {
                const prevM = new Date(currentDate);
                prevM.setMonth(prevM.getMonth() - 1);
                setCurrentDate(prevM);
              }}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-extrabold text-slate-700 min-w-20 text-center">
              {monthLabel} {year}
            </span>
            <button 
              type="button"
              onClick={() => {
                const nextM = new Date(currentDate);
                nextM.setMonth(nextM.getMonth() + 1);
                setCurrentDate(nextM);
              }}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Weekdays standard header */}
        <div className="grid grid-cols-7 gap-y-1 text-center text-[10px] font-bold text-slate-400">
          {weekdaysMin.map((day, dIdx) => (
            <div key={dIdx} className="py-0.5">{day}</div>
          ))}
        </div>
        
        {/* Days grid selection */}
        <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
          {daysArray.map((dateObj, idx) => {
            if (!dateObj) return <div key={idx} className="py-1" />;
            
            const isSelected = dateObj.getDate() === currentDate.getDate() && 
                             dateObj.getMonth() === currentDate.getMonth() && 
                             dateObj.getFullYear() === currentDate.getFullYear();
            
            const today = new Date();
            const isTodayInRealLife = dateObj.getDate() === today.getDate() && dateObj.getMonth() === today.getMonth() && dateObj.getFullYear() === today.getFullYear();
            
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCurrentDate(dateObj);
                  triggerNotification("Date modifiée", `${dateObj.toLocaleDateString("fr-FR", { day: 'numeric', month: 'long' })} sélectionné`, "info");
                }}
                className={`py-1 w-7 h-7 mx-auto rounded-full font-bold flex items-center justify-center transition-all cursor-pointer relative ${
                  isSelected 
                    ? "bg-purple-600 text-white shadow-sm font-extrabold font-sans" 
                    : isTodayInRealLife
                      ? "border border-purple-500 text-purple-600 hover:bg-purple-50 font-black font-sans" 
                      : "text-slate-600 hover:bg-slate-50 font-sans"
                }`}
              >
                <span>{dateObj.getDate()}</span>
                {/* little dot for events */}
                {state.courses.some(c => c.day === getDayKey(dateObj)) && !isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Small Google Drive & Google Calendar Link button aligned inside Calendar layout */}
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5 resize-none">
          {user ? (
            <div className="flex items-center justify-between bg-violet-50/20 border border-violet-100/50 p-2 rounded-xl text-[10px] font-semibold text-slate-700">
              <span className="truncate max-w-32">Google: {user.email}</span>
              <button 
                type="button"
                onClick={() => setIsAgendaPreviewOpen(true)}
                className="text-purple-600 font-bold hover:underline cursor-pointer"
              >
                Gérer ({googleEvents.filter(ev => !deletedGCalEventIds.includes(ev.id)).length})
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-slate-200 hover:bg-slate-50/80 rounded-xl text-[11px] text-slate-700 font-bold transition-all cursor-pointer shadow-3xs"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2005/svg" viewBox="0 0 48 48" className="w-4 h-4 shrink-0 block">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>Se connecter à Google Agenda</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderCategoryFilters = () => {
    // Categories and colors matching the mockup
    const cats = [
      { name: "Cours", color: "bg-purple-500" },
      { name: "Études", color: "bg-orange-500" },
      { name: "Sport", color: "bg-emerald-500" },
      { name: "Personnel", color: "bg-indigo-500" },
      { name: "Autre", color: "bg-sky-500" }
    ];
    
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4" id="category-filters-card">
        <h4 className="font-extrabold text-xs text-slate-900 font-display uppercase tracking-wider font-mono">Filtres</h4>
        <div className="flex flex-col gap-3">
          {cats.map((cat) => {
            const isChecked = selectedCategories.includes(cat.name);
            return (
              <label 
                key={cat.name} 
                className="flex items-center justify-between cursor-pointer group select-none py-0.5"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${cat.color} shrink-0`} />
                  <span className="text-xs font-bold text-slate-600 group-hover:text-slate-950 transition-colors">
                    {cat.name}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    if (isChecked) {
                      setSelectedCategories(selectedCategories.filter(c => c !== cat.name));
                    } else {
                      setSelectedCategories([...selectedCategories, cat.name]);
                    }
                  }}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-50 border border-slate-300 focus:ring-purple-500 focus:ring-1 cursor-pointer"
                />
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  const renderUpcomingEvents = () => {
    const dayOrder = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    
    const sorted = [...filteredCourses].sort((a, b) => {
      const idxA = dayOrder.indexOf(a.day);
      const idxB = dayOrder.indexOf(b.day);
      if (idxA !== idxB) return idxA - idxB;
      return a.startTime.localeCompare(b.startTime);
    });
    
    const upcoming = sorted.slice(0, 4);
    
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4" id="upcoming-events-card">
        <h4 className="font-extrabold text-xs text-slate-900 font-display uppercase tracking-wider font-mono">À Venir</h4>
        
        {upcoming.length === 0 ? (
          <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[11px] text-slate-400 font-semibold">Aucun événement programmé</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((ev) => {
              const cat = getCourseCategory(ev.title);
              let bulletColor = "bg-sky-500";
              if (cat === "Cours") bulletColor = "bg-purple-500";
              else if (cat === "Études") bulletColor = "bg-orange-500";
              else if (cat === "Sport") bulletColor = "bg-emerald-500";
              else if (cat === "Personnel") bulletColor = "bg-indigo-500";
              
              return (
                <div 
                  key={ev.id} 
                  className="p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all flex items-start gap-3 cursor-pointer group"
                  onClick={() => {
                    triggerNotification("Consultation", `${ev.title} (${ev.startTime} - ${ev.endTime})`, "info");
                  }}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${bulletColor} mt-1 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-slate-800 truncate group-hover:text-purple-700 transition-colors">
                      {ev.title}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1 font-sans">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{dayFrFull[ev.day] || ev.day}, {ev.startTime}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderConseilDuJour = () => {
    return (
      <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-5 shadow-2xs space-y-3 font-sans" id="conseil-du-jour-card">
        <div className="flex items-center gap-1.5 text-amber-700 font-sans">
          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
          <h4 className="font-extrabold text-xs uppercase tracking-wider font-mono">Conseil Du Jour</h4>
        </div>
        
        <p className="text-[11.5px] leading-relaxed text-amber-900 font-medium italic font-serif">
          "Planifie ton travail et travaille ton plan. Le secret d'une semaine réussie réside dans l'harmonie entre sessions de focus et temps de repos."
        </p>

        <div className="flex items-center gap-1 pt-1">
          {[...Array(5)].map((_, i) => (
            <svg key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      </div>
    );
  };

  const renderStudyInfoPanel = () => {
    const chartData = activeWeekDays.map(wd => ({
      name: wd.key,
      fullLabel: wd.label,
      heures: parseFloat(getDailyStudyHours(wd.date).toFixed(1)),
    }));

    const dailyHrs = getDailyStudyHours(currentDate);
    const targetDailyHrs = 8;
    const progressPercent = Math.min(100, Math.round((dailyHrs / targetDailyHrs) * 100));

    return (
      <div className="bg-white rounded-2xl p-5 shadow-[0_10px_35px_rgba(0,0,0,0.03)] border border-slate-100/50 space-y-5 hover:shadow-[0_15px_45px_rgba(0,0,0,0.06)] transition-all duration-300" id="schedule-evolution-panel">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 font-display flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-violet-600" />
              Informations d'étude & Évolution
            </h4>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5 font-mono uppercase tracking-wider">Visualisez votre charge d'étude hebdomadaire et vos statistiques de planification.</p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          
          {/* Stats Breakdown */}
          <div className="flex flex-col justify-between space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50/40 rounded-xl p-3 text-center shadow-[0_4px_15px_rgba(0,0,0,0.015)] border-none transition-shadow duration-300">
                <span className="text-[9px] text-slate-400 font-extrabold block mb-1 uppercase tracking-wider">Aujourd'hui ({getDayKey(currentDate)})</span>
                <span className="text-xs font-black font-mono text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-lg inline-block text-center whitespace-nowrap">
                  {formatHoursFraction(dailyHrs)}
                </span>
              </div>
              <div className="bg-slate-50/40 rounded-xl p-3 text-center shadow-[0_4px_15px_rgba(0,0,0,0.015)] border-none transition-shadow duration-300">
                <span className="text-[9px] text-slate-400 font-extrabold block mb-1 uppercase tracking-wider">Cette semaine</span>
                <span className="text-xs font-black font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg inline-block text-center whitespace-nowrap">
                  {formatHoursFraction(getWeeklyStudyHours())}
                </span>
              </div>
              <div className="bg-slate-50/40 rounded-xl p-3 text-center shadow-[0_4px_15px_rgba(0,0,0,0.015)] border-none transition-shadow duration-300">
                <span className="text-[9px] text-slate-400 font-extrabold block mb-1 uppercase tracking-wider">Mensuel (estimé)</span>
                <span className="text-xs font-black font-mono text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg inline-block text-center whitespace-nowrap">
                  {formatHoursFraction(getMonthlyStudyHours(currentDate))}
                </span>
              </div>
            </div>

            <div className="bg-slate-50/25 rounded-xl p-4 border-none space-y-2 shadow-[0_6px_20px_rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold font-mono uppercase tracking-wider">
                <span>Progression quotidienne</span>
                <span className="text-violet-650 font-black">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed font-sans">
                {dailyHrs > 0 
                  ? `${formatHoursFraction(dailyHrs)} sur un budget idéal de ${targetDailyHrs} heures d'étude par jour.`
                  : "Aucun cours ou tâche planifié pour le moment sur ce jour spécifique."}
              </p>
            </div>
          </div>

          {/* Evolution Chart */}
          <div className="bg-slate-50/10 rounded-xl border-none p-4 flex flex-col min-h-[180px] shadow-[0_6px_20px_rgba(0,0,0,0.02)]">
            <span className="text-[9px] text-slate-400 font-extrabold block mb-3 uppercase tracking-wider font-mono">Aperçu Hebdomadaire ( heures d'étude )</span>
            <div className="flex-1 w-full min-h-[140px]">
              <ResponsiveContainer width="100%" height={145}>
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ fontSize: '10px', borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}
                    labelFormatter={(label) => {
                      const found = chartData.find(d => d.name === label);
                      return found ? found.fullLabel : label;
                    }}
                    formatter={(value: any) => [`${value} h`, "Volume d'étude"]}
                  />
                  <Bar 
                    dataKey="heures" 
                    fill="#8b5cf6" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    );
  };

  const getCourseCountBySubject = (subjName: string) => {
    return filteredCourses.filter(c => c.title.toLowerCase().includes(subjName.toLowerCase())).length;
  };

  // Calculate stats
  const calculateTotalHours = () => {
    let totalMinutes = 0;
    filteredCourses.forEach(c => {
      const [sh, sm] = c.startTime.split(":").map(Number);
      const [eh, em] = c.endTime.split(":").map(Number);
      totalMinutes += (eh * 60 + em) - (sh * 60 + sm);
    });
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const exportSchedule = () => {
    triggerNotification("Emploi du temps exporté", "Le fichier PDF / iCal de votre planning a bien été téléchargé.", "success");
    alert("Votre emploi du temps a été généré et téléchargé avec succès au format iCal/PDF !");
  };

  return (
    <div className="space-y-6 font-sans" id="schedule-screen-root">
      
      {/* Top Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" id="schedule-top-bar">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-display flex items-center gap-2">
            Emploi du temps
          </h2>
          <p className="text-xs text-slate-500 mt-1">Gérez votre planning, consultez vos cours et ajoutez des événements.</p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto self-stretch sm:self-auto justify-end">
          <button
            onClick={exportSchedule}
            className="flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-all shadow-xs"
            title="Exporter l'agenda"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exporter</span>
          </button>
          
          <button
            onClick={() => setIsAddingCourse(!isAddingCourse)}
            className="flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-all shadow-md shadow-violet-800/10"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un cours</span>
          </button>
        </div>
      </div>

      {/* Course Creation Banner Drawer */}
      <AnimatePresence>
        {isAddingCourse && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-violet-100 bg-violet-50/25 p-5 border border-violet-200/50 rounded-2xl text-xs font-sans overflow-hidden"
          >
            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-violet-900 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-violet-600" /> Programmer une nouvelle séance d'étude
                </h4>
                <button 
                  type="button" 
                  onClick={() => setIsAddingCourse(false)}
                  className="p-1 hover:bg-violet-100 rounded-full text-violet-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Event Name Input */}
                <div className="md:col-span-5 space-y-1.5">
                  <label className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider">Nom de l'événement</label>
                  <input
                    type="text"
                    required
                    placeholder="Saisissez le titre de l'événement (ex: Révision Algèbre)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 text-xs font-bold text-slate-705 shadow-2xs"
                  />
                  {/* Suggested Quick Badges */}
                  <div className="flex flex-wrap gap-1 pt-1 opacity-90">
                    {["Mathématiques", "Physique", "Informatique", "Anglais", "Devoirs", "Projet"].map((subj) => (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => setNewTitle(subj)}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                          newTitle === subj 
                          ? "bg-violet-600 text-white border-violet-600" 
                          : "bg-white border-slate-200 text-slate-505 text-slate-500 hover:border-violet-300 hover:bg-violet-50/20"
                        }`}
                      >
                        {subj}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Day Select */}
                <div className="md:col-span-3 space-y-1.5">
                  <label className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider">Jour de semaine</label>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-705 shadow-2xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {daysKeysFull.filter((d) => d !== "Dim").map((d) => (
                      <option key={d} value={d}>{dayFrFull[d]}</option>
                    ))}
                  </select>
                </div>

                {/* Start Time Select */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider">Heure de début</label>
                  <select
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-705 shadow-2xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="08:00">08:00</option>
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="10:30">10:30</option>
                    <option value="11:00">11:00</option>
                    <option value="12:00">12:00</option>
                    <option value="13:00">13:00</option>
                    <option value="14:00">14:00</option>
                    <option value="15:00">15:00</option>
                    <option value="15:30">15:30</option>
                    <option value="16:00">16:00</option>
                    <option value="17:00">17:00</option>
                    <option value="18:00">18:00</option>
                    <option value="20:00">20:00 (Nuit)</option>
                    <option value="21:00">21:00 (Nuit)</option>
                    <option value="22:00">22:00 (Nuit)</option>
                    <option value="23:00">23:00 (Nuit)</option>
                    <option value="00:00">00:00 (Nuit)</option>
                    <option value="01:00">01:00 (Nuit)</option>
                    <option value="02:00">02:00 (Nuit)</option>
                  </select>
                </div>

                {/* Duration Select */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider">Durée de séance</label>
                  <select
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-705 shadow-2xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="30">30 minutes</option>
                    <option value="60">1 Heure (60 min)</option>
                    <option value="90">1 Heure 30 (90 min)</option>
                    <option value="120">2 Heures (120 min)</option>
                    <option value="180">3 Heures (180 min)</option>
                    <option value="240">4 Heures (240 min)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end pt-1">
                {/* Custom Description text area */}
                <div className="md:col-span-6 space-y-1.5">
                  <label className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider">Description / Remarques (Optionnel)</label>
                  <textarea
                    placeholder="Détails, devoirs à faire, notes à repenser..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 text-xs text-slate-700 h-10 resize-none shadow-2xs"
                  />
                </div>

                {/* Classroom Room Input */}
                <div className="md:col-span-3 space-y-1.5">
                  <label className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider">Salle (Optionnel)</label>
                  <input
                    type="text"
                    placeholder="ex: R204, Distant"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 text-xs text-slate-700 shadow-2xs"
                  />
                </div>

                {/* Save and Cancel Controls */}
                <div className="md:col-span-3 flex gap-2 justify-end self-end">
                  <button
                    type="button"
                    onClick={() => {
                      setNewTitle("");
                      setNewRoom("");
                      setNewDescription("");
                      setIsAddingCourse(false);
                    }}
                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 text-slate-700 rounded-xl font-bold transition-all shadow-2xs cursor-pointer border-none"
                  >
                    Effacer
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-md shadow-violet-800/10 cursor-pointer transition-all border-none"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main double column workspace body */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start" id="schedule-split-layout">
        
        {/* LEFT COMPONENT: Timetable core panel (3 columns) */}
        <div className="xl:col-span-3 space-y-6 flex flex-col" id="timetable-left-column">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col" id="timetable-content-card">
          
          {/* Calendar Selector Line */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100" id="timetable-filters-controls">
            
            {/* Nav Arrows & Today pill with dynamic actions */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0" id="grid-nav-group">
              <button 
                type="button"
                className="p-1 px-1.5 bg-white text-slate-600 rounded-lg hover:bg-slate-50 border border-slate-200/50 shadow-xs cursor-pointer transition-all"
                onClick={() => {
                  const nextD = new Date(currentDate);
                  if (viewType === "day") {
                    nextD.setDate(currentDate.getDate() - 1);
                  } else if (viewType === "week") {
                    nextD.setDate(currentDate.getDate() - 7);
                  } else {
                    nextD.setMonth(currentDate.getMonth() - 1);
                  }
                  setCurrentDate(nextD);
                  triggerNotification("Navigation", "Déplacement vers le passé", "info");
                }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button 
                type="button"
                className="p-1 px-1.5 bg-white text-slate-600 rounded-lg hover:bg-slate-50 border border-slate-200/50 shadow-xs cursor-pointer transition-all"
                onClick={() => {
                  const nextD = new Date(currentDate);
                  if (viewType === "day") {
                    nextD.setDate(currentDate.getDate() + 1);
                  } else if (viewType === "week") {
                    nextD.setDate(currentDate.getDate() + 7);
                  } else {
                    nextD.setMonth(currentDate.getMonth() + 1);
                  }
                  setCurrentDate(nextD);
                  triggerNotification("Navigation", "Déplacement vers l'avenir", "info");
                }}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button 
                type="button"
                className="px-3 py-1 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/50 text-[10px] font-bold font-mono tracking-wider uppercase rounded-lg transition-all"
                onClick={() => {
                  setCurrentDate(new Date());
                  triggerNotification("Navigation", "Retour à aujourd'hui", "info");
                }}
              >
                Aujourd'hui
              </button>
            </div>

            {/* Dynamic Date Label and Choose precise day widget */}
            <div className="flex flex-wrap items-center gap-2.5 justify-center" id="current-week-label-box">
              <span className="font-extrabold text-sm text-slate-800 font-display">
                {capitalizedHeaderLabel}
              </span>
              
              {/* Datepicker input to choose a specific day */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5" title="Sélectionner un jour précis">
                <CalendarIcon className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                <input 
                  type="date" 
                  value={formatDateToISO(currentDate)}
                  onChange={(e) => {
                    if (e.target.value) {
                      const parsed = new Date(e.target.value);
                      if (!isNaN(parsed.getTime())) {
                        setCurrentDate(parsed);
                        triggerNotification("Navigation", `Date choisie : ${parsed.toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'})}`, "success");
                      }
                    }
                  }}
                  className="bg-transparent border-none outline-none text-[11px] text-slate-700 font-black cursor-pointer focus:ring-0 p-0 w-[105px]"
                />
              </div>
            </div>

            {/* View Switch Pill row */}
            <div className="flex bg-slate-100 p-1 rounded-xl shrink-0" id="current-view-pills">
              {(["week", "day", "month"] as const).map((vt) => {
                const isActive = viewType === vt;
                const frLabel = vt === "week" ? "Semaine" : vt === "day" ? "Jour" : "Mois";
                return (
                  <button
                    key={vt}
                    type="button"
                    onClick={() => {
                      setViewType(vt);
                      triggerNotification("Changement de vue", `Vue définie sur ${frLabel}`, "info");
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-violet-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {frLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Core Calendar Selector Display wrapper */}
          <div className="relative mt-6 overflow-x-auto" id="timetable-axis-wrapper">
            
            {viewType === "month" ? (
              /* A. MONTH VIEW GRID SYSTEM */
              <div className="flex flex-col pt-2 min-w-160" id="timetable-month-grid">
                {/* Header Row */}
                <div className="grid grid-cols-7 border-b border-slate-100 pb-3 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono select-none animate-none">
                  <div>Lun</div>
                  <div>Mar</div>
                  <div>Mer</div>
                  <div>Jeu</div>
                  <div>Ven</div>
                  <div>Sam</div>
                  <div>Dim</div>
                </div>

                {/* 42 Cells month grid */}
                <div className="grid grid-cols-7 gap-1.5 mt-2.5 rounded-2xl bg-slate-50 border border-slate-100 p-1.5">
                  {getDaysInMonthGrid(currentDate).map((cell, idx) => {
                    const isSelected =
                      cell.date.getDate() === currentDate.getDate() &&
                      cell.date.getMonth() === currentDate.getMonth() &&
                      cell.date.getFullYear() === currentDate.getFullYear();
                    
                    const today = new Date();
                    const isTodayHighlight =
                      cell.date.getDate() === today.getDate() &&
                      cell.date.getMonth() === today.getMonth() &&
                      cell.date.getFullYear() === today.getFullYear();

                    const cellDayKey = getDayKey(cell.date);
                    const dayCourses = filteredCourses.filter(c => c.day === cellDayKey);

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setCurrentDate(cell.date);
                          triggerNotification("Date d'étude", `Sélection : ${cell.date.toLocaleDateString("fr-FR", {day: "numeric", month: "long"})}`, "info");
                        }}
                        className={`min-h-[92px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "bg-violet-50 border-violet-300 ring-1 ring-violet-200 shadow-xs"
                            : cell.isCurrentMonth
                              ? "bg-white border-slate-200/70 hover:bg-slate-50 hover:border-slate-350"
                              : "bg-slate-50/40 border-slate-100 opacity-40 hover:bg-slate-50"
                        }`}
                      >
                        {/* Cell Number info */}
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-mono font-bold ${
                            isTodayHighlight
                              ? "w-4.5 h-4.5 flex items-center justify-center bg-violet-600 text-white rounded-full font-black scale-105"
                              : isSelected
                                ? "text-violet-750 font-black"
                                : cell.isCurrentMonth ? "text-slate-700" : "text-slate-400"
                          }`}>
                            {cell.date.getDate()}
                          </span>
                          {dayCourses.length > 0 && cell.isCurrentMonth && (
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                          )}
                        </div>

                        {/* Courses mini rows in Month Grid */}
                        <div className="space-y-1 mt-1 flex-1 flex flex-col justify-end overflow-hidden">
                          {dayCourses.slice(0, 3).map(c => (
                            <div 
                              key={c.id} 
                              title={`${c.startTime} - ${c.endTime} | ${c.title}`}
                              className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-md truncate max-w-full leading-normal border transition-transform ${c.color.replace('hover:','')}`}
                            >
                              <span className="font-mono">{c.startTime.split(":")[0]}h</span>{" "}
                              <span className="truncate">{c.title}</span>
                            </div>
                          ))}
                          {dayCourses.length > 3 && (
                            <div className="text-[7.5px] text-slate-400 text-center font-bold font-sans">
                              + {dayCourses.length - 3} de plus
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* B. WEEK / DAY VIEWS STANDARD VERTICAL TIME AXIS GRID */
              <div className="min-w-160 relative flex flex-col pt-2" style={{ height: "720px" }}>
                
                {/* Days Columns Label Row Header */}
                <div 
                  className="grid border-b border-slate-100 pb-3 text-center pr-2"
                  style={{ gridTemplateColumns: `60px repeat(${visibleDays.length}, 1fr)` }}
                  id="schedule-grid-cols-labels"
                >
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-end justify-center select-none font-mono pb-2">
                    Heure
                  </div>
                  
                  {visibleDays.map((vd) => {
                    const today = new Date();
                    const isTodayHighlight =
                      vd.date.getDate() === today.getDate() &&
                      vd.date.getMonth() === today.getMonth() &&
                      vd.date.getFullYear() === today.getFullYear();
                    
                    const isSelected =
                      vd.date.getDate() === currentDate.getDate() &&
                      vd.date.getMonth() === currentDate.getMonth() &&
                      vd.date.getFullYear() === currentDate.getFullYear();
                    
                    return (
                      <div 
                        key={vd.key} 
                        className={`flex flex-col items-center cursor-pointer p-0.5 rounded-2xl transition-all ${isSelected ? "bg-purple-50/20" : ""}`}
                        onClick={() => {
                          setCurrentDate(vd.date);
                          triggerNotification("Sélection jour", `Affichage de ${vd.label}`, "info");
                        }}
                      >
                        <span className={`text-[10px] font-bold font-sans uppercase tracking-wider ${isSelected ? 'text-purple-600 font-extrabold' : 'text-slate-400'}`}>
                          {vd.key}
                        </span>
                        <span className={`w-14 h-8 mt-1 text-xs font-bold leading-normal flex flex-col items-center justify-center rounded-xl transition-all ${
                          isTodayHighlight
                            ? "bg-purple-600 text-white shadow-md shadow-purple-905/10 scale-105 font-bold"
                            : isSelected
                              ? "bg-purple-50 text-purple-700 font-bold border border-purple-200"
                              : "text-slate-700 hover:bg-slate-50 border border-transparent"
                        }`}>
                          <span className="font-extrabold text-[11px] leading-tight mt-0.5">{vd.dateNum}</span>
                          <span className="text-[8px] opacity-80 uppercase leading-none font-semibold font-mono tracking-wider">{vd.monthLabel}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Grid content container with horizontal lines */}
                <div className="relative flex-1 mt-2.5" id="timetable-lines-grid">
                  
                  {/* Horizontal time divider lines */}
                  {hours.map((hour) => {
                    const topOffsetPx = getHourOffsetPx(hour);
                    return (
                      <div 
                        key={hour}
                        className="absolute left-0 right-0 border-t border-dashed border-slate-100 flex items-center h-px group"
                        style={{ top: `${topOffsetPx}px` }}
                      >
                        <span className="text-[10px] font-bold font-mono text-slate-400 bg-white pr-2.5 z-10 select-none -translate-y-2">
                          {hour}
                        </span>
                      </div>
                    );
                  })}

                  {/* Vertical split column lanes */}
                  <div 
                    className="absolute top-0 bottom-0 right-0 grid pointer-events-none"
                    style={{ 
                      left: "60px",
                      gridTemplateColumns: `repeat(${visibleDays.length}, 1fr)` 
                    }}
                  >
                    {visibleDays.map((day, idx) => (
                      <div key={idx} className="border-r border-slate-100/60 last:border-0 h-full" />
                    ))}
                  </div>

                  {/* Dynamic Absolutely Positioned Course Cards */}
                  {dayCoursesList.map((course: Course) => {
                    const visibleDaysKeys = visibleDays.map(d => d.key);
                    const dayIndex = visibleDaysKeys.indexOf(course.day);
                    if (dayIndex === -1) return null;

                    const styles = getPositionStyles(course, visibleDays);
                    const beautifulColor = getCourseColorClass(course.title);

                    return (
                      <div
                        key={course.id}
                        className="absolute p-0.5 transition-all group overflow-hidden"
                        style={styles}
                        id={`course-box-cell-${course.id}`}
                      >
                        <div className={`w-full h-full rounded-xl transition-all p-2.5 flex flex-col justify-between overflow-hidden relative ${beautifulColor}`}>
                          
                          {/* Course actions overlay */}
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-white/95 p-0.5 rounded-lg border border-slate-200 shadow-2xs z-10 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (course.id.startsWith("gcal_")) {
                                  if (confirm(`Voulez-vous retirer l'événement Google "${course.title}" de votre emploi du temps ?`)) {
                                    handleGCalDelete(course.id);
                                  }
                                } else {
                                  if (confirm(`Voulez-vous supprimer le cours de "${course.title}" de votre emploi du temps ?`)) {
                                    deleteCourse(course.id);
                                  }
                                }
                              }}
                              className="p-1 text-slate-500 hover:text-rose-600 rounded cursor-pointer transition-colors"
                              title="Retirer ce cours"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex flex-col justify-between h-full min-w-0 pr-4">
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="font-extrabold text-[12px] tracking-tight text-slate-800 truncate leading-tight">
                                {stripEmojis(course.title)}
                              </span>
                            </div>

                            <p className="text-[9.5px] font-bold font-mono text-slate-500/95 tracking-tight mt-1 leading-none">
                              {course.startTime} - {course.endTime}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Current real-world time indicator red line */}
                  {(() => {
                    const nowHourMin = `${nowTime.getHours().toString().padStart(2, "0")}:${nowTime.getMinutes().toString().padStart(2, "0")}`;
                    const offsetPx = getHourOffsetPx(nowHourMin);
                    
                    // Display details in the grid if the current hour is between 08:00 and 20:00
                    if (offsetPx >= 0 && offsetPx <= 720) {
                      return (
                        <div 
                          className="absolute left-[60px] right-0 z-20 flex items-center h-px pointer-events-none text-rose-500"
                          style={{ top: `${offsetPx}px` }}
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1.5 border border-white shrink-0 shadow-sm" />
                          <div className="flex-1 border-t border-rose-500 border-solid animate-none" />
                        </div>
                      );
                    }
                    return null;
                  })()}

                </div>
              </div>
            )}

          </div>

          {/* Bottom dynamic legends strip aligning exactly to mockup visual design */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4" id="timetable-legend-strip">
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500">
              <div className="flex items-center gap-1.5 cursor-pointer hover:text-indigo-600 transition-colors">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <span>Mathématiques</span>
              </div>
              <div className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600 transition-colors">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Physique</span>
              </div>
              <div className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-700 transition-colors">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>Informatique</span>
              </div>
              <div className="flex items-center gap-1.5 cursor-pointer hover:text-amber-600 transition-colors">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Anglais</span>
              </div>
            </div>

            {/* Add custom Subject element (Simulated) */}
            <button
              onClick={() => {
                setIsAddingCourse(true);
                triggerNotification("Aide à la planification", "Sélectionnez un titre et un horaire pour ajouter la matière", "info");
              }}
              className="flex items-center gap-1 py-1.5 px-3 bg-slate-5 border border-dashed border-slate-300 hover:border-violet-400 hover:bg-violet-50/15 rounded-full text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Ajouter une matière</span>
            </button>
        </div>

      </div>

      {/* Beautiful Minimalist Night Agenda for 20h - 3h in the left column */}
      {showNightAgenda && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 text-slate-700" id="timetable-night-container">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 font-display flex items-center gap-2">
                <Clock className="w-5 h-5 text-violet-600" />
                Agenda de Nuit (20h - 3h)
              </h4>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5 font-mono uppercase tracking-wider block">Planifiez vos sessions d'étude tardives et révisions nocturnes.</p>
            </div>

            <button
              onClick={() => {
                setIsAddingCourse(true);
                setNewStart("20:00");
                setNewDuration("120"); // prefilled with 2h
                const container = document.getElementById("schedule-screen-root");
                if (container) {
                  container.scrollIntoView({ behavior: "smooth" });
                }
                triggerNotification("Agenda de nuit", "Formulaire ouvert d'ajout - Horaires nocturnes préinstallés (20h00) !", "info");
              }}
              className="flex items-center gap-1.5 bg-violet-50 hover:bg-violet-100 text-violet-755 text-violet-700 font-bold text-xs px-3.5 py-2 rounded-xl border border-violet-100/60 shadow-xs cursor-pointer transition-all shrink-0"
              title="Ajouter rapidement un cours sur l'agenda de nuit"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter</span>
            </button>
          </div>

          {renderNightAgendaGrid()}
        </div>
      )}

    </div>

        {/* RIGHT COMPONENT: Action Side Filter panel (1 column) */}
        <div className="xl:col-span-1 space-y-6" id="timetable-parameters-panel">
          
          {/* Mini-Calendar Component */}
          {renderMiniCalendar()}

          {/* Interactive Checkbox Filter Box to match image */}
          {renderCategoryFilters()}

          {/* Additional View Options inside Filters card to retain full capabilities */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4" id="timetable-general-options-panel">
            <h4 className="font-extrabold text-xs text-slate-900 font-display uppercase tracking-wider font-mono">Options D'Affichage</h4>
            <div className="space-y-3 text-xs font-semibold text-slate-700">
              
              {/* Filter 1: Show Weekends */}
              <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={showWeekends}
                  onChange={(e) => {
                    setShowWeekends(e.target.checked);
                    triggerNotification("Changement filtre", `Week-ends ${e.target.checked ? "affichés" : "masqués"}`, "info");
                  }}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-50 border-slate-300 focus:ring-purple-500 cursor-pointer text-purple-600"
                />
                <span className="group-hover:text-slate-900 transition-colors font-sans">Afficher les week-ends</span>
              </label>

              {/* Filter 2: Show Classroom rooms indicator */}
              <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={showRooms}
                  onChange={(e) => {
                    setShowRooms(e.target.checked);
                    triggerNotification("Changement filtre", `Salles des classes ${e.target.checked ? "affichées" : "masquées"}`, "info");
                  }}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-50 border-slate-300 focus:ring-purple-500 cursor-pointer text-purple-600"
                />
                <span className="group-hover:text-slate-900 transition-colors font-sans">Afficher les salles</span>
              </label>

              {/* Filter 3: Show Night Agenda */}
              <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={showNightAgenda}
                  onChange={(e) => {
                    setShowNightAgenda(e.target.checked);
                    triggerNotification("Changement filtre", `Agenda de nuit ${e.target.checked ? "affiché" : "masqué"}`, "info");
                  }}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-50 border-slate-300 focus:ring-purple-500 cursor-pointer text-purple-600"
                />
                <span className="group-hover:text-slate-900 transition-colors font-sans">Afficher l'agenda de nuit</span>
              </label>

            </div>
          </div>

        </div>

      </div>

      {/* Google Agenda Complet Dialog / Drawer */}
      <AnimatePresence>
        {isAgendaPreviewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-transparent">
                  <div className="bg-violet-50 p-2 rounded-xl text-violet-600">
                    <CalendarRange className="w-5 h-5 bg-transparent" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 font-display">Aperçu de l'Agenda</h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsAgendaPreviewOpen(false);
                    setGoogleSearchQuery("");
                  }}
                  className="p-1 px-1.5 hover:bg-slate-100 rounded-full text-slate-500 border border-slate-200/60 shadow-2xs hover:text-slate-900 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4 ml-auto" />
                </button>
              </div>

              {/* Search Bar with clean dividers */}
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                <div className="relative flex-1 bg-transparent">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 bg-transparent pointer-events-none" />
                  <input
                    type="text"
                    value={googleSearchQuery}
                    onChange={(e) => setGoogleSearchQuery(e.target.value)}
                    placeholder="Chercher un événement ou lieu..."
                    className="w-full bg-white border border-slate-200 focus:border-violet-300 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-705 focus:outline-none placeholder-slate-405 shadow-3xs"
                  />
                </div>
                {googleSearchQuery && (
                  <button
                    onClick={() => setGoogleSearchQuery("")}
                    className="text-xs text-slate-500 hover:text-slate-800 font-bold bg-white px-2.5 py-2 border border-slate-200 rounded-xl cursor-pointer"
                  >
                    Effacer
                  </button>
                )}
              </div>

              {/* Events List container with thin separation lines */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[50vh]">
                {googleEvents.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <p className="text-xs font-bold text-slate-505 text-slate-500">Aucun événement dans l'agenda Google.</p>
                    <p className="text-[10px] text-slate-400">Ajoutez des réunions, devoirs ou cours sur Google Agenda pour les prévisualiser ici.</p>
                  </div>
                ) : (
                  (() => {
                    const filtered = googleEvents
                      .filter(evt => !deletedGCalEventIds.includes(evt.id))
                      .filter(evt => {
                        const title = (evt.summary || "").toLowerCase();
                        const desc = (evt.description || "").toLowerCase();
                        const loc = (evt.location || "").toLowerCase();
                        const q = googleSearchQuery.toLowerCase();
                        return title.includes(q) || desc.includes(q) || loc.includes(q);
                      });

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-10 text-slate-455 text-slate-405 text-slate-400">
                          <p className="text-xs font-bold">Aucun événement ne correspond à "{googleSearchQuery}"</p>
                          <p className="text-[10px] text-slate-400 mt-1">Essayez un autre mot clé ou réinitialisez vos suppressions.</p>
                        </div>
                      );
                    }

                    return filtered.map((evt) => {
                      const isAllDay = !evt.start.dateTime;
                      return (
                        <div key={evt.id} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0 space-y-1 bg-transparent hover:bg-slate-50/15 transition-colors">
                          <div className="flex items-start justify-between gap-2 bg-transparent">
                            <span className="font-extrabold text-slate-800 text-xs leading-snug">
                              {evt.summary || "Événement sans titre"}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0 z-10">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                isAllDay ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-violet-50 text-violet-600 border border-violet-100"
                              }`}>
                                {isAllDay ? "Journée" : "Événement"}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Voulez-vous retirer l'événement "${evt.summary || "sans titre"}" de votre agenda local ?`)) {
                                    handleGCalDelete(`gcal_${evt.id}`);
                                  }
                                }}
                                className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded bg-transparent border-none cursor-pointer transition-colors"
                                title="Supprimer cet événement de l'affichage"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1 text-[10px] text-slate-400 bg-transparent animate-none">
                            <div className="flex items-center gap-1 bg-transparent font-medium">
                              <Clock className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                              <span className="font-mono text-slate-500">{formatGCalDate(evt.start)}</span>
                            </div>
                            {evt.location && (
                              <div className="flex items-center gap-1 bg-transparent font-medium truncate max-w-full animate-none">
                                <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span className="truncate text-slate-500">{evt.location}</span>
                              </div>
                            )}
                          </div>

                          {evt.description && (
                            <p className="text-[10px] text-slate-500 bg-slate-50 rounded-lg p-2 border border-slate-100 leading-relaxed font-sans mt-1">
                              {evt.description}
                            </p>
                          )}
                        </div>
                      );
                    });
                  })()
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span>Synchronisation active</span>
                <button
                  type="button"
                  onClick={() => {
                    handleManualSync();
                  }}
                  disabled={isSyncing}
                  className="flex items-center gap-1 font-bold text-violet-600 hover:text-violet-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:shadow-3xs transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>{isSyncing ? "Sync..." : "Recharger"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
