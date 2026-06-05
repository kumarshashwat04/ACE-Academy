import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";

type Body = {
  collection: string;
  docId: string;
  data: Record<string, unknown>;
  merge?: boolean;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const { collection, docId, data, merge = true } = body;

    if (!collection || !docId || !data || typeof data !== "object") {
      return NextResponse.json(
        { error: "collection, docId, and data are required." },
        { status: 400 }
      );
    }

    await getAdminDb()
      .collection(collection)
      .doc(docId)
      .set(
        {
          ...data,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge }
      );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
