"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  Plus,
  FolderOpen,
  Trash2,
  Edit,
  Upload,
  Image as ImageIcon,
  X,
  Save,
  Eye,
} from "lucide-react";

interface ProjectImage {
  id: string;
  url: string;
  filename: string;
  order: number;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  brandNotes: string | null;
  images: ProjectImage[];
  _count?: { generations: number };
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    brandNotes: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const resetForm = () => {
    setFormData({ name: "", description: "", brandNotes: "" });
    setSelectedFiles([]);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (project: Project) => {
    setFormData({
      name: project.name,
      description: project.description || "",
      brandNotes: project.brandNotes || "",
    });
    setEditingId(project.id);
    setShowForm(true);
    setViewingProject(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingId) {
        // Update project (JSON)
        const res = await fetch(`/api/projects/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          resetForm();
          fetchProjects();
        }
      } else {
        // Create project (FormData for file upload)
        const fd = new FormData();
        fd.append("name", formData.name);
        if (formData.description) fd.append("description", formData.description);
        if (formData.brandNotes) fd.append("brandNotes", formData.brandNotes);
        selectedFiles.forEach((file) => fd.append("images", file));

        const res = await fetch("/api/projects", {
          method: "POST",
          body: fd,
        });
        if (res.ok) {
          resetForm();
          fetchProjects();
        }
      }
    } catch (error) {
      console.error("Failed to save project:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchProjects();
        if (viewingProject?.id === id) setViewingProject(null);
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your content projects and reference images
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Project" : "Create New Project"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Ramadan Campaign 2025"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the project..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandNotes">Brand Notes</Label>
                <Textarea
                  id="brandNotes"
                  value={formData.brandNotes}
                  onChange={(e) => setFormData({ ...formData, brandNotes: e.target.value })}
                  placeholder="Brand guidelines, tone, colors, target audience..."
                  rows={4}
                />
              </div>

              {!editingId && (
                <div className="space-y-2">
                  <Label>Reference Images</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      Choose Files
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {selectedFiles.length} file(s) selected
                    </span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-secondary px-2 py-1 rounded text-sm"
                        >
                          <ImageIcon className="h-3 w-3" />
                          <span className="max-w-[150px] truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  <Save className="h-4 w-4" />
                  {submitting ? "Saving..." : editingId ? "Update" : "Create"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Project Detail View */}
      {viewingProject && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{viewingProject.name}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setViewingProject(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {viewingProject.description && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                <p className="text-sm">{viewingProject.description}</p>
              </div>
            )}
            {viewingProject.brandNotes && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Brand Notes</h4>
                <p className="text-sm whitespace-pre-wrap">{viewingProject.brandNotes}</p>
              </div>
            )}
            {viewingProject.images && viewingProject.images.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Reference Images ({viewingProject.images.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {viewingProject.images.map((img) => (
                    <div
                      key={img.id}
                      className="aspect-square rounded-lg border bg-muted flex items-center justify-center overflow-hidden"
                    >
                      <img
                        src={img.url}
                        alt={img.filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit(viewingProject)}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(viewingProject.id)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create your first project to start generating content
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setViewingProject(project)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(project);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(project.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5" />
                    {project.images?.length || 0} images
                  </div>
                  <Badge variant="secondary">
                    {project._count?.generations || 0} generations
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Created {formatDate(project.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
