import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  orderBy
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";

// Task Interfaces
export interface FirestoreTask {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
  group: string;
  star: boolean;
  subTasks: { id: string; title: string; completed: boolean }[];
  ownerId: string;
  createdAt: string;
  [key: string]: any; // Allow other properties
}

// Focus Session Interfaces
export interface FirestoreFocusSession {
  id: string;
  duration: number;
  timestamp: string;
  taskRef: string;
  type: "Pomodoro" | "Long";
  ownerId: string;
}

// Reminder Interfaces
export interface FirestoreReminder {
  id: string;
  title: string;
  deadline: string;
  completed: boolean;
  active: boolean;
  ownerId: string;
  createdAt: string;
  [key: string]: any;
}

// Note Interfaces
export interface FirestoreNote {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  ownerId: string;
  [key: string]: any;
}

// --- TASKS SYNC ---
export function subscribeTasks(userId: string, callback: (tasks: FirestoreTask[]) => void) {
  const path = "tasks";
  const q = query(
    collection(db, path),
    where("ownerId", "==", userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const tasks: FirestoreTask[] = [];
      snapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() } as FirestoreTask);
      });
      callback(tasks);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveTaskToCloud(userId: string, task: Omit<FirestoreTask, "ownerId" | "createdAt">) {
  const path = `tasks/${task.id}`;
  try {
    const docRef = doc(db, "tasks", task.id);
    const completeTask = {
      ...task,
      ownerId: userId,
      createdAt: new Date().toISOString()
    } as FirestoreTask;
    await setDoc(docRef, completeTask);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeTaskFromCloud(taskId: string) {
  const path = `tasks/${taskId}`;
  try {
    await deleteDoc(doc(db, "tasks", taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- FOCUS SESSIONS SYNC ---
export function subscribeFocusSessions(userId: string, callback: (sessions: FirestoreFocusSession[]) => void) {
  const path = "focus_sessions";
  const q = query(
    collection(db, path),
    where("ownerId", "==", userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const sessions: FirestoreFocusSession[] = [];
      snapshot.forEach((doc) => {
        sessions.push({ id: doc.id, ...doc.data() } as FirestoreFocusSession);
      });
      callback(sessions);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveFocusSessionToCloud(userId: string, session: Omit<FirestoreFocusSession, "ownerId">) {
  const path = `focus_sessions/${session.id}`;
  try {
    const docRef = doc(db, "focus_sessions", session.id);
    const completeSession: FirestoreFocusSession = {
      ...session,
      ownerId: userId
    };
    await setDoc(docRef, completeSession);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// --- REMINDERS SYNC ---
export function subscribeReminders(userId: string, callback: (reminders: FirestoreReminder[]) => void) {
  const path = "reminders";
  const q = query(
    collection(db, path),
    where("ownerId", "==", userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const reminders: FirestoreReminder[] = [];
      snapshot.forEach((doc) => {
        reminders.push({ id: doc.id, ...doc.data() } as FirestoreReminder);
      });
      callback(reminders);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveReminderToCloud(userId: string, reminder: Omit<FirestoreReminder, "ownerId" | "createdAt">) {
  const path = `reminders/${reminder.id}`;
  try {
    const docRef = doc(db, "reminders", reminder.id);
    const completeReminder = {
      ...reminder,
      ownerId: userId,
      createdAt: new Date().toISOString()
    } as FirestoreReminder;
    await setDoc(docRef, completeReminder);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeReminderFromCloud(reminderId: string) {
  const path = `reminders/${reminderId}`;
  try {
    await deleteDoc(doc(db, "reminders", reminderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- NOTES SYNC ---
export function subscribeNotes(userId: string, callback: (notes: FirestoreNote[]) => void) {
  const path = "notes";
  const q = query(
    collection(db, path),
    where("ownerId", "==", userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notes: FirestoreNote[] = [];
      snapshot.forEach((doc) => {
        notes.push({ id: doc.id, ...doc.data() } as FirestoreNote);
      });
      callback(notes);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveNoteToCloud(userId: string, note: Omit<FirestoreNote, "ownerId">) {
  const path = `notes/${note.id}`;
  try {
    const docRef = doc(db, "notes", note.id);
    const completeNote = {
      ...note,
      ownerId: userId,
      updatedAt: new Date().toISOString()
    } as FirestoreNote;
    await setDoc(docRef, completeNote);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeNoteFromCloud(noteId: string) {
  const path = `notes/${noteId}`;
  try {
    await deleteDoc(doc(db, "notes", noteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- CALENDAR EVENTS SYNC ---
export interface FirestoreCalendarEvent {
  id: string;
  title: string;
  type: "Cours" | "Devoirs" | "Projets" | "Réunions" | "Rappels" | "Autres";
  time: string;
  day: number;
  subject: string;
  color: string;
  room?: string;
  dateStr?: string;
  ownerId: string;
  createdAt: string;
  [key: string]: any;
}

export function subscribeCalendarEvents(userId: string, callback: (events: FirestoreCalendarEvent[]) => void) {
  const path = "calendar_events";
  const q = query(
    collection(db, path),
    where("ownerId", "==", userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const events: FirestoreCalendarEvent[] = [];
      snapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() } as FirestoreCalendarEvent);
      });
      callback(events);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveCalendarEventToCloud(userId: string, event: Omit<FirestoreCalendarEvent, "ownerId" | "createdAt">) {
  const path = `calendar_events/${event.id}`;
  try {
    const docRef = doc(db, "calendar_events", event.id);
    const completeEvent = {
      ...event,
      ownerId: userId,
      createdAt: new Date().toISOString()
    } as FirestoreCalendarEvent;
    await setDoc(docRef, completeEvent);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeCalendarEventFromCloud(eventId: string) {
  const path = `calendar_events/${eventId}`;
  try {
    await deleteDoc(doc(db, "calendar_events", eventId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- RESOURCES SYNC ---
export interface FirestoreResource {
  id: string;
  title: string;
  category: string;
  type: "pdf" | "zip" | "image" | "doc" | "other";
  url?: string;
  timestamp?: string;
  ownerId: string;
  createdAt: string;
  [key: string]: any;
}

export function subscribeResources(userId: string, callback: (resources: FirestoreResource[]) => void) {
  const path = "resources";
  const q = query(
    collection(db, path),
    where("ownerId", "==", userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const resources: FirestoreResource[] = [];
      snapshot.forEach((doc) => {
        resources.push({ id: doc.id, ...doc.data() } as FirestoreResource);
      });
      callback(resources);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveResourceToCloud(userId: string, resource: Omit<FirestoreResource, "ownerId" | "createdAt">) {
  const path = `resources/${resource.id}`;
  try {
    const docRef = doc(db, "resources", resource.id);
    const completeResource = {
      ...resource,
      ownerId: userId,
      createdAt: new Date().toISOString()
    } as FirestoreResource;
    await setDoc(docRef, completeResource);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeResourceFromCloud(resourceId: string) {
  const path = `resources/${resourceId}`;
  try {
    await deleteDoc(doc(db, "resources", resourceId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
