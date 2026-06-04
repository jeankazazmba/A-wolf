import React, { useState } from "react";
import { 
  Search, 
  Bell, 
  MessageSquare, 
  Calendar,
  Sparkles,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  Check,
  User,
  ExternalLink,
  Menu
} from "lucide-react";
import { useCollab } from "../context/CollabContext";
import { AppNotification } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface NavbarProps {
  setTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  setTab, 
  searchQuery, 
  setSearchQuery,
  isSidebarCollapsed,
  setIsSidebarCollapsed
}) => {
  const { 
    state, 
    userProfile, 
    markNotificationsRead, 
    clearNotifications,
    triggerNotification,
    currentUser,
    isAuthLoading,
    loginWithGoogle,
    logout
  } = useCollab();

  const [isOpenNotif, setIsOpenNotif] = useState(false);
  const [isOpenProfile, setIsOpenProfile] = useState(false);
  
  // Custom notification generator state
  const [customTitle, setCustomTitle] = useState("");
  const [customContent, setCustomContent] = useState("");
  const [customType, setCustomType] = useState<"info" | "success" | "warning">("info");

  const unreadCount = state.notifications.filter((n) => !n.read).length;

  const handleCreateCustomNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customContent.trim()) return;

    // Send notification to server
    triggerNotification(customTitle, customContent, customType);

    // Flash HTML5 notification fallback
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`[A-Wolf Custom] ${customTitle}`, {
        body: customContent,
      });
    }

    // Reset fields
    setCustomTitle("");
    setCustomContent("");
  };

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur px-4 md:px-6 flex items-center justify-between shrink-0 font-sans z-30" id="navbar-container">
      {/* Left side: Hamburger Toggle + Search Bar Container */}
      <div className="flex items-center gap-3.5 flex-1 max-w-sm md:max-w-md">
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer ${
            isSidebarCollapsed ? "block" : "block lg:hidden"
          }`}
          id="sidebar-toggle-btn"
          title={isSidebarCollapsed ? "Ouvrir le menu" : "Fermer le menu"}
        >
          <Menu className="w-5 h-5 animate-fade-in" />
        </button>

        {/* Search Bar - styled identically to image with keycap prompt */}
        <div className="relative w-full flex items-center" id="navbar-search">
          <span className="absolute left-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Rechercher (cours, ressources, groupes...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100/80 border-0 rounded-xl pl-9 pr-12 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all font-sans"
          />
          <span className="absolute right-3 px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 text-slate-400 rounded-md font-mono hidden md:inline-block shadow-sm">
            ⌘ K
          </span>
        </div>
      </div>

      {/* Action Indicators */}
      <div className="flex items-center gap-4 text-slate-600" id="navbar-actions">
        {/* Calendar Switcher button */}
        <button
          onClick={() => setTab("schedule")}
          className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900 cursor-pointer relative"
          title="Consulter l'emploi du temps"
        >
          <Calendar className="w-4 h-4" />
        </button>

        {/* Live Messages Quick Link */}
        <button
          onClick={() => setTab("projects")}
          className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900 cursor-pointer relative"
          title="Messages et Groupes collaboratifs"
        >
          <MessageSquare className="w-4 h-4" />
          {state.messages.length > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-violet-600 rounded-full border border-white animate-pulse" />
          )}
        </button>

        {/* Notifications push personnalisables Dropdown Container */}
        <div className="relative">
          <button
            onClick={() => {
              setIsOpenNotif(!isOpenNotif);
              setIsOpenProfile(false);
              if (!isOpenNotif) {
                // Instantly read notifications
                setTimeout(markNotificationsRead, 2000);
              }
            }}
            className={`p-2.5 rounded-xl transition-all relative cursor-pointer ${
              isOpenNotif ? "bg-violet-50 text-violet-700" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
            }`}
            title="Notifications et créateur d'alertes"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isOpenNotif && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2.5 w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden text-sm"
              >
                {/* Notification Dropdown Header */}
                <div className="p-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-slate-800 font-display">Centre de Notifications</h4>
                    <span className="bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Push
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={clearNotifications}
                      className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1 p-1 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-3 h-3" /> Tout effacer
                    </button>
                  </div>
                </div>

                {/* --- IMPORTANT VALUE ADD: PUSH NOTIFICATION CUSTOMIZER FORM --- */}
                <div className="p-3 bg-violet-50/50 border-b border-violet-100">
                  <form onSubmit={handleCreateCustomNotification} className="space-y-2">
                    <h5 className="text-xs font-bold text-violet-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Créer une Notification Push
                    </h5>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        placeholder="Titre (ex: Rappel Devoir)"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        className="bg-white border border-violet-200/50 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-400"
                        required
                      />
                      <select
                        value={customType}
                        onChange={(e: any) => setCustomType(e.target.value)}
                        className="bg-white border border-violet-200/50 rounded-lg px-2 py-1 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-400"
                      >
                        <option value="info">💡 Info générale</option>
                        <option value="success">✅ Succès / Fait</option>
                        <option value="warning">🚨 Alerte importante</option>
                      </select>
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Contenu du rappel push..."
                        value={customContent}
                        onChange={(e) => setCustomContent(e.target.value)}
                        className="grow bg-white border border-violet-200/50 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-400"
                        required
                      />
                      <button
                        type="submit"
                        className="bg-violet-600 hover:bg-violet-500 text-white p-1 px-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                      >
                        Notifier
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Astuce: La notification apparaîtra aussi dans les autres onglets ouverts en temps réel !
                    </p>
                  </form>
                </div>

                {/* Notifications list */}
                <div className="max-h-68 overflow-y-auto divide-y divide-slate-100">
                  {state.notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm">Aucune notification disponible.</p>
                      <p className="text-xs text-slate-400 mt-1">Utilisez l'outil ci-dessus pour en créer une !</p>
                    </div>
                  ) : (
                    state.notifications.map((notif: AppNotification) => (
                      <div
                        key={notif.id}
                        className={`p-3.5 transition-all text-xs flex items-start gap-2.5 ${
                          notif.read ? "bg-white opacity-80" : "bg-violet-50/20 font-medium"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                          notif.type === "success" ? "bg-emerald-500" :
                          notif.type === "warning" ? "bg-rose-500" : "bg-blue-500"
                        }`} />
                        <div className="grow">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-800 leading-tight">{notif.title}</span>
                            <span className="text-[10px] text-slate-400 shrink-0 font-mono">{notif.timestamp}</span>
                          </div>
                          <p className="text-slate-600 mt-0.5 leading-relaxed">{notif.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Vertical divider */}
        <div className="w-px h-6 bg-slate-200" />

        {/* User profile dropdown switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setIsOpenProfile(!isOpenProfile);
              setIsOpenNotif(false);
            }}
            className="flex items-center gap-3 hover:bg-slate-100 p-1.5 pr-2 rounded-xl transition-colors cursor-pointer"
            id="navbar-user-trigger"
          >
            <div className={`w-8 h-8 rounded-full ${userProfile.avatar} flex items-center justify-center text-white font-bold text-xs shadow-sm`}>
              {userProfile.name.split(" ").map(w => w[0]).join("")}
            </div>
            <div className="text-left hidden sm:block">
              <span className="block font-bold text-xs text-slate-800 leading-none">{userProfile.name}</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">{userProfile.study}</span>
            </div>
          </button>

          <AnimatePresence>
            {isOpenProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4 space-y-3"
              >
                <div>
                  <h4 className="font-bold text-slate-800">Espace Étudiant</h4>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{userProfile.email}</p>
                </div>

                <div className="border-t border-slate-100 pt-2 space-y-1.5">
                  <div className="text-xs text-slate-500">Choisissez votre couleur de badge:</div>
                  <div className="flex gap-2">
                    {["bg-violet-600", "bg-emerald-600", "bg-rose-600", "bg-sky-600", "bg-amber-500"].map((col) => (
                      <button
                        key={col}
                        onClick={() => {
                          const updated = { ...userProfile, avatar: col };
                          // This saves local state
                          // The provider updates real-time identity
                          triggerNotification("Avatar modifiée", "Couleur d'avatar mise à jour !", "success");
                        }}
                        className={`w-6 h-6 rounded-full ${col} cursor-pointer border hover:scale-110 transition-transform ${
                          userProfile.avatar === col ? "ring-2 ring-violet-400" : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2.5">
                  <button
                    onClick={() => {
                      setTab("accueil");
                      setIsOpenProfile(false);
                    }}
                    className="w-full text-left font-medium text-xs text-slate-700 hover:text-violet-600 py-1.5 flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-slate-400" /> Mon profil de travail
                  </button>
                  <a
                    href="https://ai.studio/build"
                    target="_blank"
                    className="w-full text-left font-medium text-xs text-slate-700 hover:text-violet-600 py-1.5 flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400" /> AI Studio Build
                  </a>
                </div>

                <div className="border-t border-slate-100 pt-2.5 space-y-1">
                  {!currentUser ? (
                    <button
                      onClick={() => {
                        loginWithGoogle();
                        setIsOpenProfile(false);
                      }}
                      className="w-full text-center font-bold text-xs bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      Se connecter avec Google
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        logout();
                        setIsOpenProfile(false);
                      }}
                      className="w-full text-left font-medium text-xs text-rose-600 hover:text-rose-700 py-1.5 flex items-center gap-2 cursor-pointer"
                    >
                      🚪 Se déconnecter de la session
                    </button>
                  )}
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
