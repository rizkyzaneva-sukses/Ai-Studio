import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ALLOWED_STATUS = ["draft", "active", "paused", "archived"] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const storyboards = await prisma.storyboard.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { generations: true } } },
    });

    return NextResponse.json(storyboards);
  } catch (error) {
    console.error("Failed to fetch storyboards:", error);
    return NextResponse.json({ error: "Failed to fetch storyboards" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, objective, angle, pillars, notes, status } = body as {
      projectId?: string;
      name?: string;
      objective?: string;
      angle?: string;
      pillars?: string;
      notes?: string;
      status?: string;
    };

    if (!projectId || !name?.trim()) {
      return NextResponse.json({ error: "projectId and name are required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (status && !ALLOWED_STATUS.includes(status as (typeof ALLOWED_STATUS)[number])) {
      return NextResponse.json({ error: `status must be one of ${ALLOWED_STATUS.join(", ")}` }, { status: 400 });
    }

    const storyboard = await prisma.storyboard.create({
      data: {
        projectId,
        name: name.trim(),
        objective: objective?.trim() || "conversion",
        angle: angle?.trim() || null,
        pillars: pillars?.trim() || null,
        notes: notes?.trim() || null,
        status: status || "draft",
      },
      include: { _count: { select: { generations: true } } },
    });

    return NextResponse.json(storyboard, { status: 201 });
  } catch (error) {
    console.error("Failed to create storyboard:", error);
    return NextResponse.json({ error: "Failed to create storyboard" }, { status: 500 });
  }
}
