export interface Task {
  id: string;
  title: string;
  category: "Devoirs" | "Examens" | "Projets" | "Tout" | string;
  date: string; // e.g., "Pour Demain • 23:59"
  priority: "Haute" | "Moyenne" | "Basse" | string;
  completed: boolean;
  star?: boolean;
  subTasks?: { id: string; title: string; completed: boolean }[];
}

export interface Course {
  id: string;
  title: string;
  room: string;
  day: string; // "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "10:30"
  color: string; // Tailwind class name or hex representation
  description?: string;
}

export interface Resource {
  id: string;
  title: string;
  category: string;
  type: "pdf" | "zip" | "image" | "doc" | "other";
  url?: string;
  timestamp: string;
}

export interface ProjectGroup {
  id: string;
  title: string;
  membersCount: number;
  lastActive: string;
  unreadCount?: number;
}

export interface Message {
  id: string;
  sender: string;
  avatar: string; // Tailwind bg color or initials or image URL
  text: string;
  timestamp: string; // e.g., "Il y a 10 min" or standard ISO
  role?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  content: string;
  type: "info" | "success" | "warning";
  timestamp: string;
  read: boolean;
}

export interface ConnectionStatus {
  googleCalendar: boolean;
  outlook: boolean;
  appleCalendar: boolean;
}

export interface ShareState {
  tasks: Task[];
  courses: Course[];
  resources: Resource[];
  messages: Message[];
  notifications: AppNotification[];
  projectName?: string;
  focusedUserCount: number;
}

export interface FocusSessionState {
  duration: number; // in seconds
  isPlaying: boolean;
  mode: "pomodoro" | "stopwatch";
  currentInterval: number; // e.g., 1 of 4
  ambientSound: string; // "none", "rain", "forest", "waves", "white"
  ambientVolume: number; // 0 to 100
}
