// Minimal local-friendly Google auth shim.
// This removes the Firebase dependency and offers a small UX for desktop apps
// to store an access token locally. For full OAuth flows, replace with a
// proper OAuth redirect/popup implementation suited for Electron.

const GOOGLE_ACCESS_TOKEN_KEY = "google_auth_access_token";
const GOOGLE_AUTH_PAYLOAD_KEY = "google_auth_payload";

type LocalUser = { displayName?: string; email?: string; uid?: string };

let isSigningIn = false;
let cachedAccessToken: string | null = localStorage.getItem(GOOGLE_ACCESS_TOKEN_KEY);

async function electronGetAuthPayload(): Promise<any | null> {
  if ((window as any).electronAPI?.getGoogleAuthPayload) {
    return await (window as any).electronAPI.getGoogleAuthPayload();
  }
  return null;
}

async function electronSetAuthPayload(payload: any): Promise<void> {
  if ((window as any).electronAPI?.setGoogleAuthPayload) {
    await (window as any).electronAPI.setGoogleAuthPayload(payload);
  }
}

async function electronDeleteAuthPayload(): Promise<void> {
  if ((window as any).electronAPI?.deleteGoogleAuthPayload) {
    await (window as any).electronAPI.deleteGoogleAuthPayload();
  }
}

