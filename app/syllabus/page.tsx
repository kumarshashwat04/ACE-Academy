"use client";

import { useState, useEffect } from "react";
import AppShell from "../../components/AppShell";

// Native navigation mappings to bind cleanly against your CSS definitions
const COURSE_TABS = [
  { id: "rtp", name: "Ranger RTP", icon: "🤖", cssClass: "rtp" },
  { id: "ttp", name: "Ranger TTP", icon: "📦", cssClass: "ttp" },
  { id: "tools", name: "Tools & Techniques", icon: "🛠️", cssClass: "tools" },
];

interface ModuleResource {
  label: string;
  type: string;
  url: string;
}

interface Module {
  code: string;
  title: string;
  description: string;
  resources?: ModuleResource[];
}

interface Topic {
  title: string;
  modules: Module[];
}

interface Level {
  name: string;
  topics: Topic[];
}

interface SyllabusData {
  id: string;
  name: string;
  levels: Level[];
}

export default function SyllabusPage() {
  const [activeId, setActiveId] = useState<string>("rtp");
  const [activeLevel, setActiveLevel] = useState<string>("pathfinder");
  const [syllabus, setSyllabus] = useState<SyllabusData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Dynamic Firebase data tracking logic hook 
  useEffect(() => {
    async function fetchSyllabusData() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/firebase/syllabus/${activeId}`);
        if (response.ok) {
          const data: SyllabusData = await response.json();
          setSyllabus(data);
          
          if (data?.levels && data.levels.length > 0) {
            setActiveLevel(data.levels[0].name.toLowerCase().replace(/\s+/g, ""));
          }
        }
      } catch (err) {
        console.error("Error connecting with syllabus data tree:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSyllabusData();
    setExpandedModules({});
  }, [activeId]);

  const currentLevelData = syllabus?.levels?.find(
    (l) => l.name.toLowerCase().replace(/\s+/g, "") === activeLevel.toLowerCase()
  );

  return (
    <AppShell currentTab="syllabus">
      <div className="ph">
        <h2>Syllabus</h2>
        <p>Browse curriculum content, access documentation and recommended videos for each module.</p>
      </div>

      {/* Product tabs system utilizing your native stylesheet hooks */}
      <div className="ptabs">
        {COURSE_TABS.map((tab) => {
          const isActive = activeId === tab.id;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveId(tab.id)}
              className={`ptab ${tab.cssClass} ${isActive ? "on" : ""}`}
            >
              <span>{tab.icon}</span>
              {tab.name}
            </div>
          );
        })}
      </div>

      {/* Track levels switcher subheader system bar (.ltabs) */}
      {!isLoading && syllabus && syllabus.levels?.length > 0 && (
        <div className="ltabs">
          {syllabus.levels.map((level) => {
            const cleanName = level.name.toLowerCase().replace(/\s+/g, "");
            const isActive = activeLevel === cleanName;
            return (
              <div
                key={level.name}
                onClick={() => setActiveLevel(cleanName)}
                className={`ltab ${cleanName} ${isActive ? "on" : ""}`}
                style={{ textTransform: "capitalize" }}
              >
                {level.name}
              </div>
            );
          })}
        </div>
      )}

      {/* Syllabus Layout Content Block mapping directly over native CSS grids */}
      {isLoading ? (
        <div className="empty">
          <div className="empty-ico">⏳</div>
          <p>Loading curriculum infrastructure configuration...</p>
        </div>
      ) : currentLevelData ? (
        <div>
          {currentLevelData.topics.map((topic, tIdx) => (
            <div key={tIdx} style={{ marginBottom: "28px" }}>
              
              {/* Category Segment Label Section */}
              <div className="sec-label">
                <span>◆</span>
                {topic.title}
              </div>

              {/* Native Double-Column Layout Grid */}
              <div className="mod-grid">
                {topic.modules.map((mod, mIdx) => {
                  const moduleUniqueKey = mod.code || `${tIdx}-${mIdx}`;
                  const isOpened = !!expandedModules[moduleUniqueKey];

                  return (
                    <div
                      key={moduleUniqueKey}
                      className={`mod-card ${isOpened ? "open" : ""}`}
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)"
                      }}
                    >
                      {/* Interactive Header Accent Layer Grid Row */}
                      <div
                        className="mod-head"
                        onClick={() =>
                          setExpandedModules((prev) => ({
                            ...prev,
                            [moduleUniqueKey]: !prev[moduleUniqueKey],
                          }))
                        }
                      >
                        <span className="mod-code">{mod.code || "0.0.0"}</span>
                        <span className="mod-title">{mod.title}</span>
                        <span className="mod-chev">▼</span>
                      </div>

                      {/* Dropdown Body wrapper utilizing .mod-body layout block updates */}
                      <div className="mod-body">
                        <div className="mod-content-text">{mod.description}</div>
                        
                        {mod.resources && mod.resources.length > 0 && (
                          <div className="mod-links">
                            {mod.resources.map((res, rIdx) => {
                              const isVideo = res.type.toLowerCase() === "video";
                              return (
                                <a
                                  key={rIdx}
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`mod-link ${isVideo ? "vid" : "doc"}`}
                                >
                                  <span>{isVideo ? "▶" : "📄"}</span>
                                  {res.label}
                                </a>
                              );
                            })}
                          </div>
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
          <div className="empty-ico">📂</div>
          <p>No content parameters mapped inside this certification index view.</p>
        </div>
      )}
    </AppShell>
  );
}