"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, CreditCard, HelpCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";
import { AUTH_MODE } from "@/lib/auth-mode";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/client-api";

interface UserMenuProps {
  name: string | null;
  email: string;
  planCode: string;
}

export function UserMenu({ name, email, planCode }: UserMenuProps) {
  const router = useRouter();

  async function signOut() {
    try {
      if (AUTH_MODE === "supabase") {
        await getSupabaseBrowser().auth.signOut();
      } else {
        await apiFetch("/api/v1/auth/demo/signout", { method: "POST", body: "{}" });
      }
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Account menu">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getInitials(name, email)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="truncate font-medium">{name || email}</span>
            <span className="text-xs font-normal text-muted-foreground capitalize">{planCode} plan</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/app/settings"><Settings /> Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/app/billing"><CreditCard /> Billing</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/app/support"><HelpCircle /> Support</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); void signOut(); }}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
