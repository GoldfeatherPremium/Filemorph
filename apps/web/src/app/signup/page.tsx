import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create your free FileMorph account.",
};

export default function SignupPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}>
        <SignupForm />
      </Suspense>
      <div className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Sign in
        </Link>
      </div>
    </AuthShell>
  );
}
