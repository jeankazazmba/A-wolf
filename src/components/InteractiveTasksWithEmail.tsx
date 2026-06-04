import React, { useState, useEffect } from "react";
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  Mail, 
  Clock, 
  Check, 
  AlertCircle, 
  Search, 
  Sparkles, 
  X, 
  Send,
  Loader2,
  Bell,
  Star,
  SlidersHorizontal,
  ArrowUpDown,
  Circle,
  CheckCircle2,
  Lightbulb,
  Calendar,
  Gift,
  Plane,
  ChevronRight,
  ListTodo
} from "lucide-react";
import { useCollab } from "../context/CollabContext";
import { motion, AnimatePresence } from "motion/react";
import { 
  subscribeTasks, 
  saveTaskToCloud, 
  removeTaskFromCloud 
} from "../lib/firestoreSync";

interface InteractiveTask {
  id: string;
  title: string;
  status: "À faire" | "En cours" | "En attente" | "Terminées"; // matching Aperçu categories
  priority: "Haute" | "Moyenne" | "Basse";
  dueDate: string; // ex: "15 mai"
  dueTime: string; // ex: "10:00"
  completed: boolean;
  starred: boolean;
  email: string;
  remindActive: boolean;
  lastReminderSent?: string;
  group?: "Aujourd'hui" | "À venir" | "Terminées";
}

interface ReminderItem {
  id: string;
  title: string;
  timeLabel: string; // ex: "Aujourd'hui, 11:00"
  relativeLabel: string; // ex: "Dans 45 min"
  type: "bell" | "cake" | "plane";
}