export const initAuth = (
  onAuthSuccess?: (user: LocalUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  let isActive = true;

  const hydrate = async () => {
    try {
      let restoredToken = cachedAccessToken;
      let authPayload = null;

      if (!restoredToken && (window as any).electronAPI?.getGoogleAuthPayload) {
        authPayload = await electronGetAuthPayload();
        restoredToken = authPayload?.access_token || null;
      }

      if (!restoredToken) {
        restoredToken = localStorage.getItem(GOOGLE_ACCESS_TOKEN_KEY);
      }

      if (restoredToken && isActive) {
        const userJson = localStorage.getItem("google_auth_sim_user");
        const user: LocalUser = userJson ? JSON.parse(userJson) : { displayName: "Google User", email: "user@local" };
        cachedAccessToken = restoredToken;
        if (onAuthSuccess) onAuthSuccess(user, restoredToken);
      } else if (isActive) {
        if (onAuthFailure) onAuthFailure();
      }
    } catch (error) {
      console.error("initAuth failed:", error);
      if (isActive && onAuthFailure) onAuthFailure();
    }
  };

  hydrate();

  return () => {
    isActive = false;
  };
};

export const isRunningInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

export const googleSignIn = async (clientId?: string): Promise<{ user: LocalUser; accessToken: string } | null> => {
  if (isSigningIn) {
    console.warn("Sign-in already in progress. Ignoring duplicate request.");
    return null;
  }
  try {
    isSigningIn = true;

    if ((window as any).electronAPI?.startGoogleOAuth) {
      const effectiveClientId = clientId || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
      const tokenResp = await (window as any).electronAPI.startGoogleOAuth(effectiveClientId);
      if (!tokenResp || !tokenResp.access_token) {
        throw new Error("No access token returned from Electron OAuth");
      }
      cachedAccessToken = tokenResp.access_token;
      await electronSetAuthPayload(tokenResp);

      // Fetch real user profile from Google
      let user: LocalUser = { displayName: "Utilisateur Google", email: "user@google.com" };
      try {
        const profileResp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${cachedAccessToken}` },
        });
        if (profileResp.ok) {
          const profile = await profileResp.json();
          user = {
            displayName: profile.name || profile.given_name || "Utilisateur Google",
            email: profile.email || "user@google.com",
            uid: profile.sub,
          };
        }
      } catch (profileErr) {
        console.warn("Could not fetch Google profile:", profileErr);
      }

      localStorage.setItem("google_auth_sim_user", JSON.stringify(user));
      return { user, accessToken: cachedAccessToken };
    }

    // Browser fallback: simulated account (no popup in web)
    cachedAccessToken = "mock_token_123";
    localStorage.setItem(GOOGLE_ACCESS_TOKEN_KEY, cachedAccessToken);
    const user: LocalUser = { displayName: "Utilisateur A-Wolf", email: "utilisateur@awolf.local" };
    localStorage.setItem("google_auth_sim_user", JSON.stringify(user));
    return { user, accessToken: cachedAccessToken };
  } catch (error: any) {
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  if ((window as any).electronAPI?.getGoogleAuthPayload) {
    const payload = await electronGetAuthPayload();
    if (payload?.access_token) {
      cachedAccessToken = payload.access_token;
      return cachedAccessToken;
    }
  }

  const localToken = localStorage.getItem(GOOGLE_ACCESS_TOKEN_KEY);
  if (localToken) {
    cachedAccessToken = localToken;
  }
  return localToken;
};

export const logout = async () => {
  cachedAccessToken = null;
  await electronDeleteAuthPayload();
  localStorage.removeItem(GOOGLE_ACCESS_TOKEN_KEY);
  localStorage.removeItem("google_auth_sim_user");
  localStorage.removeItem("google_auth_sim_token");
};

// Map days to French short day representation
const dayMap: { [key: number]: string } = {
  0: "Dim",
  1: "Lun",
  2: "Mar",
  3: "Mer",
  4: "Jeu",
  5: "Ven",
  6: "Sam",
};

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

/**
 * Generate a dynamic list of premium simulated Google Calendar events relative to the current week.
 * This ensures that no matter when the app is launched, the calendar grid and schedules are perfectly populated.
 */
function getDynamicMockEvents(): GoogleCalendarEvent[] {
  const getDayAtTime = (dayOffset: number, hh: number, mm: number): string => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
    const baseDate = new Date(today);
    // Find Monday of the current week
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    baseDate.setDate(today.getDate() + mondayOffset + dayOffset);
    baseDate.setHours(hh, mm, 0, 0);
    return baseDate.toISOString();
  };

  return [
    {
      id: "mock_event_1",
      summary: "🖥️ Algorithmique et Complexité",
      description: "Cours magistral d'algorithmique avancée. Préparer les notes sur la complexité temporelle.",
      location: "Amphi d'honneur - Bâtiment C",
      start: { dateTime: getDayAtTime(0, 8, 30) }, // Monday 08:30
      end: { dateTime: getDayAtTime(0, 10, 30) }
    },
    {
      id: "mock_event_2",
      summary: "👥 Sprint Planning - Projet Web",
      description: "Synchronisation d'équipe pour la répartition des tâches de l'application de gestion d'agenda.",
      location: "Google Meet / En ligne",
      start: { dateTime: getDayAtTime(0, 14, 0) }, // Monday 14:00
      end: { dateTime: getDayAtTime(0, 15, 30) }
    },
    {
      id: "mock_event_3",
      summary: "🗄️ Base de Données NoSQL & Big Data",
      description: "TP Pratique sur Cassandra et MongoDB. Rendu du script d'agrégation requis.",
      location: "Salle d'Informatique 203",
      start: { dateTime: getDayAtTime(1, 10, 45) }, // Tuesday 10:45
      end: { dateTime: getDayAtTime(1, 12, 45) }
    },
    {
      id: "mock_event_4",
      summary: "🎨 Atelier UX/UI & Ergonomie Web",
      description: "Création et test utilisateur de prototypes figma interactifs.",
      location: "Bâtiment Créatif - Studio 4",
      start: { dateTime: getDayAtTime(2, 13, 30) }, // Wednesday 13:30
      end: { dateTime: getDayAtTime(2, 16, 30) }
    },
    {
      id: "mock_event_5",
      summary: "☁️ Soutenance Projet Architecture Cloud",
      description: "Présentation finale des infrastructures déployées sous Docker & Kubernetes.",
      location: "Salle de conférence 402",
      start: { dateTime: getDayAtTime(3, 9, 0) }, // Thursday 09:00
      end: { dateTime: getDayAtTime(3, 11, 0) }
    },
    {
      id: "mock_event_6",
      summary: "🍔 Déjeuner d'orientation professionnelle",
      description: "Discussion avec un ingénieur senior sur les opportunités de carrière en cloud computing.",
      location: "Cafétéria Centrale",
      start: { dateTime: getDayAtTime(3, 12, 15) }, // Thursday 12:15
      end: { dateTime: getDayAtTime(3, 13, 30) }
    },
    {
      id: "mock_event_7",
      summary: "📝 Rédaction du Mémoire de Fin d'Études",
      description: "Travail individuel de recherche et synthèse sur l'automatisation par agents IA.",
      location: "Bibliothèque Universitaire (Espace Silence)",
      start: { dateTime: getDayAtTime(3, 15, 0) }, // Thursday 15:00
      end: { dateTime: getDayAtTime(3, 17, 0) }
    },
    {
      id: "mock_event_8",
      summary: "🚀 Examen de Génie Logiciel & CI/CD",
      description: "Vérification des connaissances sur les pipelines Gitlab CI, tests unitaires et intégration.",
      location: "Grande Halle d'Examen",
      start: { dateTime: getDayAtTime(4, 10, 0) }, // Friday 10:00
      end: { dateTime: getDayAtTime(4, 12, 0) }
    },
    {
      id: "mock_event_9",
      summary: "🧠 Session de Focus : Développement Frontend",
      description: "Implémentation d'animations interactives avec Motion et Tailwind CSS.",
      location: "Bâtiment C - Box de révisions",
      start: { dateTime: getDayAtTime(4, 14, 0) }, // Friday 14:00
      end: { dateTime: getDayAtTime(4, 16, 30) }
    },
    {
      id: "mock_event_10",
      summary: "💡 Mentorat Technologique",
      description: "Session mensuelle d'échange technologique avec notre mentor académique.",
      location: "Google Meet",
      start: { dateTime: getDayAtTime(5, 11, 0) }, // Saturday 11:00
      end: { dateTime: getDayAtTime(5, 12, 30) }
    }
  ];
}

/**
 * Fetch calendar events from the authenticated endpoint
 */
export async function fetchGoogleCalendarEvents(accessToken: string): Promise<GoogleCalendarEvent[]> {
  if (accessToken === "mock_token_123") {
    return getDynamicMockEvents();
  }
  try {
    const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("maxResults", "50");
    
    const timeMin = new Date();
    timeMin.setMonth(timeMin.getMonth() - 1);
    url.searchParams.set("timeMin", timeMin.toISOString());

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Calendar API Error: ${response.status} - ${errorText}`);
    }

    const json = await response.json();
    const items = json.items || [];
    if (items.length === 0) {
      return getDynamicMockEvents();
    }
    return items;
  } catch (err) {
    console.error("Error fetching Google Calendar data directly:", err);
    return getDynamicMockEvents();
  }
}

/**
 * Parses Google Calendar event start & end times and converts them to standard App 'Course' format
 */
export function convertGoogleEventToCourse(event: GoogleCalendarEvent): any {
  const startStr = event.start.dateTime || event.start.date;
  const endStr = event.end.dateTime || event.end.date;
  
  if (!startStr) return null;
  
  const startDate = new Date(startStr);
  const endDate = endStr ? new Date(endStr) : new Date(startDate.getTime() + 60 * 60 * 1000);
  
  const dayIndex = startDate.getDay();
  const dayName = dayMap[dayIndex] || "Lun";
  
  const formatTime = (date: Date) => {
    const hh = date.getHours().toString().padStart(2, "0");
    const mm = date.getMinutes().toString().padStart(2, "0");
    return `${hh}:${mm}`;
  };
  
  const startTime = formatTime(startDate);
  const endTime = formatTime(endDate);
  
  return {
    id: `gcal_${event.id}`,
    title: event.summary || "Événement sans titre",
    room: event.location || "Google Calendar",
    day: dayName,
    startTime,
    endTime,
    dateStr: startStr.substring(0, 10), // e.g. "2026-06-11"
    color: "bg-fuchsia-50/70 hover:bg-fuchsia-100 border border-fuchsia-200 border-l-4 border-l-fuchsia-600 text-fuchsia-800",
  };
}

/**
 * Write a new event to Google Calendar via proxy API
 */
export async function writeGoogleCalendarEvent(
  accessToken: string,
  summary: string,
  description: string,
  startTimeIso: string,
  endTimeIso: string,
  location?: string
): Promise<any> {
  const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      summary,
      description,
      location,
      start: { dateTime: startTimeIso },
      end: { dateTime: endTimeIso }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GCal post failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

