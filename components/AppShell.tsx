"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// 1. Bring in your session loader function (or import it if it's in another file)
function loadSavedSession() {
  try {
    const raw = localStorage.getItem('ace2_session_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (_err) {
    localStorage.removeItem('ace2_session_user');
    return null;
  }
}

interface UserType {
  name: string;
  team: string;
  role: "admin" | "learner";
  av: string;
}

interface AppShellProps {
  children: React.ReactNode;
  currentTab: string;
}

const DEFAULT_USER: UserType = {
  name: "Anish Kumar",
  team: "TAC",
  role: "learner",
  av: "AK",
};

function normalizeUser(savedUser: { name?: string; team?: string; role?: string; av?: string }): UserType {
  return {
    name: savedUser.name || DEFAULT_USER.name,
    team: savedUser.team || DEFAULT_USER.team,
    role: savedUser.role === "admin" ? "admin" : "learner",
    // Fallback initials generator if 'av' doesn't exist in localstorage
    av: savedUser.av || (savedUser.name ? savedUser.name.split(" ").map((n: string) => n[0]).join("").toUpperCase() : "AK"),
  };
}

// Each routed page renders its own <AppShell>, so the shell remounts on every
// navigation. Caching the resolved user at module scope lets a remount paint the
// correct user/admin state in the first frame instead of flashing the default
// user and popping the Admin section in after the effect runs.
let cachedUser: UserType | null = null;

export default function AppShell({ children, currentTab }: AppShellProps) {
  const router = useRouter();

  // 2. Initialize from the cached session (falls back to default on first load / SSR)
  const [user, setUser] = useState<UserType>(cachedUser ?? DEFAULT_USER);

  // 3. Load the session safely after mounting on the client side
  useEffect(() => {
    const savedUser = loadSavedSession();
    if (savedUser) {
      const normalized = normalizeUser(savedUser);
      cachedUser = normalized;
      setUser(normalized);
    }
  }, []);

  const hrefFor = (tabName: string) => (tabName === "dash" ? "/" : `/${tabName}`);

  const handleLogout = () => {
    // 4. Clear localStorage on logout
    cachedUser = null;
    localStorage.removeItem('ace2_session_user');
    localStorage.clear();
    console.log("Signing out user...");
    router.push("/");
  };

  return (
    <div id="app" className="on">
      {/* ─── TOPBAR ─── */}
      <div className="topbar">
        <div className="tb-left">
          <div className="tb-logo">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="26" height="26" rx="5" fill="#FF6B00"/>
              <text x="13" y="18" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="11" fill="white">GO</text>
            </svg>
            <span className="tb-brand">ACE Academy</span>
          </div>
          <div className="tb-divider"></div>
          <span className="tb-tag">Automation Certification &amp; Excellence</span>
        </div>

        <div className="tb-right">
          <div className="user-chip">
            <div className="u-av" id="uAv">{user.av}</div>
            <div>
              <div className="u-name" id="uName">{user.name}</div>
              <div className="u-team" id="uTeam">{user.team} · {user.role === "admin" ? "Admin" : "Learner"}</div>
            </div>
          </div>
          <button className="btn-out" onClick={handleLogout}>Sign out</button>
        </div>
      </div>

      {/* ─── MAIN LAYOUT CONTAINER ─── */}
      <div className="shell">
        {/* ─── SIDEBAR ─── */}
        <div className="sidebar" id="sidebar">
          <div className="sid-label">Learn</div>

          <Link href={hrefFor("dash")} prefetch className={`nav ${currentTab === "dash" ? "on" : ""}`}>
            <span className="nav-ico">⊞</span>Dashboard
          </Link>
          <Link href={hrefFor("syllabus")} prefetch className={`nav ${currentTab === "syllabus" ? "on" : ""}`}>
            <span className="nav-ico">◈</span>Syllabus
          </Link>
          <Link href={hrefFor("assessment")} prefetch className={`nav ${currentTab === "assessment" ? "on" : ""}`}>
            <span className="nav-ico">✎</span>Assessments
          </Link>
          <Link href={hrefFor("certifications")} prefetch className={`nav ${currentTab === "certifications" ? "on" : ""}`}>
            <span className="nav-ico">◎</span>My Certifications
          </Link>
          <Link href={hrefFor("globalCourse")} prefetch className={`nav ${currentTab === "globalCourse" ? "on" : ""}`}>
            <span className="nav-ico">◎</span>Global Course
          </Link>

          {/* Conditional Admin Sidebar Rendering */}
          {user.role === "admin" && (
            <>
              <div className="sid-label">Admin</div>
              <Link href={hrefFor("manageprogram")} prefetch className={`nav ${currentTab === "manageprogram" ? "on" : ""}`}>
                <span className="nav-ico">⚙</span>Manage Program
              </Link>
              <Link href={hrefFor("scores")} prefetch className={`nav ${currentTab === "scores" ? "on" : ""}`}>
                <span className="nav-ico">≡</span>All Scores
              </Link>
            </>
          )}
        </div>

        {/* ─── DYNAMIC SCREEN CONTENT DISPLAY ─── */}
        <div className="main" id="main">
          {children}
        </div>
      </div>
    </div>
  );
}
