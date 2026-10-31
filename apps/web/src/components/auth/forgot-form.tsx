"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { AUTH_MODE } from "@/lib/auth-mode";
import { apiFetch } from "@/lib/client-api";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (AUTH_MODE === "supabase") {
        const origin = window.location.origin;
        const { error } = await getSupabaseBrowser().auth.resetPasswordForEmail(email, {
          redirectTo: `${origin}/auth/callback?next=/app/settings`,
        });
        if (error) throw new Error(error.message);
      } else {
        await apiFetch("/api/v1/auth/demo/forgot", { method: "POST", body: JSON.stringify({ email }) });
      }
      setSent(true);
      toast.success("Check your inbox for reset instructions.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm">If an account exists for <span className="font-medium">{email}</span>, you’ll receive a reset link shortly.</p>
        <Button variant="outline" className="w-full" onClick={() => setSent(false)}>Send to a different email</Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
