import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/generations - List all generations with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (type) where.type = type;
    if (status) where.status = status;

    const generations = await prisma.generation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { project: true, account: true },
    });
    return NextResponse.json(generations);
  } catch (error) {
    console.error("Failed to fetch generations:", error);
    return NextResponse.json({ error: "Failed to fetch generations" }, { status: 500 });
  }
}

// POST /api/generations - Create a new generation job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, accountId, type, prompt } = body;

    if (!projectId || !type || !prompt) {
      return NextResponse.json({ error: "projectId, type, and prompt are required" }, { status: 400 });
    }

    // Auto-select account if not specified
    let selectedAccountId = accountId;
    if (!selectedAccountId) {
      const accountType = type === "storyboard" ? "chatgpt" : "gemini";
      // Find account with lowest usage that's still active and under limit
      const account = await prisma.account.findFirst({
        where: {
          type: accountType,
          status: "active",
          usageCount: { lt: prisma.account.fields.maxUsage as unknown as number },
        },
        orderBy: { usageCount: "desc" }, // Exhaust current account first (highest usage)
      });

      // Fallback: find any active account of the right type
      if (!account) {
        const fallback = await prisma.account.findFirst({
          where: { type: accountType, status: "active" },
          orderBy: { usageCount: "asc" },
        });
        if (!fallback) {
          return NextResponse.json({ error: `No active ${accountType} accounts available` }, { status: 400 });
        }
        selectedAccountId = fallback.id;
      } else {
        selectedAccountId = account.id;
      }
    }

    // Create generation record
    const generation = await prisma.generation.create({
      data: {
        projectId,
        accountId: selectedAccountId,
        type,
        prompt,
        status: "pending",
      },
      include: { project: true, account: true },
    });

    // Simulate processing (in production, this would trigger Playwright automation)
    // Mark as processing immediately
    await prisma.generation.update({
      where: { id: generation.id },
      data: { status: "processing" },
    });

    // Update account usage
    await prisma.account.update({
      where: { id: selectedAccountId },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    // Simulate completion after a short delay (mocked)
    setTimeout(async () => {
      try {
        await prisma.generation.update({
          where: { id: generation.id },
          data: {
            status: "completed",
            resultUrl: type === "storyboard"
              ? `/api/uploads/generated/storyboard-${generation.id}.png`
              : `/api/uploads/generated/video-${generation.id}.mp4`,
          },
        });
      } catch (e) {
        console.error("Failed to update generation status:", e);
      }
    }, 3000);

    return NextResponse.json(generation, { status: 201 });
  } catch (error) {
    console.error("Failed to create generation:", error);
    return NextResponse.json({ error: "Failed to create generation" }, { status: 500 });
  }
}
