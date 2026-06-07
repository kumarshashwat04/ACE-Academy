"use client";

import { useState, useEffect } from "react";
import AppShell from "../../components/AppShell";

// Extracted data from your spreadsheet
const teamTrainings = [
  { id: "1.1.1", team: "IM/PM", title: "IM/PM Training session", link: "https://drive.google.com/file/d/1crW-k7hYw4OkwcyW0L20elhOPh5ZsHfI/view" },
  { id: "1.1.2", team: "CM", title: "Change Management SF Training", link: "https://drive.google.com/file/d/1wdeHo_YtVMtU2dfDpht905IkaRCNGTBx/view" },
  { id: "1.1.3", team: "Support Teams", title: "Auto Incident Management demo for whole support", link: "https://greyorange.zoom.us/rec/play/myH2ovmOiKqAndvmqC-V9VLegsBRR4H52d0LS0RrNnvXwKhPmy8CM8CbP9s66CIi_y5ajG15flnLXnDz.sTPDImxFKqoyBNXD?eagerLoadZvaPages=sidemenu.billing.plan_management&accessLevel=meeting&canPlayFromShare=true&from=share_recording_detail&continueMode=true&oldStyle=true&componentName=rec-play&originRequestUrl=https%3A%2F%2Fgreyorange.zoom.us%2Frec%2Fshare%2FdwXkdeSTsx3aHP-IcyllgqcD29aAg5JU2uXjZFBnRACSEbolrvE_XN25W6FWaN8c.5wrgpaHIcVpkiRBu" },
  { id: "1.1.4", team: "CAC", title: "SF Training session for CAC", link: "https://drive.google.com/file/d/191iN70_zzAoqgi-0zuhs2-jpjQ8khRXe/view" },
  { id: "1.1.5", team: "TAC-RTP", title: "SF Training for TAC", link: "https://drive.google.com/file/d/1iEsL61h52yqozHzymQs7eOJhVCsKYudI/view" },
  { id: "1.1.6", team: "TAC-RTP (2)", title: "SF Training For TAC-2", link: "https://drive.google.com/file/d/121TfBMGmgfECW9zYcOOTyRPYPv229nyZ/view" },
  { id: "1.1.7", team: "TAC-RMS", title: "TAC-RMS Training session", link: "https://drive.google.com/file/d/19tAapEt8JUpFDiZjpuOkGvJjmRZFLkG4/view" },
  { id: "1.1.8", team: "g-Store", title: "gStore Training", link: "https://drive.google.com/file/d/1ogUxzS9OWGGdQdkQk1wRgQMnzB93PVz1/view" },
  { id: "1.1.9", team: "HW RTP/RMS", title: "SF Training Session for HW Team", link: "https://drive.google.com/file/d/1BJjOar4_o-qwvnZM9i91_m2j-g8QomM4/view" },
  { id: "1.1.10", team: "CEM", title: "SF Training for CEM", link: "https://drive.google.com/file/d/1BJjOar4_o-qwvnZM9i91_m2j-g8QomM4/view" },
  { id: "1.1.11", team: "CD", title: "SF Training for CD's", link: "https://drive.google.com/file/d/1R86F6VOcyRPNpDg1UaHwwiyV5lCuApOK/view" },
  { id: "1.1.12", team: "Customer", title: "Ryder Customer Training", link: "https://drive.google.com/file/d/1oW0suTWAcidadl_keF7a0u97Qy6R0Cc5/view" },
];

