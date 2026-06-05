"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import {
  mapCertificationsToGroups,
  type CertificationGroup,
} from "@/lib/certifications-view";
import { getSessionUid, syncSessionFromProfile } from "@/lib/session";
import {
  fetchUserProfile,
  type FirestoreUserProfile,
} from "@/lib/user-profile";

type PageError = "not_signed_in" | "profile_not_found" | "fetch_failed" | null;

export default function CertificationsPage() {
  const [user, setUser] = useState<FirestoreUserProfile | null>(null);
  const [certGroups, setCertGroups] = useState<CertificationGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<PageError>(null);

  const loadProfile = useCallback(async (uid: string) => {
    setIsLoading(true);
    setError(null);

    const { profile, error: fetchError } = await fetchUserProfile(uid);

    if (fetchError || !profile) {
      setUser(null);
      setCertGroups([]);
      setError(fetchError ?? "fetch_failed");
      setIsLoading(false);
      return;
    }

    setUser(profile);
    setCertGroups(mapCertificationsToGroups(profile));
    syncSessionFromProfile(profile);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const uid = getSessionUid();

    if (!uid) {
      setError("not_signed_in");
      setIsLoading(false);
      return;
    }

    loadProfile(uid);
  }, [loadProfile]);

  // Tracks cursor coordinates over cards to calculate real-time glossy lighting reflections
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left; 
    const y = e.clientY - rect.top;  
    
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <AppShell currentTab="mycertifications">
      {/* Scoped CSS styling for transparent, highly polished badge card components */}
      <style dangerouslySetInnerHTML={{ __html: `
        .badge-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 18px;
          padding: 4px 0 24px 0;
        }
        .badge-card {
          --mouse-x: 0px;
          --mouse-y: 0px;
          background: rgba(13, 16, 23, 0.45);
          border: 1px solid #191f2e;
          border-radius: 14px;
          padding: 26px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          overflow: hidden;
          transition: border-color 0.4s, transform 0.4s, background-color 0.4s, box-shadow 0.4s;
        }
        
        /* Cursor dynamic tracking radial glow spotlight layer */
        .badge-card:not(.is-locked)::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(
            300px circle at var(--mouse-x) var(--mouse-y),
            rgba(255, 255, 255, 0.08),
            transparent 65%
          );
          z-index: 1;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .badge-card:not(.is-locked):hover::before {
          opacity: 1;
        }
        .badge-card:not(.is-locked):hover {
          transform: translateY(-4px);
          border-color: rgba(167, 139, 250, 0.3);
          background: rgba(19, 24, 36, 0.8);
          box-shadow: 0 12px 30px -10px rgba(0, 0, 0, 0.6), 
                      0 0 20px -2px rgba(167, 139, 250, 0.05);
        }
        .badge-card:not(.is-locked):hover .badge-naked-icon {
          transform: scale(1.06);
        }
        .badge-card.is-locked {
          opacity: 0.25;
          cursor: not-allowed;
        }
        
        /* Transparent framing wrapper for standalone emblems */
        .badge-icon-frame {
          width: 84px;
          height: 84px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          background: none !important;
          border: none !important;
          box-shadow: none !important;
          position: relative;
          z-index: 2;
        }
        .badge-naked-icon {
          font-size: 54px;
          line-height: 1;
          user-select: none;
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2), filter 0.4s;
        }

        /* State 1: Locked or Not Attempted (Subdued silver metallic sheen mask) */
        .badge-card.is-subdued-icon .badge-naked-icon {
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.45)) grayscale(0.2) brightness(0.9);
          background: linear-gradient(135deg, #ffffff 30%, #94a3b8 60%, #ffffff 85%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* State 2: Passed (Unmasked - Vivid full original color visibility with crisp backing drop shadow) */
        .badge-card.is-passed-icon .badge-naked-icon {
          filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.55)) brightness(1.05);
          background: none;
          -webkit-background-clip: initial;
          -webkit-text-fill-color: initial;
        }
        .badge-card.is-passed-icon:hover .badge-naked-icon {
          filter: drop-shadow(0 8px 16px rgba(167, 139, 250, 0.25)) brightness(1.1);
        }

        .badge-card-content {
          position: relative;
          z-index: 2;
          width: 100%;
        }
        .badge-status-pill {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 20px;
          margin-top: 14px;
          display: inline-block;
          background: rgba(255, 255, 255, 0.04);
          color: #566275;
          border: 1px solid rgba(255, 255, 255, 0.02);
        }
        .status-passed {
          background: rgba(16, 185, 129, 0.08);
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.2);
        }
        .status-locked {
          background: rgba(239, 68, 68, 0.04);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.1);
        }
      `}} />

      <div className="ph">
        <h2>My Certifications</h2>

        {user ? (
          <p
            style={{
              color: "var(--purple-l, #A78BFA)",
              fontWeight: 600,
              marginBottom: "4px",
            }}
          >
            Learner Profile: {user.name} ({user.team})
          </p>
        ) : null}

        <p>Your earned certifications and assessment history across all products.</p>
      </div>

      {isLoading ? (
        <div className="empty">
          <div className="empty-ico">⏳</div>
          <p>Loading your certification profile...</p>
        </div>
      ) : error === "not_signed_in" ? (
        <div className="empty">
          <div className="empty-ico">🔐</div>
          <p>Sign in to view your certifications.</p>
          <Link href="/" style={{ color: "var(--purple-l, #A78BFA)", marginTop: "12px" }}>
            Go to sign in
          </Link>
        </div>
      ) : error === "profile_not_found" ? (
        <div className="empty">
          <div className="empty-ico">⚠️</div>
          <p>Your Firestore profile was not found. Complete signup or contact an admin.</p>
        </div>
      ) : error === "fetch_failed" ? (
        <div className="empty">
          <div className="empty-ico">⚠️</div>
          <p>Could not load your profile. Please try again later.</p>
        </div>
      ) : certGroups.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {certGroups.map((group) => (
            <div key={group.id}>
              {/* Product Group Section Headers */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: 600,
                  fontSize: "12px",
                  color: "#6b7280",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  paddingBottom: "8px",
                  borderBottom: "1px solid var(--border, #1e2330)",
                  marginBottom: "14px"
                }}
              >
                <span>{group.icon}</span>
                <span>{group.title}</span>
              </div>

              {/* Flexible Compact Badge Grid */}
              <div className="badge-grid">
                {group.certifications.map((cert) => {
                  const isLocked = cert.status?.toLowerCase() === "locked";
                  const isPassed = cert.status?.toLowerCase() === "passed";
                  
                  return (
                    <div 
                      key={`${group.id}-${cert.name}`} 
                      className={`badge-card ${isLocked ? 'is-locked' : ''} ${isPassed ? 'is-passed-icon' : 'is-subdued-icon'}`}
                      onMouseMove={isLocked ? undefined : handleMouseMove}
                    >
                      {/* Naked Icon Frame */}
                      <div className="badge-icon-frame">
                        <span className="badge-naked-icon">
                          {cert.name.includes("PathFinder") ? "🧭" : cert.name.includes("Navigator") ? "🗺️" : "🏆"}
                        </span>
                      </div>

                      <div className="badge-card-content">
                        {/* Headers */}
                        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#fff", margin: "0 0 2px 0", letterSpacing: "0.01em" }}>
                          {cert.name}
                        </h3>
                        {cert.subtext ? (
                          <p style={{ fontSize: "11px", color: "var(--text-muted, #566275)", margin: "0 0 12px 0", lineHeight: "1.35" }}>
                            {cert.subtext}
                          </p>
                        ) : null}

                        {/* Best Score Metric Block */}
                        <div style={{ margin: "6px 0" }}>
                          <span style={{ fontSize: "9px", color: "var(--text-muted, #566275)", display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Best Score
                          </span>
                          <span style={{ fontSize: "22px", fontWeight: 700, color: isLocked || cert.bestScore === "—" ? "var(--text-muted, #566275)" : "#fff" }}>
                            {isLocked ? "—" : cert.bestScore}
                          </span>
                        </div>

                        {/* Custom Contextual Status Pills */}
                        {isLocked ? (
                          <div className="badge-status-pill status-locked">🔒 Locked</div>
                        ) : isPassed ? (
                          <div className="badge-status-pill status-passed">Passed</div>
                        ) : (
                          <div className="badge-status-pill">{cert.status || "Not Attempted"}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">
          <div className="empty-ico">🎖️</div>
          <p>No certification data on your profile yet.</p>
        </div>
      )}
    </AppShell>
  );
}