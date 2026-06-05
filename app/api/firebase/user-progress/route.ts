import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import type { ProgressSnapshot, ScoreRecord } from "@/lib/progress";

type ProgressUpdateBody = {
  uid: string;
  done?: Record<string, string>;
  scores?: ScoreRecord[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ProgressUpdateBody>;
    const { uid, done, scores } = body;

    if (!uid) {
      return NextResponse.json({ error: "uid is required." }, { status: 400 });
    }

    const userRef = getAdminDb().collection("users").doc(uid);
    const existingDoc = await userRef.get();
    const existingProgress = (existingDoc.data()?.progress ?? {}) as Partial<ProgressSnapshot>;

    const nextProgress = {
      ...existingProgress,
      ...(typeof done === "object" && done ? { done } : {}),
      ...(Array.isArray(scores) ? { scores } : {}),
    };

    await userRef.set(
      {
        progress: nextProgress,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({
      ok: true,
      progress: nextProgress,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
