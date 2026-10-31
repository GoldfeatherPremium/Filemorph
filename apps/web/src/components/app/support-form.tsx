"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/client-api";

export function SupportForm() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/api/v1/support", { method: "POST", body: JSON.stringify({ subject, message, category }) });
      setSent(true);
      toast.success("Ticket submitted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit ticket.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm">
          <p className="font-medium">Thanks — we've received your request.</p>
          <p className="mt-1 text-muted-foreground">We'll reply to your email as soon as possible.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" required minLength={3} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What can we help with?" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="privacy">Privacy</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" required minLength={10} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe the issue in as much detail as you can…" className="min-h-[140px]" />
          </div>
          <Button type="submit" disabled={loading}>{loading ? "Submitting…" : "Submit ticket"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
