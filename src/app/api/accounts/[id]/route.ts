import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/encryption";

// GET /api/accounts/[id] - Get account by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const account = await prisma.account.findUnique({
      where: { id },
      select: {
        id: true, type: true, name: true, email: true, status: true,
        lastUsedAt: true, usageCount: true, maxUsage: true, resetAt: true,
        notes: true, createdAt: true, updatedAt: true,
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error("Failed to fetch account:", error);
    return NextResponse.json({ error: "Failed to fetch account" }, { status: 500 });
  }
}

// PUT /api/accounts/[id] - Update account
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, name, email, sessionCookie, status, maxUsage, notes, usageCount, resetAt } = body;

    const updateData: Record<string, unknown> = {};
    if (type !== undefined) updateData.type = type;
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (sessionCookie !== undefined && sessionCookie !== "") updateData.sessionCookie = encrypt(sessionCookie);
    if (status !== undefined) updateData.status = status;
    if (maxUsage !== undefined) updateData.maxUsage = maxUsage;
    if (notes !== undefined) updateData.notes = notes;
    if (usageCount !== undefined) updateData.usageCount = usageCount;
    if (resetAt !== undefined) updateData.resetAt = resetAt ? new Date(resetAt) : null;

    const account = await prisma.account.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error("Failed to update account:", error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}

// DELETE /api/accounts/[id] - Delete account
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.account.delete({ where: { id } });
    return NextResponse.json({ message: "Account deleted" });
  } catch (error) {
    console.error("Failed to delete account:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
