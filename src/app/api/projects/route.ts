import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

// GET /api/projects
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        images: { orderBy: { order: "asc" } },
        storyboards: { orderBy: { updatedAt: "desc" } },
        _count: { select: { generations: true, storyboards: true } },
      },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

// POST /api/projects
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || "";
    const brandNotes = (formData.get("brandNotes") as string) || "";
    const files = formData.getAll("images") as File[];

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    // Create project
    const project = await prisma.project.create({
      data: { name, description, brandNotes },
    });

    // Handle image uploads
    if (files.length > 0) {
      const uploadDir = join(process.cwd(), "uploads", "projects", project.id);
      await mkdir(uploadDir, { recursive: true });

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size === 0) continue;
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const filepath = join(uploadDir, filename);
        await writeFile(filepath, buffer);

        await prisma.projectImage.create({
          data: {
            projectId: project.id,
            url: `/api/uploads/projects/${project.id}/${filename}`,
            filename: file.name,
            order: i,
          },
        });
      }
    }

    const result = await prisma.project.findUnique({
      where: { id: project.id },
      include: { images: true },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
