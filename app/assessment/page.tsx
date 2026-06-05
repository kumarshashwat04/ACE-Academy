"use client";

import { useState, useEffect, useCallback } from "react";
import type { CertId } from "@/lib/academy-data";
import { isLevelUnlocked } from "@/lib/assessment-mapping";
import type { CertificationModule } from "@/lib/certifications";
import { getSessionUid, syncSessionFromProfile } from "@/lib/session";
import { fetchUserProfile } from "@/lib/user-profile";
import AppShell from "../../components/AppShell";

const COURSE_TABS = [
  { id: "rtp", name: "Ranger RTP", icon: "🤖", cssClass: "rtp" },
  { id: "ttp", name: "Ranger TTP", icon: "📦", cssClass: "ttp" },
  { id: "tools", name: "Tools & Techniques", icon: "🛠️", cssClass: "tools" },
];

const LEVEL_SCHEMAS = [
  { id: "pathfinder", name: "PathFinder", subtitle: "Concept & Problem Statement", icon: "🧭" },
  { id: "navigator", name: "Navigator", subtitle: "UI Flow & System Logic", icon: "🗺️" },
  { id: "grandmaster", name: "GrandMaster", subtitle: "Advanced Architecture & Edge Cases", icon: "🏆" },
];

interface Question {
  questionText: string;
  options: string[];
  correctAnswer: string;
}

interface QuizData {
  id: string;
  quizId: string;
  timeLimit: number; // in seconds
  passingPercentage: number;
  questions?: Question[];
  totalMarks?: number;
}

function getModuleNameForTab(tabId: string): string | undefined {
  return COURSE_TABS.find((tab) => tab.id === tabId)?.name;
}

