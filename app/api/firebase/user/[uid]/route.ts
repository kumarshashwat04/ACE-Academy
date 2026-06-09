import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

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
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    return NextResponse.json(userDoc.data());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type PatchBody = {
  name?: string;
  role?: "admin" | "learner";
  team?: string;
};

/**
 * PATCH /api/firebase/user/[uid]
 *
 * Admin edit of a user's identity/access fields (name, role, team).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    if (!uid) {
      return NextResponse.json({ error: "uid is required." }, { status: 400 });
    }

    const body = (await request.json()) as PatchBody;
    const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

    if (typeof body.name === "string" && body.name.trim()) {
      updates.name = body.name.trim();
    }
    if (body.role === "admin" || body.role === "learner") {
      updates.role = body.role;
    }
    if (typeof body.team === "string" && body.team.trim()) {
      updates.team = body.team.trim();
    }

    if (Object.keys(updates).length === 1) {
      return NextResponse.json(
        { error: "No valid fields to update (name, role, or team)." },
        { status: 400 }
      );
    }

    await getAdminDb().collection("users").doc(uid).set(updates, { merge: true });

    // Keep the Auth display name in sync when the name changes.
    if (typeof updates.name === "string") {
      try {
        await getAdminAuth().updateUser(uid, { displayName: updates.name });
      } catch {
        // Auth record may not exist for legacy/Firestore-only users — ignore.
      }
    }

    return NextResponse.json({ ok: true, uid });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/firebase/user/[uid]
 *
 * Removes both the Firestore profile and the Firebase Auth login.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    if (!uid) {
      return NextResponse.json({ error: "uid is required." }, { status: 400 });
    }

    await getAdminDb().collection("users").doc(uid).delete();

    try {
      await getAdminAuth().deleteUser(uid);
    } catch (authError) {
      const code = (authError as { code?: string })?.code;
      // Tolerate a missing Auth record (Firestore-only / already-removed user).
      if (code !== "auth/user-not-found") {
        throw authError;
      }
    }

    return NextResponse.json({ ok: true, uid });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
