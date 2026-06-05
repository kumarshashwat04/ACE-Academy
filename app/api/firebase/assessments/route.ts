import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";


///////-----------------------------------------------------------------
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("quizId");

    const db = getAdminDb();
    const collectionRef = db.collection("assessments");

    // Scenario A: Fetch a specific quiz
    if (quizId) {
      const docSnap = await collectionRef.doc(quizId).get();
      
      if (!docSnap.exists) {
        return NextResponse.json({ error: `Assessment with ID '${quizId}' not found.` }, { status: 404 });
      }

      return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
    }

    // Scenario B: Fetch all quizzes if no specific quizId is provided
    const snapshot = await collectionRef.get();
    const assessments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ assessments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}