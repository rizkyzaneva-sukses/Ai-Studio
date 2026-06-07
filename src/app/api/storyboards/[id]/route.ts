import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ALLOWED_STATUS = ["draft", "active", "paused", "archived"] as const;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const storyboard = await prisma.storyboard.findUnique({
      where: { id },
      include: {
        project: true,
        generations: {
          orderBy: { createdAt: "desc" },
          include: { account: true },
        },
        _count: { select: { generations: true } },
      },
    });

    if (!storyboard) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(storyboard);
  } catch (error) {
    console.error("Failed to fetch storyboard:", error);
    return NextResponse.json({ error: "Failed to fetch storyboard" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, objective, angle, pillars, notes, status } = body as {
      name?: string;
      objective?: string;
      angle?: string;
      pillars?: string;
      notes?: string;
      status?: string;
    };

    if (status && !ALLOWED_STATUS.includes(status as (typeof ALLOWED_STATUS)[number])) {
      return NextResponse.json({ error: `status must be one of ${ALLOWED_STATUS.join(", ")}` }, { status: 400 });
    }

    const storyboard = await prisma.storyboard.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(objective !== undefined ? { objective: objective.trim() || "conversion" } : {}),
        ...(angle !== undefined ? { angle: angle?.trim() || null } : {}),
        ...(pillars !== undefined ? { pillars: pillars?.trim() || null } : {}),
        ...(notes !== undefined ? { notes: notes?.trim() || null } : {}),
        ...(status !== undefined ? { status } : {}),
      },
      include: { _count: { select: { generations: true } } },
    });

    return NextResponse.json(storyboard);
  } catch (error) {
    console.error("Failed to update storyboard:", error);
    return NextResponse.json({ error: "Failed to update storyboard" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.storyboard.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete storyboard:", error);
    return NextResponse.json({ error: "Failed to delete storyboard" }, { status: 500 });
  }
}
