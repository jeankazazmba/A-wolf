import React, { createContext, useContext, useState, useEffect } from "react";
import { ShareState, Task, Course, Resource, Message, AppNotification } from "../types";
import { initAuth, googleSignIn, getAccessToken, logout as googleLogout } from "../lib/googleAuth";

interface CollabContextType {
  state: ShareState;
  connectionStatus: "connecting" | "connected" | "disconnected";
  userProfile: { name: string; email: string; avatar: string; study: string };
  updateUserProfile: (profile: { name: string; email: string; study: string; avatar: string }) => void;
  addTask: (title: string, category: "Devoirs" | "Examens" | "Projets" | "Tout", date: string, priority: "Haute" | "Moyenne" | "Basse") => void;
  toggleTask: (id: string) => void;
  addCourse: (course: Omit<Course, "id">) => void;
  deleteCourse: (id: string) => void;
  addResource: (title: string, category: string, type: "pdf" | "zip" | "image" | "doc" | "other") => void;
  deleteResource: (id: string) => void;
  sendMessage: (text: string) => void;
  triggerNotification: (title: string, content: string, type: "info" | "success" | "warning") => void;
  markNotificationsRead: () => void;
  clearNotifications: () => void;
  // Firebase Auth additions
  currentUser: User | null;
  isAuthLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const CollabContext = createContext<CollabContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "awolf_local_state_backup";

export const CollabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initial empty production state
  const defaultState: ShareState = {
    tasks: [],
    courses: [],
    resources: [],
    messages: [],
    notifications: [],
    focusedUserCount: 1,
  };

  const [state, setState] = useState<ShareState>(() => {
    try {
      const backup = localStorage.getItem(LOCAL_STORAGE_KEY);
      return backup ? JSON.parse(backup) : defaultState;
    } catch {
      return defaultState;
    }
  });

  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [userProfile, setUserProfile] = useState({
    name: "Alex Martin",
    email: "bagumakazamba@gmail.com",
    avatar: "bg-violet-600",
    study: "Étudiant en Informatique",
  });

  // Auth hooks (local-friendly Google auth shim)
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setIsAuthLoading(false);
        if ((user as any)?.displayName) {
          setUserProfile((prev) => ({
            ...prev,
            name: (user as any).displayName || prev.name,
            email: (user as any).email || prev.email,
          }));
        }
      },
      () => {
        setCurrentUser(null);
        setIsAuthLoading(false);
      }
    );
    return () => {
      try {
        unsubscribe();
      } catch {}
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setIsAuthLoading(false);
        triggerNotification("Connexion réussie", "Vous êtes connecté avec Google !", "success");
      }
    } catch (err) {
      console.error("Google sign in failed:", err);
      triggerNotification("Authentification échouée", "Action interrompue ou refusée.", "warning");
    }
  };

  const logout = async () => {
    try {
      await googleLogout();
      setCurrentUser(null);
      setIsAuthLoading(false);
      triggerNotification("Déconnexion", "Session fermée.", "info");
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  // Save progress locally
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const updateUserProfile = (profile: { name: string; email: string; study: string; avatar: string }) => {
    setUserProfile(profile);
    // Push message to chat about profile change to demonstrate collaboration
    sendMessage(`👋 Changement d'identité: je m'appelle désormais ${profile.name} (${profile.study}) !`);
  };

  const addTask = (title: string, category: "Devoirs" | "Examens" | "Projets" | "Tout", date: string, priority: "Haute" | "Moyenne" | "Basse") => {
    const newTask: Task = {
      id: `tsk_local_${Date.now()}`,
      title,
      category,
      date: date || "À définir",
      priority,
      completed: false,
    };
    setState((prev) => ({ ...prev, tasks: [...prev.tasks, newTask] }));
    triggerNotification("Tâche Ajoutée", `La tâche '${title}' a été créée avec succès par ${userProfile.name}.`, "success");
  };

  const toggleTask = (id: string) => {
    const updated = state.tasks.map((task) => {
      if (task.id === id) {
        const nextCompleted = !task.completed;
        if (nextCompleted) {
          triggerNotification("Tâche Terminée ✅", `Félicitations ! '${task.title}' a été marquée comme terminée.`, "success");
        }
        return { ...task, completed: nextCompleted };
      }
      return task;
    });
    setState((prev) => ({ ...prev, tasks: updated }));
  };

  const addCourse = (course: Omit<Course, "id">) => {
    const newCourse: Course = {
      id: `crs_local_${Date.now()}`,
      ...course,
    };
    setState((prev) => ({ ...prev, courses: [...prev.courses, newCourse] }));
    triggerNotification("Nouveau Cours Planifié", `Le cours '${course.title}' a été ajouté à l'emploi du temps.`, "info");
  };

  const deleteCourse = (id: string) => {
    setState((prev) => ({ ...prev, courses: prev.courses.filter((course) => course.id !== id) }));
    triggerNotification("Cours Supprimé", "Le cours a été retiré de l'emploi du temps.", "info");
  };

  const addResource = (title: string, category: string, type: "pdf" | "zip" | "image" | "doc" | "other") => {
    const resourceId = `res_${Date.now()}`;
    const newResource: Resource = {
      id: resourceId,
      title,
      category,
      type,
      timestamp: "À l'instant",
    };
    setState((prev) => ({ ...prev, resources: [newResource, ...prev.resources] }));
    triggerNotification("Ressource ajoutée", `Fichier '${title}' ajouté localement.`, "success");
  };

  const deleteResource = (id: string) => {
    setState((prev) => ({ ...prev, resources: prev.resources.filter((resource) => resource.id !== id) }));
  };

  const sendMessage = (text: string) => {
    const newMessage: Message = {
      id: `msg_local_${Date.now()}`,
      sender: userProfile.name,
      avatar: userProfile.avatar,
      text,
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      role: userProfile.study,
    };
    setState((prev) => ({ ...prev, messages: [...prev.messages, newMessage] }));
  };

  const triggerNotification = (title: string, content: string, type: "info" | "success" | "warning") => {
    const newNotification: AppNotification = {
      id: `notif_local_${Date.now()}`,
      title,
      content,
      type,
      timestamp: "À l'instant",
      read: false,
    };
    setState((prev) => ({ ...prev, notifications: [newNotification, ...prev.notifications] }));
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`A-Wolf • ${title}`, { body: content, icon: "/favicon.ico" });
    }
  };

  const markNotificationsRead = () => {
    setState((prev) => ({ ...prev, notifications: prev.notifications.map((notif) => ({ ...notif, read: true })) }));
  };

  const clearNotifications = () => {
    setState((prev) => ({ ...prev, notifications: [] }));
  };

  return (
    <CollabContext.Provider
      value={{
        state,
        connectionStatus,
        userProfile,
        updateUserProfile,
        addTask,
        toggleTask,
        addCourse,
        deleteCourse,
        addResource,
        deleteResource,
        sendMessage,
        triggerNotification,
        markNotificationsRead,
        clearNotifications,
        currentUser,
        isAuthLoading,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </CollabContext.Provider>
  );
};

export const useCollab = () => {
  const context = useContext(CollabContext);
  if (!context) {
    throw new Error("useCollab must be used within a CollabProvider");
  }
  return context;
};
