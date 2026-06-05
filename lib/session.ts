import type { FirestoreUserProfile } from "@/lib/user-profile";

const SESSION_KEY = "ace2_session_user";

export type SessionUser = {
  id: string;
  name: string;
  email?: string;
  team: string;
  role: "admin" | "learner";
  av: string;
  level?: number;
  allowedLevel?: number;
  certifications?: FirestoreUserProfile["certifications"];
};

export function getSessionUid(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as { id?: string };
    return typeof session?.id === "string" ? session.id : null;
  } catch {
    return null;
  }
}

function initialsFromName(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "LN"
  );
}

export function syncSessionFromProfile(profile: FirestoreUserProfile): void {
  if (typeof window === "undefined") return;

  const session: SessionUser = {
    id: profile.uid,
    name: profile.name,
    email: profile.email,
    team: profile.team,
    role: profile.role,
    av: initialsFromName(profile.name),
    level: profile.level,
    allowedLevel: profile.allowedLevel,
    certifications: profile.certifications,
  };

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
