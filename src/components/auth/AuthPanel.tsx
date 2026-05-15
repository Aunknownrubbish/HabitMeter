"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { LogIn, LogOut, User, Mail, Lock } from "lucide-react";

export function AuthPanel({
  session,
}: {
  session: { user?: { email?: string; name?: string } } | null;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "register") {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "注册失败");
        setLoading(false);
        return;
      }
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(mode === "login" ? "邮箱或密码错误" : "登录失败");
    } else {
      setEmail("");
      setPassword("");
      setName("");
      setError("");
    }
    setLoading(false);
  };

  // Logged in state
  if (session?.user) {
    return (
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <User className="h-4 w-4 text-[var(--color-primary)]" />
            <span className="font-medium">{session.user.name || session.user.email}</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => signOut({ redirect: false })}
          >
            <LogOut className="mr-1 h-3.5 w-3.5" />
            退出
          </Button>
        </div>
      </Card>
    );
  }

  // Login/Register form
  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold text-slate-800">账号</h2>
      <form onSubmit={handleSubmit} className="space-y-2.5">
        {mode === "register" && (
          <Input
            placeholder="昵称（选填）"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            placeholder="邮箱"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            placeholder="密码"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          <LogIn className="mr-1 h-3.5 w-3.5" />
          {loading ? "处理中..." : mode === "login" ? "登录" : "注册"}
        </Button>

        <button
          type="button"
          className="w-full text-center text-xs text-slate-400 hover:text-[var(--color-primary)]"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
        >
          {mode === "login" ? "没有账号？去注册" : "已有账号？去登录"}
        </button>
      </form>
    </Card>
  );
}
