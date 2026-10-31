import Link from "next/link";
import { APP_NAME } from "@filemorph/shared";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AuthShell({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-fm-bg px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#17191C] text-white shadow-soft">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 4h8l4 4v12H6V4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M14 4v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M9.5 12h5M9.5 15h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
        <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="pb-4 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue to your workspace.</p>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      {footer ? <div className="mt-6 text-sm text-muted-foreground">{footer}</div> : null}
      <p className="mt-10 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">← Back to {APP_NAME}</Link>
      </p>
    </div>
  );
}
