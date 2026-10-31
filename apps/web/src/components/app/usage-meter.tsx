import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface UsageMeterProps {
  label?: string;
  used: number;
  quota: number | null;
  sublabel?: string;
}

export function UsageMeter({ label = "Usage", used, quota, sublabel }: UsageMeterProps) {
  const hasQuota = quota !== null && quota !== undefined && quota > 0;
  const pct = hasQuota ? Math.min(100, Math.round((used / (quota as number)) * 100)) : 0;
  const nearLimit = hasQuota && pct >= 90;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className={cn("text-muted-foreground", nearLimit && "text-destructive")}>
          {hasQuota ? `${used} / ${quota}` : `${used} used`}
          {sublabel ? ` · ${sublabel}` : ""}
        </span>
      </div>
      <Progress value={pct} className={cn("h-1.5", nearLimit && "[&>div]:bg-destructive")} />
    </div>
  );
}
