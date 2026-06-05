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

  return (
    <AppShell currentTab="mycertifications">
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
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {certGroups.map((group) => (
            <div
              key={group.id}
              className="cert-panel"
              style={{
                background: "var(--surface, #11141a)",
                borderRadius: "8px",
                border: "1px solid var(--border, #1e2330)",
                overflow: "hidden",
              }}
            >
              <div
                className="cert-panel-header"
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border, #1e2330)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: 600,
                  color: "#fff",
                }}
              >
                <span>{group.icon}</span>
                <span>{group.title}</span>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                    fontSize: "14px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--border, #1e2330)",
                        color: "var(--text-muted, #566275)",
                        textTransform: "uppercase",
                        fontSize: "11px",
                        letterSpacing: "0.05em",
                      }}
                    >
                      <th style={{ padding: "12px 20px" }}>Certification</th>
                      <th style={{ padding: "12px 20px" }}>Best Score</th>
                      <th style={{ padding: "12px 20px" }}>Attempts</th>
                      <th style={{ padding: "12px 20px" }}>Status</th>
                      <th style={{ padding: "12px 20px" }}>Last Attempt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.certifications.map((cert) => {
                      const isLocked = cert.status?.toLowerCase() === "locked";
                      
                      return (
                        <tr
                          key={`${group.id}-${cert.name}`}
                          style={{
                            borderBottom: "1px solid var(--border, #1e2330)",
                            opacity: isLocked ? 0.6 : 1, // Subtle opacity fade for locked certifications
                          }}
                        >
                          <td style={{ padding: "16px 20px" }}>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "2px",
                              }}
                            >
                              <span style={{ fontWeight: 600, color: isLocked ? "var(--text-muted, #566275)" : "#fff" }}>
                                {cert.name}
                              </span>
                              {cert.subtext ? (
                                <span
                                  style={{
                                    fontSize: "12px",
                                    color: "var(--text-muted, #566275)",
                                  }}
                                >
                                  {cert.subtext}
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "16px 20px",
                              color:
                                cert.bestScore === "—" || isLocked
                                  ? "var(--text-muted, #566275)"
                                  : "#fff",
                            }}
                          >
                            {isLocked ? "—" : cert.bestScore}
                          </td>
                          <td
                            style={{
                              padding: "16px 20px",
                              color:
                                cert.attempts === 0 || isLocked
                                  ? "var(--text-muted, #566275)"
                                  : "#fff",
                            }}
                          >
                            {isLocked ? 0 : cert.attempts}
                          </td>
                          <td style={{ padding: "16px 20px" }}>
                            {isLocked ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  color: "#ef4444", // Crimson/Red text color for locked states
                                  fontWeight: 500,
                                }}
                              >
                                🔒 Locked
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-muted, #566275)" }}>
                                {cert.status}
                              </span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: "16px 20px",
                              color: "var(--text-muted, #566275)",
                            }}
                          >
                            {isLocked ? "—" : cert.lastAttempt}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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