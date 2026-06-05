"use client";

import { useEffect, useMemo, useState } from "react";
import { CMETA, PERSONA_CERTS, type CertId } from "@/lib/academy-data";
import { CURRICULUM, type ProductCurriculum } from "@/lib/curriculum";
import type { User } from "@/lib/auth";

type DoneRecord = Record<string, Record<string, string>>;

type SyllabusPageProps = {
  user: User;
};

function getDone() {
  const stored = window.localStorage.getItem("ace2_done");
  return stored ? (JSON.parse(stored) as DoneRecord) : {};
}

function saveDone(done: DoneRecord) {
  window.localStorage.setItem("ace2_done", JSON.stringify(done));
}

function visibleCerts(user: User, product: ProductCurriculum) {
  const allowed = PERSONA_CERTS[user.team] ?? PERSONA_CERTS.default;
  return product.certs.filter((certId) => allowed.includes(certId));
}

export default function SyllabusPage({ user }: SyllabusPageProps) {
  const [selectedProductId, setSelectedProductId] =
    useState<ProductCurriculum["id"]>("rtp");
  const selectedProduct =
    CURRICULUM.find((product) => product.id === selectedProductId) ?? CURRICULUM[0];
  const certs = useMemo(() => visibleCerts(user, selectedProduct), [selectedProduct, user]);
  const [selectedLevel, setSelectedLevel] = useState<CertId>(certs[0]);
  const [doneState, setDoneState] = useState<DoneRecord>(() => getDone());
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!certs.includes(selectedLevel)) {
      setSelectedLevel(certs[0]);
    }
  }, [certs, selectedLevel]);

  async function markDone(key: string) {
    const next = { ...doneState };
    if (!next[user.id]) next[user.id] = {};
    next[user.id][key] = new Date().toISOString();
    setDoneState(next);
    saveDone(next);

    try {
      const response = await fetch("/api/firebase/user-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: user.id,
          done: next[user.id],
        }),
      });

      if (!response.ok) {
        console.warn("Failed to sync progress to Firestore.");
      }
    } catch (error) {
      console.warn("Failed to sync progress to Firestore.", error);
    }
  }

  return (
    <div id="pg-syllabus">
      <div className="ph">
        <h2>Syllabus</h2>
        <p>
          Browse curriculum content, access documentation and recommended videos for
          each module.
        </p>
      </div>

      <div className="ptabs">
        {CURRICULUM.map((product) => (
          <button
            className={`ptab ${product.id} ${selectedProduct.id === product.id ? "on" : ""}`}
            key={product.id}
            type="button"
            onClick={() => setSelectedProductId(product.id)}
          >
            {product.icon} {product.name}
          </button>
        ))}
      </div>

      <div className="ltabs">
        {certs.map((certId) => (
          <button
            className={`ltab ${certId} ${selectedLevel === certId ? "on" : ""}`}
            key={certId}
            type="button"
            onClick={() => setSelectedLevel(certId)}
          >
            {CMETA[certId].icon} {CMETA[certId].name}
          </button>
        ))}
      </div>

      {selectedProduct.sections.map((section) => (
        <div key={section.title}>
          <div className="sec-label">◆ {section.title}</div>
          <div className="mod-grid">
            {section.mods.map((module) => {
              const key = `${selectedProduct.id}-${module.code}-${selectedLevel}`;
              const isDone = Boolean(doneState[user.id]?.[key]);
              const isOpen = Boolean(openCards[key]);
              return (
                <article className={`mod-card ${isDone ? "mod-done" : ""}`} key={key}>
                  <button
                    className="mod-head"
                    type="button"
                    onClick={() => setOpenCards((prev) => ({ ...prev, [key]: !isOpen }))}
                  >
                    <span className="mod-code">{module.code}</span>
                    <span className="mod-title">{module.title}</span>
                    {isDone ? <span className="done-tag">✓ Done</span> : null}
                    <span className="mod-chev">{isOpen ? "▲" : "▼"}</span>
                  </button>
                  {isOpen ? (
                    <div className="mod-body">
                      <div className="mod-content-text">
                        {module.content[selectedLevel] ??
                          "Content will be available once documentation is complete."}
                      </div>
                      <div className="mod-links">
                        {module.docLink ? (
                          <a
                            className="mod-link doc"
                            href={module.docLink}
                            rel="noreferrer"
                            target="_blank"
                          >
                            📄 Confluence Doc
                          </a>
                        ) : null}
                        {module.videoLink ? (
                          <a
                            className="mod-link vid"
                            href={module.videoLink}
                            rel="noreferrer"
                            target="_blank"
                          >
                            ▶ {module.videoTitle ?? "Watch Video"}
                          </a>
                        ) : null}
                        {!module.docLink && !module.videoLink ? (
                          <span className="no-link-note">
                            Documentation links will be added by admin
                          </span>
                        ) : null}
                        <button
                          className={`btn-done ${isDone ? "done-state" : ""}`}
                          disabled={isDone}
                          onClick={() => markDone(key)}
                          type="button"
                        >
                          {isDone ? "✓ Completed" : "Mark as Done"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
