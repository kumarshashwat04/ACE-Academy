'use client';

import AppShell from '@/components/AppShell';
import React, { useState, useEffect } from 'react';

// --- CONFIGURATION DEFINITIONS ---
const PRODUCTS = [
  { id: 'rtp', name: 'Ranger RTP', icon: '🤖', certs: ['l1', 'l2', 'l3'], sections: [{ title: 'Core Architecture', mods: [{ code: 'MOD-101', title: 'Introduction to Butler', content: { l1: 'Default content text' }, docLink: '', videoLink: '', videoTitle: '' }] }] },
  { id: 'ttp', name: 'Ranger TTP', icon: '📦', certs: ['l1', 'l2', 'l3'], sections: [] },
  { id: 'tools', name: 'Tools & Techniques', icon: '🛠️', certs: ['l1', 'l2', 'l3'], sections: [] },
];

const CMETA: Record<string, { name: string; icon: string; dt: number; dp: number }> = {
  l1: { name: 'PathFinder', icon: '🧭', dt: 60, dp: 80 },
  l2: { name: 'Navigator', icon: '🗺️', dt: 90, dp: 85 },
  l3: { name: 'GrandMaster', icon: '🏆', dt: 90, dp: 85 },
};

const LEVEL_COLORS: Record<string, { bg: string; border: string; text: string; rawGlow: string }> = {
  l1: { bg: 'rgba(99, 102, 241, 0.15)', border: '#6366f1', text: '#a5b4fc', rawGlow: '99, 102, 241' },
  l2: { bg: 'rgba(56, 189, 248, 0.12)', border: '#38bdf8', text: '#7dd3fc', rawGlow: '56, 189, 248' },
  l3: { bg: 'rgba(234, 179, 8, 0.12)', border: '#eab308', text: '#fde047', rawGlow: '234, 179, 8' },
};

// --- INTERFACES MATCHING BACKEND SCHEMA ---
interface FirebaseQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
}

interface AssessmentPayload {
  id: string;
  quizId: string;
  passingPercentage: number;
  totalMarks: number;
  timeLimit: number;
  questions: FirebaseQuestion[];
}

