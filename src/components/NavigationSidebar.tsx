import React from "react";
import { 
  Home, 
  Calendar, 
  FolderOpen, 
  Users, 
  Clock, 
  Bell, 
  Timer, 
  BarChart3, 
  CheckSquare,
  FileText,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";
import { motion } from "motion/react";
import brandLogo from "../assets/logo.png";

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const NavigationSidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  setTab,
  isCollapsed,
  setIsCollapsed
}) => {
  const menuItems: { id: string; label: string; icon: any; badge?: number }[] = [
    { id: "accueil", label: "Accueil", icon: Home },
    { id: "schedule", label: "Emploi du temps", icon: Calendar },
    { id: "resources", label: "Bloc-notes", icon: FileText },
    { id: "projects", label: "Tâches & rappels", icon: CheckSquare },
    { id: "calendars", label: "Calendriers", icon: Clock },
    { id: "focus", label: "Focus", icon: Timer },
  ];

  const toolsItems = [
    { id: "focus", label: "Pomodoro", icon: Timer },
    { id: "focus", label: "Chronomètre", icon: Clock },
    { id: "projects", label: "Rappels de Tâches", icon: CheckSquare },
  ];

  return (
    <div 
      className={`h-full bg-white text-slate-700 flex flex-col justify-between border-r border-slate-200/80 shrink-0 font-sans select-none overflow-hidden transition-all duration-300 z-40
        ${isCollapsed 
          ? "w-0 md:w-20 -translate-x-full md:translate-x-0" 
          : "w-68 fixed left-0 top-0 lg:relative translate-x-0 shadow-2xl lg:shadow-none"
        }
      `}
      id="sidebar-container"
    >
      <div>
        {/* Brand Header */}
        {isCollapsed ? (
          <div className="p-4 flex flex-col items-center gap-3" id="sidebar-brand-collapsed">
            <div className="w-14 h-14 bg-white flex items-center justify-center shrink-0">
              <img src={brandLogo} alt="A-Wolf Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            {/* Expand button for desktop view */}
            <button 
              onClick={() => setIsCollapsed(false)} 
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Agrandir le menu"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="p-6 pb-2 flex flex-col items-center justify-center relative min-h-[140px]" id="sidebar-brand">
            {/* Logo centered */}
            <div className="w-full h-28 bg-white flex items-center justify-center shrink-0 overflow-hidden">
              <img src={brandLogo} alt="A-Wolf Logo" className="h-full w-auto object-contain" referrerPolicy="no-referrer" />
            </div>
            {/* Collapse action buttons absolutely positioned at top right */}
            <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
              <button 
                onClick={() => setIsCollapsed(true)} 
                className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors cursor-pointer bg-white/70 backdrop-blur-xs"
                title="Réduire le menu"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {/* Close button for mobile screens */}
              <button 
                onClick={() => setIsCollapsed(true)} 
                className="flex lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors cursor-pointer bg-white/70 backdrop-blur-xs"
                title="Masquer le menu"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <div className="px-3 py-4 space-y-1.5" id="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id);
                  // Close sidebar automatically on mobile/tablet after clicking menu
                  if (window.innerWidth < 1024) {
                    setIsCollapsed(true);
                  }
                }}
                className={`w-full flex items-center rounded-xl transition-all duration-150 relative text-sm group ${
                  isCollapsed 
                    ? "justify-center px-0 py-3 w-12 mx-auto" 
                    : "justify-between px-3 py-2.5"
                } ${
                  isActive 
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-sm" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/80"
                }`}
                title={item.label}
                id={`sidebar-tab-${item.id}`}
              >
                <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`} />
                  {!isCollapsed && <span className={isActive ? "text-white font-bold" : ""}>{item.label}</span>}
                </div>
                {!isCollapsed && item.badge && (
                  <span className={`font-semibold font-mono text-xs px-2 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700"}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Extra Tools List */}
        <div className="px-3 space-y-1.5 border-t border-slate-100 pt-4" id="sidebar-tools">
          <p className={`text-[10px] font-bold tracking-wider text-slate-400 px-3 py-1 ${isCollapsed ? "text-center text-[8px] font-black truncate" : ""}`}>
            {isCollapsed ? "OUTILS" : "OUTILS ÉTUDIANTS"}
          </p>
          {toolsItems.map((item, idx) => {
            const Icon = item.icon;
            const isTabActive = currentTab === item.id;
            return (
              <button
                key={`${item.id}-${idx}`}
                onClick={() => {
                  setTab(item.id);
                  // Close sidebar automatically on mobile
                  if (window.innerWidth < 1024) {
                    setIsCollapsed(true);
                  }
                }}
                className={`w-full flex items-center transition-all duration-150 ${
                  isCollapsed 
                    ? "justify-center px-0 py-3 w-12 mx-auto rounded-xl" 
                    : "gap-3 px-3 py-2 rounded-xl text-xs"
                } ${
                  isTabActive
                    ? "bg-gradient-to-r from-purple-600/95 to-indigo-600/95 text-white font-bold" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
                title={item.label}
              >
                <Icon className={`w-3.5 h-3.5 transition-colors ${isTabActive ? "text-white" : "text-purple-400"}`} />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Brand Credit */}
      <div className="p-4 text-center" id="sidebar-promo" />
    </div>
  );
};
