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

    // Auto-reset expired cooldown accounts before returning data
    const now = new Date();
    await prisma.account.updateMany({
      where: {
        tokenStatus: "exhausted",
        resetAt: { lte: now },
      },
      data: {
        usageCount: 0,
        tokenStatus: "ready",
        resetAt: null,
      },
    });

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

      // Auto-reset expired cooldown accounts
      const now = new Date();
      await prisma.account.updateMany({
        where: {
          type: accountType,
          tokenStatus: "exhausted",
          resetAt: { lte: now },
        },
        data: {
          usageCount: 0,
          tokenStatus: "ready",
          resetAt: null,
        },
      });

      // Find active account with available slots (prefer highest usage to exhaust first)
      const account = await prisma.account.findFirst({
        where: {
          type: accountType,
          status: "active",
          tokenStatus: "ready",
          usageCount: { lt: prisma.account.fields.maxUsage as unknown as number },
        },
        orderBy: { usageCount: "desc" },
      });

      if (!account) {
        // All accounts exhausted — find the soonest reset time
        const nextReset = await prisma.account.findFirst({
          where: {
            type: accountType,
            status: "active",
            tokenStatus: "exhausted",
            resetAt: { not: null },
          },
          orderBy: { resetAt: "asc" },
          select: { resetAt: true },
        });

        const resetMsg = nextReset?.resetAt
          ? `Semua akun habis. Reset berikutnya: ${new Date(nextReset.resetAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`
          : `Semua akun ${accountType} habis slot.`;

        return NextResponse.json({ error: resetMsg }, { status: 400 });
      }

      selectedAccountId = account.id;
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

    // Update account usage & check if exhausted
    const updatedAccount = await prisma.account.update({
      where: { id: selectedAccountId },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    // Mark exhausted if usage hits max
    if (updatedAccount.usageCount >= updatedAccount.maxUsage) {
      const firstUse = updatedAccount.lastUsedAt || new Date();
      const resetTime = new Date(firstUse.getTime() + 5 * 60 * 60 * 1000);
      await prisma.account.update({
        where: { id: selectedAccountId },
        data: {
          tokenStatus: "exhausted",
          resetAt: resetTime,
        },
      });
    }

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
        // On failure: revert usage count and reset token status
        await prisma.generation.update({
          where: { id: generation.id },
          data: { status: "failed", error: "Generation failed" },
        }).catch(() => {});
        const revertedAccount = await prisma.account.update({
          where: { id: selectedAccountId },
          data: { usageCount: { decrement: 1 } },
        }).catch(() => null);
        if (revertedAccount && revertedAccount.usageCount < revertedAccount.maxUsage) {
          await prisma.account.update({
            where: { id: selectedAccountId },
            data: { tokenStatus: "ready", resetAt: null },
          }).catch(() => {});
        }
        console.error("Failed to update generation status:", e);
      }
    }, 3000);

    return NextResponse.json(generation, { status: 201 });
  } catch (error) {
    console.error("Failed to create generation:", error);
    return NextResponse.json({ error: "Failed to create generation" }, { status: 500 });
  }
}