export default function ManageProgram() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'questions' | 'timers' | 'syllabus' | 'users'>('questions');

  // Filter States
  const [admQProd, setAdmQProd] = useState(PRODUCTS[0].id);
  const [admQCert, setAdmQCert] = useState(PRODUCTS[0].certs[0]);
  const [admProd, setAdmProd] = useState(PRODUCTS[0].id);
  const [admLvl, setAdmLvl] = useState(PRODUCTS[0].certs[0]);

  // Dynamic Data & Loading States
  const [currentQuizData, setCurrentQuizData] = useState<AssessmentPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modal Control States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQIdx, setEditingQIdx] = useState<number | null>(null);
  const [modalQText, setModalQText] = useState('');
  const [modalOpts, setModalOpts] = useState<string[]>(['', '', '', '']);
  const [modalCorrectIdx, setModalCorrectIdx] = useState(0);

  // Accordion Expand State for Syllabus
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Active Layout UI context color decoders
  const activeQColors = LEVEL_COLORS[admQCert] || { bg: 'transparent', border: 'transparent', text: 'inherit', rawGlow: '0,0,0' };
  const activeSylColors = LEVEL_COLORS[admLvl] || { bg: 'transparent', border: 'transparent', text: 'inherit', rawGlow: '0,0,0' };

  /**
   * Translates front-end selected active tab nodes into backend parameters
   * Examples: 'ranger-rtp' + 'l1' -> 'rtp-pathfinder'
   */
  const getQuizId = (productId: string, certLevel: string): string => {
    const genericProd = productId.replace('ranger-', ''); 
    const metaName = CMETA[certLevel]?.name.toLowerCase() || 'level';
    return `${genericProd}-${metaName}`;
  };

  // Compute active target code representation key
  const activeQuizId = getQuizId(admQProd, admQCert);

  // --- API DATA ENGINE ---
  useEffect(() => {
    async function fetchAssessmentData() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/firebase/assessments?quizId=${activeQuizId}`);
        if (!response.ok) {
          throw new Error(`Failed to load data for query identity key: ${activeQuizId}`);
        }
        const data: AssessmentPayload = await response.json();
        setCurrentQuizData(data);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
        setCurrentQuizData(null);
      } finally {
        setLoading(false);
      }
    }

    if (activeTab === 'questions' || activeTab === 'timers') {
      fetchAssessmentData();
    }
  }, [admQProd, admQCert, activeTab, activeQuizId]);


  // --- MUTATION SUBMISSION HANDLERS ---
  const handleOpenAddQ = () => {
    setEditingQIdx(null);
    setModalQText('');
    setModalOpts(['', '', '', '']);
    setModalCorrectIdx(0);
    setIsModalOpen(true);
  };

  const handleOpenEditQ = (idx: number) => {
    if (!currentQuizData) return;
    const q = currentQuizData.questions[idx];
    if (!q) return;

    // Determine the index of the correct answer from string mapping array values
    const correctIdx = q.options.indexOf(q.correctAnswer);

    setEditingQIdx(idx);
    setModalQText(q.questionText);
    setModalOpts([...q.options]);
    setModalCorrectIdx(correctIdx !== -1 ? correctIdx : 0);
    setIsModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalQText.trim()) return alert('Please enter a question.');
    if (modalOpts.some(o => !o.trim())) return alert('All four options must be filled in.');
    if (!currentQuizData) return;

    // Create the updated backend item structure
    const updatedQuestion: FirebaseQuestion = {
      questionText: modalQText.trim(),
      options: modalOpts.map(o => o.trim()),
      correctAnswer: modalOpts[modalCorrectIdx].trim()
    };

    let updatedQuestionsList = [...currentQuizData.questions];
    if (editingQIdx !== null) {
      updatedQuestionsList[editingQIdx] = updatedQuestion;
    } else {
      updatedQuestionsList.push(updatedQuestion);
    }

    const payload: AssessmentPayload = {
      ...currentQuizData,
      questions: updatedQuestionsList
    };

    // Optimistic state updates
    setCurrentQuizData(payload);
    setIsModalOpen(false);

    // TODO: Connect fetch PATCH or POST endpoint handler request line here if needed
    // await fetch(`/api/firebase/assessments?quizId=${activeQuizId}`, { method: 'POST', body: JSON.stringify(payload) });
  };

  const handleDeleteQ = (idx: number) => {
    if (!currentQuizData || !confirm('Delete this question?')) return;
    
    const updatedQuestionsList = [...currentQuizData.questions];
    updatedQuestionsList.splice(idx, 1);

    setCurrentQuizData({
      ...currentQuizData,
      questions: updatedQuestionsList
    });
    
    // TODO: Synchronize database persistence payload via API here
  };

  const toggleSyllabusCard = (key: string) => {
    setExpandedCards(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AppShell currentTab="manageprogram">
      <div className="admin-container" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Page Header */}
        <div className="ph" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0' }}>Manage Program</h2>
          <p style={{ color: 'var(--text3)', margin: 0, fontSize: '14px' }}>
            Configure dynamic database modules, assessment sets, parameters and core content layouts.
          </p>
        </div>

        {/* Global Configuration Tab Navigators */}
        <div className="admin-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
          {(['questions', 'timers', 'syllabus', 'users'] as const).map((tab) => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`atab ${activeTab === tab ? 'on' : ''}`}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                borderBottom: activeTab === tab ? '2px solid var(--purple)' : '2px solid transparent',
                color: activeTab === tab ? 'var(--purple-l)' : 'var(--text2)'
              }}
            >
              {tab === 'questions' && '📝 Questions'}
              {tab === 'timers' && '⏱ Timers & Pass Marks'}
              {tab === 'syllabus' && '📝 Syllabus Content & Links'}
              {tab === 'users' && '👥 User Management'}
            </div>
          ))}
        </div>

        {/* ──────────────── QUESTIONS MANAGEMENT FEATURE TAB VIEW ──────────────── */}
        {activeTab === 'questions' && (
          <div id="adminQuestions">
            <div className="sec-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                {/* Product Selectors */}
                <div className="ptabs" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  {PRODUCTS.map(p => (
  <div 
    key={p.id} 
    className={`ptab ${p.id} ${admQProd === p.id ? 'on' : ''}`}
    onClick={() => {
      setAdmQProd(p.id);
      setAdmQCert(p.certs[0]);
    }}
  >
    {p.icon} {p.name}
  </div>
))}
                </div>
                
                {/* Level Tier Node Capsules */}
                <div className="ltabs" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {(PRODUCTS.find(p => p.id === admQProd)?.certs || []).map(c => {
                    const isSelected = admQCert === c;
                    const cColor = LEVEL_COLORS[c];
                    return (
                      <div 
                        key={c} 
                        className={`ltab ${c} ${isSelected ? 'on' : ''}`}
                        onClick={() => setAdmQCert(c)}
                        style={{
                          padding: '8px 20px',
                          cursor: 'pointer',
                          borderRadius: '9999px',
                          border: isSelected ? `1px solid ${cColor.border}` : '1px solid rgba(255,255,255,0.08)',
                          backgroundColor: isSelected ? cColor.bg : 'rgba(255,255,255,0.02)',
                          color: isSelected ? cColor.text : 'rgba(255, 255, 255, 0.4)',
                          fontWeight: 600,
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: isSelected ? `0 0 12px rgba(${cColor.rawGlow}, 0.25)` : 'none',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        <span style={{ opacity: isSelected ? 1 : 0.5 }}>{CMETA[c]?.icon}</span>
                        {CMETA[c]?.name}
                      </div>
                    );
                  })}
                </div>
              </div>
              <button 
                className="btn-add" 
                onClick={handleOpenAddQ}
                disabled={loading}
                style={{ backgroundColor: activeQColors.border, borderColor: activeQColors.border, color: '#fff', opacity: loading ? 0.6 : 1 }}
              >
                + Add Question
              </button>
            </div>

            {/* Assessment Database Workspace Area */}
            <div className="q-list-container" style={{ marginTop: '20px' }}>
              {loading ? (
                <div className="empty"><p>Loading live schema for id: "{activeQuizId}"...</p></div>
              ) : error ? (
                <div className="empty" style={{ border: '1px dashed red' }}>
                  <p style={{ color: '#f87171' }}>⚠️ Error retrieving dataset configuration: {error}</p>
                </div>
              ) : !currentQuizData || currentQuizData.questions.length === 0 ? (
                <div className="empty">
                  <div className="empty-ico">📝</div>
                  <p>No backend questions returned for identity query point: <strong>{activeQuizId}</strong>.</p>
                </div>
              ) : (
                currentQuizData.questions.map((q, i) => (
                  <div className="q-item" key={i} style={{ borderLeft: `4px solid ${activeQColors.border}`, paddingLeft: '16px', background: 'rgba(255,255,255,0.01)', borderRadius: '0 8px 8px 0', marginBottom: '16px' }}>
                    <div className="q-item-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span className="q-item-num" style={{ color: activeQColors.text, fontWeight: '700', marginRight: '8px' }}>Q{i + 1}</span>
                        <span className="q-item-text">{q.questionText}</span>
                      </div>
                      <div className="q-item-actions">
                        <button className="btn-edit" onClick={() => handleOpenEditQ(i)}>Edit</button>
                        <button className="btn-del" onClick={() => handleDeleteQ(i)}>Delete</button>
                      </div>
                    </div>
                    <div className="q-opts-preview" style={{ marginTop: '12px' }}>
                      {q.options.map((o, oi) => {
                        const isCorrect = o === q.correctAnswer;
                        return (
                          <div key={oi} className={`q-opt-prev ${isCorrect ? 'correct' : 'wrong'}`}>
                            <div className="q-dot">{isCorrect ? '✓' : ''}</div>
                            {o}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ──────────────── TIMERS & CONFIG PARAMETERS TAB VIEW ──────────────── */}
        {activeTab === 'timers' && (
          <div id="adminTimers">
            {loading ? (
              <p>Loading runtime properties...</p>
            ) : currentQuizData ? (
              <div className="timer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                <div className="timer-card" style={{ borderTop: `4px solid ${activeQColors.border}`, padding: '16px', background: 'var(--surface)', borderRadius: '6px' }}>
                  <div className="tcl" style={{ fontWeight: 600, marginBottom: '12px', color: activeQColors.text }}>
                    🚀 Current Selected Track: {activeQuizId}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Time Limit:</span>
                      <div className="tcr-group">
                        <input 
                          type="number" 
                          className="t-inp" 
                          value={Math.round(currentQuizData.timeLimit / 60)} 
                          onChange={(e) => setCurrentQuizData({ ...currentQuizData, timeLimit: Number(e.target.value) * 60 })}
                          min="5" 
                          max="180" 
                        />
                        <span> mins</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Passing Grade Threshold:</span>
                      <div className="tcr-group">
                        <input 
                          type="number" 
                          className="t-inp" 
                          value={currentQuizData.passingPercentage} 
                          onChange={(e) => setCurrentQuizData({ ...currentQuizData, passingPercentage: Number(e.target.value) })}
                          min="50" 
                          max="100" 
                          style={{ width: '52px' }} 
                        />
                        <span> %</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p>Select the questions tab to refresh configurations parameters.</p>
            )}
            <div style={{ marginTop: '14px' }}>
              <button className="btn-add" style={{ backgroundColor: activeQColors.border, borderColor: activeQColors.border }} onClick={() => alert('Dynamic metrics cached!')}>Save Runtime Configurations</button>
            </div>
          </div>
        )}

        {/* ──────────────── SYLLABUS EDIT LAYER ──────────────── */}
        {activeTab === 'syllabus' && (
          <div id="adminSyllabus">
            <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'var(--amber-bg)', border: '1px solid rgba(217,119,6,.25)', borderRadius: '4px', fontSize: '13px', color: 'var(--amber-l)' }}>
              <strong>Content Sandbox Editor:</strong> Modify curriculum maps matching structural UI parameters.
            </div>
            
            <div className="ptabs" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {PRODUCTS.map(p => (
                <div key={p.id} className={`ptab ${p.id} ${admProd === p.id ? 'on' : ''}`} onClick={() => setAdmProd(p.id)}>{p.icon} {p.name}</div>
              ))}
            </div>

            <div className="ltabs" style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              {(PRODUCTS.find(p => p.id === admProd)?.certs || []).map(c => {
                const isSelected = admLvl === c;
                const cColor = LEVEL_COLORS[c];
                return (
                  <div 
                    key={c} 
                    className={`ltab ${c} ${isSelected ? 'on' : ''}`} 
                    onClick={() => setAdmLvl(c)}
                    style={{
                      padding: '10px 24px',
                      cursor: 'pointer',
                      borderRadius: '9999px',
                      border: isSelected ? `1px solid ${cColor.border}` : '1px solid rgba(255,255,255,0.08)',
                      backgroundColor: isSelected ? cColor.bg : 'rgba(255,255,255,0.02)',
                      color: isSelected ? cColor.text : 'rgba(255, 255, 255, 0.4)',
                      fontWeight: 600,
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>{CMETA[c]?.icon}</span> {CMETA[c]?.name}
                  </div>
                );
              })}
            </div>

            <div id="adSylCards">
              {PRODUCTS.find(p => p.id === admProd)?.sections.map((sec, sIdx) => (
                <div key={sIdx}>
                  <div className="sec-label" style={{ marginTop: '20px', color: activeSylColors.text, fontWeight: '700' }}><span>◆ </span>{sec.title}</div>
                  {sec.mods.map((mod) => {
                    const cardKey = `${admProd}-${mod.code}-${admLvl}`;
                    const isExpanded = !!expandedCards[cardKey];
                    return (
                      <div className={`syl-edit-card ${isExpanded ? 'syl-open' : ''}`} id={`sec-${cardKey}`} key={mod.code} style={{ borderLeft: isExpanded ? `3px solid ${activeSylColors.border}` : '1px solid var(--border)', margin: '10px 0' }}>
                        <div className="syl-edit-head" onClick={() => toggleSyllabusCard(cardKey)} style={{ display: 'flex', alignItems: 'center', padding: '14px', cursor: 'pointer' }}>
                          <span className="mod-code" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', marginRight: '10px', background: activeSylColors.bg, color: activeSylColors.text, padding: '3px 6px', borderRadius: '4px', border: `1px solid rgba(${activeSylColors.rawGlow}, 0.3)` }}>{mod.code}</span>
                          <span style={{ fontSize: '14px', fontWeight: 600, flex: 1 }}>{mod.title}</span>
                          <span className="mod-chev" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                        </div>
                        
                        {isExpanded && (
                          <div className="syl-edit-body" style={{ padding: '16px', background: 'var(--surface2)' }}>
                            <div className="syl-field-label">Content text block raw string input:</div>
                            <textarea className="syl-textarea" rows={6} defaultValue={mod.content.l1} style={{ width: '100%' }} />
                            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                              <button className="btn-sv" style={{ backgroundColor: activeSylColors.border, color: '#fff', borderColor: activeSylColors.border }} onClick={() => alert('Syllabus structural definitions cached!')}>Save Changes</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ──────────────── USER MANAGEMENT (Placeholder) ──────────────── */}
        {activeTab === 'users' && (
          <div id="adminUsers" className="empty">
            <div className="empty-ico">👥</div>
            <p>Dynamic Authorization Registry View Control Panel</p>
          </div>
        )}

        {/* ──────────────── QUESTION MUTATION DIALOG MODAL ──────────────── */}
        {isModalOpen && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="modal-content" style={{ background: 'var(--surface)', padding: '24px', borderRadius: '8px', width: '500px', border: `1px solid ${activeQColors.border}`, boxShadow: `0 0 24px rgba(${activeQColors.rawGlow}, 0.15)` }}>
              <h3 id="modalTitle" style={{ margin: '0 0 16px 0', fontSize: '18px', color: activeQColors.text }}>{editingQIdx !== null ? 'Edit Question' : 'Add New Question'}</h3>
              <form onSubmit={handleSaveQuestion}>
                <div style={{ marginBottom: '14px' }}>
                  <label className="syl-field-label" style={{ display: 'block', marginBottom: '6px' }}>Question String Prompt</label>
                  <textarea 
                    className="syl-textarea" 
                    rows={3} 
                    value={modalQText} 
                    onChange={(e) => setModalQText(e.target.value)}
                    placeholder="Enter explicit string logic prompt..."
                    style={{ width: '100%' }}
                  />
                </div>

                <div id="optEditor" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {['A', 'B', 'C', 'D'].map((label, idx) => (
                    <div className="opt-row" key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="opt-idx" style={{ fontWeight: 'bold', color: activeQColors.text }}>{label}</span>
                      <input 
                        type="text" 
                        className="inp"
                        style={{ flex: 1 }}
                        value={modalOpts[idx]} 
                        placeholder={`Option alternative string label description ${label}...`}
                        onChange={(e) => {
                          const updated = [...modalOpts];
                          updated[idx] = e.target.value;
                          setModalOpts(updated);
                        }}
                      />
                      <button 
                        type="button" 
                        className={`opt-correct-btn ${modalCorrectIdx === idx ? 'correct' : ''}`}
                        onClick={() => setModalCorrectIdx(idx)}
                        style={{ background: modalCorrectIdx === idx ? '#22c55e' : 'transparent', border: '1px solid var(--border)', color: '#fff', cursor: 'pointer', padding: '4px 8px' }}
                      >
                        ✓
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn-edit" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-add" style={{ boxShadow: 'none', backgroundColor: activeQColors.border, borderColor: activeQColors.border, color: '#fff' }}>Save Structural Question</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}