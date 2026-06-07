"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Loader2, Plus, Save, X } from "lucide-react";

interface Storyboard {
  id: string;
  name: string;
  objective: string;
  angle: string | null;
  pillars: string | null;
  notes: string | null;
  status: string;
  _count: { generations: number };
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS = ["draft", "active", "paused", "archived"] as const;

export default function StoryboardsPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [storyboards, setStoryboards] = useState<Storyboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    objective: "conversion",
    angle: "",
    pillars: "",
    notes: "",
    status: "draft",
  });

  const fetchStoryboards = async () => {
    try {
      const res = await fetch(`/api/storyboards?projectId=${projectId}`);
      if (res.ok) {
        setStoryboards(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch storyboards:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoryboards();
  }, [projectId]);

  const resetForm = () => {
    setForm({ name: "", objective: "conversion", angle: "", pillars: "", notes: "", status: "draft" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (item: Storyboard) => {
    setForm({
      name: item.name,
      objective: item.objective,
      angle: item.angle || "",
      pillars: item.pillars || "",
      notes: item.notes || "",
      status: item.status,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name: form.name,
        objective: form.objective,
        angle: form.angle || null,
        pillars: form.pillars || null,
        notes: form.notes || null,
        status: form.status,
      };

      const res = editingId
        ? await fetch(`/api/storyboards/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/storyboards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId, ...payload }),
          });

      if (res.ok) {
        resetForm();
        fetchStoryboards();
      }
    } catch (error) {
      console.error("Failed to save storyboard:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus storyboard ini? Generasi yang sudah dibuat tetap ada, hanya tidak lagi terhubung ke sini.")) return;
    try {
      const res = await fetch(`/api/storyboards/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (editingId === id) resetForm();
        fetchStoryboards();
      }
    } catch (error) {
      console.error("Failed to delete storyboard:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Storyboards</h1>
          <p className="text-muted-foreground mt-1">
            Satu project = satu produk. Di sini kamu bisa bikin banyak storyboard untuk testing angle, campaign, atau pillar berbeda.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4" />
          New Storyboard
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Storyboard" : "Create Storyboard"}</CardTitle>
            <CardDescription>
              Gunakan field ini untuk memecah banyak konsep konten di dalam satu produk.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Storyboard *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Contoh: Hook Reveal Test 01"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objective">Objective</Label>
                  <Input
                    id="objective"
                    value={form.objective}
                    onChange={(e) => setForm({ ...form, objective: e.target.value })}
                    placeholder="conversion | awareness | testing"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="angle">Angle</Label>
                  <Textarea
                    id="angle"
                    value={form.angle}
                    onChange={(e) => setForm({ ...form, angle: e.target.value })}
                    placeholder="Contoh: problem-solution, testimonial, hook reveal"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pillars">Pillars</Label>
                  <Textarea
                    id="pillars"
                    value={form.pillars}
                    onChange={(e) => setForm({ ...form, pillars: e.target.value })}
                    placeholder="Contoh: breathable, wudhu friendly, flowy"
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Catatan internal untuk tim: apa yang mau diuji, referensi, dsb."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={`px-3 py-1.5 rounded-full border text-sm capitalize ${
                        form.status === status ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                      }`}
                      onClick={() => setForm({ ...form, status })}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving || !form.name.trim()}>
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : editingId ? "Update Storyboard" : "Create Storyboard"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {storyboards.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Belum ada storyboard. Buat dulu satu atau banyak storyboard untuk mulai testing konten.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {storyboards.map((item) => (
            <Card key={item.id}>
              <CardHeader className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <Badge variant="outline" className="capitalize">{item.status}</Badge>
                </div>
                <CardDescription>
                  {item.objective || "conversion"} • {item._count.generations} generations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {item.angle && (
                  <div>
                    <p className="text-muted-foreground font-medium">Angle</p>
                    <p className="whitespace-pre-wrap">{item.angle}</p>
                  </div>
                )}
                {item.pillars && (
                  <div>
                    <p className="text-muted-foreground font-medium">Pillars</p>
                    <p className="whitespace-pre-wrap">{item.pillars}</p>
                  </div>
                )}
                {item.notes && (
                  <div>
                    <p className="text-muted-foreground font-medium">Notes</p>
                    <p className="whitespace-pre-wrap text-muted-foreground">{item.notes}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Updated {formatDate(item.updatedAt)}</p>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
