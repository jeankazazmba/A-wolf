import React, { useState } from "react";
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  Calendar, 
  Search, 
  Tag, 
  Flag,
  Sparkles,
  Info
} from "lucide-react";
import { useCollab } from "../context/CollabContext";
import { Task } from "../types";
import { motion, AnimatePresence } from "motion/react";

export const TaskCenter: React.FC = () => {
  const { state, addTask, toggleTask, triggerNotification } = useCollab();

  const [activeCategory, setActiveCategory] = useState<"Tout" | "Devoirs" | "Examens" | "Projets">("Tout");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpenCreator, setIsOpenCreator] = useState(false);

  // Selector input states
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCategory, setTaskCategory] = useState<"Devoirs" | "Examens" | "Projets">("Devoirs");
  const [taskDate, setTaskDate] = useState("");
  const [taskPriority, setTaskPriority] = useState<"Haute" | "Moyenne" | "Basse">("Moyenne");

  const filterCategories: ("Tout" | "Devoirs" | "Examens" | "Projets")[] = [
    "Tout",
    "Devoirs",
    "Examens",
    "Projets",
  ];

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    let formattedDate = "À faire";
    if (taskDate) {
      const dateObj = new Date(taskDate);
      formattedDate = dateObj.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    addTask(taskTitle, taskCategory, formattedDate, taskPriority);

    // reset fields
    setTaskTitle("");
    setTaskDate("");
    setIsOpenCreator(false);
  };

  const filteredTasks = state.tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "Tout" || task.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getPriorityClasses = (priority: string) => {
    switch (priority) {
      case "Haute":
        return "bg-rose-50 text-rose-600 border border-rose-100 font-bold";
      case "Moyenne":
        return "bg-amber-50 text-amber-600 border border-amber-100 font-bold";
      default:
        return "bg-sky-50 text-sky-600 border border-sky-100 font-bold";
    }
  };

  const completedCount = filteredTasks.filter(t => t.completed).length;
  const percentComplete = filteredTasks.length > 0 ? Math.round((completedCount / filteredTasks.length) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col h-full font-sans" id="taskcenter-card">
      
      {/* Header controls layout aligned with user requirements */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5" id="taskcenter-header">
        <div>
          <h3 className="text-lg font-bold text-slate-900 font-display">Tâches à faire</h3>
          <p className="text-xs text-slate-400 mt-0.5">Suivi en temps réel des devoirs, examens et projets de groupe</p>
        </div>

        {/* Create button */}
        <button
          onClick={() => setIsOpenCreator(!isOpenCreator)}
          className="flex items-center gap-1.5 bg-violet-605 hover:bg-violet-700 bg-violet-600 text-white font-bold text-xs px-4  py-2.5 rounded-xl shadow-lg shadow-violet-800/10 cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Nouvelle tâche
        </button>
      </div>

      {/* Task creator drawer inside card */}
      <AnimatePresence>
        {isOpenCreator && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-violet-100 bg-violet-50/20 p-4 border border-violet-200/50 rounded-xl my-4 text-xs font-sans overflow-hidden"
          >
            <form onSubmit={handleCreateTask} className="space-y-3">
              <h4 className="font-bold text-violet-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600" /> Ajouter une nouvelle tâche d'étude
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold text-[10px] uppercase">Désignation</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Rendre le compte-rendu de Physique"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500 text-slate-850 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold text-[10px] uppercase">Catégorie</label>
                  <select
                    value={taskCategory}
                    onChange={(e: any) => setTaskCategory(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500 text-slate-705 text-xs"
                  >
                    <option value="Devoirs">📝 Devoirs d'étude</option>
                    <option value="Examens">🎓 Examens / Sessions académiques</option>
                    <option value="Projets">🚀 Projets d'études & Groupes</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold text-[10px] uppercase">Priorité requise</label>
                  <select
                    value={taskPriority}
                    onChange={(e: any) => setTaskPriority(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-slate-705 text-xs"
                  >
                    <option value="Haute">🔴 Haute</option>
                    <option value="Moyenne">🟡 Moyenne</option>
                    <option value="Basse">🔵 Basse</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold text-[10px] uppercase">Date Limite de rendu</label>
                  <input
                    type="datetime-local"
                    value={taskDate}
                    onChange={(e) => setTaskDate(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsOpenCreator(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-bold shadow-sm cursor-pointer transition-colors"
                  >
                    Créer la tâche
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FILTER BUTTONS ROW */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4" id="taskcenter-filters">
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto shrink-0">
          {filterCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap grow text-center ${
                activeCategory === cat
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Global Task Search bar */}
        <div className="relative w-full sm:w-64 flex items-center">
          <span className="absolute left-3 text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            placeholder="Rechercher une tâche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-700"
          />
        </div>
      </div>

      {/* STATS OVERVIEW DISPLAY BOX */}
      <div className="mt-5 p-4 bg-slate-50/55 rounded-2xl border border-slate-150 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase">VOS PROGRÈS DU JOUR</span>
          <h4 className="font-extrabold text-slate-800 text-sm">
            {completedCount} tâche{completedCount > 1 && "s"} complétée{completedCount > 1 && "s"} sur {filteredTasks.length} !
          </h4>
        </div>

        {/* Linear progress completed animation */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold font-mono">
            <span>TAUX D'ACHÈVEMENT DE REVISIONS</span>
            <span>{percentComplete}%</span>
          </div>
          <div className="w-full h-2 bg-slate-150 rounded-full overflow-hidden">
            <div 
              className="bg-violet-600 h-full transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>
      </div>

      {/* TASKS FLOW LIST */}
      <div className="mt-5 space-y-2.5 max-h-112 overflow-y-auto pr-1" id="tasks-feed-list">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-slate-50/30 rounded-2xl border border-dashed border-slate-200">
            <CheckSquare className="w-10 h-10 mx-auto mb-2 text-slate-300 pointer-events-none" />
            <p className="text-xs">Aucune tâche disponible dans cette rubrique.</p>
            <p className="text-[10px] text-slate-400 mt-1">Créez-en une en cliquant sur "Nouvelle tâche" ci-dessus !</p>
          </div>
        ) : (
          filteredTasks.map((task: Task) => (
            <div
              key={task.id}
              className={`p-4 rounded-xl border transition-all duration-100 flex items-center justify-between gap-4 group ${
                task.completed 
                  ? "bg-slate-50/50 border-slate-150 opacity-60" 
                  : "bg-white border-slate-200/80 hover:border-violet-300 shadow-sm"
              }`}
              id={`task-item-card-${task.id}`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Standard Checkbox */}
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                    task.completed
                      ? "bg-violet-600 border-violet-600 text-white"
                      : "border-slate-300 hover:border-violet-600 bg-white"
                  }`}
                  title={task.completed ? "Rétablir la tâche" : "Marquer comme fait"}
                >
                  {task.completed && <CheckSquare className="w-3.5 h-3.5" />}
                </button>

                <div className="min-w-0">
                  <span className={`text-xs font-bold leading-snug break-words ${task.completed ? "line-through text-slate-450 text-slate-500" : "text-slate-800"}`}>
                    {task.title}
                  </span>
                  
                  {/* Category and date subtitle */}
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-[8px]">
                      {task.category}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {task.date}
                    </span>
                  </div>
                </div>
              </div>

              {/* Priority badge pill */}
              <div className="flex items-center gap-2.5 shrink-0">
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${getPriorityClasses(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