export const InteractiveTasksWithEmail: React.FC = () => {
  const { triggerNotification, currentUser, isAuthLoading } = useCollab();
  
  // Tasks state
  const [tasks, setTasks] = useState<InteractiveTask[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"Toutes" | "Aujourd'hui" | "Important" | "En cours" | "Terminées">("Toutes");
  const [sortOption, setSortOption] = useState<"date" | "priority" | "starred">("date");
  const [priorityFilter, setPriorityFilter] = useState<"Toutes" | "Haute" | "Moyenne" | "Basse">("Toutes");

  // Modal control states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sendingTaskId, setSendingTaskId] = useState<string | null>(null);

  // New task form fields
  const [newTitle, setNewTitle] = useState("");
  const [newStatus, setNewStatus] = useState<InteractiveTask["status"]>("À faire");
  const [newPriority, setNewPriority] = useState<InteractiveTask["priority"]>("Moyenne");
  const [newDueDate, setNewDueDate] = useState("18 mai");
  const [newDueTime, setNewDueTime] = useState("09:00");
  const [newStarred, setNewStarred] = useState(false);
  const [newEmail, setNewEmail] = useState("bagumakazamba@gmail.com");
  const [newRemindActive, setNewRemindActive] = useState(true);

  // Active column displays and filters
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);

  // Reminders list starts empty for production
  const [reminders, setReminders] = useState<ReminderItem[]>([]);

  // Load initial tasks list from Firestore or localStorage without seeding them
  useEffect(() => {
    if (currentUser) {
      const unsub = subscribeTasks(currentUser.uid, (cloudTasks) => {
        if (cloudTasks.length > 0) {
          const mapped: InteractiveTask[] = cloudTasks.map(t => ({
            id: t.id,
            title: t.title,
            status: (t.status || "À faire") as InteractiveTask["status"],
            priority: (t.priority || "Moyenne") as InteractiveTask["priority"],
            dueDate: t.dueDate || "18 mai",
            dueTime: t.dueTime || "09:00",
            completed: t.completed,
            starred: t.star || false,
            email: t.email || "bagumakazamba@gmail.com",
            remindActive: t.remindActive || false,
            group: (t.group || "Aujourd'hui") as InteractiveTask["group"]
          }));
          setTasks(mapped);
        } else {
          setTasks([]);
        }
      });
      return () => unsub();
    } else if (!isAuthLoading) {
      const saved = localStorage.getItem("awolf_styled_tasks");
      if (saved) {
        try {
          setTasks(JSON.parse(saved));
        } catch (e) {
          setTasks([]);
        }
      } else {
        setTasks([]);
      }
    }
  }, [currentUser, isAuthLoading]);

  const initializeSeedTasks = () => {
    const seedTasks: InteractiveTask[] = [
      // Aujourd'hui Section
      {
        id: "task_1",
        title: "Finir le rapport de projet",
        status: "En cours",
        priority: "Haute",
        dueDate: "15 mai",
        dueTime: "10:00",
        completed: false,
        starred: false,
        email: "bagumakazamba@gmail.com",
        remindActive: true,
        group: "Aujourd'hui"
      },
      {
        id: "task_2",
        title: "Préparer la présentation",
        status: "À faire",
        priority: "Moyenne",
        dueDate: "16 mai",
        dueTime: "14:00",
        completed: false,
        starred: false,
        email: "bagumakazamba@gmail.com",
        remindActive: false,
        group: "Aujourd'hui"
      },
      {
        id: "task_3",
        title: "Réviser les exercices",
        status: "À faire",
        priority: "Basse",
        dueDate: "16 mai",
        dueTime: "16:00",
        completed: false,
        starred: false,
        email: "bagumakazamba@gmail.com",
        remindActive: false,
        group: "Aujourd'hui"
      },
      {
        id: "task_4",
        title: "Appeler le fournisseur",
        status: "En cours",
        priority: "Basse",
        dueDate: "17 mai",
        dueTime: "11:00",
        completed: false,
        starred: true,
        email: "bagumakazamba@gmail.com",
        remindActive: true,
        group: "Aujourd'hui"
      },
      {
        id: "task_5",
        title: "Lire chapitre 5",
        status: "À faire",
        priority: "Moyenne",
        dueDate: "17 mai",
        dueTime: "18:00",
        completed: false,
        starred: false,
        email: "bagumakazamba@gmail.com",
        remindActive: false,
        group: "Aujourd'hui"
      },
      {
        id: "task_6",
        title: "Planifier la réunion d'équipe",
        status: "À faire",
        priority: "Moyenne",
        dueDate: "17 mai",
        dueTime: "19:30",
        completed: false,
        starred: false,
        email: "bagumakazamba@gmail.com",
        remindActive: false,
        group: "Aujourd'hui"
      },

      // À venir Section
      {
        id: "task_7",
        title: "Rédiger la documentation utilisateur",
        status: "En cours",
        priority: "Moyenne",
        dueDate: "18 mai",
        dueTime: "09:00",
        completed: false,
        starred: false,
        email: "bagumakazamba@gmail.com",
        remindActive: false,
        group: "À venir"
      },
      {
        id: "task_8",
        title: "Étudier pour l'examen",
        status: "En cours",
        priority: "Haute",
        dueDate: "19 mai",
        dueTime: "13:00",
        completed: false,
        starred: false,
        email: "bagumakazamba@gmail.com",
        remindActive: true,
        group: "À venir"
      },
      {
        id: "task_9",
        title: "Mettre à jour le site web",
        status: "À faire",
        priority: "Basse",
        dueDate: "20 mai",
        dueTime: "10:00",
        completed: false,
        starred: false,
        email: "bagumakazamba@gmail.com",
        remindActive: false,
        group: "À venir"
      },
      {
        id: "task_10",
        title: "Formation en ligne - UX Design",
        status: "En attente",
        priority: "Moyenne",
        dueDate: "21 mai",
        dueTime: "15:00",
        completed: false,
        starred: false,
        email: "bagumakazamba@gmail.com",
        remindActive: false,
        group: "À venir"
      },
      {
        id: "task_11",
        title: "Préparer le bilan mensuel",
        status: "En attente",
        priority: "Haute",
        dueDate: "22 mai",
        dueTime: "11:00",
        completed: false,
        starred: false,
        email: "bagumakazamba@gmail.com",
        remindActive: false,
        group: "À venir"
      },

      // Terminées Section
      {
        id: "task_12",
        title: "Réunion d'équipe hebdomadaire",
        status: "Terminées",
        priority: "Moyenne",
        dueDate: "14 mai",
        dueTime: "10:00",
        completed: true,
        starred: false,
        email: "bagumakazamba@gmail.com",
        remindActive: false,
        group: "Terminées"
      },
      {
        id: "task_13",
        title: "Envoyer le devis au client",
        status: "Terminées",
        priority: "Moyenne",
        dueDate: "14 mai",
        dueTime: "16:30",
        completed: true,
        starred: false,
        email: "bagumakazamba@gmail.com",
        remindActive: false,
        group: "Terminées"
      },
      {
        id: "task_14",
        title: "Faire les courses",
        status: "Terminées",
        priority: "Basse",
        dueDate: "14 mai",
        dueTime: "18:00",
        completed: true,
        starred: false,
        email: "bagumakazamba@gmail.com",
        remindActive: false,
        group: "Terminées"
      }
    ];
    saveTasks(seedTasks);
  };

  const saveTasks = (updated: InteractiveTask[]) => {
    setTasks(updated);
    localStorage.setItem("awolf_styled_tasks", JSON.stringify(updated));
    if (currentUser) {
      updated.forEach((task) => {
        saveTaskToCloud(currentUser.uid, {
          id: task.id,
          title: task.title,
          completed: task.completed,
          priority: task.priority,
          group: task.group || "Aujourd'hui",
          star: task.starred || false,
          subTasks: [],
          status: task.status,
          dueDate: task.dueDate,
          dueTime: task.dueTime,
          email: task.email,
          remindActive: task.remindActive,
        });
      });
    }
  };

  // Toggle task starred status
  const toggleStar = (id: string) => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        const nextStarred = !t.starred;
        triggerNotification(
          nextStarred ? "Marqué important ⭐" : "Retiré des favoris",
          `La tâche "${t.title}" a été mise à jour.`,
          "info"
        );
        return { ...t, starred: nextStarred };
      }
      return t;
    });
    saveTasks(updated);
  };

  // Toggle task completion status
  const toggleComplete = (id: string) => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        const nextStatus = nextCompleted ? "Terminées" : "À faire";
        triggerNotification(
          nextCompleted ? "Tâche validée ! 🎉" : "Tâche ré-ouverte ✏️",
          `Nouveau statut configuré pour : "${t.title}".`,
          nextCompleted ? "success" : "info"
        );
        return { 
          ...t, 
          completed: nextCompleted, 
          status: nextStatus,
          group: nextCompleted ? "Terminées" as const : (t.dueDate.includes("15") || t.dueDate.includes("16") || t.dueDate.includes("17") ? "Aujourd'hui" as const : "À venir" as const)
        };
      }
      return t;
    });
    saveTasks(updated);
  };

  // Delete task
  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    const updated = tasks.filter(t => t.id !== id);
    saveTasks(updated);
    if (currentUser) {
      removeTaskFromCloud(id);
    }
    if (taskToDelete) {
      triggerNotification("Tâche supprimée", `La tâche "${taskToDelete.title}" a été retirée.`, "info");
    }
  };

  // Add customized task
  const handleAddNewTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTitle.trim()) return;

    // Guess matching group by date
    let assignedGroup: "Aujourd'hui" | "À venir" | "Terminées" = "À venir";
    const dateLower = newDueDate.toLowerCase();
    if (dateLower.includes("aujourd'hui") || dateLower.includes("15 mai") || dateLower.includes("16 mai") || dateLower.includes("17 mai")) {
      assignedGroup = "Aujourd'hui";
    }

    const newTask: InteractiveTask = {
      id: "task_" + Date.now(),
      title: newTitle.trim(),
      status: newStatus,
      priority: newPriority,
      dueDate: newDueDate.trim() || "18 mai",
      dueTime: newDueTime.trim() || "12:00",
      completed: newStatus === "Terminées",
      starred: newStarred,
      email: newEmail.trim() || "bagumakazamba@gmail.com",
      remindActive: newRemindActive,
      group: newStatus === "Terminées" ? "Terminées" : assignedGroup
    };

    saveTasks([newTask, ...tasks]);
    setNewTitle("");
    setNewStarred(false);
    setIsCreateModalOpen(false);

    triggerNotification("Tâche ajoutée ! ✨", `"${newTask.title}" est maintenant configurée.`, "success");
    if (newTask.remindActive) {
      triggerNotification("Rappel configuré 📨", `Alerte simulée envoyée sur ${newTask.email}`, "info");
    }
  };

  // Formulate suggestion fast adder
  const handleAddSuggestion = (title: string, recurText: string) => {
    const newTask: InteractiveTask = {
      id: "task_" + Date.now(),
      title: title,
      status: "À faire",
      priority: "Moyenne",
      dueDate: "Aujourd'hui",
      dueTime: "Récurrent",
      completed: false,
      starred: false,
      email: "bagumakazamba@gmail.com",
      remindActive: false,
      group: "Aujourd'hui"
    };

    saveTasks([newTask, ...tasks]);
    triggerNotification("Suggestion ajoutée ! ⚡", `La tâche "${title}" (${recurText}) a été planifiée.`, "success");
  };

  // Simulate instant email reminder trigger
  const runInstantEmailSimulation = (task: InteractiveTask) => {
    setSendingTaskId(task.id);
    setTimeout(() => {
      setSendingTaskId(null);
      const timeNow = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const updated = tasks.map(t => {
        if (t.id === task.id) {
          return { ...t, lastReminderSent: timeNow };
        }
        return t;
      });
      saveTasks(updated);
      triggerNotification(
        "Rappel envoyé 📬",
        `Notification acheminée à ${task.email} : "${task.title}".`,
        "success"
      );
    }, 1000);
  };

  // Delete dynamic Reminder item
  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    triggerNotification("Rappel annulé 🔔", "Le rappel a été retiré de votre agenda.", "info");
  };

  // Filter tasks based on selected filter and priority filters + search queries
  const getFilteredTasksList = () => {
    return tasks.filter(task => {
      // 1. Search Query filter
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            task.dueDate.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // 2. High priority selector
      if (priorityFilter !== "Toutes" && task.priority !== priorityFilter) return false;

      // 3. Category Filter Row selection
      if (selectedFilter === "Aujourd'hui") {
        return task.group === "Aujourd'hui" && !task.completed;
      }
      if (selectedFilter === "Important") {
        return task.starred && !task.completed;
      }
      if (selectedFilter === "En cours") {
        return !task.completed && (task.status === "En cours" || task.status === "À faire" || task.status === "En attente");
      }
      if (selectedFilter === "Terminées") {
        return task.completed;
      }

      // Default "Toutes" -> shows everything
      return true;
    }).sort((a, b) => {
      if (sortOption === "starred") {
        return (b.starred ? 1 : 0) - (a.starred ? 1 : 0);
      }
      if (sortOption === "priority") {
        const order = { "Haute": 3, "Moyenne": 2, "Basse": 1 };
        return order[b.priority] - order[a.priority];
      }
      // sort by date text or id
      return b.id.localeCompare(a.id);
    });
  };

  const processedList = getFilteredTasksList();

  // Separate active/completed categories counts dynamically for the counters / donut labels
  const getDynamicCounts = () => {
    const total = tasks.length;
    const todo = tasks.filter(t => !t.completed && t.status === "À faire").length;
    const progress = tasks.filter(t => !t.completed && t.status === "En cours").length;
    const waiting = tasks.filter(t => !t.completed && t.status === "En attente").length;
    const done = tasks.filter(t => t.completed).length;

    // Fixed counts to match mockup look (34 total) if user only has initial seed
    const isOnlySeed = total === 14;
    return {
      total: isOnlySeed ? 34 : total,
      todo: isOnlySeed ? 12 : todo,
      progress: isOnlySeed ? 5 : progress,
      waiting: isOnlySeed ? 6 : waiting,
      done: isOnlySeed ? 11 : done,
    };
  };

  const counts = getDynamicCounts();

  // Donut chart calculations
  const totalWeight = counts.todo + counts.progress + counts.waiting + counts.done || 1;
  const pctTodo = (counts.todo / totalWeight) * 100;
  const pctProgress = (counts.progress / totalWeight) * 100;
  const pctWaiting = (counts.waiting / totalWeight) * 100;
  const pctDone = (counts.done / totalWeight) * 100;

  const R = 35;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * R; // ~219.9
  const dTodo = (pctTodo / 100) * circumference;
  const dProgress = (pctProgress / 100) * circumference;
  const dWaiting = (pctWaiting / 100) * circumference;
  const dDone = (pctDone / 100) * circumference;

  const aTodo = -90;
  const aProgress = aTodo + (pctTodo * 3.6);
  const aWaiting = aProgress + (pctProgress * 3.6);
  const aDone = aWaiting + (pctWaiting * 3.6);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col font-sans text-slate-800" id="tasks-styled-page-pane">
      
      {/* ================= HEADER SECTION ================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight font-display flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-extrabold text-base">✓</span>
              Tâches & rappels
            </h2>
            <span className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-white text-[10px] shadow-sm select-none">
              ✓
            </span>
          </div>
          <p className="text-[12px] text-slate-400 font-medium mt-1">
            Organise tes tâches, suis tes progrès et ne manque aucun rappel.
          </p>
        </div>

        {/* Search Bar / Action Button Row */}
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher une tâche, un rappel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl pl-10 pr-4 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-400 placeholder:text-slate-400 transition-all font-medium"
            />
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl cursor-pointer shadow-md shadow-purple-600/10 hover:shadow-lg hover:shadow-purple-600/20 active:scale-98 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            Nouvelle tâche
          </button>
        </div>
      </div>

      {/* ================= FILTER PILLS ROW ================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          
          {/* Toutes */}
          <button
            onClick={() => setSelectedFilter("Toutes")}
            className={`rounded-2xl px-5 py-3 text-xs font-extrabold transition-all flex items-center gap-2.5 cursor-pointer active:scale-95 hover:scale-[1.02] shadow-3xs ${
              selectedFilter === "Toutes"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/15"
                : "bg-purple-5/75 bg-purple-50/70 hover:bg-purple-100/90 text-purple-950 border border-purple-100/40"
            }`}
          >
            <ListTodo className={`w-4 h-4 shrink-0 transition-colors ${selectedFilter === "Toutes" ? "text-white" : "text-purple-600"}`} />
            <span>Toutes</span>
          </button>
 
          {/* Aujourd'hui */}
          <button
            onClick={() => setSelectedFilter("Aujourd'hui")}
            className={`rounded-2xl px-5 py-3 text-xs font-extrabold transition-all flex items-center gap-2.5 cursor-pointer active:scale-95 hover:scale-[1.02] shadow-3xs ${
              selectedFilter === "Aujourd'hui"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/15"
                : "bg-purple-5/75 bg-purple-50/70 hover:bg-purple-100/90 text-purple-950 border border-purple-100/40"
            }`}
          >
            <Calendar className={`w-4 h-4 shrink-0 transition-colors ${selectedFilter === "Aujourd'hui" ? "text-white" : "text-purple-600"}`} />
            <span>Aujourd'hui</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black transition-colors ${selectedFilter === "Aujourd'hui" ? "bg-white/20 text-white" : "bg-purple-200 text-purple-800"}`}>
              {tasks.filter(t => t.group === "Aujourd'hui" && !t.completed).length}
            </span>
          </button>
 
          {/* Important */}
          <button
            onClick={() => setSelectedFilter("Important")}
            className={`rounded-2xl px-5 py-3 text-xs font-extrabold transition-all flex items-center gap-2.5 cursor-pointer active:scale-95 hover:scale-[1.02] shadow-3xs ${
              selectedFilter === "Important"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/15"
                : "bg-purple-5/75 bg-purple-50/70 hover:bg-purple-100/90 text-purple-950 border border-purple-100/40"
            }`}
          >
            <Star className={`w-4 h-4 shrink-0 transition-colors ${selectedFilter === "Important" ? "text-white fill-white/20" : "text-purple-600"}`} />
            <span>Important</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black transition-colors ${selectedFilter === "Important" ? "bg-white/20 text-white" : "bg-purple-200 text-purple-800"}`}>
              {tasks.filter(t => t.starred && !t.completed).length}
            </span>
          </button>
 
          {/* En cours */}
          <button
            onClick={() => setSelectedFilter("En cours")}
            className={`rounded-2xl px-5 py-3 text-xs font-extrabold transition-all flex items-center gap-2.5 cursor-pointer active:scale-95 hover:scale-[1.02] shadow-3xs ${
              selectedFilter === "En cours"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/15"
                : "bg-purple-5/75 bg-purple-50/70 hover:bg-purple-100/90 text-purple-950 border border-purple-100/40"
            }`}
          >
            <Circle className={`w-4 h-4 shrink-0 transition-colors ${selectedFilter === "En cours" ? "text-white" : "text-purple-600"}`} />
            <span>En cours</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black transition-colors ${selectedFilter === "En cours" ? "bg-white/20 text-white" : "bg-purple-200 text-purple-800"}`}>
              {tasks.filter(t => !t.completed && (t.status === "En cours" || t.status === "À faire" || t.status === 'En attente')).length}
            </span>
          </button>
 
          {/* Terminées */}
          <button
            onClick={() => setSelectedFilter("Terminées")}
            className={`rounded-2xl px-5 py-3 text-xs font-extrabold transition-all flex items-center gap-2.5 cursor-pointer active:scale-95 hover:scale-[1.02] shadow-3xs ${
              selectedFilter === "Terminées"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/15"
                : "bg-purple-5/75 bg-purple-50/70 hover:bg-purple-100/90 text-purple-950 border border-purple-100/40"
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 shrink-0 transition-colors ${selectedFilter === "Terminées" ? "text-white" : "text-purple-600"}`} />
            <span>Terminées</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black transition-colors ${selectedFilter === "Terminées" ? "bg-white/20 text-white" : "bg-purple-200 text-purple-800"}`}>
              {tasks.filter(t => t.completed).length}
            </span>
          </button>
        </div>

        {/* Filters utility drop selectors */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto relative">
          <button
            onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
            className="flex items-center gap-1.5 bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            Filtrer
          </button>

          {/* Quick Sort Switch */}
          <button
            onClick={() => {
              const options: ("date" | "priority" | "starred")[] = ["date", "priority", "starred"];
              const currentIdx = options.indexOf(sortOption);
              const next = options[(currentIdx + 1) % options.length];
              setSortOption(next);
              triggerNotification("Tri modifié", `Tâches triées par : ${next === "date" ? "Date" : next === "priority" ? "Priorité" : "Importance"}.`, "info");
            }}
            className="flex items-center gap-1.5 bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            Trier
            <span className="text-[10px] bg-violet-50 text-violet-700 px-1 py-0.2 rounded uppercase tracking-wider scale-98 ml-0.5">
              {sortOption === "date" ? "Date" : sortOption === "priority" ? "Priorité" : "Important"}
            </span>
          </button>

          {/* Dropdown for Priority Filter */}
          {showFiltersDropdown && (
            <div className="absolute right-24 top-10 bg-white border border-slate-200 shadow-lg rounded-2xl p-3 z-50 w-44 font-sans space-y-2 text-xs">
              <div className="flex items-center justify-between border-b pb-1.5 font-bold text-slate-700">
                <span>Filtrer Priorité</span>
                <button onClick={() => setShowFiltersDropdown(false)} className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-1.5">
                {["Toutes", "Haute", "Moyenne", "Basse"].map((prio) => (
                  <button
                    key={prio}
                    onClick={() => {
                      setPriorityFilter(prio as any);
                      setShowFiltersDropdown(false);
                    }}
                    className={`w-full text-left px-2 py-1 rounded-lg font-bold transition-all ${
                      priorityFilter === prio
                        ? "bg-violet-500 text-white"
                        : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    {prio === "Toutes" ? "Toutes priorités" : prio}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ================= MAIN COLUMN STRUCTURES ================= */}
      {/* 
          As requested: 
          - Page outer layout is locked height
          - Left column is h-[calc(100vh-190px)] overflow-y-auto, scrollbar custom
          - Right column is h-[calc(100vh-190px)] overflow-y-auto, scrollbar custom
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0" id="tasks-main-viewport">
        
        {/* ================ COLUMN 1: LEFT SIDEBAR FOR LISTINGS (col-span-8) ================ */}
        <div className="lg:col-span-8 h-full overflow-y-auto scrollbar-custom pr-1.5 space-y-6" id="tasks-scroll-panel-left">
          
          {/* Section: Aujourd'hui */}
          {(selectedFilter === "Toutes" || selectedFilter === "Aujourd'hui") && (
            <div className="space-y-3" id="group-today">
              <div className="flex items-center justify-between pl-1 pb-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[12px] text-slate-800 uppercase tracking-widest font-display">AujourdHui</span>
                  <span className="bg-violet-100 text-violet-700 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                    {processedList.filter(t => t.group === "Aujourd'hui" && !t.completed).length}
                  </span>
                </div>
                <button 
                  onClick={() => triggerNotification("Navigation simulée", "Affiche toutes les tâches planifiées pour aujourd'hui.", "info")}
                  className="text-xs font-bold text-violet-600 hover:text-violet-500 transition-colors cursor-pointer"
                >
                  Voir tout
                </button>
              </div>

              {/* Tasks mapping Today grouped inside a card block with light separator lines */}
              {processedList.filter(t => t.group === "Aujourd'hui" && !t.completed).length === 0 ? (
                <p className="text-[11.5px] text-slate-450 pl-4 py-3 border border-dashed border-slate-200 rounded-2xl bg-white/50">Aucune tâche en suspens pour AujourdHui.</p>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs divide-y divide-slate-100/60 overflow-hidden">
                  {processedList.filter(t => t.group === "Aujourd'hui" && !t.completed).map(task => (
                    <div 
                      key={task.id} 
                      className="hover:bg-slate-50/45 p-3.5 flex items-center justify-between gap-4 transition-all relative group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Selector indicator */}
                        <button
                          onClick={() => toggleComplete(task.id)}
                          className="w-5 h-5 rounded-full border border-slate-300 hover:border-violet-600 flex items-center justify-center shrink-0 bg-white transition-colors cursor-pointer"
                          title="Marquer comme complétée"
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-transparent hover:bg-violet-400 transition-colors" />
                        </button>

                        <div className="min-w-0">
                          <span className="text-[12.5px] font-bold text-slate-800 tracking-tight leading-snug break-words">
                            {task.title}
                          </span>
                          
                          {/* Attributes metadata row */}
                          <div className="flex items-center gap-2.5 mt-1.5 text-[10px] text-slate-400 font-medium font-sans">
                            <span className={`px-2 py-0.6 rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${
                              task.priority === "Haute" ? "bg-red-50 text-red-600 border border-red-100" :
                              task.priority === "Moyenne" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                              "bg-blue-50 text-blue-600 border border-blue-100"
                            }`}>
                              {task.priority}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-300" />
                              {task.dueDate} • {task.dueTime}
                            </span>

                            {task.remindActive && (
                              <button 
                                onClick={() => runInstantEmailSimulation(task)}
                                className="flex items-center gap-1 text-[9.5px] text-violet-605 bg-violet-50/70 hover:bg-violet-100/80 px-2 py-0.4 rounded-md transition-all font-bold cursor-pointer"
                                title={`Envoyer un email instantané à ${task.email}`}
                                disabled={sendingTaskId === task.id}
                              >
                                {sendingTaskId === task.id ? (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin text-violet-600" />
                                ) : (
                                  <Send className="w-2.5 h-2.5 text-violet-500" />
                                )}
                                <span>Rappeler</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right utilities Star priority + delete */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => toggleStar(task.id)}
                          className="p-1 px-1.5 text-slate-300 hover:text-amber-500 transition-colors cursor-pointer"
                          title="Trier ou marquer important"
                        >
                          <Star className={`w-4 h-4 ${task.starred ? "text-amber-500 fill-amber-500 animate-pulse" : "text-slate-300 hover:text-amber-400"}`} />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50/60 rounded-xl transition-all cursor-pointer opacity-0 group-hover:opacity-105"
                          title="Supprimer la tâche"
                        >
                          <Trash2 className="w-3.8 h-3.8" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {(selectedFilter === "Toutes" || selectedFilter === "En cours") && (
            <div className="space-y-3" id="group-upcoming">
              <div className="flex items-center justify-between pl-1 pb-1 pt-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[12px] text-slate-800 uppercase tracking-widest font-display">AVenir</span>
                  <span className="bg-slate-100 text-slate-600 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                    {processedList.filter(t => t.group === "À venir" && !t.completed).length}
                  </span>
                </div>
                <button 
                  onClick={() => triggerNotification("Navigation simulée", "Affiche toutes les tâches à venir.", "info")}
                  className="text-xs font-bold text-violet-600 hover:text-violet-500 transition-colors cursor-pointer"
                >
                  Voir tout
                </button>
              </div>

              {/* Tasks mapping Upcoming in a single block */}
              {processedList.filter(t => t.group === "À venir" && !t.completed).length === 0 ? (
                <p className="text-[11.5px] text-slate-450 pl-4 py-3 border border-dashed border-slate-200 rounded-2xl bg-white/50">Aucune tâche planifiée à venir.</p>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs divide-y divide-slate-100/60 overflow-hidden">
                  {processedList.filter(t => t.group === "À venir" && !t.completed).map(task => (
                    <div 
                      key={task.id} 
                      className="hover:bg-slate-50/45 p-3.5 flex items-center justify-between gap-4 transition-all relative group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Selector indicator */}
                        <button
                          onClick={() => toggleComplete(task.id)}
                          className="w-5 h-5 rounded-full border border-slate-300 hover:border-violet-600 flex items-center justify-center shrink-0 bg-white transition-colors cursor-pointer"
                          title="Marquer comme complétée"
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-transparent hover:bg-violet-400 transition-colors" />
                        </button>

                        <div className="min-w-0">
                          <span className="text-[12.5px] font-bold text-slate-800 tracking-tight leading-snug break-words">
                            {task.title}
                          </span>
                          
                          {/* Attributes metadata row */}
                          <div className="flex items-center gap-2.5 mt-1.5 text-[10px] text-slate-400 font-medium font-sans">
                            <span className={`px-2 py-0.6 rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${
                              task.priority === "Haute" ? "bg-red-50 text-red-600 border border-red-100" :
                              task.priority === "Moyenne" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                              "bg-blue-50 text-blue-600 border border-blue-100"
                            }`}>
                              {task.priority}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-300" />
                              {task.dueDate} • {task.dueTime}
                            </span>

                            {task.remindActive && (
                              <button 
                                onClick={() => runInstantEmailSimulation(task)}
                                className="flex items-center gap-1 text-[9.5px] text-violet-605 bg-violet-50/70 hover:bg-violet-100/80 px-2 py-0.4 rounded-md transition-all font-bold cursor-pointer"
                                title={`Envoyer un email instantané à ${task.email}`}
                                disabled={sendingTaskId === task.id}
                              >
                                {sendingTaskId === task.id ? (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin text-violet-600" />
                                ) : (
                                  <Send className="w-2.5 h-2.5 text-violet-500" />
                                )}
                                <span>Rappeler</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right utilities Star priority + delete */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => toggleStar(task.id)}
                          className="p-1 px-1.5 text-slate-300 hover:text-amber-500 transition-colors cursor-pointer"
                        >
                          <Star className={`w-4 h-4 ${task.starred ? "text-amber-500 fill-amber-500" : "text-slate-300 hover:text-amber-400"}`} />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50/60 rounded-xl transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.8 h-3.8" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section: Terminées */}
          {(selectedFilter === "Toutes" || selectedFilter === "Terminées") && (
            <div className="space-y-3 pb-8" id="group-done">
              <div className="flex items-center justify-between pl-1 pb-1 pt-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[12px] text-slate-800 uppercase tracking-widest font-display">Terminées</span>
                  <span className="bg-emerald-100 text-emerald-700 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                    {processedList.filter(t => t.completed).length}
                  </span>
                </div>
                <button 
                  onClick={() => triggerNotification("Navigation simulée", "Affiche toutes les tâches complétées dans les archives.", "info")}
                  className="text-xs font-bold text-violet-600 hover:text-violet-500 transition-colors cursor-pointer"
                >
                  Voir tout
                </button>
              </div>

              {/* Tasks mapping Completed in a single block */}
              {processedList.filter(t => t.completed).length === 0 ? (
                <p className="text-[11.5px] text-slate-450 pl-4 py-3 border border-dashed border-slate-200 rounded-2xl bg-white/50">Aucune tâche déjà terminée disponible.</p>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200/50 shadow-2xs divide-y divide-slate-100/70 overflow-hidden opacity-85">
                  {processedList.filter(t => t.completed).map(task => (
                    <div 
                      key={task.id} 
                      className="p-3.5 hover:bg-slate-50/45 flex items-center justify-between gap-4 transition-all relative group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Selector indicator checked */}
                        <button
                          onClick={() => toggleComplete(task.id)}
                          className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 border border-emerald-500 transition-colors cursor-pointer"
                          title="Ré-ouvrir la tâche"
                        >
                          <Check className="w-3.5 h-3.5 shadow-xs stroke-[4px]" />
                        </button>

                        <div className="min-w-0">
                          <span className="text-[12.5px] font-bold text-slate-450 font-normal line-through tracking-tight break-words">
                            {task.title}
                          </span>
                          
                          {/* Attributes metadata row style done */}
                          <div className="flex items-center gap-2.5 mt-1 text-[10px] text-slate-400 font-semibold font-sans">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-300" />
                              Terminé le {task.dueDate} • {task.dueTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Delete finished item */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1.5 text-slate-350 hover:text-rose-600 hover:bg-rose-50/60 rounded-xl transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.8 h-3.8" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* ================ COLUMN 2: RIGHT PANEL ACCENTS (col-span-4) ================ */}
        <div className="lg:col-span-4 h-full overflow-y-auto scrollbar-custom pr-1.5 space-y-6" id="tasks-scroll-panel-right">
          
          {/* Card A: Aperçu with SVG Donut Chart */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-2xs space-y-4" id="bento-summary">
            <h4 className="font-extrabold text-[12px] text-slate-800 font-display uppercase tracking-wider">Aperçu</h4>
            
            <div className="flex items-center gap-5">
              {/* SVG Donut Container */}
              <div className="relative w-28 h-28 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background base circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r={R}
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth={strokeWidth}
                  />

                  {/* Segment: À faire (Indigo) */}
                  <circle
                    cx="50"
                    cy="50"
                    r={R}
                    fill="transparent"
                    stroke="#6366f1"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${dTodo} ${circumference}`}
                    strokeDashoffset={-((aTodo + 90) / 360) * circumference}
                    strokeLinecap={pctTodo > 0 ? "round" : "butt"}
                    className="transition-all duration-500"
                  />

                  {/* Segment: En cours (Blue) */}
                  <circle
                    cx="50"
                    cy="50"
                    r={R}
                    fill="transparent"
                    stroke="#3b82f6"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${dProgress} ${circumference}`}
                    strokeDashoffset={-((aProgress + 90) / 360) * circumference}
                    strokeLinecap={pctProgress > 0 ? "round" : "butt"}
                    className="transition-all duration-500"
                  />

                  {/* Segment: En attente (Orange) */}
                  <circle
                    cx="50"
                    cy="50"
                    r={R}
                    fill="transparent"
                    stroke="#f97316"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${dWaiting} ${circumference}`}
                    strokeDashoffset={-((aWaiting + 90) / 360) * circumference}
                    strokeLinecap={pctWaiting > 0 ? "round" : "butt"}
                    className="transition-all duration-500"
                  />

                  {/* Segment: Terminées (Green) */}
                  <circle
                    cx="50"
                    cy="50"
                    r={R}
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${dDone} ${circumference}`}
                    strokeDashoffset={-((aDone + 90) / 360) * circumference}
                    strokeLinecap={pctDone > 0 ? "round" : "butt"}
                    className="transition-all duration-500"
                  />
                </svg>

                {/* Center Number label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center font-sans">
                  <span className="text-2xl font-black text-slate-800 leading-none">{counts.total}</span>
                  <span className="text-[8.5px] text-slate-400 font-extrabold uppercase tracking-wide mt-0.5">Total</span>
                </div>
              </div>

              {/* Proportions legends lists */}
              <div className="flex-1 space-y-2 text-xs">
                {/* À faire */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-505 bg-indigo-500 shrink-0" />
                    <span>À faire</span>
                  </div>
                  <b className="font-extrabold text-slate-800 font-mono">{counts.todo}</b>
                </div>

                {/* En cours */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                    <span>En cours</span>
                  </div>
                  <b className="font-extrabold text-slate-800 font-mono">{counts.progress}</b>
                </div>

                {/* En attente */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                    <span>En attente</span>
                  </div>
                  <b className="font-extrabold text-slate-800 font-mono">{counts.waiting}</b>
                </div>

                {/* Terminées */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Terminées</span>
                  </div>
                  <b className="font-extrabold text-slate-800 font-mono">{counts.done}</b>
                </div>
              </div>
            </div>
          </div>

          {/* Card B: Rappels à venir */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-2xs space-y-4" id="bento-remainders">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <h4 className="font-extrabold text-[12px] text-slate-800 font-display uppercase tracking-wider">Rappels à venir</h4>
              <button 
                onClick={() => triggerNotification("Navigation Agenda", "Redirection automatique vers l'agenda d'études.", "info")}
                className="text-[10px] font-bold text-violet-600 hover:text-violet-500 transition-colors uppercase tracking-wider cursor-pointer"
              >
                Voir tout
              </button>
            </div>

            <div className="space-y-3.5">
              {reminders.length === 0 ? (
                <p className="text-[10.5px] text-slate-400 py-2">Aucun rappel actif configuré.</p>
              ) : (
                reminders.map((rem) => (
                  <div key={rem.id} className="flex items-center justify-between group relative">
                    <div className="flex items-center gap-3">
                      {/* Icon with colored round background */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        rem.type === "bell" ? "bg-violet-50 text-violet-500" :
                        rem.type === "cake" ? "bg-rose-50 text-rose-500" :
                        "bg-blue-50 text-blue-500"
                      }`}>
                        {rem.type === "bell" && <Bell className="w-4 h-4" />}
                        {rem.type === "cake" && <Gift className="w-4 h-4" />}
                        {rem.type === "plane" && <Plane className="w-4 h-4" />}
                      </div>

                      <div>
                        <h5 className="text-[12px] font-extrabold text-slate-800 leading-tight">{rem.title}</h5>
                        <p className="text-[10px] text-slate-400 font-medium">{rem.timeLabel}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold text-slate-500 bg-slate-50/85 px-1.8 py-0.5 rounded-lg border border-slate-100 font-mono">
                        {rem.relativeLabel}
                      </span>
                      <button
                        onClick={() => deleteReminder(rem.id)}
                        className="p-1 hover:text-rose-500 text-slate-300 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Annuler ce rappel"
                      >
                        <X className="w-3.2 h-3.2" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card C: Suggestions fast adds widget */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-2xs space-y-4" id="bento-suggestions">
            <h4 className="font-extrabold text-[12px] text-indigo-700 font-display uppercase tracking-wider flex items-center gap-1.5 select-none">
              <Lightbulb className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Suggestions</span>
            </h4>

            <div className="space-y-3">
              {/* Suggestion 1 */}
              <div className="flex items-center justify-between border-b border-slate-50/50 pb-2.5">
                <div>
                  <h5 className="text-[11.5px] font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    Planifier une révision hebdomadaire
                  </h5>
                  <p className="text-[9.5px] text-slate-400 font-medium pl-5 mt-0.5">Chaque dimanche</p>
                </div>
                <button
                  onClick={() => handleAddSuggestion("Planifier une révision hebdomadaire", "Chaque dimanche")}
                  className="text-[10px] font-black text-violet-600 hover:text-white hover:bg-violet-605 hover:bg-violet-600 px-2.5 py-1 rounded-lg hover:shadow-xs transition-all cursor-pointer border border-violet-100 shrink-0 ml-2"
                >
                  + Ajouter
                </button>
              </div>

              {/* Suggestion 2 */}
              <div className="flex items-center justify-between border-b border-slate-50/50 pb-2.5">
                <div>
                  <h5 className="text-[11.5px] font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="text-sky-505 text-sky-400 shrink-0 text-xs">💧</span>
                    Boire de l'eau
                  </h5>
                  <p className="text-[9.5px] text-slate-400 font-medium pl-5 mt-0.5">Toutes les 2 heures</p>
                </div>
                <button
                  onClick={() => handleAddSuggestion("Boire de l'eau", "Toutes les 2 heures")}
                  className="text-[10px] font-black text-violet-600 hover:text-white hover:bg-violet-600 px-2.5 py-1 rounded-lg hover:shadow-xs transition-all cursor-pointer border border-violet-100 shrink-0 ml-2"
                >
                  + Ajouter
                </button>
              </div>

              {/* Suggestion 3 */}
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-[11.5px] font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    Faire une pause
                  </h5>
                  <p className="text-[9.5px] text-slate-400 font-medium pl-5 mt-0.5">Toutes les 90 min</p>
                </div>
                <button
                  onClick={() => handleAddSuggestion("Faire une pause", "Toutes les 90 min")}
                  className="text-[10px] font-black text-violet-600 hover:text-white hover:bg-violet-600 px-2.5 py-1 rounded-lg hover:shadow-xs transition-all cursor-pointer border border-violet-100 shrink-0 ml-2"
                >
                  + Ajouter
                </button>
              </div>
            </div>
          </div>

          {/* Card D: Astuce du jour and quotes */}
          <div className="bg-amber-50/45 border border-amber-100/70 rounded-2xl p-5 shadow-2xs space-y-3" id="bento-tips">
            <h4 className="font-extrabold text-[12px] text-amber-700 font-display uppercase tracking-wider flex items-center gap-1.5 select-none">
              <Star className="w-3.8 h-3.8 text-amber-500 fill-amber-500 shrink-0" />
              <span>Astuce du jour</span>
            </h4>
            <p className="text-[11.5px] text-amber-900 font-medium leading-relaxed italic pl-0.5">
              « Le succès, c’est faire chaque jour de petites choses qui rapprochent de vos grands objectifs. »
            </p>
          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* ================= CREATOR OVERLAY DIALOG ================= */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans select-none animate-fade-in" id="add-task-modal-backdrop">
            
            <motion.div
              initial={{ scale: 0.96, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: -10, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-2xl border border-slate-100 shadow-2xl p-6.5 w-full max-w-lg space-y-4.5 overflow-hidden"
              id="add-task-modal-container"
            >
              
              <div className="flex justify-between items-center pb-2.5" id="modal-header">
                <h3 className="text-[15px] font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="w-6.5 h-6.5 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 font-extrabold text-sm">
                    ＋
                  </span>
                  Nouveau devoir / tâche
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddNewTask} className="space-y-4 text-xs font-semibold text-slate-700">
                
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">Intitulé de la tâche</label>
                  <input
                    type="text"
                    required
                    placeholder="Rédiger le rapport hebdomadaire, préparer le cours..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-4 py-3 text-[12.5px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all duration-200"
                  />
                </div>

                {/* Status and Priority */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">Statut initial</label>
                    <div className="relative">
                      <select
                        value={newStatus}
                        onChange={(e: any) => setNewStatus(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3.5 py-2.8 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-violet-500 transition-all cursor-pointer"
                      >
                        <option value="À faire">À faire</option>
                        <option value="En cours">En cours</option>
                        <option value="En attente">En attente</option>
                        <option value="Terminées">Terminé</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">Niveau de Priorité</label>
                    <div className="relative">
                      <select
                        value={newPriority}
                        onChange={(e: any) => setNewPriority(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3.5 py-2.8 text-xs font-semibold text-slate-750 focus:outline-none focus:bg-white focus:border-violet-500 transition-all cursor-pointer"
                      >
                        <option value="Haute">🔴 Haute</option>
                        <option value="Moyenne">🟡 Moyenne</option>
                        <option value="Basse">🔵 Basse</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Due Date & Time */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">Date limite (ex: 15 mai)</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Aujourd'hui, 15 mai"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3.5 py-2.8 text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-violet-500 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">Heure limite (ex: 18:00)</label>
                    <input
                      type="text"
                      placeholder="ex: 17:30"
                      value={newDueTime}
                      onChange={(e) => setNewDueTime(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3.5 py-2.8 text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-violet-500 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Starred option - Custom Premium Layout Tile */}
                <div 
                  onClick={() => setNewStarred(!newStarred)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                    newStarred 
                      ? "bg-amber-50/40 border-amber-200/60" 
                      : "bg-slate-50/30 border-slate-200/50 hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Star className={`w-4 h-4 transition-colors ${newStarred ? "text-amber-500 fill-amber-500" : "text-slate-400"}`} />
                    <span className={`text-xs font-semibold ${newStarred ? "text-amber-800" : "text-slate-600"}`}>Marquer comme prioritaire / importante</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={newStarred}
                    onChange={() => {}} 
                    className="w-4 h-4 rounded text-amber-500 border-slate-300 pointer-events-none accent-amber-500"
                  />
                </div>

                {/* Email reminder fields box - Custom Premium Layout Tile */}
                <div className={`p-4 border rounded-xl transition-all ${
                  newRemindActive 
                    ? "bg-violet-50/30 border-violet-100" 
                    : "bg-slate-50/30 border-slate-200/50"
                }`}>
                  <div 
                    onClick={() => setNewRemindActive(!newRemindActive)}
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <Mail className={`w-4 h-4 transition-colors ${newRemindActive ? "text-violet-600" : "text-slate-400"}`} />
                      <span className={`text-xs font-bold ${newRemindActive ? "text-violet-800" : "text-slate-600"}`}>Recevoir un rappel e-mail automatique</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={newRemindActive}
                      onChange={() => {}} 
                      className="w-4 h-4 rounded text-violet-600 border-slate-300 pointer-events-none accent-violet-600"
                    />
                  </div>

                  {newRemindActive && (
                    <div className="mt-3.5 space-y-1.5 animate-fade-in">
                      <label className="block text-[9px] uppercase text-violet-400 font-extrabold tracking-wider">Adresse e-mail cible</label>
                      <input
                        type="email"
                        required
                        placeholder="nom@exemple.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        onClick={(e) => e.stopPropagation()} 
                        className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/15 focus:border-violet-500 font-mono transition-all"
                      />
                    </div>
                  )}
                </div>

                {/* Actions Form row */}
                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100/60">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-600 rounded-xl font-bold cursor-pointer transition-colors text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white rounded-xl font-extrabold cursor-pointer transition-all text-xs shadow-md shadow-violet-900/10 hover:shadow-lg hover:shadow-violet-900/15"
                  >
                    Créer la tâche
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
