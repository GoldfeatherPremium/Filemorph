"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ToolSettingDef } from "@filemorph/shared";

interface SettingsPanelProps {
  settings: ToolSettingDef[];
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  disabled?: boolean;
}

export function SettingsPanel({ settings, values, onChange, disabled }: SettingsPanelProps) {
  function set(key: string, value: unknown) {
    onChange({ ...values, [key]: value });
  }

  function visible(def: ToolSettingDef): boolean {
    if (!def.showWhen) return true;
    return values[def.showWhen.key] === def.showWhen.equals;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {settings.filter(visible).map((def) => (
        <div key={def.key} className="space-y-2" data-setting={def.key}>
          <Label htmlFor={`setting-${def.key}`}>{def.label}</Label>
          {def.type === "select" ? (
            <Select value={String(values[def.key] ?? def.default)} onValueChange={(v) => set(def.key, v)} disabled={disabled}>
              <SelectTrigger id={`setting-${def.key}`}>
                <SelectValue placeholder={def.label} />
              </SelectTrigger>
              <SelectContent>
                {def.options?.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : def.type === "range" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{(values[def.key] ?? def.default) as string | number}</span>
                {def.unit ? <span className="text-xs text-muted-foreground">{def.unit}</span> : null}
              </div>
              <Slider
                id={`setting-${def.key}`}
                min={def.min ?? 0}
                max={def.max ?? 100}
                step={def.step ?? 1}
                value={[Number(values[def.key] ?? def.default)]}
                onValueChange={([v]) => set(def.key, v)}
                disabled={disabled}
              />
            </div>
          ) : def.type === "boolean" ? (
            <div className="flex items-center justify-between rounded-xl border px-3.5 py-2.5">
              <span className="text-sm text-muted-foreground">{def.description ?? ""}</span>
              <Switch checked={Boolean(values[def.key] ?? def.default)} onCheckedChange={(v) => set(def.key, v)} disabled={disabled} />
            </div>
          ) : def.type === "color" ? (
            <div className="flex items-center gap-2">
              <input
                id={`setting-${def.key}`}
                type="color"
                value={String(values[def.key] ?? def.default)}
                onChange={(e) => set(def.key, e.target.value.replace("#", ""))}
                className="h-10 w-14 cursor-pointer rounded-lg border bg-transparent p-1"
                disabled={disabled}
              />
              <span className="text-sm text-muted-foreground">{(values[def.key] ?? def.default) as string}</span>
            </div>
          ) : (
            <Input
              id={`setting-${def.key}`}
              type={def.type === "number" ? "number" : "text"}
              min={def.min}
              max={def.max}
              value={String(values[def.key] ?? def.default)}
              onChange={(e) => set(def.key, def.type === "number" ? Number(e.target.value) : e.target.value)}
              disabled={disabled}
            />
          )}
          {def.description && def.type !== "boolean" ? <p className="text-xs text-muted-foreground">{def.description}</p> : null}
        </div>
      ))}
    </div>
  );
}
