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
interface AdminModuleResource {
  label: string;
  type: string;
  url: string;
}

interface AdminModule {
  code: string;
  title: string;
  description: string;
  resources?: AdminModuleResource[];
}

interface AdminTopic {
  title: string;
  modules: AdminModule[];
}

interface AdminLevel {
  name: string;
  topics: AdminTopic[];
}

interface AdminSyllabusPayload {
  id: string;
  name: string;
  levels: AdminLevel[];
}

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

// Custom Notification Alert State Interface
interface CustomAlert {
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function ManageProgram() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'questions' | 'timers' | 'syllabus' | 'users'>('questions');

  // Custom Notifications Alert State
  const [alert, setAlert] = useState<CustomAlert | null>(null);

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, message: '', onConfirm: () => {} });

  // Filter States
  const [admQProd, setAdmQProd] = useState(PRODUCTS[0].id);
  const [admQCert, setAdmQCert] = useState(PRODUCTS[0].certs[0]);
  const [admProd, setAdmProd] = useState(PRODUCTS[0].id);
  const [admLvl, setAdmLvl] = useState(PRODUCTS[0].certs[0]); 

  // Dynamic Data & Loading States
  const [currentQuizData, setCurrentQuizData] = useState<AssessmentPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSyllabusData, setCurrentSyllabusData] = useState<AdminSyllabusPayload | null>(null);
  const [sylLoading, setSylLoading] = useState<boolean>(false);

  // Modal Control States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQIdx, setEditingQIdx] = useState<number | null>(null);
  const [modalQText, setModalQText] = useState('');
  const [modalOpts, setModalOpts] = useState<string[]>(['', '', '', '']);
  const [modalCorrectIdx, setModalCorrectIdx] = useState(0);

  // Syllabus Link Editor State Management
  const [isLnkModalOpen, setIsLnkModalOpen] = useState(false);
  const [activeModCode, setActiveModCode] = useState<string>('');
  const [activeResIdx, setActiveResIdx] = useState<number | null>(null);
  const [modalLnkLabel, setModalLnkLabel] = useState('');
  const [modalLnkUrl, setModalLnkUrl] = useState('');
  const [modalLnkType, setModalLnkType] = useState('doc');

  // Accordion Expand State for Syllabus
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Active Layout UI context color decoders
  const activeQColors = LEVEL_COLORS[admQCert] || { bg: 'transparent', border: 'transparent', text: 'inherit', rawGlow: '0,0,0' };
  const activeSylColors = LEVEL_COLORS[admLvl] || { bg: 'transparent', border: 'transparent', text: 'inherit', rawGlow: '0,0,0' };

  // Helper function to show notifications auto-dismissing after 4 seconds
  const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setAlert({ message, type });
  };

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const getQuizId = (productId: string, certLevel: string): string => {
    const genericProd = productId.replace('ranger-', ''); 
    const metaName = CMETA[certLevel]?.name.toLowerCase() || 'level';
    return `${genericProd}-${metaName}`;
  };

  const activeQuizId = getQuizId(admQProd, admQCert);

  // --- API DATA ENGINE 1: ASSESSMENTS ---
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

  // --- API DATA ENGINE 2: SYLLABUS CONTENT ---
  useEffect(() => {
    async function fetchSyllabusStructure() {
      if (activeTab !== 'syllabus') return;
      setSylLoading(true);
      try {
        const response = await fetch(`/api/firebase/syllabus/${admProd}`);
        if (!response.ok) throw new Error("Failed to pull dynamic backend syllabus schema.");
        const data: AdminSyllabusPayload = await response.json();
        setCurrentSyllabusData(data);
      } catch (err) {
        console.error("Syllabus Fetch Error:", err);
        setCurrentSyllabusData(null);
      } finally {
        setSylLoading(false);
      }
    }

    fetchSyllabusStructure();
  }, [admProd, activeTab]);

  const currentAdminLevelData = currentSyllabusData?.levels?.find(
    (l) => l.name.toLowerCase().replace(/\s+/g, "") === (CMETA[admLvl]?.name || '').toLowerCase()
  );

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

    const correctIdx = q.options.indexOf(q.correctAnswer);

    setEditingQIdx(idx);
    setModalQText(q.questionText);
    setModalOpts([...q.options]);
    setModalCorrectIdx(correctIdx !== -1 ? correctIdx : 0);
    setIsModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalQText.trim()) return showAlert('Please enter a question.', 'error');
    if (modalOpts.some(o => !o.trim())) return showAlert('All four options must be filled in.', 'error');

    const updatedQuestion: FirebaseQuestion = {
      questionText: modalQText.trim(),
      options: modalOpts.map(o => o.trim()),
      correctAnswer: modalOpts[modalCorrectIdx].trim()
    };

    let updatedQuestionsList: FirebaseQuestion[] = [];
    if (currentQuizData && Array.isArray(currentQuizData.questions)) {
      updatedQuestionsList = [...currentQuizData.questions];
    }

    if (editingQIdx !== null) {
      updatedQuestionsList[editingQIdx] = updatedQuestion;
    } else {
      updatedQuestionsList.push(updatedQuestion);
    }

    const payload = {
      quizId: activeQuizId,
      totalMarks: currentQuizData?.totalMarks ?? 100,
      passingPercentage: currentQuizData?.passingPercentage ?? 70,
      timeLimit: currentQuizData?.timeLimit ?? 1800,
      questions: updatedQuestionsList
    };

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/firebase/assessments/${payload.quizId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let responseData: any = {};
      
      if (responseText) {
        try { responseData = JSON.parse(responseText); } catch { responseData = { message: responseText }; }
      }

      if (!response.ok) {
        throw new Error(responseData.error || `Server responded with status ${response.status}`);
      }

      setCurrentQuizData({
        id: activeQuizId,
        quizId: activeQuizId,
        totalMarks: payload.totalMarks,
        passingPercentage: payload.passingPercentage,
        timeLimit: payload.timeLimit,
        questions: updatedQuestionsList,
      });

      setIsModalOpen(false);
      showAlert(editingQIdx !== null ? 'Question updated successfully!' : 'Question appended successfully!', 'success');

    } catch (err: any) {
      console.error("❌ Save error detailed trace:", err);
      setError(err.message || 'Error occurred while saving question payload.');
      showAlert(`Failed to save: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQ = (idx: number) => {
    if (!currentQuizData) return;

    setConfirmDialog({
      isOpen: true,
      message: 'Are you sure you want to delete this question?',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        const updatedQuestionsList = currentQuizData.questions.filter((_, qIdx) => qIdx !== idx);

        const payload = {
          quizId: activeQuizId,
          totalMarks: currentQuizData.totalMarks ?? 100,
          passingPercentage: currentQuizData.passingPercentage ?? 70,
          timeLimit: currentQuizData.timeLimit ?? 1800,
          questions: updatedQuestionsList
        };

        setLoading(true);

        try {
          const response = await fetch(`/api/firebase/assessments/${activeQuizId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          const responseText = await response.text();
          let responseData: any = {};
          if (responseText) {
            try { responseData = JSON.parse(responseText); } catch { responseData = { message: responseText }; }
          }

          if (!response.ok) {
            throw new Error(responseData.error || 'Failed to delete question from backend.');
          }

          setCurrentQuizData({
            ...currentQuizData,
            questions: updatedQuestionsList
          });
          showAlert('Question deleted successfully!', 'success');
        } catch (err: any) {
          console.error(err);
          showAlert(`Error during deletion processing: ${err.message}`, 'error');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleSaveTimers = async () => {
    if (!currentQuizData) {
      return showAlert('No active track configuration data loaded to save.', 'error');
    }

    const payload = {
      quizId: activeQuizId,
      totalMarks: currentQuizData.totalMarks ?? 100,
      passingPercentage: currentQuizData.passingPercentage,
      timeLimit: currentQuizData.timeLimit, 
      questions: currentQuizData.questions || []
    };

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/firebase/assessments/${activeQuizId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let responseData: any = {};
      if (responseText) {
        try { responseData = JSON.parse(responseText); } catch { responseData = { message: responseText }; }
      }

      if (!response.ok) {
        throw new Error(responseData.error || `Server returned status ${response.status}`);
      }

      showAlert('Runtime configurations saved successfully!', 'success');
    } catch (err: any) {
      console.error("Timer configuration error details:", err);
      showAlert(`Failed to save runtime metrics: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- SYLLABUS RESOURCE UTILITY MUTATION HANDLERS ---
  const handleOpenEditLink = (modCode: string, resIdx: number, resource: AdminModuleResource) => {
    setActiveModCode(modCode);
    setActiveResIdx(resIdx);
    setModalLnkLabel(resource.label);
    setModalLnkUrl(resource.url);
    setModalLnkType(resource.type);
    setIsLnkModalOpen(true);
  };

  const handleSaveSyllabusLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalLnkLabel.trim() || !modalLnkUrl.trim()) {
      return showAlert('Both resource title label description and path URL are explicitly required.', 'error');
    }
    if (!currentSyllabusData) return;

    const clonedData = JSON.parse(JSON.stringify(currentSyllabusData));
    const targetLevelName = (CMETA[admLvl]?.name || '').toLowerCase().replace(/\s+/g, "");
    
    const targetLevel = clonedData.levels?.find(
      (l: any) => l.name.toLowerCase().replace(/\s+/g, "") === targetLevelName
    );

    if (!targetLevel) {
      return showAlert(`Target level context map reference could not be localized for: ${admLvl}`, 'error');
    }

    let localizedMatch = false;
    for (const topic of targetLevel.topics) {
      for (const mod of topic.modules) {
        if (mod.code === activeModCode) {
          if (!mod.resources) mod.resources = [];
          if (activeResIdx !== null && mod.resources[activeResIdx]) {
            mod.resources[activeResIdx] = {
              label: modalLnkLabel.trim(),
              type: modalLnkType, 
              url: modalLnkUrl.trim()
            };
            localizedMatch = true;
          }
          break;
        }
      }
      if (localizedMatch) break;
    }

    if (!localizedMatch) {
      return showAlert(`Could not map resource update. Module code or resource index missing layout context validation.`, 'error');
    }

    setSylLoading(true);

    const finalRequestBody = {
      product: {
        id: admProd, 
        name: PRODUCTS.find(p => p.id === admProd)?.name || "Tools & Techniques",
        sub: clonedData.sub || "Operational Toolkit",
        icon: PRODUCTS.find(p => p.id === admProd)?.icon || "🛠️",
        levels: clonedData.levels 
      }
    };

    try {
      const response = await fetch('/api/firebase/syllabus', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(finalRequestBody)
      });

      const responseText = await response.text();
      let responseData: any = {};
      if (responseText) {
        try { responseData = JSON.parse(responseText); } catch { responseData = { error: responseText }; }
      }

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || `Server responded with HTTP Status Code ${response.status}`);
      }

      setCurrentSyllabusData(clonedData);
      setIsLnkModalOpen(false);
      showAlert('Resource link updated and synchronized to Firestore successfully!', 'success');
    } catch (err: any) {
      console.error("Syllabus sync execution failure detailed trace:", err);
      showAlert(`Syllabus asset synchronization failure: ${err.message}`, 'error');
    } finally {
      setSylLoading(false);
    }
  };

  const toggleSyllabusCard = (key: string) => {
    setExpandedCards(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AppShell currentTab="manageprogram">
      <div className="admin-container" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
        
        {/* ─── CUSTOM TOAST ALERT SYSTEM ─── */}
        {alert && (
          <div style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 1100,
            padding: '12px 20px',
            borderRadius: '6px',
            backgroundColor: alert.type === 'success' ? 'rgba(34, 197, 94, 0.95)' : alert.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(59, 130, 246, 0.95)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.3s ease'
          }}>
            <span>{alert.type === 'success' ? '✅' : alert.type === 'error' ? '❌' : 'ℹ️'}</span>
            <span>{alert.message}</span>
            <button onClick={() => setAlert(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: '10px', fontWeight: 'bold' }}>×</button>
          </div>
        )}

        {/* ─── CUSTOM CONFIRMATION MODAL ─── */}
        {confirmDialog.isOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
            <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: '8px', width: '400px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '18px', color: 'var(--text1)' }}>Confirm Action</h4>
              <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '24px' }}>{confirmDialog.message}</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button className="btn-edit" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>Cancel</button>
                <button className="btn-add" style={{ backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#fff' }} onClick={confirmDialog.onConfirm}>Delete</button>
              </div>
            </div>
          </div>
        )}

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
            <div className="timers-filter-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <div className="ptabs" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {PRODUCTS.map(p => (
                    <div 
                      key={p.id} 
                      className={`ptab ${p.id} ${admQProd === p.id ? 'on' : ''}`}
                      onClick={() => {
                        setAdmQProd(p.id);
                        setAdmQCert(p.certs[0]);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {p.icon} {p.name}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="ltabs" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
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
            </div>

            {loading ? (
              <div className="empty"><p>Loading configurations for id: "{activeQuizId}"...</p></div>
            ) : currentQuizData ? (
              <div className="timer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '16px' }}>
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
              <button 
                className="btn-add" 
                style={{ 
                  backgroundColor: activeQColors.border, 
                  borderColor: activeQColors.border,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }} 
                disabled={loading}
                onClick={handleSaveTimers}
              >
                {loading ? 'Saving Properties...' : 'Save Runtime Configurations'}
              </button>
            </div>
          </div>
        )}

        {/* ──────────────── SYLLABUS EDIT LAYER ──────────────── */}
        {activeTab === 'syllabus' && (
          <div id="adminSyllabus">
            <div style={{ marginBottom: '20px', padding: '12px 16px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '6px', fontSize: '13px', color: '#a5b4fc' }}>
              <strong>Curriculum Sandbox Modeler:</strong> Inspecting live production curriculum definitions. Select topic layouts and certification milestones below.
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <div className="ptabs" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {PRODUCTS.map(p => (
                  <div 
                    key={p.id} 
                    className={`ptab ${p.id} ${admProd === p.id ? 'on' : ''}`} 
                    onClick={() => {
                      setAdmProd(p.id);
                      setAdmLvl(p.certs[0]);
                    }}
                  >
                    {p.icon} {p.name}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div className="ltabs" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                {['l1', 'l2', 'l3'].map(lvlKey => {
                  const isSelected = admLvl === lvlKey;
                  const cColor = LEVEL_COLORS[lvlKey];
                  const meta = CMETA[lvlKey];

                  return (
                    <div 
                      key={lvlKey} 
                      className={`ltab ${lvlKey} ${isSelected ? 'on' : ''}`} 
                      onClick={() => setAdmLvl(lvlKey)}
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
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span>{meta?.icon}</span> {meta?.name}
                    </div>
                  );
                })}
              </div>
            </div>

            {sylLoading ? (
              <div className="empty"><p>Loading live database curriculum maps...</p></div>
            ) : currentAdminLevelData ? (
              <div id="adSylCards">
                {currentAdminLevelData.topics.map((topic, tIdx) => (
                  <div key={tIdx} style={{ marginBottom: '28px' }}>
                    <div className="sec-label" style={{ color: activeSylColors.text, fontWeight: '700', marginBottom: '12px' }}>
                      <span>◆ </span>{topic.title}
                    </div>

                    <div className="mod-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(1fr, 1fr))', gap: '16px' }}>
                      {topic.modules.map((mod, mIdx) => {
                        const moduleUniqueKey = mod.code || `${tIdx}-${mIdx}`;
                        const isExpanded = !!expandedCards[moduleUniqueKey];
                        
                        return (
                          <div 
                            className={`mod-card ${isExpanded ? 'open' : ''}`} 
                            key={moduleUniqueKey} 
                            style={{ 
                              borderLeft: isExpanded ? `3px solid ${activeSylColors.border}` : '1px solid var(--border)', 
                              background: 'var(--surface)',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}
                          >
                            <div 
                              className="mod-head" 
                              onClick={() => toggleSyllabusCard(moduleUniqueKey)} 
                              style={{ display: 'flex', alignItems: 'center', padding: '14px', cursor: 'pointer' }}
                            >
                              <span className="mod-code" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', marginRight: '10px', background: activeSylColors.bg, color: activeSylColors.text, padding: '3px 6px', borderRadius: '4px', border: `1px solid rgba(${activeSylColors.rawGlow}, 0.3)` }}>
                                {mod.code || "0.0.0"}
                              </span>
                              <span style={{ fontSize: '14px', fontWeight: 600, flex: 1, color: 'var(--text1)' }}>{mod.title}</span>
                              <span className="mod-chev" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                            </div>
                            
                            {isExpanded && (
                              <div className="mod-body" style={{ padding: '16px', background: 'rgba(0,0,0,0.15)', borderTop: '1px solid var(--border)' }}>
                                <div style={{ marginBottom: '12px' }}>
                                  <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>Module Description Preview:</div>
                                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text2)', lineHeight: '1.5' }}>{mod.description}</p>
                                </div>

                                {mod.resources && mod.resources.length > 0 && (
                                  <div>
                                    <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase' }}>Attached Resource Materials:</div>
                                    <div className="mod-links" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                      {mod.resources.map((res, rIdx) => {
                                        const isVideo = res.type.toLowerCase() === 'video';
                                        return (
                                          <div 
                                            key={rIdx} 
                                            className={`mod-link ${isVideo ? 'vid' : 'doc'}`}
                                            style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.05)' }}
                                          >
                                            <a href={res.url} target="_blank" rel="noreferrer" style={{ color: isVideo ? '#f43f5e' : '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                              <span>{isVideo ? '▶' : '📄'}</span>
                                              {res.label}
                                            </a>
                                            
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenEditLink(mod.code, rIdx, res);
                                              }}
                                              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: '2px 4px', fontSize: '11px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                                              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--purple-l)'}
                                              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                                              title="Modify link metadata"
                                            >
                                              ✏️
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
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
                <p>No content parameters mapped inside this structural index database query target.</p>
              </div>
            )}
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

        {/* ──────────────── LINK MUTATION DIALOG MODAL ──────────────── */}
        {isLnkModalOpen && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
            <div className="modal-content" style={{ background: 'var(--surface)', padding: '24px', borderRadius: '8px', width: '460px', border: `1px solid ${activeSylColors.border}`, boxShadow: `0 0 24px rgba(0,0,0,0.5)` }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: activeSylColors.text }}>Edit Resource Blueprint Context</h3>
              <form onSubmit={handleSaveSyllabusLink}>
                
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text2)' }}>Resource Title Label</label>
                  <input 
                    type="text" 
                    className="inp"
                    style={{ width: '100%' }}
                    value={modalLnkLabel} 
                    onChange={(e) => setModalLnkLabel(e.target.value)}
                    placeholder="Confluence Space Document Reference Name..."
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text2)' }}>Resource Destination path URL</label>
                  <input 
                    type="text" 
                    className="inp"
                    style={{ width: '100%', fontFamily: 'monospace', fontSize: '12px' }}
                    value={modalLnkUrl} 
                    onChange={(e) => setModalLnkUrl(e.target.value)}
                    placeholder="https://your-company.atlassian.net/wiki/spaces/..."
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text2)' }}>Asset Media Type Classification</label>
                  <select 
                    value={modalLnkType} 
                    onChange={(e) => setModalLnkType(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: '4px', width: '100%' }}
                  >
                    <option value="doc">📄 Documentation Reference (Confluence / Web PDF)</option>
                    <option value="video">▶ Recorded Session / Stream Media Video asset</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn-edit" onClick={() => setIsLnkModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-add" style={{ backgroundColor: activeSylColors.border, borderColor: activeSylColors.border, color: '#fff', boxShadow: 'none' }}>
                    {sylLoading ? 'Updating Database...' : 'Save Asset Settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}