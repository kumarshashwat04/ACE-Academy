"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

export default function AppShell({ children, currentTab }: AppShellProps) {
  const router = useRouter();
  
  // 2. Initialize state with your fallback default user
  const [user, setUser] = useState<UserType>({
    name: "Anish Kumar",
    team: "TAC",
    role: "admin",
    av: "AK"
  });

  // 3. Load the session safely after mounting on the client side
  useEffect(() => {
    const savedUser = loadSavedSession();
    if (savedUser) {
      setUser({
        name: savedUser.name || "Anish Kumar",
        team: savedUser.team || "TAC",
        role: savedUser.role === "admin" ? "admin" : "learner",
        // Fallback initials generator if 'av' doesn't exist in localstorage
        av: savedUser.av || (savedUser.name ? savedUser.name.split(" ").map((n: string) => n[0]).join("").toUpperCase() : "AK")
      });
    }
  }, []);

  const handleNavigation = (tabName: string) => {
    if (tabName === "dash") {
      router.push("/");
    } else {
      router.push(`/${tabName}`);
    }
  };

  const handleLogout = () => {
    // 4. Clear localStorage on logout
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
          
          <div className={`nav ${currentTab === "dash" ? "on" : ""}`} onClick={() => handleNavigation("dash")}>
            <span className="nav-ico">⊞</span>Dashboard
          </div>
          <div className={`nav ${currentTab === "syllabus" ? "on" : ""}`} onClick={() => handleNavigation("syllabus")}>
            <span className="nav-ico">◈</span>Syllabus
          </div>
          <div className={`nav ${currentTab === "assessment" ? "on" : ""}`} onClick={() => handleNavigation("assessment")}>
            <span className="nav-ico">✎</span>Assessments
          </div>
          <div className={`nav ${currentTab === "certifications" ? "on" : ""}`} onClick={() => handleNavigation("certifications")}>
            <span className="nav-ico">◎</span>My Certifications
          </div>
           <div className={`nav ${currentTab === "globalCourse" ? "on" : ""}`} onClick={() => handleNavigation("globalCourse")}>
            <span className="nav-ico">◎</span>Global Course
          </div>

          {/* Conditional Admin Sidebar Rendering */}
          {user.role === "admin" && (
            <>
              <div className="sid-label">Admin</div>
              <div className={`nav ${currentTab === "manageprogram" ? "on" : ""}`} onClick={() => handleNavigation("manageprogram")}>
                <span className="nav-ico">⚙</span>Manage Program
              </div>
              <div className={`nav ${currentTab === "scores" ? "on" : ""}`} onClick={() => handleNavigation("scores")}>
                <span className="nav-ico">≡</span>All Scores
              </div>
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