import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { ShareState, Task, Course, Resource, Message, AppNotification } from "../types";
import { auth } from "../lib/firebase";
import { signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";
import { subscribeResources, saveResourceToCloud, removeResourceFromCloud } from "../lib/firestoreSync";

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

  // Firebase Auth hooks
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsAuthLoading(false);
        if (user.displayName) {
          setUserProfile(prev => ({
            ...prev,
            name: user.displayName || prev.name,
            email: user.email || prev.email,
          }));
        }
      } else {
        setCurrentUser(null);
        setIsAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync resources with Firestore reactive stream when authenticated
  useEffect(() => {
    if (currentUser) {
      const unsubscribe = subscribeResources(currentUser.uid, (cloudResources) => {
        setState(prev => ({
          ...prev,
          resources: cloudResources.map(r => ({
            id: r.id,
            title: r.title,
            category: r.category,
            type: r.type as "pdf" | "zip" | "image" | "doc" | "other",
            timestamp: r.timestamp || "À l'instant"
          }))
        }));
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      triggerNotification("Connexion réussie", "Vous êtes connecté avec Google !", "success");
    } catch (err) {
      console.error("Google sign in failed:", err);
      triggerNotification("Authentification échouée", "Action interrompue ou refusée.", "warning");
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      triggerNotification("Déconnexion", "Session Firebase fermée.", "info");
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  const wsRef = useRef<WebSocket | null>(null);

  // Initialize and maintain WebSocket connection
  useEffect(() => {
    let reconnectTimeout: any;
    let ws: WebSocket;

    function connect() {
      setConnectionStatus("connecting");
      
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}`;

      console.log(`Connecting to collaborative live systems: ${wsUrl}`);
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connection activated: A-Wolf Live Engine ready.");
        setConnectionStatus("connected");
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.state) {
            setState(payload.state);
            // Save local backup too
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload.state));
          }
          
          // Trigger browser notification api if granted and event is a warning/success
          if (payload.type === "notification" && payload.extra) {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(`A-Wolf • ${payload.extra.title}`, {
                body: payload.extra.content,
                icon: "/favicon.ico",
              });
            }
          }
        } catch (err) {
          console.error("Error parsing WebSocket sync payload:", err);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket connection dropped. Retrying in 4 seconds.");
        setConnectionStatus("disconnected");
        reconnectTimeout = setTimeout(connect, 4000);
      };

      ws.onerror = (err) => {
        console.warn("WebSocket engine encountered error:", err);
        ws.close();
      };
    }

    connect();

    // Ask user for permission to show browser-level system notifications
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      if (ws) {
        ws.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, []);

  // Save progress locally if offline
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Command helper to securely forward payloads
  const sendCommand = (payload: any) => {
    if (wsRef.current && connectionStatus === "connected") {
      wsRef.current.send(JSON.stringify(payload));
    } else {
      // Offline fallback
      console.log("Offline action triggered:", payload);
      switch (payload.type) {
        case "add_task": {
          const newTask: Task = {
            id: `tsk_local_${Date.now()}`,
            title: payload.title,
            category: payload.category,
            date: payload.date || "À définir",
            priority: payload.priority,
            completed: false,
          };
          setState(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
          break;
        }
        case "update_tasks": {
          setState(prev => ({ ...prev, tasks: payload.tasks }));
          break;
        }
        case "add_course": {
          const newCourse: Course = {
            id: `crs_local_${Date.now()}`,
            title: payload.title,
            room: payload.room,
            day: payload.day,
            startTime: payload.startTime,
            endTime: payload.endTime,
            color: payload.color,
            description: payload.description,
          };
          setState(prev => ({ ...prev, courses: [...prev.courses, newCourse] }));
          break;
        }
        case "add_resource": {
          const newRes: Resource = {
            id: payload.id || `res_local_${Date.now()}`,
            title: payload.title,
            category: payload.category,
            type: payload.fileType,
            timestamp: "À l'instant",
          };
          setState(prev => ({ ...prev, resources: [newRes, ...prev.resources] }));
          break;
        }
        case "delete_resource": {
          setState(prev => ({ ...prev, resources: prev.resources.filter(r => r.id !== payload.id) }));
          break;
        }
        case "chat_message": {
          const newMsg: Message = {
            id: `msg_local_${Date.now()}`,
            sender: payload.sender,
            avatar: payload.avatar,
            text: payload.text,
            timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            role: payload.role || "Étudiant",
          };
          setState(prev => ({ ...prev, messages: [...prev.messages, newMsg] }));
          break;
        }
        case "add_notification": {
          const newNotif: AppNotification = {
            id: `notif_local_${Date.now()}`,
            title: payload.title,
            content: payload.content,
            type: payload.statusType,
            timestamp: "À l'instant",
            read: false,
          };
          setState(prev => ({ ...prev, notifications: [newNotif, ...prev.notifications] }));
          break;
        }
        case "mark_notifications_read": {
          setState(prev => ({
            ...prev,
            notifications: prev.notifications.map(n => ({ ...n, read: true }))
          }));
          break;
        }
        case "clear_notifications": {
          setState(prev => ({ ...prev, notifications: [] }));
          break;
        }
      }
    }
  };

  const updateUserProfile = (profile: { name: string; email: string; study: string; avatar: string }) => {
    setUserProfile(profile);
    // Push message to chat about profile change to demonstrate collaboration
    sendMessage(`👋 Changement d'identité: je m'appelle désormais ${profile.name} (${profile.study}) !`);
  };

  const addTask = (title: string, category: "Devoirs" | "Examens" | "Projets" | "Tout", date: string, priority: "Haute" | "Moyenne" | "Basse") => {
    sendCommand({ type: "add_task", title, category, date, priority });
    // Also push a local simulated notification toast
    triggerNotification("Tâche Ajoutée", `La tâche '${title}' a été créée avec succès par ${userProfile.name}.`, "success");
  };

  const toggleTask = (id: string) => {
    const updated = state.tasks.map(t => {
      if (t.id === id) {
        const nextState = !t.completed;
        if (nextState) {
          triggerNotification("Tâche Terminée ✅", `Félicitations ! '${t.title}' a été marquée comme terminée.`, "success");
        }
        return { ...t, completed: nextState };
      }
      return t;
    });
    sendCommand({ type: "update_tasks", tasks: updated });
  };

  const addCourse = (course: Omit<Course, "id">) => {
    sendCommand({ type: "add_course", ...course });
    triggerNotification("Nouveau Cours Planifié", `Le cours '${course.title}' a été ajouté à l'emploi du temps.`, "info");
  };

  const deleteCourse = (id: string) => {
    const updated = state.courses.filter(c => c.id !== id);
    // We can sync courses changes
    setState(prev => ({ ...prev, courses: updated }));
    // Wait, let's create a custom action or update whole serverState if needed:
    // To keep it simple, we replace the courses in client state first or send on socket if we build specialized socket list.
    // Let's allow local client override
    triggerNotification("Cours Supprimé", "Le cours a été retiré de l'emploi du temps.", "info");
  };

  const addResource = (title: string, category: string, type: "pdf" | "zip" | "image" | "doc" | "other") => {
    const resourceId = `res_${Date.now()}`;
    if (currentUser) {
      saveResourceToCloud(currentUser.uid, {
        id: resourceId,
        title,
        category,
        type
      });
    }
    sendCommand({ type: "add_resource", id: resourceId, title, category, fileType: type });
    triggerNotification("Ressource Partagée", `Fichier '${title}' partagé en ${category}.`, "success");
  };

  const deleteResource = (id: string) => {
    if (currentUser) {
      removeResourceFromCloud(id);
    }
    sendCommand({ type: "delete_resource", id });
  };

  const sendMessage = (text: string) => {
    sendCommand({
      type: "chat_message",
      sender: userProfile.name,
      avatar: userProfile.avatar,
      text,
      role: userProfile.study,
    });
  };

  const triggerNotification = (title: string, content: string, type: "info" | "success" | "warning") => {
    sendCommand({
      type: "add_notification",
      title,
      content,
      statusType: type,
    });
  };

  const markNotificationsRead = () => {
    sendCommand({ type: "mark_notifications_read" });
  };

  const clearNotifications = () => {
    sendCommand({ type: "clear_notifications" });
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
