"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { getQuotaPercentage, getQuotaColor, formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2, RotateCcw, X } from "lucide-react";

interface Account {
  id: string;
  type: string;
  name: string;
  email: string | null;
  status: string;
  lastUsedAt: string | null;
  usageCount: number;
  maxUsage: number;
  resetAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    type: "chatgpt",
    name: "",
    email: "",
    sessionCookie: "",
    maxUsage: 50,
    notes: "",
  });

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/accounts");
      const data = await res.json();
      setAccounts(data);
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAccount ? `/api/accounts/${editingAccount.id}` : "/api/accounts";
      const method = editingAccount ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setEditingAccount(null);
        setFormData({ type: "chatgpt", name: "", email: "", sessionCookie: "", maxUsage: 50, notes: "" });
        fetchAccounts();
      }
    } catch (error) {
      console.error("Failed to save account:", error);
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      type: account.type,
      name: account.name,
      email: account.email || "",
      sessionCookie: "",
      maxUsage: account.maxUsage,
      notes: account.notes || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;
    try {
      await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      fetchAccounts();
    } catch (error) {
      console.error("Failed to delete account:", error);
    }
  };

  const handleResetQuota = async (id: string) => {
    try {
      await fetch(`/api/accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usageCount: 0, resetAt: new Date().toISOString() }),
      });
      fetchAccounts();
    } catch (error) {
      console.error("Failed to reset quota:", error);
    }
  };

  const handleToggleStatus = async (account: Account) => {
    const newStatus = account.status === "active" ? "paused" : "active";
    try {
      await fetch(`/api/accounts/${account.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchAccounts();
    } catch (error) {
      console.error("Failed to toggle status:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading accounts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground mt-1">Manage ChatGPT and Gemini accounts</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingAccount(null); setFormData({ type: "chatgpt", name: "", email: "", sessionCookie: "", maxUsage: 50, notes: "" }); }}>
          <Plus className="h-4 w-4" /> Add Account
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{editingAccount ? "Edit Account" : "Add New Account"}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditingAccount(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Account Type</Label>
                <Select id="type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value, maxUsage: e.target.value === "chatgpt" ? 50 : 25 })}>
                  <option value="chatgpt">ChatGPT</option>
                  <option value="gemini">Gemini</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Account Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., ChatGPT Account 1" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="account@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUsage">Max Usage (per cycle)</Label>
                <Input id="maxUsage" type="number" value={formData.maxUsage} onChange={(e) => setFormData({ ...formData, maxUsage: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="sessionCookie">Session Cookie {editingAccount && "(leave blank to keep current)"}</Label>
                <Textarea id="sessionCookie" value={formData.sessionCookie} onChange={(e) => setFormData({ ...formData, sessionCookie: e.target.value })} placeholder="Paste session cookie here..." rows={3} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional notes..." rows={2} />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit">{editingAccount ? "Update Account" : "Create Account"}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingAccount(null); }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Account List */}
      <div className="grid gap-4">
        {accounts.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No accounts yet. Click &quot;Add Account&quot; to get started.</p>
            </CardContent>
          </Card>
        ) : (
          accounts.map((account) => {
            const percentage = getQuotaPercentage(account.usageCount, account.maxUsage);
            return (
              <Card key={account.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{account.name}</h3>
                        <Badge variant={account.type === "chatgpt" ? "default" : "secondary"}>{account.type}</Badge>
                        <Badge variant={account.status === "active" ? "success" : account.status === "error" ? "error" : "warning"}>
                          {account.status}
                        </Badge>
                      </div>
                      {account.email && <p className="text-sm text-muted-foreground">{account.email}</p>}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>Usage: {account.usageCount}/{account.maxUsage}</span>
                          <span className="text-muted-foreground">{percentage}%</span>
                        </div>
                        <Progress value={percentage} indicatorClassName={getQuotaColor(percentage)} />
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Last used: {formatDate(account.lastUsedAt)}</span>
                        <span>Reset: {formatDate(account.resetAt)}</span>
                      </div>
                      {account.notes && <p className="text-sm text-muted-foreground">{account.notes}</p>}
                    </div>
                    <div className="flex gap-1 ml-4">
                      <Button variant="ghost" size="icon" onClick={() => handleResetQuota(account.id)} title="Reset Quota">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(account)}>
                        {account.status === "active" ? "⏸" : "▶"}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(account)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(account.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
