import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { ToolCard } from "@/components/app/tool-card";
import { PDF_TOOLS, IMAGE_TOOLS } from "@filemorph/shared";

export const metadata: Metadata = { title: "Upload" };

export default function UploadPage() {
  return (
    <>
      <PageHeader
        title="Upload & transform"
        description="Choose a tool to upload and transform your files. Processing is private and files are deleted automatically."
      />
      <div className="space-y-10">
        <section>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">PDF tools</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PDF_TOOLS.map((tool) => (
              <ToolCard key={tool.code} tool={tool} />
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">Image tools</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {IMAGE_TOOLS.map((tool) => (
              <ToolCard key={tool.code} tool={tool} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
