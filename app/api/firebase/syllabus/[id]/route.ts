import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Syllabus id is required." }, { status: 400 });
    }

    const doc = await getAdminDb().collection("syllabi").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Syllabus not found." }, { status: 404 });
    }

    return NextResponse.json(doc.data());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
