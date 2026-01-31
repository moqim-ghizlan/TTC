import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

function generateRandomKey(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function GET() {
  for (let length = 3; length <= 20; length++) {
    for (let attempt = 0; attempt < 10; attempt++) {
      const key = generateRandomKey(length);
      const exists = await prisma.codeSnippet.findUnique({
        where: { key },
      });
      if (!exists) {
        return NextResponse.json({ key });
      }
    }
  }

  return NextResponse.json({ error: "Could not generate key" }, { status: 500 });
}