export default function GlobalCoursePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    "1.1.1": true, 
  });

  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const savedCompletions = localStorage.getItem("ace_completed_trainings");
    if (savedCompletions) {
      try {
        setCompletedItems(JSON.parse(savedCompletions));
      } catch (e) {
        console.error("Error parsing completion data from localStorage", e);
      }
    }
  }, []);

  const toggleAccordion = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleComplete = (id: string) => {
    setCompletedItems((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      localStorage.setItem("ace_completed_trainings", JSON.stringify(updated));
      return updated;
    });
  };

  const filteredTrainings = teamTrainings.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.team.toLowerCase().includes(query) ||
      item.title.toLowerCase().includes(query)
    );
  });

  return (
    <AppShell currentTab="globalCourse">
      <div className="ace-dark-theme-container">
        
        <div className="ace-header-group">
          <h2 className="ace-title">Salesforce Courses</h2>
          <p className="ace-section-subtitle">✦ Global training and resources</p>
        </div>

        <div className="ace-search-container">
          <svg className="ace-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search by team or course title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ace-search-input"
          />
        </div>

        <div className="ace-accordion-stack">
          {filteredTrainings.length > 0 ? (
            filteredTrainings.map((item) => {
              const isOpen = !!expandedItems[item.id];
              const isDone = !!completedItems[item.id];
              
              return (
                <div key={item.id} className={`ace-card ${isOpen ? 'is-open' : ''} ${isDone ? 'ace-card-completed' : ''}`}>
                  
                  <button 
                    type="button"
                    onClick={() => toggleAccordion(item.id)} 
                    className="ace-card-trigger"
                    aria-expanded={isOpen}
                  >
                    <div className="ace-trigger-left">
                      <span className="ace-badge-id">{item.id}</span>
                      <span className="ace-team-name">{item.team}</span>
                    </div>
                    
                    <div className="ace-trigger-right">
                      {isDone && (
                        <span className="ace-tick-badge" title="Completed">
                          <svg className="icon-tick" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                          Done
                        </span>
                      )}

                      <svg 
                        className={`ace-caret-icon ${isOpen ? "rotate-icon" : ""}`} 
                        viewBox="0 0 24 24" 
                        fill="currentColor"
                      >
                        <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
                      </svg>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="ace-card-body">
                      <p className="ace-description">
                        Class recordings and resource pathways dedicated to {item.team} internal operations.
                      </p>
                      
                      <div className="ace-body-actions-row">
                        <div className="ace-pill-wrapper">
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="ace-pill ace-pill-video">
                            <svg className="icon-play" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                            <span>{item.title}</span>
                          </a>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleComplete(item.id)}
                          className={`ace-pill ace-pill-action ${isDone ? 'action-complete' : 'action-pending'}`}
                        >
                          {isDone ? (
                            <>
                              <svg className="icon-action" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                              </svg>
                              <span>Mark Pending</span>
                            </>
                          ) : (
                            <>
                              <svg className="icon-action" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                              </svg>
                              <span>Mark as Done</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="ace-no-results">
              No matching courses found for "{searchQuery}".
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .ace-dark-theme-container {
          background-color: #0b0e14;
          color: #adbac7;
          min-height: 100vh;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        }
        .ace-header-group {
          margin-bottom: 1.5rem;
        }
        .ace-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #f0f6fc;
          margin: 0;
        }
        .ace-section-subtitle {
          font-size: 0.70rem;
          color: #768390;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-top: 1.5rem;
          font-weight: 600;
        }
        
        .ace-search-container {
          position: relative;
          max-width: 1200px;
          margin-bottom: 1.5rem;
        }
        .ace-search-input {
          width: 100%;
          padding: 0.55rem 1rem 0.55rem 2.5rem;
          background-color: #15191e;
          border: 1px solid #373e47;
          border-radius: 6px;
          color: #c9d1d9;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .ace-search-input:focus {
          border-color: #388bfd;
          box-shadow: 0 0 0 3px rgba(56, 139, 253, 0.15);
        }
        .ace-search-icon {
          position: absolute;
          left: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          width: 1rem;
          height: 1rem;
          color: #768390;
          pointer-events: none;
        }
        .ace-no-results {
          padding: 2rem;
          text-align: center;
          color: #768390;
          background-color: #15191e;
          border: 1px solid #373e47;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .ace-accordion-stack {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          max-width: 1200px;
        }
        .ace-card {
          background-color: #15191e;
          border: 1px solid #373e47;
          border-radius: 6px;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }
        
        /* Green border color modification removed from .ace-card-completed */
        .ace-card-completed {
          border-color: #373e47; 
        }

        .ace-card-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
        }
        .ace-card-trigger:hover {
          background-color: #1c2128;
        }
        .ace-trigger-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .ace-trigger-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .ace-badge-id {
          font-size: 0.75rem;
          font-family: monospace;
          background-color: #222831;
          color: #4493f8;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          border: 1px solid #373e47;
        }
        .ace-team-name {
          color: #f0f6fc;
          font-size: 0.95rem;
          font-weight: 600;
        }
        .ace-tick-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #39d353;
          background-color: rgba(46, 160, 67, 0.15);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          border: 1px solid rgba(46, 160, 67, 0.4);
        }
        .icon-tick {
          width: 0.85rem;
          height: 0.85rem;
        }
        .ace-caret-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: #768390;
          transition: transform 0.2s ease;
          transform: rotate(0deg);
        }
        .rotate-icon {
          transform: rotate(180deg);
        }
        .ace-card-body {
          padding: 0 1.25rem 1.25rem 1.25rem;
          background-color: #111418;
          border-top: 1px solid #222831;
        }
        .ace-description {
          font-size: 0.85rem;
          color: #768390;
          margin: 0.75rem 0 1rem 0;
        }
        .ace-body-actions-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .ace-pill-wrapper {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .ace-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.9rem;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s;
          cursor: pointer;
        }
        .ace-pill-video {
          background-color: #13232c;
          color: #8ed2ef;
          border: 1px solid #1f3e4e;
        }
        .ace-pill-video:hover {
          background-color: #1a323f;
        }
        .ace-pill-action {
          border: 1px solid transparent;
          background: none;
        }
        .action-pending {
          background-color: #21262d;
          color: #c9d1d9;
          border-color: #30363d;
        }
        .action-pending:hover {
          background-color: #2e353f;
          border-color: #8b949e;
        }
        .action-complete {
          background-color: #1f2d24;
          color: #56d364;
          border-color: #244b2d;
        }
        .action-complete:hover {
          background-color: #2b3e32;
          color: #f0f6fc;
        }
        .icon-play, .icon-action {
          width: 0.9rem;
          height: 0.9rem;
        }
        .icon-play { color: #3197f5; }
      `}</style>
    </AppShell>
  );
}