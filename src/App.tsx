/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Plus, 
  Check, 
  CheckSquare, 
  ChevronRight, 
  FileText, 
  Archive
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
