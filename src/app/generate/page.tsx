"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
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

interface Generation {
  id: string;
  type: string;
  prompt: string;
  status: string;
  resultUrl: string | null;
  project: { name: string };
  account: { name: string; type: string };
  createdAt: string;
}

const STORYBOARD_TEMPLATES = [
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

const VIDEO_TEMPLATES = [
  {
    label: "Product Reel (15s)",
    prompt:
      "Generate a 15-second short video concept for Zaneva hijab-friendly sportswear. Quick cuts showing: fabric detail, model movement, multiple color options, end card with logo. Background music: upbeat, modern. Text overlays: product name, key features, price. Format: 9:16 vertical for Instagram Reels.",
  },
  {
    label: "Brand Story (30s)",
    prompt:
      "Create a 30-second brand story video for Zaneva muslimah sportswear. Sequence: Brand mission statement, diverse women exercising in hijab sportswear, community shots, call-to-action. Tone: Empowering, inclusive, premium. Include lower-third text and end screen.",
  },
  {
    label: "Tutorial Clip (20s)",
    prompt:
      "Design a 20-second styling tutorial video for Zaneva activewear. Show 3 different ways to style the hijab sport collection: gym workout, outdoor running, casual athleisure. Quick transitions, text labels for each look. End with shop link.",
  },
];

export default function GeneratePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentGenerations, setRecentGenerations] = useState<Generation[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [generationType, setGenerationType] = useState<"storyboard" | "video">("storyboard");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchProjects();
    fetchRecentGenerations();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) setProjects(await res.json());
    } catch (err) {
      console.error("Failed to fetch projects:", err);
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

  const handleGenerate = async () => {
    if (!selectedProjectId || !prompt.trim()) {
      setError("Please select a project and enter a prompt.");
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
          type: generationType,
          prompt: prompt.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(
          `Generation started! Using account: ${data.account?.name || "auto-selected"}. Status will update automatically.`
        );
        setPrompt("");
        fetchRecentGenerations();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to start generation.");
      }
    } catch (err) {
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
                Click a template to use it as your prompt
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
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                        {gen.prompt}
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
