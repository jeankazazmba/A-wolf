import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { Task, Course, Resource, Message, AppNotification, ShareState } from "./src/types";

// Server memory workspace state
let serverState: ShareState = {
  tasks: [],
  courses: [],
  resources: [],
  messages: [],
  notifications: [],
  focusedUserCount: 1, // Start with 1 (the user)
};

async function start() {
  const app = express();
  const PORT = 3000;

  // In-memory stats and variables for extended REST APIs
  let userSettings = {
    activeAmbiance: "none",
    ambientSound: "Pluie douce",
    volume: 40,
    isMuted: false,
    doNotDisturb: true
  };

  let focusSessions: any[] = [];

  // Helper mock calendar events generator matching raw Google Calendar structures
  function getServerDynamicMockEvents() {
    const getDayAtTime = (dayOffset: number, hh: number, mm: number): string => {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
      const baseDate = new Date(today);
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      baseDate.setDate(today.getDate() + mondayOffset + dayOffset);
      baseDate.setHours(hh, mm, 0, 0);
      return baseDate.toISOString();
    };

    return [
      {
        id: "mock_event_1",
        summary: "🖥️ Algorithmique et Complexité",
        description: "Cours magistral d'algorithmique avancée.",
        location: "Amphi d'honneur - Bâtiment C",
        start: { dateTime: getDayAtTime(0, 8, 30) },
        end: { dateTime: getDayAtTime(0, 10, 30) }
      },
      {
        id: "mock_event_2",
        summary: "👥 Sprint Planning - Projet Web",
        description: "Synchronisation d'équipe pour la répartition des tâches.",
        location: "Google Meet / En ligne",
        start: { dateTime: getDayAtTime(0, 14, 0) },
        end: { dateTime: getDayAtTime(0, 15, 30) }
      },
      {
        id: "mock_event_3",
        summary: "🗄️ Base de Données NoSQL & Big Data",
        description: "TP Pratique sur Cassandra et MongoDB.",
        location: "Salle d'Informatique 203",
        start: { dateTime: getDayAtTime(1, 10, 45) },
        end: { dateTime: getDayAtTime(1, 12, 45) }
      },
      {
        id: "mock_event_4",
        summary: "☁️ Soutenance Projet Architecture Cloud",
        description: "Présentation finale des infrastructures.",
        location: "Salle de conférence 402",
        start: { dateTime: getDayAtTime(3, 9, 0) },
        end: { dateTime: getDayAtTime(3, 11, 0) }
      }
    ];
  }

  // Serve static folders and parse JSON payloads safely
  app.use(express.json());

  // API endpoint to fetch initial state
  app.get("/api/state", (req, res) => {
    res.json(serverState);
  });

  // --- GOOGLE WORKSPACE API ROUTES ---

  // Exchange auth code endpoint to comply with Step 3
  app.post("/api/oauth/exchange", async (req, res) => {
    const { code, redirect_uri } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }
    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          redirect_uri: redirect_uri || 'postmessage',
          grant_type: "authorization_code"
        })
      });
      const data = await response.json();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Dual calendar sync endpoint
  app.get("/api/calendar/sync", async (req, res) => {
    const authHeader = req.headers.authorization;
    let token = authHeader?.split(" ")[1] || (req.query.token as string);

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Access token missing" });
    }

    if (token === "simulated_prod_access_token") {
      return res.json(getServerDynamicMockEvents());
    }

    try {
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 4, 1).toISOString();
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=80`;

      const gResponse = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!gResponse.ok) {
        throw new Error(`Google API Http Error: ${gResponse.status}`);
      }

      const data = await gResponse.json();
      return res.json(data.items || []);
    } catch (err: any) {
      console.error("Server calendar sync failure:", err);
      return res.json(getServerDynamicMockEvents());
    }
  });

  // Google Calendar add event endpoint
  app.post("/api/calendar/add", async (req, res) => {
    const authHeader = req.headers.authorization;
    let token = authHeader?.split(" ")[1] || (req.query.token as string);

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Access token missing" });
    }

    const { summary, description, location, start, end } = req.body;

    if (token === "simulated_prod_access_token") {
      return res.json({ id: "simulated_gcal_event_" + Date.now(), summary, description, location, start, end });
    }

    try {
      const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          summary,
          description,
          location,
          start,
          end
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google API Http Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return res.json(data);
    } catch (err: any) {
      console.error("Server calendar add failure:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // --- GENERAL UNIFIED REST APIS ---

  // Tasks endpoints
  app.get("/api/tasks", (req, res) => {
    res.json(serverState.tasks);
  });

  app.post("/api/tasks", (req, res) => {
    const incomingTask = req.body;
    if (!incomingTask.title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const idx = serverState.tasks.findIndex(t => t.id === incomingTask.id);
    const completeTask: Task = {
      id: incomingTask.id || "tsk_" + Date.now(),
      title: incomingTask.title,
      category: incomingTask.category || "Tout",
      date: incomingTask.date || "À définir",
      priority: incomingTask.priority || "Moyenne",
      completed: !!incomingTask.completed,
      star: !!incomingTask.star,
      subTasks: incomingTask.subTasks || []
    };

    if (idx > -1) {
      serverState.tasks[idx] = completeTask;
    } else {
      serverState.tasks.push(completeTask);
    }

    broadcastState("update_tasks");
    res.status(200).json(completeTask);
  });

  app.delete("/api/tasks/:id", (req, res) => {
    const taskId = req.params.id;
    const initialLen = serverState.tasks.length;
    serverState.tasks = serverState.tasks.filter(t => t.id !== taskId);
    
    if (serverState.tasks.length < initialLen) {
      broadcastState("update_tasks");
      res.json({ success: true, message: `Task ${taskId} deleted.` });
    } else {
      res.status(404).json({ error: "Task not found" });
    }
  });

  // Focus & Synthesizer session tracking
  app.post("/api/focus/session", (req, res) => {
    const { id, duration, timestamp, taskRef, type } = req.body;
    const newSession = {
      id: id || `fs_${Date.now()}`,
      duration: Number(duration) || 25,
      timestamp: timestamp || new Date().toISOString(),
      taskRef: taskRef || "Focus session",
      type: type || "Pomodoro"
    };
    focusSessions.push(newSession);

    res.status(201).json({ success: true, session: newSession });
  });

  // User Settings endpoints
  app.get("/api/settings", (req, res) => {
    res.json(userSettings);
  });

  app.post("/api/settings", (req, res) => {
    userSettings = { ...userSettings, ...req.body };
    res.json(userSettings);
  });

  // API endpoint for simulated push notifications registry
  app.post("/api/notifications/custom", (req, res) => {
    const { title, content, type } = req.body;
    if (!title || !content) {
       return res.status(400).json({ error: "Title and content required" });
    }
    const newNotif: AppNotification = {
      id: "n_" + Date.now(),
      title,
      content,
      type: type || "info",
      timestamp: "À l'instant",
      read: false
    };
    serverState.notifications = [newNotif, ...serverState.notifications];
    broadcastState("notification", newNotif);
    res.status(201).json(newNotif);
  });

  // Create standard HTTP server
  const server = http.createServer(app);

  // Initialize companion WebSocket Server
  const wss = new WebSocketServer({ server });

  // Connected client sockets tracking
  const activeSockets = new Set<WebSocket>();

  // Function to broadcast message / state to all connected clients
  function broadcastState(eventType: string, extraData?: any) {
    const stringPayload = JSON.stringify({
      type: eventType,
      state: serverState,
      extra: extraData,
    });
    for (const socket of activeSockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(stringPayload);
      }
    }
  }

  wss.on("connection", (socket) => {
    activeSockets.add(socket);
    
    // Increment focused users counter dynamically to represent collaborative active students
    serverState.focusedUserCount = Math.max(1, activeSockets.size + 1);
    
    // Provide full initial state sync upon connection
    socket.send(
      JSON.stringify({
        type: "sync",
        state: serverState,
      })
    );

    // Broadcast updated co-worker count
    broadcastState("presence_change");

    socket.on("message", (rawMessage) => {
      try {
        const payload = JSON.parse(rawMessage.toString());
        
        switch (payload.type) {
          case "chat_message": {
            const newMsg: Message = {
              id: "msg_" + Date.now(),
              sender: payload.sender || "Anonyme",
              avatar: payload.avatar || "bg-rose-500",
              text: payload.text,
              timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
              role: payload.role || "Étudiant",
            };
            serverState.messages.push(newMsg);
            // Slice to keep reasonable memory
            if (serverState.messages.length > 100) {
              serverState.messages.shift();
            }
            broadcastState("chat_message", newMsg);
            break;
          }

          case "update_tasks": {
            serverState.tasks = payload.tasks;
            broadcastState("update_tasks");
            break;
          }

          case "add_task": {
            const newTask: Task = {
              id: "tsk_" + Date.now(),
              title: payload.title,
              category: payload.category || "Tout",
              date: payload.date || "À définir",
              priority: payload.priority || "Moyenne",
              completed: false,
            };
            serverState.tasks.push(newTask);
            broadcastState("add_task", newTask);
            break;
          }

          case "add_course": {
            const newCourse: Course = {
              id: "crs_" + Date.now(),
              title: payload.title,
              room: payload.room || "Lab",
              day: payload.day || "Lun",
              startTime: payload.startTime || "08:00",
              endTime: payload.endTime || "09:30",
              color: payload.color || "bg-violet-100 hover:bg-violet-200 border-l-4 border-violet-500 text-violet-700",
            };
            serverState.courses.push(newCourse);
            broadcastState("add_course", newCourse);
            break;
          }

          case "add_resource": {
            const newRes: Resource = {
              id: "res_" + Date.now(),
              title: payload.title,
              category: payload.category || "Général",
              type: payload.fileType || "pdf",
              timestamp: "À l'instant",
            };
            serverState.resources.unshift(newRes);
            broadcastState("add_resource", newRes);
            break;
          }

          case "delete_resource": {
            serverState.resources = serverState.resources.filter(r => r.id !== payload.id);
            broadcastState("delete_resource");
            break;
          }

          case "add_notification": {
            const btnNotif: AppNotification = {
              id: "notif_" + Date.now(),
              title: payload.title,
              content: payload.content,
              type: payload.statusType || "info",
              timestamp: "À l'instant",
              read: false,
            };
            serverState.notifications.unshift(btnNotif);
            broadcastState("add_notification", btnNotif);
            break;
          }

          case "mark_notifications_read": {
            serverState.notifications = serverState.notifications.map((n) => ({
              ...n,
              read: true,
            }));
            broadcastState("mark_notifications_read");
            break;
          }

          case "clear_notifications": {
            serverState.notifications = [];
            broadcastState("clear_notifications");
            break;
          }

          default:
            console.log("Unrecognized socket event type received:", payload.type);
        }
      } catch (err) {
        console.error("Failed to process socket payload:", err);
      }
    });

    socket.on("close", () => {
      activeSockets.delete(socket);
      serverState.focusedUserCount = Math.max(1, activeSockets.size + 1);
      broadcastState("presence_change");
    });
  });

  // Mount Vite development server as middleware, fallback to production serve in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[A-Wolf] Collaborative Workspace server booted on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Critical server startup failure:", err);
});
