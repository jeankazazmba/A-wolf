// Simple local username/password auth for desktop-only use.
// Stores users in localStorage under 'awolf_local_users'. Passwords are hashed with SHA-256.

const LOCAL_USERS_KEY = "awolf_local_users";
export const LOCAL_SESSION_KEY = "awolf_local_session"; // Clé de persistance de session locale

export type LocalAuthUser = { username: string; displayName?: string; email?: string };

const SALT_PEPPER = "awolf_custom_secure_pepper_2026";

async function sha256Hex(message: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const msgUint8 = enc.encode(message + salt + SALT_PEPPER);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function loadUsers(): Record<string, any> {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY) || "{}";
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function saveUsers(users: Record<string, any>) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    return true;
  } catch (e) {
    console.error("Failed to save local users:", e);
    return false;
  }
}

export async function registerLocalUser(username: string, password: string, displayName?: string, email?: string): Promise<LocalAuthUser> {
  const uname = username.trim().toLowerCase();
  if (!uname || !password) throw new Error("Invalid username or password");
  const users = loadUsers();
  if (users[uname]) throw new Error("Utilisateur existant");
  const hash = await sha256Hex(password, uname);
  users[uname] = { hash, displayName: displayName || uname, email: email || "" };
  saveUsers(users);
  const user: LocalAuthUser = { username: uname, displayName: displayName || uname, email: email || "" };
  // Fix: persister la session pour la restaurer au rechargement
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
  return user;
}

export async function loginLocalUser(username: string, password: string): Promise<LocalAuthUser> {
  const uname = username.trim().toLowerCase();
  if (!uname || !password) throw new Error("Invalid username or password");
  const users = loadUsers();
  const entry = users[uname];
  if (!entry) throw new Error("Utilisateur introuvable");
  const hash = await sha256Hex(password, uname);
  if (hash !== entry.hash) throw new Error("Mot de passe invalide");
  const user: LocalAuthUser = { username: uname, displayName: entry.displayName || uname, email: entry.email || "" };
  // Fix: persister la session pour la restaurer au rechargement
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
  return user;
}

export function listLocalUsers(): LocalAuthUser[] {
  const users = loadUsers();
  return Object.keys(users).map(u => ({ username: u, displayName: users[u].displayName, email: users[u].email }));
}
