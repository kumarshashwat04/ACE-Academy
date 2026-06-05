import {
  findCertLevel,
  getNextLevelName,
  parseQuizId,
} from "@/lib/assessment-mapping";
import type { CertificationModule, LevelProgress } from "@/lib/certifications";
import { updateModuleProgress } from "@/lib/certifications";

export type AssessmentResultSummary = {
  passed: boolean;
  scoreUpdated: boolean;
  previousScore: number;
  newScore: number;
  levelCompleted: boolean;
  nextLevelUnlocked: string | null;
};

type ApplyAssessmentResultInput = {
  certifications: CertificationModule[];
  quizId: string;
  assessmentScore: number;
  passingPercentage: number;
  attemptedTimeSeconds: number;
  attemptedAt: string;
};

export function applyAssessmentResult({
  certifications,
  quizId,
  assessmentScore,
  passingPercentage,
  attemptedTimeSeconds,
  attemptedAt,
}: ApplyAssessmentResultInput): {
  updatedCertifications: CertificationModule[];
  result: AssessmentResultSummary;
} {
  const parsed = parseQuizId(quizId);
  if (!parsed) {
    throw new Error(`Invalid quizId: ${quizId}`);
  }

  const { moduleName, levelName } = parsed;
  const currentLevel = findCertLevel(certifications, moduleName, levelName);
  if (!currentLevel) {
    throw new Error(`Certification level not found: ${moduleName} / ${levelName}`);
  }

  if (currentLevel.status === "locked") {
    throw new Error(`Certification level is locked: ${moduleName} / ${levelName}`);
  }

  const previousScore = currentLevel.score;
  const newScore = assessmentScore > previousScore ? assessmentScore : previousScore;
  const scoreUpdated = newScore > previousScore;
  const passed = assessmentScore >= passingPercentage;

  let status: LevelProgress["status"] = currentLevel.status;
  if (currentLevel.status === "not_started" || currentLevel.status === "in_progress") {
    status = passed ? "completed" : "in_progress";
  }

  let completedAt = currentLevel.completedAt;
  if (passed && !completedAt) {
    completedAt = attemptedAt;
  }

  let updated = updateModuleProgress(certifications, moduleName, levelName, {
    score: newScore,
    status,
    noOfAttempts: currentLevel.noOfAttempts + 1,
    lastAttemptDate: attemptedAt,
    attemptedTime: currentLevel.attemptedTime + attemptedTimeSeconds,
    completedAt,
  });

  let nextLevelUnlocked: string | null = null;
  if (passed) {
    const nextLevelName = getNextLevelName(levelName);
    if (nextLevelName) {
      const nextLevel = findCertLevel(updated, moduleName, nextLevelName);
      if (nextLevel?.status === "locked") {
        updated = updateModuleProgress(updated, moduleName, nextLevelName, {
          status: "not_started",
        });
        nextLevelUnlocked = nextLevelName;
      }
    }
  }

  return {
    updatedCertifications: updated,
    result: {
      passed,
      scoreUpdated,
      previousScore,
      newScore,
      levelCompleted: passed,
      nextLevelUnlocked,
    },
  };
}
