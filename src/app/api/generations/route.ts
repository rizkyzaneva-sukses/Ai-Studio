import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runGeneration } from "@/lib/automation";

// GET /api/generations - List all generations with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const storyboardId = searchParams.get("storyboardId");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (storyboardId) where.storyboardId = storyboardId;
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

// POST /api/generations - Create a new generation request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, storyboardId, type, prompt, accountId, imagePaths } = body;

    if (!projectId || !type || !prompt) {
      return NextResponse.json(
        { error: "projectId, type, and prompt are required" },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Auto-select account if not specified
    let selectedAccountId = accountId;
    if (!selectedAccountId) {
      const accountType = type === "storyboard" ? "chatgpt" : "gemini";

      // Find active account with available slots
      const account = await prisma.account.findFirst({
        where: {
          type: accountType,
          status: "active",
          usageCount: { lt: prisma.account.fields.maxUsage as unknown as number },
        },
        orderBy: { usageCount: "desc" },
      });

      if (!account) {
        return NextResponse.json({ error: `No active ${accountType} accounts available` }, { status: 400 });
      }

      selectedAccountId = account.id;
    }

    // Create generation record
    const generation = await prisma.generation.create({
      data: {
        projectId,
        ...(storyboardId && { storyboardId }),
        accountId: selectedAccountId,
        type,
        prompt,
        status: "pending",
      },
    });

    // Update account usage
    await prisma.account.update({
      where: { id: selectedAccountId },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    // Run generation in background (fire and forget)
    const automationType = type === "storyboard" ? "chatgpt" : "gemini";
    runGeneration(
      {
        generationId: generation.id,
        accountId: selectedAccountId,
        prompt,
        imagePaths: imagePaths || project.imageUrls || [],
      },
      automationType
    ).catch((err) => {
      console.error("Generation failed:", err);
    });

    return NextResponse.json(generation, { status: 201 });
  } catch (error) {
    console.error("Failed to create generation:", error);
    return NextResponse.json({ error: "Failed to create generation" }, { status: 500 });
  }
}
