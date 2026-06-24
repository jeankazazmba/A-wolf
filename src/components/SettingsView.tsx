import React, { useState } from "react";
import { useCollab } from "../context/CollabContext";
import {
  Settings,
  User,
  Bell,
  Palette,
  Database,
  Info,
  ChevronRight,
  Check,
  Trash2,
  Download,
  Shield,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Camera,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type SettingsSection = "account" | "appearance" | "notifications" | "data" | "about";

const SectionButton: React.FC<{
  id: SettingsSection;
  label: string;
  icon: React.ElementType;
  description: string;
  active: boolean;
  onClick: () => void;
}> = ({ id, label, icon: Icon, description, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
      active
        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm"
        : "hover:bg-slate-50 text-slate-600"
    }`}
    id={`settings-section-${id}`}
  >
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-white/20" : "bg-slate-100"}`}>
      <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-500"}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-semibold leading-none ${active ? "text-white" : "text-slate-700"}`}>{label}</p>
      <p className={`text-[10px] mt-0.5 truncate ${active ? "text-white/70" : "text-slate-400"}`}>{description}</p>
    </div>
    <ChevronRight className={`w-4 h-4 shrink-0 ${active ? "text-white/70" : "text-slate-300"}`} />
  </button>
);

const ToggleSetting: React.FC<{
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  id: string;
}> = ({ label, description, value, onChange, id }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
    <div>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className="text-xs text-slate-400 mt-0.5">{description}</p>
    </div>
    <button
      onClick={() => onChange(!value)}
      className={`relative w-10 h-5.5 rounded-full transition-all cursor-pointer shrink-0 ${
        value ? "bg-violet-600" : "bg-slate-200"
      }`}
      id={id}
      role="switch"
      aria-checked={value}
      style={{ height: "22px", width: "40px" }}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
          value ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  </div>
);

