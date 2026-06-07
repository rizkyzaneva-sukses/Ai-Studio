"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  Search,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  Download,
  ExternalLink,
  Filter,
  History,
} from "lucide-react";

interface Generation {
  id: string;
  type: string;
  prompt: string;
  status: string;
  resultUrl: string | null;
  errorMessage: string | null;
  project: { id: string; name: string } | null;
  account: { id: string; name: string; type: string } | null;
  createdAt: string;
  updatedAt: string;
}

export default function HistoryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchGenerations = async () => {
    try {
      const params = new URLSearchParams();
      if (filterType) params.set("type", filterType);
      if (filterStatus) params.set("status", filterStatus);
      params.set("limit", "100");

      const res = await fetch(`/api/generations?${params.toString()}`);
      if (res.ok) {
        setGenerations(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch generations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenerations();
  }, [filterType, filterStatus]);

  const filteredGenerations = generations.filter((gen) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      gen.prompt.toLowerCase().includes(query) ||
      gen.project?.name.toLowerCase().includes(query) ||
      gen.account?.name.toLowerCase().includes(query) ||
      gen.type.toLowerCase().includes(query)
    );
  });

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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "success" as const;
      case "failed":
        return "error" as const;
      case "processing":
        return "warning" as const;
      default:
        return "secondary" as const;
    }
  };

  const completedCount = generations.filter((g) => g.status === "completed").length;
  const failedCount = generations.filter((g) => g.status === "failed").length;
  const processingCount = generations.filter((g) => g.status === "processing").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading generation history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Generation History</h1>
        <p className="text-muted-foreground mt-1">
          Browse and search through all content generation logs
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{generations.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-blue-600">{processingCount}</p>
            <p className="text-sm text-muted-foreground">Processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-red-600">{failedCount}</p>
            <p className="text-sm text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by prompt, project, or account..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-40"
              >
                <option value="">All Types</option>
                <option value="storyboard">Storyboard</option>
                <option value="video">Video</option>
              </Select>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-40"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Results ({filteredGenerations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredGenerations.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No generations found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || filterType || filterStatus
                  ? "Try adjusting your filters"
                  : "Generate some content to see it here"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredGenerations.map((gen) => (
                <div key={gen.id} className="border rounded-lg overflow-hidden">
                  {/* Row Header */}
                  <button
                    className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors text-left"
                    onClick={() =>
                      setExpandedId(expandedId === gen.id ? null : gen.id)
                    }
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {getStatusIcon(gen.status)}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">
                            {gen.project?.name || "Unknown Project"}
                          </span>
                          <Badge
                            variant={
                              gen.type === "storyboard" ? "default" : "secondary"
                            }
                          >
                            {gen.type}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(gen.status)}>
                            {gen.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {gen.prompt}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(gen.createdAt)}
                      </p>
                      {gen.account && (
                        <p className="text-xs text-muted-foreground">
                          via {gen.account.name}
                        </p>
                      )}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {expandedId === gen.id && (
                    <div className="border-t p-4 bg-muted/30 space-y-3">
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-1">
                          Full Prompt
                        </h4>
                        <p className="text-sm whitespace-pre-wrap bg-background p-3 rounded border">
                          {gen.prompt}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-xs text-muted-foreground">ID</span>
                          <p className="font-mono text-xs">{gen.id.slice(0, 12)}...</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Type</span>
                          <p className="capitalize">{gen.type}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Account</span>
                          <p>{gen.account?.name || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Updated</span>
                          <p className="text-xs">{formatDate(gen.updatedAt)}</p>
                        </div>
                      </div>

                      {gen.resultUrl && (
                        <div className="flex gap-2">
                          <a
                            href={gen.resultUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-8 px-3 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            View Result
                          </a>
                          <a
                            href={gen.resultUrl}
                            download
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-8 px-3 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </a>
                        </div>
                      )}

                      {gen.errorMessage && (
                        <div className="p-3 rounded bg-red-50 border border-red-100 text-sm text-red-700">
                          <span className="font-medium">Error:</span> {gen.errorMessage}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
