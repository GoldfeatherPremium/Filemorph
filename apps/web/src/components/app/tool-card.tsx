import Link from "next/link";
import * as Icons from "lucide-react";
import type { ToolDef } from "@filemorph/shared";
import { Card } from "@//components/ui/card";

const IconMap = Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>;

function Icon({ name }: { name: string }) {
  const Cmp = (Map[name] ?? (Icons.File as unknown as React.ComponentType<{ className?: string }>);
  return <Cmp className="h-5 w-5" />;
}

export function ToolCard({ tool, showCategory = false }: { tool: ToolDef; showCategory?: boolean }) {
  return (
    <Link href={`/tools/${tool.slug}`} className="block h-full">
      <Card className="group flex h-full flex-col gap-3 p-5 transition-all hover:shadow-lift hover:-translate-y-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fm-accent/12 text-fm-accent transition-colors group-hover:bg-fm-accent group-hover:text-white">
          <Icon name={tool.icon} />
        </div>
        <div>
          <p className="font-medium leading-tight">{tool.name}</p>
          <p className="mt-1 text-sm leading-snug text-muted-foreground">{tool.description}</p>
        </div>
        {showCategory ? (
          <span className="mt-auto text-xs font-medium uppercase tracking-wide text-muted-foreground/70">{tool.category}</span>
        ) : null}
      </Card>
    </Link>
  );
}
