import { apiRoute } from "@/lib/api";
import { TOOLS, type ToolDTO } from "@filemorph/shared";

export const GET = apiRoute(async () => {
  const dto: ToolDTO[] = TOOLS.map((t) => ({
    code: t.code,
    slug: t.slug,
    name: t.name,
    category: t.category,
    tagline: t.tagline,
    description: t.description,
    icon: t.icon,
    supportsBatch: t.supportsBatch,
    batchMax: t.batchMax,
    settings: t.settings.map((s) => ({ ...s })),
  }));
  return dto;
});
