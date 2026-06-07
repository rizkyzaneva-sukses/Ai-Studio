"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { VEO_DURATION_LABEL } from "@/lib/videoPrompt";
import {
  Sparkles,
  Video,
  ImageIcon,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  brandNotes: string | null;
}

interface Storyboard {
  id: string;
  name: string;
  objective: string;
  angle: string | null;
  pillars: string | null;
  notes: string | null;
  status: string;
}

interface Generation {
  id: string;
  type: string;
  prompt: string;
  status: string;
  resultUrl: string | null;
  project: { name: string };
  storyboard?: { name: string } | null;
  account: { name: string; type: string };
  createdAt: string;
}

interface PromptTemplate {
  label: string;
  prompt: string;
  description?: string;
}

const STORYBOARD_TEMPLATES: PromptTemplate[] = [
  {
    label: "Product Showcase",
    prompt:
      "Create a 4-panel storyboard for a Zaneva muslimah sportswear product showcase. Panel 1: Close-up of fabric texture and quality. Panel 2: Model wearing the hijab-friendly activewear during exercise. Panel 3: Lifestyle shot showing the outfit in daily activities. Panel 4: Brand logo with tagline. Style: Modern, clean, empowering.",
  },
  {
    label: "Ramadan Campaign",
    prompt:
      "Design a 4-panel storyboard for Zaneva's Ramadan campaign. Panel 1: Serene morning scene, woman in modest activewear doing light stretching. Panel 2: Community gathering for sahur/iftar. Panel 3: Evening workout in comfortable hijab sportswear. Panel 4: Inspirational message with Zaneva branding. Mood: Warm, spiritual, inclusive.",
  },
  {
    label: "Testimonial Story",
    prompt:
      "Create a 3-panel social media storyboard featuring a customer testimonial for Zaneva sportswear. Panel 1: Before - showing the challenge of finding modest activewear. Panel 2: Discovery - trying Zaneva products. Panel 3: After - confident and active lifestyle. Include text overlays for social media.",
  },
];

const VIDEO_TEMPLATES: PromptTemplate[] = [
  {
    label: `Hook Reveal (${VEO_DURATION_LABEL})`,
    description: "Buat video pembuka yang cepat buat narik perhatian di 2 detik pertama.",
    prompt:
      "Create a 10-second vertical affiliate video for Zaneva muslimah sportswear. Keep it to 5 short beats only: 0-2s full-look hero reveal, 2-4s close-up fabric shot, 4-6s model movement, 6-8s one key benefit on screen, 8-10s checkout CTA. Tone: scroll-stopping, premium, clean. Text overlay must stay minimal and readable. Format: 9:16 for Reels/TikTok.",
  },
  {
    label: `Bahan Close-Up (${VEO_DURATION_LABEL})`,
    description: "Fokus ke detail bahan, jatuh kain, dan rasa premium produk.",
    prompt:
      "Generate a 10-second vertical product-detail video for Zaneva. Show only 4 concise beats: macro fabric texture, stretch/flow movement, modest coverage detail, final product beauty shot. Highlight 2 benefits maximum: breathable, not see-through, flowy, or lightweight. Visual feel: elegant, tactile, premium. Format: 9:16.",
  },
  {
    label: `Try-On Gerak (${VEO_DURATION_LABEL})`,
    description: "Menonjolkan look saat dipakai dan tetap nyaman dipakai bergerak.",
    prompt:
      "Create a 10-second vertical try-on video for Zaneva activewear. Sequence: opening outfit reveal, walking shot, workout movement shot, close-up drape/hijab-friendly detail, end CTA. Keep motion natural, feminine, confident, and modest. Use short captions only and avoid overcrowding the frame. Format: 9:16.",
  },
  {
    label: `Problem-Solution (${VEO_DURATION_LABEL})`,
    description: "Cocok buat angle masalah umum lalu langsung kasih solusi produk.",
    prompt:
      "Create a 10-second vertical problem-solution ad for Zaneva muslimah sportswear. Beat 1: show one relatable problem only, such as hot fabric, see-through material, or hard-to-move outfit. Beat 2-4: reveal Zaneva as the solution with product close-ups and movement proof. Beat 5: simple CTA to shop now. Keep it sharp, practical, and easy to understand in one watch. Format: 9:16.",
  },
  {
    label: `UGC Testimoni (${VEO_DURATION_LABEL})`,
    description: "Gaya video affiliate yang terasa seperti review jujur dari pengguna.",
    prompt:
      "Generate a 10-second vertical UGC-style affiliate video for Zaneva. Structure: quick opening reaction, 2 product proof shots, 1 comfort or modesty claim, final recommendation CTA. Make it feel natural, believable, and creator-made, not overly polished. Keep text short and conversational. Format: 9:16.",
  },
  {
    label: `Wudhu Friendly (${VEO_DURATION_LABEL})`,
    description: "Preset spesifik untuk angle busui atau wudhu-friendly yang praktis.",
    prompt:
      "Create a 10-second vertical benefit-focused video for Zaneva with a wudhu-friendly or busui-friendly angle. Show only 4 simple beats: outfit overview, practical detail shot, easy-use demonstration, final CTA. Focus on one core benefit only so the message lands quickly. Tone: helpful, modest, practical, premium. Format: 9:16.",
  },
];

