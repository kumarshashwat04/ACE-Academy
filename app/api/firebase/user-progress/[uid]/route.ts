import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import type { ProgressSnapshot } from "@/lib/progress";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    if (!uid) {
      return NextResponse.json({ error: "uid is required." }, { status: 400 });
    }

    const userDoc = await getAdminDb().collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json({
        scores: [],
        done: {},
      } satisfies ProgressSnapshot);
    }

    const progress = (userDoc.data()?.progress ?? {}) as Partial<ProgressSnapshot>;

    return NextResponse.json({
      scores: Array.isArray(progress.scores) ? progress.scores : [],
      done: typeof progress.done === "object" && progress.done ? progress.done : {},
    } satisfies ProgressSnapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