export const SettingsView: React.FC<{ setTab?: (tab: string) => void }> = ({ setTab }) => {
  const { userProfile, updateUserProfile, clearNotifications, logout, state, triggerNotification } = useCollab();
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");

  // Appearance settings (localStorage-backed)
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("awolf_sound") !== "false");
  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem("awolf_notif") !== "false");
  const [desktopNotif, setDesktopNotif] = useState(() => "Notification" in window && Notification.permission === "granted");
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem("awolf_compact") === "true");

  const avatarColors = [
    { value: "bg-violet-600", label: "Violet" },
    { value: "bg-emerald-600", label: "Vert" },
    { value: "bg-rose-600", label: "Rose" },
    { value: "bg-sky-600", label: "Bleu" },
    { value: "bg-amber-500", label: "Ambre" },
    { value: "bg-indigo-700", label: "Indigo" },
    { value: "bg-pink-600", label: "Fuchsia" },
    { value: "bg-teal-600", label: "Teal" },
  ];

  const handleSoundToggle = (v: boolean) => {
    setSoundEnabled(v);
    localStorage.setItem("awolf_sound", String(v));
  };

  const handleNotifToggle = (v: boolean) => {
    setNotifEnabled(v);
    localStorage.setItem("awolf_notif", String(v));
  };

  const handleCompactToggle = (v: boolean) => {
    setCompactMode(v);
    localStorage.setItem("awolf_compact", String(v));
  };

  const handleRequestDesktopNotif = async () => {
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      setDesktopNotif(perm === "granted");
      if (perm === "granted") {
        triggerNotification("Notifications activées", "Vous recevrez des alertes bureau !", "success");
      }
    }
  };

  const handleExportData = () => {
    const data = {
      profile: userProfile,
      tasks: state.tasks,
      courses: state.courses,
      resources: state.resources,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `awolf_data_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerNotification("Export réussi", "Vos données ont été téléchargées.", "success");
  };

  const handleClearAllData = () => {
    if (window.confirm("Voulez-vous vraiment effacer toutes vos données locales ? Cette action est irréversible.")) {
      localStorage.removeItem("awolf_local_state_backup");
      localStorage.removeItem("awolf_user_photo");
      localStorage.removeItem("awolf_user_profile");
      clearNotifications();
      triggerNotification("Données effacées", "Toutes vos données locales ont été supprimées.", "info");
      window.location.reload();
    }
  };

  const handleAvatarChange = (color: string) => {
    updateUserProfile({ ...userProfile, avatar: color });
    triggerNotification("Avatar mis à jour", "Couleur d'avatar modifiée avec succès !", "success");
  };

  const sections: { id: SettingsSection; label: string; icon: React.ElementType; description: string }[] = [
    { id: "account", label: "Compte", icon: User, description: "Profil, avatar, connexion" },
    { id: "appearance", label: "Apparence", icon: Palette, description: "Couleurs, affichage" },
    { id: "notifications", label: "Notifications", icon: Bell, description: "Alertes et rappels" },
    { id: "data", label: "Données", icon: Database, description: "Export, suppression" },
    { id: "about", label: "À propos", icon: Info, description: "Version, licence, aide" },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-10" id="settings-view">
      <div className="mb-6">
        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-violet-600" /> Paramètres
        </h1>
        <p className="text-sm text-slate-400 mt-1">Gérez vos préférences et votre compte</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left nav */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-3 space-y-1">
            {sections.map((s) => (
              <SectionButton
                key={s.id}
                id={s.id}
                label={s.label}
                icon={s.icon}
                description={s.description}
                active={activeSection === s.id}
                onClick={() => setActiveSection(s.id)}
              />
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="md:col-span-2">
          <AnimatePresence mode="wait">
            {/* === ACCOUNT === */}
            {activeSection === "account" && (
              <motion.div
                key="account"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-5"
              >
                <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-violet-500" /> Informations du compte
                </h2>

                {/* Current profile summary */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className={`w-14 h-14 rounded-xl ${userProfile.avatar} flex items-center justify-center text-white font-bold text-lg shrink-0 overflow-hidden shadow-sm`}>
                    {userProfile.photoURL ? (
                      <img src={userProfile.photoURL} alt="Photo" className="w-full h-full object-cover" />
                    ) : (
                      userProfile.name.split(" ").map((w) => w[0]).join("").toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{userProfile.name}</p>
                    <p className="text-xs text-slate-500 truncate">{userProfile.email}</p>
                    <p className="text-xs text-violet-600 mt-0.5">{userProfile.study}</p>
                  </div>
                  <button
                    onClick={() => setTab?.("profile")}
                    className="px-3 py-1.5 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg border border-violet-200 transition-colors cursor-pointer shrink-0"
                  >
                    Modifier
                  </button>
                </div>

                {/* Avatar color */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">Couleur d'avatar</p>
                  <div className="flex flex-wrap gap-2.5">
                    {avatarColors.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => handleAvatarChange(c.value)}
                        className={`w-8 h-8 rounded-full ${c.value} cursor-pointer border-2 transition-all hover:scale-110 relative ${
                          userProfile.avatar === c.value ? "border-slate-800 scale-110 shadow-md" : "border-white shadow-sm"
                        }`}
                        title={c.label}
                      >
                        {userProfile.avatar === c.value && (
                          <Check className="absolute inset-0 m-auto w-3.5 h-3.5 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Go to profile */}
                <button
                  onClick={() => setTab?.("profile")}
                  className="w-full flex items-center justify-between px-4 py-3 bg-violet-50 hover:bg-violet-100 rounded-xl border border-violet-100 transition-colors cursor-pointer group"
                  id="settings-goto-profile-btn"
                >
                  <div className="flex items-center gap-2.5">
                    <Camera className="w-4 h-4 text-violet-500" />
                    <span className="text-sm font-semibold text-violet-800">Gérer la photo de profil</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-violet-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Sign out */}
                <div className="border-t border-slate-100 pt-4">
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 text-sm text-rose-500 hover:text-rose-700 font-medium transition-colors cursor-pointer py-1"
                    id="settings-logout-btn"
                  >
                    <LogOut className="w-4 h-4" /> Se déconnecter
                  </button>
                </div>
              </motion.div>
            )}

            {/* === APPEARANCE === */}
            {activeSection === "appearance" && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-4"
              >
                <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Palette className="w-4 h-4 text-violet-500" /> Apparence
                </h2>

                <div className="space-y-0 divide-y divide-slate-50">
                  <ToggleSetting
                    id="toggle-compact"
                    label="Mode compact"
                    description="Réduit l'espacement pour afficher plus de contenu"
                    value={compactMode}
                    onChange={handleCompactToggle}
                  />
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">Thème couleur (à venir)</p>
                  <div className="flex gap-2">
                    {["bg-violet-600", "bg-indigo-600", "bg-sky-600", "bg-teal-600", "bg-rose-600"].map((c) => (
                      <div key={c} className={`w-6 h-6 rounded-full ${c} opacity-50 cursor-not-allowed`} />
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Cette fonctionnalité sera disponible dans une prochaine version.</p>
                </div>
              </motion.div>
            )}

            {/* === NOTIFICATIONS === */}
            {activeSection === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-4"
              >
                <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4 text-violet-500" /> Notifications
                </h2>

                <div className="space-y-0">
                  <ToggleSetting
                    id="toggle-sound"
                    label="Sons de notification"
                    description="Jouer un son lors d'une alerte"
                    value={soundEnabled}
                    onChange={handleSoundToggle}
                  />
                  <ToggleSetting
                    id="toggle-notif"
                    label="Notifications in-app"
                    description="Afficher les alertes dans le centre de notifications"
                    value={notifEnabled}
                    onChange={handleNotifToggle}
                  />
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold text-slate-500 mb-3">Notifications bureau (OS)</p>
                  {desktopNotif ? (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <p className="text-xs font-semibold text-emerald-700">Notifications bureau activées</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleRequestDesktopNotif}
                      className="w-full flex items-center gap-2.5 px-4 py-3 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl transition-colors cursor-pointer"
                      id="enable-desktop-notif-btn"
                    >
                      <Bell className="w-4 h-4 text-violet-600" />
                      <span className="text-sm font-semibold text-violet-800">Activer les notifications bureau</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* === DATA === */}
            {activeSection === "data" && (
              <motion.div
                key="data"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-4"
              >
                <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-violet-500" /> Gestion des données
                </h2>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Tâches", value: state.tasks.length },
                    { label: "Cours", value: state.courses.length },
                    { label: "Ressources", value: state.resources.length },
                  ].map((s) => (
                    <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                      <p className="text-2xl font-black text-slate-800">{s.value}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleExportData}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer group"
                    id="export-data-btn"
                  >
                    <Download className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-blue-800">Exporter mes données</p>
                      <p className="text-xs text-blue-500">Télécharger un fichier JSON de vos données</p>
                    </div>
                  </button>

                  <button
                    onClick={clearNotifications}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer"
                    id="clear-notifications-btn"
                  >
                    <RefreshCw className="w-4 h-4 text-amber-600 shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-amber-800">Effacer les notifications</p>
                      <p className="text-xs text-amber-500">Vider le centre de notifications</p>
                    </div>
                  </button>

                  <button
                    onClick={handleClearAllData}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                    id="clear-all-data-btn"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-rose-800">Supprimer toutes les données</p>
                      <p className="text-xs text-rose-400">Action irréversible — réinitialise l'application</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* === ABOUT === */}
            {activeSection === "about" && (
              <motion.div
                key="about"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-4"
              >
                <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Info className="w-4 h-4 text-violet-500" /> À propos de A-Wolf
                </h2>

                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl border border-violet-100">
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm border border-violet-100 overflow-hidden">
                    <img src="/favicon.ico" alt="Logo" className="w-10 h-10 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">A-Wolf</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Plateforme académique collaborative</p>
                    <span className="inline-block mt-1 text-[10px] font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">
                      v1.0.0
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {[
                    { label: "Version", value: "1.0.0" },
                    { label: "Plateforme", value: "Electron + React + Vite" },
                    { label: "Authentification", value: "Google OAuth + Local Auth" },
                    { label: "Stockage", value: "LocalStorage (hors-ligne)" },
                    { label: "Licence", value: "Apache-2.0" },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                      <span className="text-slate-400 font-medium">{row.label}</span>
                      <span className="text-slate-700 font-semibold text-right">{row.value}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2">
                  <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Vos données sont stockées localement sur votre appareil. Aucune donnée personnelle n'est envoyée à des serveurs tiers sans votre consentement.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
