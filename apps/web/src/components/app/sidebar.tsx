"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wand2, UploadCloud, History, FolderOpen, Gauge, CreditCard, Settings, LifeBuoy, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { UsageMeter } from "@/components/app/usage-meter";
import { UserMenu } from "@/components/app/user-menu";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  user: { name: string | null; email: string; planCode: string; isAdmin: boolean };
  usage: { usedMonthly: number; monthlyQuota: number | null; usedDaily: number; dailyQuota: number | null };
}

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/tools", label: "Tools", icon: Wand2 },
  { href: "/app/upload", label: "Upload", icon: UploadCloud },
  { href: "/app/history", label: "History", icon: History },
  { href: "/app/files", label: "Files", icon: FolderOpen },
  { href: "/app/usage", label: "Usage", icon: Gauge },
  { href: "/app/billing", label: "Billing", icon: CreditCard },
  { href: "/app/settings", label: "Settings", icon: Settings },
  { href: "/app/support", label: "Support", icon: LifeBuoy },
] as const;

export function Sidebar({ user, usage }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center justify-between px-2 pt-1">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#17191C] text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 4h8l4 4v12H6V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M14 4v4h4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-sm font-semibold tracking-tight">FileMorph</span>
        </Link>
        <div className="lg:hidden">
          <UserMenu name={user.name} email={user.email} planCode={user.planCode} />
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar" aria-label="Workspace">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-[#17191C] text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        {user.isAdmin ? (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/admin") ? "bg-[#17191C] text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            Admin
          </Link>
        ) : null}
      </nav>

      <div className="space-y-4 rounded-2xl border bg-card p-4 shadow-soft">
        <UsageMeter label="Monthly jobs" used={usage.usedMonthly} quota={usage.monthlyQuota} />
        <UsageMeter label="Daily jobs" used={usage.usedDaily} quota={usage.dailyQuota} />
        {user.planCode === "free" ? (
          <Button asChild className="w-full" size="sm">
            <Link href="/pricing">Upgrade</Link>
          </Button>
        ) : null}
        <div className="hidden lg:block">
          <UserMenu name={user.name} email={user.email} planCode={user.planCode} />
        </div>
      </div>
    </div>
  );
}
