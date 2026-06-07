import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/encryption";

// GET /api/accounts - List all accounts
export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        name: true,
        email: true,
        status: true,
        lastUsedAt: true,
        usageCount: true,
        maxUsage: true,
        resetAt: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        // Never expose sessionCookie to frontend
      },
    });
    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

// POST /api/accounts - Create a new account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, name, email, sessionCookie, maxUsage, notes } = body;

    if (!type || !name) {
      return NextResponse.json({ error: "Type and name are required" }, { status: 400 });
    }

    if (!["chatgpt", "gemini"].includes(type)) {
      return NextResponse.json({ error: "Type must be 'chatgpt' or 'gemini'" }, { status: 400 });
    }

    const account = await prisma.account.create({
      data: {
        type,
        name,
        email: email || null,
        sessionCookie: sessionCookie ? encrypt(sessionCookie) : null,
        maxUsage: maxUsage || (type === "chatgpt" ? 50 : 25),
        notes: notes || null,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error("Failed to create account:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
