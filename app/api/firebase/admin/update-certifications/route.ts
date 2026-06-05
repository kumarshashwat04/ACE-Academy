import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";

type Body = {
  uid: string;
  certifications: unknown[];
  updatedBy?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<Body>;
    const { uid, certifications, updatedBy } = body;

    if (!uid || !Array.isArray(certifications)) {
      return NextResponse.json(
        { error: "uid and certifications array are required." },
        { status: 400 }
      );
    }

    const userRef = getAdminDb().collection("users").doc(uid);
    await userRef.set(
      {
        certifications,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: updatedBy ?? "admin",
      },
      { merge: true }
    );

    return NextResponse.json({
      ok: true,
      uid,
      certifications,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
