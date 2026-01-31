import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  const codeSnippet = await prisma.codeSnippet.findUnique({
    where: { key },
  });

  if (!codeSnippet) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(codeSnippet);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const { content } = await request.json();

  const codeSnippet = await prisma.codeSnippet.upsert({
    where: { key },
    update: { content },
    create: { key, content },
  });

  return NextResponse.json(codeSnippet);
}
