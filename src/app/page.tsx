import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getQuotaPercentage, getQuotaColor, formatDate } from "@/lib/utils";
import { Users, FolderOpen, Wand2, Video, ImageIcon, AlertCircle } from "lucide-react";

async function getDashboardData() {
  try {
    const [accounts, projects, generations] = await Promise.all([
      prisma.account.findMany({ orderBy: { updatedAt: "desc" } }),
      prisma.project.count(),
      prisma.generation.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { project: true, account: true },
      }),
    ]);

    const chatgptAccounts = accounts.filter((a) => a.type === "chatgpt");
    const geminiAccounts = accounts.filter((a) => a.type === "gemini");
    const totalGenerations = await prisma.generation.count();
    const completedGenerations = await prisma.generation.count({ where: { status: "completed" } });

    return {
      accounts,
      chatgptAccounts,
      geminiAccounts,
      projectCount: projects,
      totalGenerations,
      completedGenerations,
      recentGenerations: generations,
    };
  } catch {
    // Database might not be available yet
    return {
      accounts: [],
      chatgptAccounts: [],
      geminiAccounts: [],
      projectCount: 0,
      totalGenerations: 0,
      completedGenerations: 0,
      recentGenerations: [],
    };
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Zaneva AI Content Studio — Overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ChatGPT Accounts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.chatgptAccounts.length}</div>
            <p className="text-xs text-muted-foreground">
              {data.chatgptAccounts.filter((a) => a.status === "active").length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gemini Accounts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.geminiAccounts.length}</div>
            <p className="text-xs text-muted-foreground">
              {data.geminiAccounts.filter((a) => a.status === "active").length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.projectCount}</div>
            <p className="text-xs text-muted-foreground">Product collections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generations</CardTitle>
            <Wand2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalGenerations}</div>
            <p className="text-xs text-muted-foreground">
              {data.completedGenerations} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Account Status & Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Account Quota Status */}
        <Card>
          <CardHeader>
            <CardTitle>Account Quota Status</CardTitle>
            <CardDescription>Current usage across all accounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.accounts.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>No accounts configured. Add accounts to get started.</span>
              </div>
            ) : (
              data.accounts.map((account) => {
                const percentage = getQuotaPercentage(account.usageCount, account.maxUsage);
                return (
                  <div key={account.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{account.name}</span>
                        <Badge variant={account.type === "chatgpt" ? "default" : "secondary"}>
                          {account.type}
                        </Badge>
                        <Badge
                          variant={
                            account.status === "active"
                              ? "success"
                              : account.status === "error"
                              ? "error"
                              : "warning"
                          }
                        >
                          {account.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {account.usageCount}/{account.maxUsage}
                      </span>
                    </div>
                    <Progress
                      value={percentage}
                      indicatorClassName={getQuotaColor(percentage)}
                    />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent Generations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Generations</CardTitle>
            <CardDescription>Latest content generation activity</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentGenerations.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>No generations yet. Create a project and start generating.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {data.recentGenerations.map((gen) => (
                  <div key={gen.id} className="flex items-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                      {gen.type === "storyboard" ? (
                        <ImageIcon className="h-4 w-4" />
                      ) : (
                        <Video className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">
                        {gen.project.name} — {gen.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {gen.account.name} • {formatDate(gen.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        gen.status === "completed"
                          ? "success"
                          : gen.status === "failed"
                          ? "error"
                          : gen.status === "processing"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {gen.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
