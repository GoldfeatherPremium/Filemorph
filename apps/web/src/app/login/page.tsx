import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your FileMorph workspace.",
};

export default function LoginPage() {
  return (
    <AuthShell>
      <LoginForm />
      <div className="mt-6 text-center text-sm text-muted-foreground">
        New to FileMorph?{" "}
        <Link href="/signup" className="font-medium text-foreground hover:underline">
          Create an account
        </Link>
      </div>
    </AuthShell>
  );
}
