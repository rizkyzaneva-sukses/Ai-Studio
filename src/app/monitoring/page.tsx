"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, getQuotaPercentage, getQuotaColor } from "@/lib/utils";
import {
  Activity,
  RefreshCw,
  Bot,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  PauseCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";

interface Account {
  id: string;
  name: string;
  type: string;
  status: string;
  usageCount: number;
  maxUsage: number;
  lastUsedAt: string | null;
  createdAt: string;
}

interface GenerationStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export default function MonitoringPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState<GenerationStats>({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [accountsRes, generationsRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/generations?limit=1000"),
      ]);

      if (accountsRes.ok) {
        setAccounts(await accountsRes.json());
      }

      if (generationsRes.ok) {
        const generations = await generationsRes.json();
        setStats({
          total: generations.length,
          pending: generations.filter((g: { status: string }) => g.status === "pending").length,
          processing: generations.filter((g: { status: string }) => g.status === "processing").length,
          completed: generations.filter((g: { status: string }) => g.status === "completed").length,
          failed: generations.filter((g: { status: string }) => g.status === "failed").length,
        });
      }
    } catch (error) {
      console.error("Failed to fetch monitoring data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const chatgptAccounts = accounts.filter((a) => a.type === "chatgpt");
  const geminiAccounts = accounts.filter((a) => a.type === "gemini");

  const totalChatgptUsage = chatgptAccounts.reduce((sum, a) => sum + a.usageCount, 0);
  const totalChatgptMax = chatgptAccounts.reduce((sum, a) => sum + a.maxUsage, 0);
  const totalGeminiUsage = geminiAccounts.reduce((sum, a) => sum + a.usageCount, 0);
  const totalGeminiMax = geminiAccounts.reduce((sum, a) => sum + a.maxUsage, 0);

  const activeAccounts = accounts.filter((a) => a.status === "active").length;
  const pausedAccounts = accounts.filter((a) => a.status === "paused").length;
  const errorAccounts = accounts.filter((a) => a.status === "error").length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "paused":
        return <PauseCircle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading monitoring data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitoring</h1>
          <p className="text-muted-foreground mt-1">
            Real-time overview of account quotas and system health
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeAccounts}</p>
                <p className="text-sm text-muted-foreground">Active Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <PauseCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pausedAccounts}</p>
                <p className="text-sm text-muted-foreground">Paused Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Generations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{errorAccounts}</p>
                <p className="text-sm text-muted-foreground">Error Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generation Pipeline Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Generation Pipeline
          </CardTitle>
          <CardDescription>Current status of all generation jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-gray-50 border">
              <p className="text-3xl font-bold text-gray-600">{stats.pending}</p>
              <p className="text-sm text-muted-foreground mt-1">Pending</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-3xl font-bold text-blue-600">{stats.processing}</p>
              <p className="text-sm text-muted-foreground mt-1">Processing</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50 border border-green-100">
              <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-sm text-muted-foreground mt-1">Completed</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-50 border border-red-100">
              <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
              <p className="text-sm text-muted-foreground mt-1">Failed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Quotas - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ChatGPT Accounts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                ChatGPT Accounts
              </CardTitle>
              <Badge variant="outline">
                {totalChatgptUsage}/{totalChatgptMax} total
              </Badge>
            </div>
            <CardDescription>Storyboard & image generation quota</CardDescription>
          </CardHeader>
          <CardContent>
            {chatgptAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No ChatGPT accounts configured
              </p>
            ) : (
              <div className="space-y-4">
                {/* Total progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Total Quota Usage</span>
                    <span>
                      {totalChatgptMax > 0
                        ? getQuotaPercentage(totalChatgptUsage, totalChatgptMax)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getQuotaColor(
                        totalChatgptMax > 0
                          ? getQuotaPercentage(totalChatgptUsage, totalChatgptMax)
                          : 0
                      )}`}
                      style={{
                        width: `${
                          totalChatgptMax > 0
                            ? getQuotaPercentage(totalChatgptUsage, totalChatgptMax)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Individual accounts */}
                {chatgptAccounts.map((account) => {
                  const pct = getQuotaPercentage(account.usageCount, account.maxUsage);
                  return (
                    <div key={account.id} className="p-3 rounded-lg border space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(account.status)}
                          <span className="text-sm font-medium">{account.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {account.usageCount}/{account.maxUsage}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getQuotaColor(pct)}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Last used: {formatDate(account.lastUsedAt)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gemini Accounts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Gemini Accounts
              </CardTitle>
              <Badge variant="outline">
                {totalGeminiUsage}/{totalGeminiMax} total
              </Badge>
            </div>
            <CardDescription>Video generation quota</CardDescription>
          </CardHeader>
          <CardContent>
            {geminiAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No Gemini accounts configured
              </p>
            ) : (
              <div className="space-y-4">
                {/* Total progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Total Quota Usage</span>
                    <span>
                      {totalGeminiMax > 0
                        ? getQuotaPercentage(totalGeminiUsage, totalGeminiMax)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getQuotaColor(
                        totalGeminiMax > 0
                          ? getQuotaPercentage(totalGeminiUsage, totalGeminiMax)
                          : 0
                      )}`}
                      style={{
                        width: `${
                          totalGeminiMax > 0
                            ? getQuotaPercentage(totalGeminiUsage, totalGeminiMax)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Individual accounts */}
                {geminiAccounts.map((account) => {
                  const pct = getQuotaPercentage(account.usageCount, account.maxUsage);
                  return (
                    <div key={account.id} className="p-3 rounded-lg border space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(account.status)}
                          <span className="text-sm font-medium">{account.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {account.usageCount}/{account.maxUsage}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getQuotaColor(pct)}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Last used: {formatDate(account.lastUsedAt)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
