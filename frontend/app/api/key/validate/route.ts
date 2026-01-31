import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { key } = await request.json();

  if (!key || typeof key !== "string") {
    return NextResponse.json({ valid: false, error: "Key is required" });
  }

  if (key.length < 2 || key.length > 20) {
    return NextResponse.json({ valid: false, error: "Key must be 2-20 characters" });
  }

  const validKeyRegex = /^[a-zA-Z0-9]+$/;
  if (!validKeyRegex.test(key)) {
    return NextResponse.json({ valid: false, error: "Key can only contain letters and numbers" });
  }

  return NextResponse.json({ valid: true });
}
