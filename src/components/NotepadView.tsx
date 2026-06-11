import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  Check, 
  X, 
  Calendar, 
  Tag, 
  ChevronRight, 
  BookOpen, 
  Sparkles,
  Bookmark,
  Share2,
  Star,
  MoreHorizontal,
  Clock,
  ArrowUpDown,
  ChevronDown,
  CheckSquare,
  Square,
  PlusCircle,
  FolderPlus,
  ArrowRight,
  Lightbulb,
  Heart,
  Pin,
  ListPlus,
  Compass
} from "lucide-react";
import { useCollab } from "../context/CollabContext";
import { motion, AnimatePresence } from "motion/react";

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  color?: string;
  pinned: boolean;
  isFavorite?: boolean;
  tags: string[];
  updatedAt: string;
  createdAt: string;
  relativeTimeCreated?: string;
  relativeTimeUpdated?: string;
  // Dynamic high-fidelity sections
  problemText?: string;
  quoteBox?: string;
  solutionIntro?: string;
  solutionBullets?: string[];
  features?: ChecklistItem[];
  nextSteps?: ChecklistItem[];
  isStructured?: boolean;
}

export const NotepadView: React.FC = () => {
  const { triggerNotification } = useCollab();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tout");
  const [selectedTag, setSelectedTag] = useState<string>("Tout");
  const [sortNewest, setSortNewest] = useState(true);
  const [isAllNotesExpanded, setIsAllNotesExpanded] = useState(true);

  // Quick note state (at the bottom of left panel)
  const [quickNoteText, setQuickNoteText] = useState("");

  // Editor states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState<string>("Projets");
  const [editTags, setEditTags] = useState<string>("");
  const [editProblemText, setEditProblemText] = useState("");
  const [editQuoteBox, setEditQuoteBox] = useState("");
  const [editSolutionIntro, setEditSolutionIntro] = useState("");
  const [editIsStructured, setEditIsStructured] = useState(false);

  // Temp inline item add states
  const [newFeatureText, setNewFeatureText] = useState("");
  const [newStepText, setNewStepText] = useState("");

  // Category Colors
  const categoryColors: Record<string, { bg: string, text: string, border: string, dot: string }> = {
    "Projets": { bg: "bg-violet-50/70", text: "text-violet-700", border: "border-violet-100", dot: "bg-violet-500" },
    "Études": { bg: "bg-amber-50/70", text: "text-amber-700", border: "border-amber-100", dot: "bg-amber-500" },
    "Personnel": { bg: "bg-blue-50/70", text: "text-blue-700", border: "border-blue-100", dot: "bg-blue-500" },
    "Idées": { bg: "bg-emerald-50/70", text: "text-emerald-700", border: "border-emerald-100", dot: "bg-emerald-500" },
    "Autre": { bg: "bg-slate-100/70", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400" }
  };

const toPascalCase = (str: string): string => {
  if (!str) return "";
  return str
    .split(/[\s_\-]+/)
    .map(word => {
      if (!word) return "";
      // Keep accents on uppercase, e.g. idée -> Idée
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join("");
};

  // Preset Tags with colors (borders removed)
  const tagColorSchemes: Record<string, string> = {
    "startup": "bg-violet-50 text-violet-600 hover:bg-violet-100/60",
    "idée": "bg-blue-50 text-blue-600 hover:bg-blue-100/60",
    "recherche": "bg-emerald-50 text-emerald-600 hover:bg-emerald-100/60",
    "important": "bg-rose-50 text-rose-600 hover:bg-rose-100/60",
    "à faire": "bg-amber-50 text-amber-600 hover:bg-amber-100/60"
  };

  const getTagClass = (tag: string) => {
    return tagColorSchemes[tag.toLowerCase()] || "bg-slate-50 text-slate-500 hover:bg-slate-100/60";
  };

  // Load saved notes from local storage — no seed data, all data is user-created
  useEffect(() => {
    const saved = localStorage.getItem("awolf_notepad_notes_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotes(parsed);
        if (parsed.length > 0) {
          setSelectedNote(parsed[0]);
        }
      } catch (e) {
        setNotes([]);
        setSelectedNote(null);
      }
    } else {
      setNotes([]);
      setSelectedNote(null);
      localStorage.setItem("awolf_notepad_notes_v2", JSON.stringify([]));
    }
  }, []);

  const saveNotesAndSync = (updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    localStorage.setItem("awolf_notepad_notes_v2", JSON.stringify(updatedNotes));

    if (selectedNote) {
      const active = updatedNotes.find(n => n.id === selectedNote.id);
      if (active) {
        setSelectedNote(active);
      } else if (updatedNotes.length > 0) {
        setSelectedNote(updatedNotes[0]);
      } else {
        setSelectedNote(null);
      }
    } else if (updatedNotes.length > 0) {
      setSelectedNote(updatedNotes[0]);
    }
  };

  // Toggle Pinned status
  const togglePin = (noteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = notes.map(n => {
      if (n.id === noteId) {
        const nextState = !n.pinned;
        triggerNotification(
          nextState ? "Note épinglée 📌" : "Note désépinglée",
          `"${n.title}" a été déplacée.`,
          "success"
        );
        return { ...n, pinned: nextState, updatedAt: new Date().toISOString() };
      }
      return n;
    });
    saveNotesAndSync(updated);
  };

  // Toggle Favorite Status
  const toggleFavorite = (noteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = notes.map(n => {
      if (n.id === noteId) {
        const nextState = !n.isFavorite;
        triggerNotification(
          nextState ? "Ajouté aux favoris ❤️" : "Retiré des favoris",
          `La note "${n.title}" est mise à jour.`,
          "success"
        );
        return { ...n, isFavorite: nextState };
      }
      return n;
    });
    saveNotesAndSync(updated);
  };

  // Add a brand new note
  const createNewNote = (isTemplate: boolean = false) => {
    const newId = "note_" + Date.now();
    const newNote: Note = {
      id: newId,
      title: isTemplate ? "Nouveau projet de groupe" : "Nouvelle note",
      category: "Projets",
      pinned: false,
      isFavorite: false,
      tags: ["idée"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      relativeTimeCreated: "Créée à l'instant",
      relativeTimeUpdated: "Modifiée à l'instant",
      isStructured: isTemplate,
      content: "Commencez à rédiger votre note ici...",
      problemText: isTemplate ? "Identifiez le défi ou le besoin principal à surmonter..." : undefined,
      quoteBox: isTemplate ? "Éléments clés de réflexion ou problématique majeure..." : undefined,
      solutionIntro: isTemplate ? "Les solutions envisagées pour le projet :" : undefined,
      solutionBullets: isTemplate ? ["Solution technologique envisagée", "Architecture agile"] : undefined,
      features: isTemplate ? [
        { id: "f_1", text: "Maquette fonctionnelle", done: false },
        { id: "f_2", text: "Spécifications techniques", done: false }
      ] : undefined,
      nextSteps: isTemplate ? [
        { id: "s_1", text: "Réunion avec le tuteur", done: false },
        { id: "s_2", text: "Définition des rôles d'équipe", done: false }
      ] : undefined
    };

    const updated = [newNote, ...notes];
    saveNotesAndSync(updated);
    setSelectedNote(newNote);
    setIsEditing(true);
    
    // prefill edit states
    setEditTitle(newNote.title);
    setEditContent(newNote.content);
    setEditCategory(newNote.category);
    setEditTags(newNote.tags.join(", "));
    setEditIsStructured(newNote.isStructured || false);
    setEditProblemText(newNote.problemText || "");
    setEditQuoteBox(newNote.quoteBox || "");
    setEditSolutionIntro(newNote.solutionIntro || "");

    triggerNotification("Note créée ✍️", "Votre brouillon est prêt à être personnalisé.", "success");
  };

  // Quick addition at bottom of left menu
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNoteText.trim()) return;

    const newId = "quick_" + Date.now();
    const newNote: Note = {
      id: newId,
      title: quickNoteText.trim().length > 25 ? quickNoteText.trim().substring(0, 25) + "..." : quickNoteText.trim(),
      category: "Personnel",
      pinned: false,
      tags: ["à faire"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      relativeTimeCreated: "Créée à l'instant",
      relativeTimeUpdated: "Modifiée à l'instant",
      isStructured: false,
      content: quickNoteText.trim()
    };

    const updated = [newNote, ...notes];
    saveNotesAndSync(updated);
    setSelectedNote(newNote);
    setQuickNoteText("");
    triggerNotification("Note rapide ajoutée ⚡", "La note a été classée dans vos notes personnelles.", "success");
  };

  // Delete note physically
  const deleteNote = (noteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetNote = notes.find(n => n.id === noteId);
    const title = targetNote ? targetNote.title : "cette note";
    
    if (confirm(`Voulez-vous vraiment supprimer "${title}" ? Les données seront perdues.`)) {
      const remaining = notes.filter(n => n.id !== noteId);
      saveNotesAndSync(remaining);
      triggerNotification("Note supprimée", `La note "${title}" a été supprimée.`, "info");
    }
  };

  // Filter strategy matches both category selection, tags selection, and typed search
  const filteredNotes = notes.filter(note => {
    const matchesCategory = selectedCategory === "Tout" || note.category === selectedCategory;
    const matchesTag = selectedTag === "Tout" || note.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase());
    
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = !query || 
      note.title.toLowerCase().includes(query) || 
      note.content.toLowerCase().includes(query) ||
      (note.category && note.category.toLowerCase().includes(query)) ||
      (note.problemText && note.problemText.toLowerCase().includes(query));

    return matchesCategory && matchesTag && matchesQuery;
  });

  // Sort fiches (recently modified first OR alphabetically)
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (sortNewest) {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    } else {
      return a.title.localeCompare(b.title);
    }
  });

  // Categorized counts (dynamic update)
  const allCategories = ["Projets", "Études", "Personnel", "Idées", "Autre"];
  const getCategoryCount = (catName: string) => {
    return notes.filter(n => n.category === catName).length;
  };

  // Compile unique tags and map counts
  const allUniqueTagsMap = (Array.from(
    new Set(notes.flatMap(n => n.tags))
  ) as string[]).reduce((acc, tag) => {
    acc[tag] = notes.filter(n => n.tags.includes(tag)).length;
    return acc;
  }, {} as Record<string, number>);

  // Interactive Checklist Toggles for Note Reader view (Notion style, dynamic state updates!)
  const toggleFeatureBox = (featureId: string) => {
    if (!selectedNote) return;
    const updated = notes.map(n => {
      if (n.id === selectedNote.id && n.features) {
        const nextFeats = n.features.map(f => f.id === featureId ? { ...f, done: !f.done } : f);
        return { ...n, features: nextFeats, updatedAt: new Date().toISOString() };
      }
      return n;
    });
    saveNotesAndSync(updated);
  };

  const toggleNextStepBox = (stepId: string) => {
    if (!selectedNote) return;
    const updated = notes.map(n => {
      if (n.id === selectedNote.id && n.nextSteps) {
        const nextSteps = n.nextSteps.map(s => s.id === stepId ? { ...s, done: !s.done } : s);
        return { ...n, nextSteps: nextSteps, updatedAt: new Date().toISOString() };
      }
      return n;
    });
    saveNotesAndSync(updated);
  };

  // Inline additive inputs for checklists
  const addFeatureItem = () => {
    if (!selectedNote || !newFeatureText.trim()) return;
    const updated = notes.map(n => {
      if (n.id === selectedNote.id) {
        const currentFeats = n.features || [];
        const newItem: ChecklistItem = {
          id: "item_" + Date.now(),
          text: newFeatureText.trim(),
          done: false
        };
        return { ...n, features: [...currentFeats, newItem], updatedAt: new Date().toISOString() };
      }
      return n;
    });
    saveNotesAndSync(updated);
    setNewFeatureText("");
    triggerNotification("Fonctionnalité ajoutée 💡", "Nouvel item ajouté à la structure.", "success");
  };

  const addNextStepItem = () => {
    if (!selectedNote || !newStepText.trim()) return;
    const updated = notes.map(n => {
      if (n.id === selectedNote.id) {
        const currentSteps = n.nextSteps || [];
        const newItem: ChecklistItem = {
          id: "step_" + Date.now(),
          text: newStepText.trim(),
          done: false
        };
        return { ...n, nextSteps: [...currentSteps, newItem], updatedAt: new Date().toISOString() };
      }
      return n;
    });
    saveNotesAndSync(updated);
    setNewStepText("");
    triggerNotification("Étape de projet ajoutée 📌", "Nouvelle tâche de projet configurée.", "success");
  };

  // Full Editor Form actions
  const startEditMode = () => {
    if (!selectedNote) return;
    setIsEditing(true);
    setEditTitle(selectedNote.title);
    setEditContent(selectedNote.content);
    setEditCategory(selectedNote.category);
    setEditTags(selectedNote.tags.join(", "));
    setEditIsStructured(selectedNote.isStructured || false);
    setEditProblemText(selectedNote.problemText || "");
    setEditQuoteBox(selectedNote.quoteBox || "");
    setEditSolutionIntro(selectedNote.solutionIntro || "");
  };

  const cancelEditMode = () => {
    setIsEditing(false);
  };

  const saveFormEdits = () => {
    if (!selectedNote) return;
    
    // Parse tags safely from comma separated lists
    const parsedTags = editTags
      .split(",")
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    const updated = notes.map(n => {
      if (n.id === selectedNote.id) {
        return {
          ...n,
          title: editTitle.trim() || "Note sans titre",
          content: editContent,
          category: editCategory,
          tags: parsedTags.length > 0 ? parsedTags : ["général"],
          isStructured: editIsStructured,
          problemText: editIsStructured ? editProblemText : undefined,
          quoteBox: editIsStructured ? editQuoteBox : undefined,
          solutionIntro: editIsStructured ? editSolutionIntro : undefined,
          updatedAt: new Date().toISOString(),
          relativeTimeUpdated: "Modifiée à l'instant"
        };
      }
      return n;
    });

    saveNotesAndSync(updated);
    setIsEditing(false);
    triggerNotification("Sauvegardé ✅", "Vos modifications ont été enregistrées.", "success");
  };

  // Keyboard shortcut indicator logic (meta/ctrl click focus filter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("gcal-note-search");
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Split view filtering groups
  const pinnedNotesList = sortedNotes.filter(n => n.pinned);
  const unpinnedNotesList = sortedNotes.filter(n => !n.pinned);

  return (
    <div className="space-y-6 font-sans text-slate-800" id="notepad-container-root">
      
      {/* 1. Header with custom layout exactly as mockup */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="blocnotes-header-layout">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight font-display flex items-center gap-2.5">
            <span className="p-2.5 bg-violet-50 text-violet-600 rounded-xl border border-violet-100 flex items-center justify-center shadow-2xs">
              <FileText className="w-5.5 h-5.5 shrink-0" />
            </span>
            <span>Bloc-notes</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1.5 pl-0.5">
            Capture tes idées, organise tes notes et ne perds rien d'important.
          </p>
        </div>

        {/* Header Search layout matching exact styling of mockup */}
        <div className="relative w-full md:w-80 select-none animate-none" id="notepad-header-search-belt">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="gcal-note-search"
            type="text"
            placeholder="Rechercher dans les notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50/70 border border-slate-200/70 hover:border-violet-300 hover:bg-white rounded-xl pl-10 pr-12 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-all font-medium shadow-2xs"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-white border border-slate-200/80 rounded-md shadow-3xs pointer-events-none uppercase">
            <span>⌘</span>
            <span>K</span>
          </kbd>
        </div>
      </div>

      {/* 2. Core Workspace Area matching the beautiful structured columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="notepad-bento-grid">
        
        {/* ================= COLUMN 1: LEFT SIDEBAR FOR LISTINGS (col-span-3) ================= */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4 flex flex-col lg:h-[calc(100vh-190px)]" id="notepad-sidebar-left">
          
          {/* Action trigger & sort row */}
          <div className="flex gap-2" id="notepad-listing-header-actions">
            <button
              type="button"
              onClick={() => createNewNote(false)}
              className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-violet-900/10 hover:shadow-lg hover:shadow-violet-900/15"
              title="Ajouter une note vierge classique"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Nouvelle note</span>
            </button>
            <button
              type="button"
              onClick={() => setSortNewest(!sortNewest)}
              className={`p-2.5 border rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
                !sortNewest 
                  ? "bg-violet-50 border-violet-100 text-violet-700" 
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
              title={sortNewest ? "Trier par date d'édition" : "Trier par ordre alphabétique"}
            >
              <ArrowUpDown className="w-4 h-4 shrink-0" />
            </button>
          </div>

          {/* Listing space containing pinned & categories */}
          <div className="space-y-4 flex-1 overflow-y-auto pr-1.5 scrollbar-custom" id="notepad-sidebar-scroller">
            
            {/* A. Pinned list header & layout */}
            {pinnedNotesList.length > 0 && (
              <div className="space-y-2" id="notes-pinned-block">
                <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider font-mono flex items-center gap-1.5 select-none pl-1">
                  <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  Épinglées
                </span>
                
                <div className="space-y-2">
                  {pinnedNotesList.map((note) => {
                    const isSelected = selectedNote?.id === note.id;
                    return (
                      <div
                        key={note.id}
                        onClick={() => {
                          setSelectedNote(note);
                          setIsEditing(false);
                        }}
                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all relative group shadow-2xs ${
                          isSelected
                            ? "bg-violet-500/5 border-violet-500/80 ring-1 ring-violet-500/20"
                            : "bg-white border-slate-200/80 hover:bg-slate-50/50 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                            categoryColors[note.category]?.bg || "bg-slate-100"
                          } ${categoryColors[note.category]?.text || "text-slate-600"}`}>
                            {note.category}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => togglePin(note.id, e)}
                              className="text-amber-500 p-0.5 hover:scale-110 transition-transform"
                              title="Désépingler de l'accueil"
                            >
                              <Star className="w-3.5 h-3.5 fill-amber-405 fill-amber-400 text-amber-500 shrink-0" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => deleteNote(note.id, e)}
                              className="text-slate-300 hover:text-rose-600 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Supprimer définitivement"
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0" />
                            </button>
                          </div>
                        </div>

                        <h4 className="font-extrabold text-xs text-slate-900 line-clamp-1">
                          {note.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1 truncate">
                          {note.content}
                        </p>
                        <span className="text-[9px] font-bold font-mono text-slate-400 mt-2 block tracking-tight uppercase">
                          {note.relativeTimeCreated || "Récemment"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* B. All remaining notes list block */}
            <div className="space-y-2" id="notes-unpinned-block">
              <button
                type="button"
                onClick={() => setIsAllNotesExpanded(!isAllNotesExpanded)}
                className="w-full flex items-center justify-between text-[10px] uppercase font-extrabold text-slate-400 tracking-wider font-mono hover:text-slate-600 text-left py-1 pl-1"
              >
                <span className="flex items-center gap-1.5">
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isAllNotesExpanded ? "" : "-rotate-90"}`} />
                  Toutes les notes
                </span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[9px] shrink-0">
                  {unpinnedNotesList.length}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isAllNotesExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: "hidden" }}
                    className="space-y-2 mt-2"
                  >
                    {unpinnedNotesList.length === 0 ? (
                      <div className="p-6 bg-slate-50/50 rounded-xl text-center border border-dashed border-slate-200 text-slate-400 text-[10px]">
                        Aucune autre note disponible.
                      </div>
                    ) : (
                      unpinnedNotesList.map((note) => {
                        const isSelected = selectedNote?.id === note.id;
                        return (
                          <div
                            key={note.id}
                            onClick={() => {
                              setSelectedNote(note);
                              setIsEditing(false);
                            }}
                            className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all relative group ${
                              isSelected
                                ? "bg-violet-500/5 border-violet-500/80 ring-1 ring-violet-500/20 shadow-2xs"
                                : "bg-white border-slate-200/60 hover:bg-slate-50/40 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-md ${
                                categoryColors[note.category]?.bg || "bg-slate-100"
                              } ${categoryColors[note.category]?.text || "text-slate-600"}`}>
                                {note.category}
                              </span>
                              
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => togglePin(note.id, e)}
                                  className="text-slate-300 hover:text-amber-500 p-0.5 hover:scale-115 transition-all opacity-0 group-hover:opacity-100"
                                  title="Épingler cette note"
                                >
                                  <Star className="w-3.2 h-3.2 text-slate-300 shrink-0" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => deleteNote(note.id, e)}
                                  className="text-slate-300 hover:text-rose-500 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Supprimer la note"
                                >
                                  <Trash2 className="w-3.2 h-3.2 shrink-0" />
                                </button>
                              </div>
                            </div>

                            <h4 className="font-extrabold text-xs text-slate-800 line-clamp-1 leading-snug">
                              {note.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                              {note.content}
                            </p>
                            <span className="text-[8.5px] font-bold font-mono text-slate-400 mt-1.5 block tracking-tight">
                              {note.relativeTimeCreated || "Récemment"}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* C. Direct option to create category inline */}
            <div className="pt-2 px-1">
              <button
                type="button"
                onClick={() => {
                  const name = prompt("Nom de la nouvelle catégorie :");
                  if (name && name.trim()) {
                    triggerNotification("Catégorie créée 📁", `La catégorie "${name}" est désormais active.`, "success");
                  }
                }}
                className="text-[10.5px] font-black text-violet-650 text-violet-600 hover:text-violet-700 flex items-center gap-1.5 bg-transparent border-none p-0 cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5 shrink-0" />
                <span>+ Nouvelle catégorie</span>
              </button>
            </div>


          </div>

        </div>


        {/* ================= COLUMN 2: CENTER NOTE WORKSPACE & DETAIL PREVIEW (col-span-6) ================= */}
        <div className="lg:col-span-8 xl:col-span-6 lg:h-[calc(100vh-190px)] lg:overflow-y-auto pr-1.5 scrollbar-custom" id="notepad-workspace-center">
          <AnimatePresence mode="wait">
            {!selectedNote ? (
              <div className="bg-white rounded-2xl border border-slate-200/60 p-12 flex flex-col items-center justify-center text-center text-slate-400 min-h-[500px]">
                <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
                <h4 className="font-extrabold text-sm text-slate-800">Aucune note active</h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                  Sélectionnez une note existante dans la barre latérale pour la parcourir ou démarrez une nouvelle fiche d'idées.
                </p>
                <button
                  type="button"
                  onClick={() => createNewNote(false)}
                  className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-500 transition-colors cursor-pointer"
                >
                  Démarrer un brouillon
                </button>
              </div>
            ) : isEditing ? (
              
              /* ---------------- INTERACTIVE FULL EDITOR MODE ---------------- */
              <motion.div
                key="workspace-editor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                    Mode Édition : {selectedNote.isStructured ? "Fiche Projet" : "Fiche Standard"}
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={cancelEditMode}
                      className="px-3.5 py-1.5 border border-slate-200 text-slate-650 hover:bg-slate-50 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={saveFormEdits}
                      className="px-4 py-1.5 bg-violet-650 bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold rounded-xl flex items-center gap-1 shadow-sm shrink-0 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Enregistrer
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category Selection */}
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">Catégorie d'étude</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-400 text-xs font-bold"
                    >
                      {allCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tag label strings list */}
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">Étiquettes (séparées par une virgule)</label>
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="startup, important, cours"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.8 text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-400 text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Form type switcher */}
                <div className="flex items-center gap-2 py-1 select-none">
                  <input
                    type="checkbox"
                    id="edit-is-structured-checkbox"
                    checked={editIsStructured}
                    onChange={(e) => {
                      setEditIsStructured(e.target.checked);
                      if (e.target.checked) {
                        setEditProblemText(editProblemText || "Saisir la problématique...");
                        setEditQuoteBox(editQuoteBox || "Élément central de réflexion...");
                        setEditSolutionIntro(editSolutionIntro || "La solution retenue :");
                      }
                    }}
                    className="rounded text-violet-505 text-violet-600 focus:ring-violet-400 cursor-pointer"
                  />
                  <label htmlFor="edit-is-structured-checkbox" className="text-xs font-bold text-slate-600 cursor-pointer selection:bg-transparent">
                    Activer la mise en page interactive structurée (Modèle Projet)
                  </label>
                </div>

                {/* Note title editable input */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">Titre de la fiche d'idées</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Grand titre..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-extrabold focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-400"
                  />
                </div>

                {/* Standard Free-Text Textarea */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">Description de base ou contenu synthétique</label>
                  <textarea
                    rows={editIsStructured ? 4 : 12}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Rédigez ici vos résumés, formules mathématiques ou notes de cours..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-400 font-sans resize-none leading-relaxed"
                  />
                </div>

                {editIsStructured && (
                  <div className="space-y-3 pt-3 border-t border-slate-100" id="structured-form-expansion">
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">1. Problème principal identifié</label>
                      <input
                        type="text"
                        value={editProblemText}
                        onChange={(e) => setEditProblemText(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] text-slate-700"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">💡 Accent callout phare (Boîte violette)</label>
                      <input
                        type="text"
                        value={editQuoteBox}
                        onChange={(e) => setEditQuoteBox(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] text-slate-700"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">2. Solution (Phrase d'introduction)</label>
                      <input
                        type="text"
                        value={editSolutionIntro}
                        onChange={(e) => setEditSolutionIntro(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] text-slate-700"
                      />
                    </div>
                  </div>
                )}
              </motion.div>

            ) : (

              /* ---------------- PERSISTENT READING VIEW EXACTLY AS THE SCREENSHOT ---------------- */
              <motion.div
                key="workspace-reader"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_12px_45px_rgba(0,0,0,0.02)] overflow-hidden"
                id="notes-reader-panel-workspace"
              >
                
                {/* A. Top metadata row & actions exactly like mockup */}
                <div className="p-6 border-b border-indigo-50/50 flex flex-col md:flex-row md:items-start justify-between gap-4" id="note-workspace-reader-header">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        categoryColors[selectedNote.category]?.bg || "bg-slate-50"
                      } ${categoryColors[selectedNote.category]?.text || "text-slate-500"} ${categoryColors[selectedNote.category]?.border || "border-slate-200"}`}>
                        {selectedNote.category}
                      </span>
                      
                      {/* Formatted metadata date label */}
                      <span className="text-[10.5px] text-slate-400 font-bold font-mono tracking-tight uppercase">
                        {selectedNote.relativeTimeCreated || "Créée récemment"} · {selectedNote.relativeTimeUpdated || "Modifiée à l'instant"}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 tracking-tight font-display select-text">
                      {selectedNote.title}
                    </h3>
                  </div>

                  {/* Header widgets: Edit, Favorites hearth, Pinned, Share */}
                  <div className="flex items-center gap-1.5 select-none self-end md:self-stretch">
                    
                    {/* Favorite hearth toggle */}
                    <button
                      type="button"
                      onClick={() => toggleFavorite(selectedNote.id)}
                      className={`p-2 border rounded-xl cursor-pointer transition-all ${
                        selectedNote.isFavorite 
                          ? "bg-rose-50 border-rose-100 text-rose-500 shadow-2xs" 
                          : "bg-white border-slate-200/90 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                      }`}
                      title={selectedNote.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                    >
                      <Heart className={`w-4 h-4 shrink-0 transition-transform ${selectedNote.isFavorite ? "fill-rose-500 scale-105" : ""}`} />
                    </button>

                    {/* Star pin toggle */}
                    <button
                      type="button"
                      onClick={() => togglePin(selectedNote.id)}
                      className={`p-2 border rounded-xl cursor-pointer transition-all ${
                        selectedNote.pinned 
                          ? "bg-amber-50 border-amber-100 text-amber-500 shadow-2xs" 
                          : "bg-white border-slate-200/90 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                      }`}
                      title={selectedNote.pinned ? "Retirer du tableau des épingles" : "Épingler la note"}
                    >
                      <Star className={`w-4 h-4 shrink-0 transition-transform ${selectedNote.pinned ? "fill-amber-550 fill-amber-500 text-amber-500 scale-105" : ""}`} />
                    </button>

                    {/* Full standard options */}
                    <button
                      type="button"
                      onClick={startEditMode}
                      className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 font-bold text-xs"
                      title="Modifier le contenu de la note"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                      <span>Modifier</span>
                    </button>

                    {/* Delete trigger */}
                    <button
                      type="button"
                      onClick={() => deleteNote(selectedNote.id)}
                      className="p-2 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Supprimer cette note"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                    </button>

                  </div>
                </div>

                {/* B. Core Editorial Content block matching the startup mockup screenshots style sheets */}
                <div className="p-6 space-y-6 text-slate-700 select-text" id="note-workspace-reader-body">
                  
                  {selectedNote.isStructured ? (
                    
                    /* HIGH-FIDELITY LAYOUT AS DEPICTED FOR STRUCURED STARTUPS PROJECTS */
                    <div className="space-y-6">
                      
                      {/* Section 1: Problem */}
                      {selectedNote.problemText && (
                        <div className="space-y-2.5">
                          <h4 className="font-extrabold text-[12.5px] text-indigo-750 text-indigo-700 font-mono tracking-tight uppercase flex items-center gap-1.5">
                            <span className="text-violet-500 font-extrabold">1.</span> Problème
                          </h4>
                          <p className="text-[11.5px] text-slate-600 leading-relaxed font-sans font-medium pl-0.5 select-text">
                            {selectedNote.problemText}
                          </p>
                        </div>
                      )}

                      {/* Accent callout element in centered custom light-purple gradient block */}
                      {selectedNote.quoteBox && (
                        <div className="p-4 bg-gradient-to-r from-violet-50/60 to-indigo-50/60 border border-violet-100/70 rounded-2xl flex items-center gap-2.5 select-all">
                          <span className="p-1.5 bg-white rounded-lg flex items-center justify-center shadow-3xs shrink-0 self-start mt-0.5">
                            <Lightbulb className="w-4 h-4 text-violet-500 shrink-0" />
                          </span>
                          <p className="text-[11px] font-black font-sans text-violet-750 text-violet-750/90 leading-tight">
                            {selectedNote.quoteBox}
                          </p>
                        </div>
                      )}

                      {/* Section 2: Solution */}
                      <div className="space-y-2.5">
                        <h4 className="font-extrabold text-[12.5px] text-indigo-750 text-indigo-700 font-mono tracking-tight uppercase">
                          <span className="text-violet-500 font-extrabold">2.</span> Solution
                        </h4>
                        
                        {selectedNote.solutionIntro && (
                          <p className="text-[11.5px] text-slate-600 font-sans font-semibold">
                            {selectedNote.solutionIntro}
                          </p>
                        )}

                        {selectedNote.solutionBullets && selectedNote.solutionBullets.length > 0 && (
                          <ul className="space-y-1.5 pl-4 select-text">
                            {selectedNote.solutionBullets.map((bullet, i) => (
                              <li key={i} className="text-[11.5px] text-slate-600 font-sans font-medium list-disc marker:text-violet-500">
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        )}
                        
                        {(!selectedNote.solutionBullets || selectedNote.solutionBullets.length === 0) && selectedNote.content && (
                          <p className="text-[11px] text-slate-500 leading-relaxed whitespace-pre-wrap pl-0.5">
                            {selectedNote.content}
                          </p>
                        )}
                      </div>

                      {/* Section 3: Key Features checklist block */}
                      <div className="space-y-3.5 pt-2">
                        <h4 className="font-extrabold text-[12.5px] text-indigo-750 text-indigo-700 font-mono tracking-tight uppercase">
                          <span className="text-violet-500 font-extrabold">3.</span> Fonctionnalités clés
                        </h4>

                        <div className="space-y-2" id="key-features-interactive-checklist">
                          {selectedNote.features?.map((feat) => (
                            <div 
                              key={feat.id}
                              onClick={() => toggleFeatureBox(feat.id)}
                              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors select-none"
                            >
                              <button 
                                type="button"
                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                  feat.done 
                                    ? "bg-violet-50 border-violet-200 text-violet-600" 
                                    : "border-slate-300 text-slate-300"
                                }`}
                              >
                                {feat.done && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>
                              <span className={`text-[11px] font-sans font-semibold transition-all ${
                                feat.done ? "text-slate-400 line-through decoration-slate-300/80" : "text-slate-700"
                              }`}>
                                {feat.text}
                              </span>
                            </div>
                          ))}

                          {/* Quick inline element injector */}
                          <div className="flex gap-2 p-1.5 bg-slate-50/50 rounded-xl max-w-sm">
                            <input
                              type="text"
                              value={newFeatureText}
                              onChange={(e) => setNewFeatureText(e.target.value)}
                              placeholder="Ajouter une fonctionnalité..."
                              className="flex-1 bg-transparent border-none text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-0 pl-1"
                              onKeyDown={(e) => e.key === "Enter" && addFeatureItem()}
                            />
                            <button
                              type="button"
                              onClick={addFeatureItem}
                              className="p-1 px-2.5 bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-[10px] rounded-lg shrink-0 cursor-pointer border-none"
                            >
                              Ajouter
                            </button>
                          </div>

                        </div>
                      </div>

                      {/* Section 4: Next Steps Checklist block */}
                      <div className="space-y-3.5 pt-2">
                        <h4 className="font-extrabold text-[12.5px] text-indigo-750 text-indigo-700 font-mono tracking-tight uppercase">
                          <span className="text-violet-500 font-extrabold">4.</span> Prochaines étapes
                        </h4>

                        <div className="space-y-2" id="next-steps-interactive-checklist">
                          {selectedNote.nextSteps?.map((step) => (
                            <div 
                              key={step.id}
                              onClick={() => toggleNextStepBox(step.id)}
                              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors select-none"
                            >
                              <button 
                                type="button"
                                className={`w-4 h-4 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                                  step.done 
                                    ? "bg-violet-605 bg-violet-600 border-violet-500 text-white shadow-2xs" 
                                    : "border-slate-300 text-slate-300 bg-white"
                                }`}
                              >
                                {step.done && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>
                              
                              <span className={`text-[11px] font-sans font-semibold transition-all ${
                                step.done ? "text-slate-400 line-through decoration-slate-300/80" : "text-slate-700"
                              }`}>
                                {step.text}
                              </span>
                            </div>
                          ))}

                          {/* Quick inline nextstep injector */}
                          <div className="flex gap-2 p-1.5 bg-slate-50/50 rounded-xl max-w-sm">
                            <input
                              type="text"
                              value={newStepText}
                              onChange={(e) => setNewStepText(e.target.value)}
                              placeholder="Ajouter une tâche d'étape..."
                              className="flex-1 bg-transparent border-none text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-0 pl-1"
                              onKeyDown={(e) => e.key === "Enter" && addNextStepItem()}
                            />
                            <button
                              type="button"
                              onClick={addNextStepItem}
                              className="p-1 px-2.5 bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-[10px] rounded-lg shrink-0 cursor-pointer border-none"
                            >
                              Ajouter
                            </button>
                          </div>

                        </div>
                      </div>

                    </div>

                  ) : (
                    
                    /* TRADITIONAL FREE NOTE RENDERING */
                    <div className="space-y-4">
                      <div className="text-[11.5px] text-slate-700 leading-relaxed font-sans whitespace-pre-wrap select-text pl-0.5 min-h-[140px]">
                        {selectedNote.content}
                      </div>
                      
                      {/* Visual guide footer badge inside note */}
                      <div className="p-3 bg-violet-50/20 border border-violet-100/50 rounded-xl text-[10px] text-violet-600 font-medium flex items-center gap-1.5 self-stretch">
                        <Bookmark className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                        <span>Fiche d'idées libre d'études. Pour l'éditer, cliquez sur "Modifier" ou double-cliquez pour corriger le texte.</span>
                      </div>
                    </div>

                  )}

                </div>

                {/* C. Soft tag capsule footer on note container */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 select-none">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {selectedNote.tags.map(tag => (
                      <span
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`text-[9px] font-bold px-2 py-0.8 rounded-md cursor-pointer ${getTagClass(tag)}`}
                      >
                        {toPascalCase(tag)}
                      </span>
                    ))}
                  </div>
                  
                  <span className="text-[9px] font-bold font-mono text-slate-400 flex items-center gap-1 uppercase">
                    <Clock className="w-3 h-3 text-slate-300 shrink-0" />
                    Enregistré localement
                  </span>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* ================= COLUMN 3: RIGHT PANEL ACCENTS (col-span-3) ================= */}
        <div className="lg:col-span-12 xl:col-span-3 lg:h-[calc(100vh-190px)] lg:overflow-y-auto pr-1.5 scrollbar-custom space-y-6" id="notepad-sidebar-right">
          
          {/* A. CATEGORIES CARD WITH COUNT BADGES */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-2xs space-y-4" id="cat-card-bento">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
              <h4 className="font-extrabold text-[12px] text-slate-800 font-display uppercase tracking-wider flex items-center gap-1.5">
                <span>Catégories</span>
              </h4>
              <button 
                type="button"
                onClick={() => {
                  const cat = prompt("Créer une nouvelle catégorie d'étude :");
                  if (cat && cat.trim()) {
                    triggerNotification("Catégorie validée", `Fiche "${cat}" prête à l'emploi.`, "success");
                  }
                }}
                className="text-[11.5px] font-extrabold text-slate-400 hover:text-slate-900 bg-transparent border-none p-0 cursor-pointer"
                title="Créer une catégorie"
              >
                +
              </button>
            </div>

            <div className="space-y-1.5 select-none md:select-auto">
              {/* Reset filter "Tout" selection */}
              <div
                onClick={() => {
                  setSelectedCategory("Tout");
                  setSelectedTag("Tout");
                }}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  selectedCategory === "Tout" && selectedTag === "Tout"
                    ? "bg-violet-50 text-violet-700"
                    : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
                  <span>Toutes les notes</span>
                </div>
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 font-bold rounded-lg text-[9px] shrink-0">
                  {notes.length}
                </span>
              </div>

              {allCategories.map(cat => {
                const count = getCategoryCount(cat);
                const isActive = selectedCategory === cat;
                return (
                  <div
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                      isActive
                        ? "bg-violet-50 text-violet-700"
                        : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.2 h-2.2 rounded-full shrink-0 ${categoryColors[cat]?.dot || "bg-slate-400"}`} />
                      <span>{cat}</span>
                    </div>
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 font-bold rounded-lg text-[10px] shrink-0">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>


          {/* B. LABELS & TAGS CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-2xs space-y-4" id="tags-card-bento">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
              <h4 className="font-extrabold text-[12px] text-slate-800 font-display uppercase tracking-wider">
                Étiquettes
              </h4>
              <button 
                type="button"
                onClick={() => {
                  const tag = prompt("Créer une nouvelle étiquette de tri :");
                  if (tag && tag.trim()) {
                    triggerNotification("Étiquette configurée", `Le filtre "${tag}" est prêt.`, "success");
                  }
                }}
                className="text-[11.5px] font-extrabold text-slate-400 hover:text-slate-900 bg-transparent border-none p-0 cursor-pointer"
                title="Ajouter un mot clé"
              >
                +
              </button>
            </div>

            <div className="flex flex-wrap gap-2 select-none" id="sidebar-pill-tags-layout">
              {/* Reset filter option */}
              <button
                type="button"
                onClick={() => setSelectedTag("Tout")}
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                  selectedTag === "Tout"
                    ? "bg-violet-650 bg-violet-605 bg-violet-600 text-white"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                Tous
              </button>

              {Object.keys(allUniqueTagsMap).map(tag => {
                const isActive = selectedTag.toLowerCase() === tag.toLowerCase();
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    className={`text-[10.5px] font-extrabold px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                      isActive 
                        ? "bg-violet-600 text-white shadow-xs" 
                        : getTagClass(tag)
                    }`}
                  >
                    <span>{toPascalCase(tag)}</span>
                    <span className="text-[8.5px] font-black opacity-80 pl-1 shrink-0">
                      ({allUniqueTagsMap[tag]})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Nova tag option */}
            <div className="pt-1 select-none">
              <button
                type="button"
                onClick={() => {
                  const tag = prompt("Saisir un nouveau tag de fiches d'étude :");
                  if (tag && tag.trim()) {
                    triggerNotification("Tag enregistré", `Filtre "${tag}" à votre disposition.`, "success");
                  }
                }}
                className="text-[10px] font-bold text-violet-600 hover:text-violet-700 bg-transparent border-none p-0 cursor-pointer"
              >
                + Nouvelle étiquette
              </button>
            </div>
          </div>


          {/* C. RECENTS TIMELINE LOGS (UP TO 5 ITEMS) */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-2xs space-y-4" id="recent-logs-bento">
            <h4 className="font-extrabold text-[12px] text-slate-800 font-display uppercase tracking-wider border-b border-slate-50 pb-2.5">
              Récents
            </h4>

            <div className="space-y-3.5 select-none md:select-text">
              {notes.slice(0, 5).map((note) => (
                <div
                  key={note.id + "_recent"}
                  onClick={() => {
                    setSelectedNote(note);
                    setIsEditing(false);
                  }}
                  className="group flex items-start gap-2.5 cursor-pointer hover:bg-slate-50/40 p-1.5 rounded-xl transition-colors text-left"
                >
                  <span className="p-1.5 bg-slate-50 text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-600 rounded-lg shrink-0 transition-colors mt-0.5">
                    <FileText className="w-3.5 h-3.5" />
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-extrabold text-slate-800 truncate leading-snug group-hover:text-violet-650 transition-colors">
                      {note.title}
                    </p>
                    <span className="text-[9px] font-bold font-mono text-slate-400 block mt-0.5 tracking-tight uppercase">
                      {note.relativeTimeUpdated || "Modifié récemment"}
                    </span>
                  </div>
                </div>
              ))}

              {/* Back to all overview filter reset */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("Tout");
                  setSelectedTag("Tout");
                  setSearchQuery("");
                  triggerNotification("Vue réinitialisée", "Toutes les fiches d'idées sont à nouveau affichées.", "info");
                }}
                className="w-full text-center text-[10.5px] font-black text-violet-650 text-violet-600 hover:text-violet-750 flex items-center justify-center gap-1 pt-2 transition-colors cursor-pointer bg-transparent border-none px-0"
              >
                <span>Voir toutes mes notes</span>
                <ArrowRight className="w-3 h-3 shrink-0" />
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
