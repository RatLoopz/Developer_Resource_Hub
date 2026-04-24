import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return NextResponse.json({ ok: true, message: "POST received" });
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "GET received" });
}
