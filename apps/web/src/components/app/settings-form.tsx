"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { apiFetch } from "@/lib/client-api";

interface SettingsFormProps {
  profile: { id: string; fullName: string | null; email: string; avatarUrl: string | null } | null;
  prefs: { theme: string; marketingOptIn: boolean; notifyJobCompletion: boolean; notifyProductUpdates: boolean } | null;
}

export function SettingsForm({ profile, prefs }: SettingsFormProps) {
  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [marketingOptIn, setMarketingOptIn] = useState(prefs?.marketingOptIn ?? false);
  const [notifyJobCompletion, setNotifyJobCompletion] = useState(prefs?.notifyJobCompletion ?? true);
  const [notifyProductUpdates, setNotifyProductUpdates] = useState(prefs?.notifyProductUpdates ?? false);
  const [loading, setLoading] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/api/v1/me", { method: "PATCH", body: JSON.stringify({ fullName }) });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  async function savePrefs(next: Partial<{ marketingOptIn: boolean; notifyJobCompletion: boolean; notifyProductUpdates: boolean }>) {
    try {
      await apiFetch("/api/v1/me", { method: "PATCH", body: JSON.stringify({ preferences: next }) });
      toast.success("Preferences saved");
    } catch {
      toast.error("Could not save preferences");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile?.email ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save profile"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notifications & preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Job completion emails</p>
              <p className="text-xs text-muted-foreground">Get an email when a transformation finishes.</p>
            </div>
            <Switch checked={notifyJobCompletion} onCheckedChange={(v) => { setNotifyJobCompletion(v); void savePrefs({ notifyJobCompletion: v }); }} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Product updates</p>
              <p className="text-xs text-muted-foreground">Occasional notes on new tools and features.</p>
            </div>
            <Switch checked={notifyProductUpdates} onCheckedChange={(v) => { setNotifyProductUpdates(v); void savePrefs({ notifyProductUpdates: v }); }} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Marketing emails</p>
              <p className="text-xs text-muted-foreground">Only if you opt in — we never email without consent.</p>
            </div>
            <Switch checked={marketingOptIn} onCheckedChange={(v) => { setMarketingOptIn(v); void savePrefs({ marketingOptIn: v }); }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