export default function AssessmentsPage() {
  const [activeTabId, setActiveTabId] = useState<string>("rtp");
  const [assessmentMeta, setAssessmentMeta] = useState<Record<string, QuizData>>({});
  const [activeLoadingLevel, setActiveLoadingLevel] = useState<string | null>(null);
  const [certifications, setCertifications] = useState<CertificationModule[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Quiz Execution States ---
  const [activeQuizData, setActiveQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const uid = getSessionUid();
    if (!uid) return;

    fetchUserProfile(uid).then(({ profile }) => {
      if (profile?.certifications) {
        setCertifications(profile.certifications);
        syncSessionFromProfile(profile);
      }
    });
  }, []);

  // Tab switching drops lock history validation state locally without fetching
  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId);
    setAssessmentMeta({});
  };

  // Triggered ONLY when clicking an unlocked level card
  const handleLevelClick = async (levelId: string) => {
    const targetQuizId = `${activeTabId}-${levelId}`;
    setActiveLoadingLevel(levelId);
    
    try {
      const response = await fetch(`/api/firebase/assessments?quizId=${targetQuizId}`);
      if (response.ok) {
        const data: QuizData = await response.json();
        
        // Save metadata progression tracker
        setAssessmentMeta((prev) => ({
          ...prev,
          [levelId]: data,
        }));

        if (data.questions && data.questions.length > 0) {
          setActiveQuizData(data);
          setCurrentQuestionIndex(0);
          setSelectedAnswers({});
          setTimeLeft(data.timeLimit || 1800); // fallback to 30 mins
        } else {
          alert("No questions found for this configuration layout.");
        }
      } else {
        console.error("Failed to fetch assessment on explicit action click");
      }
    } catch (err) {
      console.error(`Error handling click API call for ${targetQuizId}:`, err);
    } finally {
      setActiveLoadingLevel(null);
    }
  };

  // Format countdown clock metric
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOptionSelect = (option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: option,
    }));
  };

  const handleNext = () => {
    if (!activeQuizData) return;
    if (currentQuestionIndex < activeQuizData.questions!.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Last question completed, trigger manual submission confirm flow
      handleQuizSubmit(false);
    }
  };

  const handleExitQuiz = () => {
    if (confirm("Are you sure you want to exit? Your progressive answers will be lost.")) {
      setActiveQuizData(null);
    }
  };

  const handleQuizSubmit = useCallback(async (isTimeExpired = false) => {
    if (!activeQuizData || !activeQuizData.questions || isSubmitting) return;

    if (!isTimeExpired) {
      const totalQuestions = activeQuizData.questions.length;
      const answeredCount = Object.keys(selectedAnswers).length;

      const confirmMsg = answeredCount < totalQuestions
        ? `You have only answered ${answeredCount}/${totalQuestions} questions. Do you want to submit anyway?`
        : "Are you sure you want to finish and submit this assessment?";

      if (!confirm(confirmMsg)) return;
    } else {
      alert("Time is up! Your assessment is being automatically submitted.");
    }

    const uid = getSessionUid();
    if (!uid) {
      alert("You must be signed in to submit an assessment.");
      return;
    }

    let correctCount = 0;
    activeQuizData.questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        correctCount++;
      }
    });

    const finalScorePercent = Math.round((correctCount / activeQuizData.questions.length) * 100);
    const passThreshold = activeQuizData.passingPercentage ?? 70;
    const timeLimit = activeQuizData.timeLimit || 1800;
    const attemptedTimeSeconds = Math.max(0, timeLimit - timeLeft);

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/firebase/assessments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          quizId: activeQuizData.quizId,
          score: finalScorePercent,
          attemptedTimeSeconds,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        passed?: boolean;
        newScore?: number;
        nextLevelUnlocked?: string | null;
        passingPercentage?: number;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Failed to save assessment result.");
      }

      const { profile } = await fetchUserProfile(uid);
      if (profile?.certifications) {
        setCertifications(profile.certifications);
        syncSessionFromProfile(profile);
      }

      const isPassed = payload.passed ?? finalScorePercent >= passThreshold;
      const savedScore = payload.newScore ?? finalScorePercent;
      const requiredScore = payload.passingPercentage ?? passThreshold;
      const unlockMsg = payload.nextLevelUnlocked
        ? `\n\nNext level unlocked: ${payload.nextLevelUnlocked}`
        : "";

      alert(
        `Assessment Submitted!\n\nScore: ${savedScore}%\nRequired: ${requiredScore}%\nResult: ${
          isPassed ? "🎉 PASSED!" : "❌ FAILED"
        }${unlockMsg}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit assessment.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      setActiveQuizData(null);
    }
  }, [activeQuizData, isSubmitting, selectedAnswers, timeLeft]);

  // Countdown timer effect for the active quiz
  useEffect(() => {
    if (!activeQuizData || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleQuizSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuizData, timeLeft, handleQuizSubmit]);

  // --- RENDERING STRATEGY INTERCEPTOR ---
  // If a quiz is running, discard standard shell scaffolding entirely
  if (activeQuizData && activeQuizData.questions) {
    const currentQuestion = activeQuizData.questions[currentQuestionIndex];
    const totalQuestions = activeQuizData.questions.length;
    const trackingHeaderLabel = `${activeQuizData.id.replace("-", " — ").toUpperCase()}`;

    return (
      <div
        style={{
          backgroundColor: "#0d1117",
          color: "#ffffff",
          minHeight: "100vh",
          width: "100vw",
          fontFamily: "sans-serif",
          padding: "40px 20px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: "840px" }}>
          
          {/* Header Progress Panel */}
          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: "12px",
              padding: "20px 32px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "32px",
            }}
          >
            <div>
              <div style={{ fontSize: "12px", color: "#8b949e", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                🧭 {trackingHeaderLabel}
              </div>
              <div style={{ fontSize: "16px", color: "#c9d1d9", marginTop: "4px", fontWeight: "500" }}>
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </div>
            </div>

            {/* Countdown Clock Display */}
            <div style={{ fontSize: "32px", fontWeight: "700", color: "#f8e3a1", letterSpacing: "1px" }}>
              {formatTime(timeLeft)}
            </div>

            {/* Exit Action Trigger Button */}
            <button
              onClick={handleExitQuiz}
              style={{
                backgroundColor: "transparent",
                border: "1px solid #30363d",
                color: "#c9d1d9",
                borderRadius: "6px",
                padding: "8px 16px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#21262d")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              ✕ Exit
            </button>
          </div>

          {/* Core Question & Interactive Options Block Wrapper Component */}
          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: "12px",
              padding: "40px",
              marginBottom: "24px",
            }}
          >
            <span style={{ fontSize: "12px", color: "#58a6ff", fontWeight: "600", textTransform: "uppercase" }}>
              Question {currentQuestionIndex + 1}
            </span>
            <h2 style={{ fontSize: "22px", fontWeight: "600", marginTop: "12px", marginBottom: "32px", color: "#f0f6fc", lineHeight: "1.4" }}>
              {currentQuestion.questionText}
            </h2>

            {/* Selection Engine List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {currentQuestion.options.map((option) => {
                const isSelected = selectedAnswers[currentQuestionIndex] === option;
                return (
                  <div
                    key={option}
                    onClick={() => handleOptionSelect(option)}
                    style={{
                      border: isSelected ? "1px solid #58a6ff" : "1px solid #30363d",
                      backgroundColor: isSelected ? "rgba(56, 139, 253, 0.1)" : "#0d1117",
                      borderRadius: "8px",
                      padding: "18px 24px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      transition: "border-color 0.2s, background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.borderColor = "#8b949e";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.borderColor = "#30363d";
                    }}
                  >
                    {/* Simulated Radio Input Button Bubble indicator markup */}
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        border: isSelected ? "6px solid #58a6ff" : "2px solid #30363d",
                        backgroundColor: isSelected ? "#0d1117" : "transparent",
                        boxSizing: "border-box",
                        transition: "all 0.15s ease",
                      }}
                    />
                    <span style={{ fontSize: "16px", color: isSelected ? "#58a6ff" : "#c9d1d9", fontWeight: isSelected ? "500" : "400" }}>
                      {option}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer Navigation Strip Control Block Layer */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleNext}
              disabled={!selectedAnswers[currentQuestionIndex] || isSubmitting}
              style={{
                backgroundColor: !selectedAnswers[currentQuestionIndex] || isSubmitting ? "#30363d" : "#6c5ce7",
                color: !selectedAnswers[currentQuestionIndex] || isSubmitting ? "#8b949e" : "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "14px 36px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: !selectedAnswers[currentQuestionIndex] || isSubmitting ? "not-allowed" : "pointer",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => {
                if (selectedAnswers[currentQuestionIndex]) e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              {isSubmitting
                ? "Submitting..."
                : currentQuestionIndex === totalQuestions - 1
                  ? "Submit Assessment →"
                  : "Next →"}
            </button>
          </div>

        </div>
      </div>
    );
  }

  // --- STANDARD DASHBOARD MANAGEMENT GRID VIEW ---
  return (
    <AppShell currentTab="assessments">
      <div className="ph">
        <h2>Assessments</h2>
        <p>Select your track and choose a level to launch your verification quiz module.</p>
      </div>

      <div className="ptabs">
        {COURSE_TABS.map((tab) => {
          const isActive = activeTabId === tab.id;
          return (
            <div
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`ptab ${tab.cssClass} ${isActive ? "on" : ""}`}
            >
              <span>{tab.icon}</span>
              {tab.name}
            </div>
          );
        })}
      </div>

      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", 
          gap: "20px", 
          marginTop: "24px" 
        }}
      >
        {LEVEL_SCHEMAS.map((level) => {
          const quizDetails = assessmentMeta[level.id];
          const isCurrentlyLoading = activeLoadingLevel === level.id;
          const moduleName = getModuleNameForTab(activeTabId);
          const isUnlocked =
            moduleName && certifications.length > 0
              ? isLevelUnlocked(certifications, moduleName, level.id as CertId)
              : level.id === "pathfinder";
          
          const displayMinutes = quizDetails?.timeLimit 
            ? Math.floor(quizDetails.timeLimit / 60) 
            : 30; 
          
          const displayPassPercent = quizDetails?.passingPercentage ?? 75;

          return (
            <div
              key={level.id}
              onClick={() => isUnlocked && !isCurrentlyLoading && handleLevelClick(level.id)}
              className="mod-card"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "24px",
                opacity: isUnlocked ? (isCurrentlyLoading ? 0.7 : 1) : 0.4,
                cursor: isUnlocked ? (isCurrentlyLoading ? "wait" : "pointer") : "not-allowed",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "all 0.2s ease-in-out"
              }}
            >
              <div>
                <div style={{ fontSize: "28px", marginBottom: "16px" }}>
                  {isCurrentlyLoading ? "⏳" : level.icon}
                </div>

                <h3 style={{ fontSize: "20px", fontWeight: "600", margin: "0 0 4px 0", color: "#ffffff" }}>
                  {level.name} {isCurrentlyLoading && "(Connecting...)"}
                </h3>
                <p style={{ fontSize: "14px", color: "var(--text-muted, #8a92a6)", margin: "0 0 24px 0" }}>
                  {level.subtitle}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <div 
                  className="mod-link doc" 
                  style={{ padding: "6px 12px", borderRadius: "20px", pointerEvents: "none", margin: 0 }}
                >
                  <span>⏱</span> {displayMinutes} min
                </div>

                <div 
                  className="mod-link vid" 
                  style={{ 
                    padding: "6px 12px", 
                    borderRadius: "20px", 
                    pointerEvents: "none", 
                    margin: 0, 
                    backgroundColor: "rgba(16, 185, 129, 0.15)", 
                    color: "#10b981" 
                  }}
                >
                  Pass: {displayPassPercent}%
                </div>

                {!isUnlocked && (
                  <div 
                    style={{ 
                      fontSize: "13px", 
                      color: "var(--text-muted, #8a92a6)", 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "4px",
                      marginLeft: "auto"
                    }}
                  >
                    🔒 Complete previous level first
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}