export default function GeneratePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [storyboards, setStoryboards] = useState<Storyboard[]>([]);
  const [recentGenerations, setRecentGenerations] = useState<Generation[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedStoryboardId, setSelectedStoryboardId] = useState("");
  const [generationType, setGenerationType] = useState<"storyboard" | "video">("storyboard");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) setProjects(await res.json());
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  };

  const fetchStoryboards = async (projectId: string) => {
    if (!projectId) {
      setStoryboards([]);
      setSelectedStoryboardId("");
      return;
    }

    try {
      const res = await fetch(`/api/storyboards?projectId=${projectId}`);
      if (res.ok) setStoryboards(await res.json());
    } catch (err) {
      console.error("Failed to fetch storyboards:", err);
    }
  };

  const fetchRecentGenerations = async () => {
    try {
      const res = await fetch("/api/generations?limit=10");
      if (res.ok) setRecentGenerations(await res.json());
    } catch (err) {
      console.error("Failed to fetch generations:", err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchRecentGenerations();
  }, []);

  useEffect(() => {
    fetchStoryboards(selectedProjectId);
  }, [selectedProjectId]);

  const handleGenerate = async () => {
    if (!selectedProjectId || !prompt.trim()) {
      setError("Please select a project and enter a prompt.");
      return;
    }
    if (storyboards.length > 0 && !selectedStoryboardId) {
      setError("Please select a storyboard to keep variants grouped.");
      return;
    }

    setGenerating(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          storyboardId: selectedStoryboardId || undefined,
          type: generationType,
          prompt: prompt.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(
          `Generation started! Storyboard: ${data.storyboard?.name || "Unassigned"}. Account: ${data.account?.name || "auto-selected"}. Status will update automatically.`
        );
        setPrompt("");
        fetchRecentGenerations();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to start generation.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const templates = generationType === "storyboard" ? STORYBOARD_TEMPLATES : VIDEO_TEMPLATES;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-gray-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Generate Content</h1>
        <p className="text-muted-foreground mt-1">
          Create storyboards and videos using AI-powered automation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generation Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                New Generation
              </CardTitle>
              <CardDescription>
                Select a project, choose the content type, and describe what you want to generate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Project Selection */}
              <div className="space-y-2">
                <Label htmlFor="project">Project *</Label>
                <Select
                  id="project"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  <option value="">Select a project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-muted-foreground">
                  Satu produk = satu project. Banyak storyboard di dalam satu project.
                </p>
              </div>

              {/* Storyboard Selection */}
              <div className="space-y-2">
                <Label htmlFor="storyboard">Storyboard *</Label>
                <Select
                  id="storyboard"
                  value={selectedStoryboardId}
                  onChange={(e) => setSelectedStoryboardId(e.target.value)}
                  disabled={!selectedProjectId}
                >
                  <option value="">
                    {selectedProjectId
                      ? storyboards.length > 0
                        ? "Select a storyboard..."
                        : "No storyboards yet - create one below"
                      : "Select a project first"}
                  </option>
                  {storyboards.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-muted-foreground">
                  Tiap project bisa punya banyak storyboard. Cocok buat testing angle, pillar, atau campaign berbeda.
                </p>
                {selectedProjectId && storyboards.length === 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    Project ini belum punya storyboard. Isi nama storyboard baru di bawah, lalu simpan dulu sebelum generate.
                  </div>
                )}
              </div>

              {/* Type Selection */}
              <div className="space-y-2">
                <Label>Content Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGenerationType("storyboard")}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                      generationType === "storyboard"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <ImageIcon className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">Storyboard</p>
                      <p className="text-xs text-muted-foreground">
                        Via ChatGPT (DALL-E)
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenerationType("video")}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                      generationType === "video"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Video className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">Short Video</p>
                      <p className="text-xs text-muted-foreground">
                        Via Google Gemini
                      </p>
                    </div>
                  </button>
                </div>
                {generationType === "video" && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    Veo saat ini maksimal {VEO_DURATION_LABEL} per video. Template dan prompt video akan otomatis disesuaikan ke durasi itu.
                  </div>
                )}
              </div>

              {/* Prompt */}
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt *</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to generate..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Isi prompt bebas. Beberapa angle/pillar cukup dipisah di notes atau nama storyboard saja.
                </p>
              </div>

              {/* Error / Success Messages */}
              {error && (
                <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 rounded-md bg-green-50 text-green-700 text-sm">
                  {success}
                </div>
              )}

              {selectedStoryboardId && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                  Semua hasil generate dari sini akan masuk ke storyboard yang sama. Jadi kalau mau testing 50 angle, tinggal buat 50 storyboard di halaman Projects.
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={generating || !selectedProjectId || !prompt.trim()}
                className="w-full"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Generate {generationType === "storyboard" ? "Storyboard" : "Video"}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Templates Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Templates</CardTitle>
              <CardDescription>
                Click a preset to drop in a ready-to-use prompt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(template.prompt)}
                  className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <p className="font-medium text-sm">{template.label}</p>
                  {template.description ? (
                    <p className="text-xs text-primary/80 mt-1">{template.description}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {template.prompt}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Generations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Generations</CardTitle>
          <CardDescription>Latest generation jobs and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {recentGenerations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No generations yet. Create your first one above!
            </p>
          ) : (
            <div className="space-y-3">
              {recentGenerations.map((gen) => (
                <div
                  key={gen.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(gen.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {gen.project?.name || "Unknown Project"}
                        </span>
                        <Badge variant={gen.type === "storyboard" ? "default" : "secondary"}>
                          {gen.type}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-md">
                        {gen.storyboard?.name ? `${gen.storyboard.name} • ` : ""}{gen.prompt}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        gen.status === "completed"
                          ? "success"
                          : gen.status === "failed"
                          ? "error"
                          : gen.status === "processing"
                          ? "warning"
                          : "secondary"
                      }
                    >
                      {gen.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(gen.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
