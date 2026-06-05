import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";

type Question = {
  questionText: string;
  options: string[];
  correctAnswer: string;
};

type AssessmentPayload = {
  quizId: "ttp-pathfinder" | "ttp-navigator" | "ttp-grandmaster"| "rtp-navigator" | "rtp-grandmaster"| "rtp-pathfinder" | "tools-navigator" | "tools-grandmaster"| "tools-pathfinder" ;
  totalMarks: number;
  passingPercentage: number;
  timeLimit: number; // e.g., in seconds or minutes
  questions: Question[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AssessmentPayload;
    const { quizId, totalMarks, passingPercentage, timeLimit, questions } = body;

    // Validate allowed quiz IDs
    const validIds = ["ttp-pathfinder", "ttp-navigator", "ttp-grandmaster", "rtp-navigator", "rtp-grandmaster", "rtp-pathfinder", "tools-navigator", "tools-grandmaster", "tools-pathfinder"];
    if (!quizId || !validIds.includes(quizId)) {
      return NextResponse.json(
        { error: "Invalid or missing quizId. Must be one of the allowed quiz IDs." },
        { status: 400 }
      );
    }

    // Validate remaining fields
    if (totalMarks === undefined || passingPercentage === undefined || timeLimit === undefined || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: "Missing required fields: totalMarks, passingPercentage, timeLimit, or questions array." },
        { status: 400 }
      );
    }

    // Save to Firestore using the quizId as the document ID
    await getAdminDb()
      .collection("assessments")
      .doc(quizId)
      .set(
        {
          quizId,
          totalMarks,
          passingPercentage,
          timeLimit,
          questions,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true } // Merges if doc exists, creates if it doesn't
      );

    return NextResponse.json({ ok: true, message: `Assessment '${quizId}' successfully updated/created.` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}