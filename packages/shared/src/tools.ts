export type ToolCategory = "pdf" | "image";

export interface ToolSettingOption {
  value: string;
  label: string;
}

export interface ToolSettingDef {
  key: string;
  label: string;
  type: "select" | "number" | "range" | "text" | "boolean" | "color";
  options?: ToolSettingOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  default: unknown;
  description?: string;
  /** Show only when a condition over settings is true (evaluated by UI). */
  showWhen?: { key: string; equals: unknown };
}

export interface ToolFaq {
  q: string;
  a: string;
}

export interface ToolDef {
  code: string;
  slug: string;
  name: string;
  shortName: string;
  category: ToolCategory;
  tagline: string;
  description: string;
  longDescription: string;
  icon: string; // lucide icon name
  accepts: string[]; // accepted MIME types
  extensions: string[];
  supportsBatch: boolean;
  batchMin: number;
  batchMax: number;
  defaultSettings: Record<string, unknown>;
  settings: ToolSettingDef[];
  examples: { from: string; to: string }[];
  faq: ToolFaq[];
  seo: { title: string; description: string };
}

export const TOOLS: ToolDef[] = [
  {
    code: "merge-pdf",
    slug: "merge-pdf",
    name: "Merge PDF",
    shortName: "Merge",
    category: "pdf",
    tagline: "Combine multiple PDFs into one document.",
    description: "Join several PDF files into a single PDF, in the order you choose.",
    longDescription:
      "Upload two or more PDFs, drag them into the order you want, and merge them into one polished document. Great for combining scans, chapters, and receipts.",
    icon: "Combine",
    accepts: ["application/pdf"],
    extensions: ["pdf"],
    supportsBatch: true,
    batchMin: 2,
    batchMax: 50,
    defaultSettings: {},
    settings: [],
    examples: [
      { from: "3 PDFs", to: "1 combined PDF" },
    ],
    faq: [
      { q: "Can I merge PDFs of different page sizes?", a: "Yes — the output preserves each page's original dimensions; pages are simply appended in order." },
      { q: "Is there a limit on how many files I can merge?", a: "Free plans can merge up to your batch limit; Plus (20) and Pro (50) allow larger batches." },
    ],
    seo: {
      title: "Merge PDF — Combine PDF Files Online | FileMorph",
      description: "Merge multiple PDF files into one document for free. Drag-and-drop ordering, no installation, private & secure.",
    },
  },
  {
    code: "split-pdf",
    slug: "split-pdf",
    name: "Split PDF",
    shortName: "Split",
    category: "pdf",
    tagline: "Extract pages or page ranges into new PDFs.",
    description: "Split a PDF by individual pages or custom ranges.",
    longDescription:
      "Pull single pages out of a PDF or split it into ranges — perfect for extracting a cover page or dividing a large document into chapters.",
    icon: "Scissors",
    accepts: ["application/pdf"],
    extensions: ["pdf"],
    supportsBatch: false,
    batchMin: 1,
    batchMax: 1,
    defaultSettings: { mode: "ranges", ranges: "" },
    settings: [
      {
        key: "mode",
        label: "Split mode",
        type: "select",
        options: [
          { value: "ranges", label: "Page ranges" },
          { value: "all", label: "Every page separately" },
        ],
        default: "ranges",
      },
      {
        key: "ranges",
        label: "Page ranges",
        type: "text",
        default: "",
        description: 'e.g. 1-3, 5, 8-10',
        showWhen: { key: "mode", equals: "ranges" },
      },
    ],
    examples: [{ from: "1 PDF", to: "Multiple PDFs" }],
    faq: [
      { q: "What is a page range?", a: "A list of page numbers or spans, e.g. 1-3, 5, 8-10. Out-of-range pages are ignored." },
    ],
    seo: {
      title: "Split PDF — Extract Pages Online | FileMorph",
      description: "Split a PDF into separate files by page or range. Free online PDF splitter with a clean, fast workflow.",
    },
  },
  {
    code: "compress-pdf",
    slug: "compress-pdf",
    name: "Compress PDF",
    shortName: "Compress",
    category: "pdf",
    tagline: "Shrink your PDF without breaking the layout.",
    description: "Reduce PDF file size with low, balanced, or high compression.",
    longDescription:
      "Re-encode embedded images at a lower quality to reduce file size. Choose Low, Balanced, or High compression. If the output is larger than the input, you'll see the true sizes and can keep the original.",
    icon: "Minimize2",
    accepts: ["application/pdf"],
    extensions: ["pdf"],
    supportsBatch: false,
    batchMin: 1,
    batchMax: 1,
    defaultSettings: { preset: "balanced" },
    settings: [
      {
        key: "preset",
        label: "Compression preset",
        type: "select",
        options: [
          { value: "low", label: "Low (near-lossless)" },
          { value: "balanced", label: "Balanced" },
          { value: "high", label: "High (smallest)" },
        ],
        default: "balanced",
      },
    ],
    examples: [{ from: "12.4 MB", to: "3.1 MB" }],
    faq: [
      { q: "Is the compression lossy?", a: "It re-encodes images, so it is recompression — quality is preserved for text-heavy PDFs but there is a small tradeoff on photos. We always show the true resulting size." },
      { q: "What if my PDF gets bigger?", a: "We report the real numbers. If compression isn't beneficial you can download the original instead." },
    ],
    seo: {
      title: "Compress PDF — Reduce PDF File Size Online | FileMorph",
      description: "Compress PDF files online to shrink their size. Fast, private, and free — see the real before/after size.",
    },
  },
  {
    code: "pdf-to-jpg",
    slug: "pdf-to-jpg",
    name: "PDF to JPG",
    shortName: "PDF → JPG",
    category: "pdf",
    tagline: "Turn every PDF page into a high-quality JPG.",
    description: "Convert PDF pages to JPG images, individually or as a ZIP.",
    longDescription:
      "Render each page of your PDF as a crisp JPG. Choose output quality, then download pages one-by-one or as a single ZIP archive.",
    icon: "FileImage",
    accepts: ["application/pdf"],
    extensions: ["pdf"],
    supportsBatch: false,
    batchMin: 1,
    batchMax: 1,
    defaultSettings: { quality: 85, output: "zip" },
    settings: [
      { key: "quality", label: "Quality", type: "range", min: 20, max: 100, step: 5, unit: "%", default: 85 },
      {
        key: "output",
        label: "Download as",
        type: "select",
        options: [
          { value: "zip", label: "ZIP archive" },
          { value: "individual", label: "Individual files" },
        ],
        default: "zip",
      },
    ],
    examples: [{ from: "1 PDF", to: "JPG per page" }],
    faq: [
      { q: "Will the text look sharp?", a: "Pages are rendered at full vector resolution before encoding to JPG, so text stays crisp at your chosen quality." },
    ],
    seo: {
      title: "PDF to JPG — Convert PDF Pages to Images | FileMorph",
      description: "Convert PDF pages to JPG images online, free. High quality, no installation, private processing.",
    },
  },
  {
    code: "jpg-to-pdf",
    slug: "jpg-to-pdf",
    name: "JPG to PDF",
    shortName: "JPG → PDF",
    category: "pdf",
    tagline: "Build a PDF from your images in seconds.",
    description: "Combine JPG, PNG, and WebP images into a single PDF.",
    longDescription:
      "Turn scans and photos into a clean PDF. Reorder images, set page size and orientation, and add margins.",
    icon: "Image",
    accepts: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
    extensions: ["jpg", "jpeg", "png", "webp", "heic", "heif"],
    supportsBatch: true,
    batchMin: 1,
    batchMax: 50,
    defaultSettings: { pageSize: "a4", orientation: "portrait", margin: 0 },
    settings: [
      {
        key: "pageSize",
        label: "Page size",
        type: "select",
        options: [
          { value: "a4", label: "A4" },
          { value: "letter", label: "US Letter" },
          { value: "fit", label: "Fit image" },
        ],
        default: "a4",
      },
      {
        key: "orientation",
        label: "Orientation",
        type: "select",
        options: [
          { value: "portrait", label: "Portrait" },
          { value: "landscape", label: "Landscape" },
        ],
        default: "portrait",
      },
      { key: "margin", label: "Margin (px)", type: "range", min: 0, max: 120, step: 4, unit: "px", default: 0 },
    ],
    examples: [{ from: "N images", to: "1 PDF" }],
    faq: [
      { q: "Can I mix JPG, PNG and WebP?", a: "Yes — any supported image can be combined in the same PDF." },
    ],
    seo: {
      title: "JPG to PDF — Convert Images to PDF Online | FileMorph",
      description: "Convert JPG, PNG and WebP images to a single PDF. Free online image-to-PDF converter with reordering.",
    },
  },
  {
    code: "rotate-pdf",
    slug: "rotate-pdf",
    name: "Rotate PDF",
    shortName: "Rotate",
    category: "pdf",
    tagline: "Fix page orientation in one click.",
    description: "Rotate PDF pages by 90°, 180°, or 270°.",
    longDescription:
      "Select pages — or all pages — and rotate them to fix sideways scans and upside-down pages.",
    icon: "RotateCw",
    accepts: ["application/pdf"],
    extensions: ["pdf"],
    supportsBatch: false,
    batchMin: 1,
    batchMax: 1,
    defaultSettings: { rotation: 90, pages: "all", pageRange: "" },
    settings: [
      {
        key: "rotation",
        label: "Rotate",
        type: "select",
        options: [
          { value: "90", label: "90° clockwise" },
          { value: "180", label: "180°" },
          { value: "270", label: "270° clockwise" },
        ],
        default: "90",
      },
      {
        key: "pages",
        label: "Pages",
        type: "select",
        options: [
          { value: "all", label: "All pages" },
          { value: "range", label: "Custom range" },
        ],
        default: "all",
      },
      { key: "pageRange", label: "Page range", type: "text", default: "", showWhen: { key: "pages", equals: "range" } },
    ],
    examples: [{ from: "Sideways PDF", to: "Correctly oriented PDF" }],
    faq: [
      { q: "What's a page range?", a: "e.g. 1-3, 5 rotates pages 1–3 and page 5. Other pages stay untouched." },
    ],
    seo: {
      title: "Rotate PDF — Rotate Pages Online | FileMorph",
      description: "Rotate PDF pages by 90, 180 or 270 degrees online. Free, fast, and private.",
    },
  },
  {
    code: "organize-pdf",
    slug: "organize-pdf",
    name: "Organize PDF",
    shortName: "Organize",
    category: "pdf",
    tagline: "Reorder and delete pages visually.",
    description: "Rearrange or remove PDF pages from thumbnails.",
    longDescription:
      "See every page as a thumbnail, then drag to reorder and delete pages you don't need. Download the cleaned-up PDF.",
    icon: "LayoutGrid",
    accepts: ["application/pdf"],
    extensions: ["pdf"],
    supportsBatch: false,
    batchMin: 1,
    batchMax: 1,
    defaultSettings: {},
    settings: [],
    examples: [{ from: "Messy PDF", to: "Organized PDF" }],
    faq: [
      { q: "Are the thumbnail previews accurate?", a: "Yes — thumbnails are rendered from the actual page content." },
    ],
    seo: {
      title: "Organize PDF — Reorder Pages Online | FileMorph",
      description: "Reorder and delete PDF pages visually with thumbnails. Free online PDF organizer.",
    },
  },
  {
    code: "pdf-to-text",
    slug: "pdf-to-text",
    name: "PDF to Text",
    shortName: "PDF → TXT",
    category: "pdf",
    tagline: "Extract selectable text from your PDF.",
    description: "Extract text from PDFs and download as TXT.",
    longDescription:
      "Pull the raw text layer out of a PDF, preserving page boundaries, and download it as a .txt file. Perfect for quotes, notes, and analysis.",
    icon: "FileText",
    accepts: ["application/pdf"],
    extensions: ["pdf"],
    supportsBatch: false,
    batchMin: 1,
    batchMax: 1,
    defaultSettings: { includePageHeaders: true },
    settings: [
      { key: "includePageHeaders", label: "Include page boundaries", type: "boolean", default: true },
    ],
    examples: [{ from: "PDF with text", to: "Plain text" }],
    faq: [
      { q: "Will scanned PDFs extract text?", a: "Only if the PDF already contains a text layer. Scanned (image-only) PDFs need OCR, which isn't part of this tool." },
    ],
    seo: {
      title: "PDF to Text — Extract Text from PDF Online | FileMorph",
      description: "Extract text from a PDF and download it as TXT. Free, private, no installation.",
    },
  },
  {
    code: "image-compressor",
    slug: "image-compressor",
    name: "Image Compressor",
    shortName: "Compress",
    category: "image",
    tagline: "Shrink JPG, PNG, and WebP images.",
    description: "Reduce image file size while keeping quality.",
    longDescription:
      "Pick a quality level and shrink your photos. See the real before/after sizes and the true percentage saved — no fake numbers.",
    icon: "Spline",
    accepts: ["image/jpeg", "image/png", "image/webp"],
    extensions: ["jpg", "jpeg", "png", "webp"],
    supportsBatch: true,
    batchMin: 1,
    batchMax: 50,
    defaultSettings: { quality: 75, keepFormat: true },
    settings: [
      { key: "quality", label: "Quality", type: "range", min: 10, max: 100, step: 5, unit: "%", default: 75 },
      { key: "keepFormat", label: "Keep original format", type: "boolean", default: true },
    ],
    examples: [{ from: "2.4 MB", to: "0.6 MB" }],
    faq: [
      { q: "Does it change the dimensions?", a: "No — only the encoding quality changes, so dimensions stay identical." },
    ],
    seo: {
      title: "Image Compressor — Reduce Image File Size Online | FileMorph",
      description: "Compress JPG, PNG and WebP images online. See real before/after sizes, free and private.",
    },
  },
  {
    code: "image-resizer",
    slug: "image-resizer",
    name: "Image Resizer",
    shortName: "Resize",
    category: "image",
    tagline: "Resize images by pixels or percentage.",
    description: "Resize JPG, PNG, and WebP images with aspect-ratio lock.",
    longDescription:
      "Enter exact pixel dimensions, a percentage, or pick a preset like Instagram or Twitter sizes. Keep the aspect ratio locked or crop-to-fit.",
    icon: "Scan",
    accepts: ["image/jpeg", "image/png", "image/webp"],
    extensions: ["jpg", "jpeg", "png", "webp"],
    supportsBatch: true,
    batchMin: 1,
    batchMax: 50,
    defaultSettings: { mode: "percent", percent: 50, width: 0, height: 0, aspectLock: true, preset: "none" },
    settings: [
      {
        key: "mode",
        label: "Resize by",
        type: "select",
        options: [
          { value: "percent", label: "Percentage" },
          { value: "pixels", label: "Pixels" },
          { value: "preset", label: "Preset" },
        ],
        default: "percent",
      },
      { key: "percent", label: "Percentage", type: "range", min: 1, max: 200, step: 1, unit: "%", default: 50, showWhen: { key: "mode", equals: "percent" } },
      { key: "width", label: "Width (px)", type: "number", min: 1, max: 12000, default: 0, showWhen: { key: "mode", equals: "pixels" } },
      { key: "height", label: "Height (px)", type: "number", min: 1, max: 12000, default: 0, showWhen: { key: "mode", equals: "pixels" } },
      { key: "aspectLock", label: "Lock aspect ratio", type: "boolean", default: true, showWhen: { key: "mode", equals: "pixels" } },
      {
        key: "preset",
        label: "Preset",
        type: "select",
        options: [
          { value: "none", label: "Choose…" },
          { value: "ig-square", label: "Instagram square — 1080×1080" },
          { value: "ig-portrait", label: "Instagram portrait — 1080×1350" },
          { value: "tw-card", label: "Twitter/X card — 1200×675" },
          { value: "og", label: "Open Graph — 1200×630" },
          { value: "hd", label: "HD — 1920×1080" },
        ],
        default: "none",
        showWhen: { key: "mode", equals: "preset" },
      },
    ],
    examples: [{ from: "4000×3000", to: "1200×900" }],
    faq: [
      { q: "Will the image look stretched?", a: "With the aspect-ratio lock on, we scale proportionally and never distort. Turning it off lets you force exact dimensions." },
    ],
    seo: {
      title: "Image Resizer — Resize Images Online | FileMorph",
      description: "Resize JPG, PNG and WebP images to exact pixels or by percentage. Free online image resizer with presets.",
    },
  },
  {
    code: "png-to-jpg",
    slug: "png-to-jpg",
    name: "PNG to JPG",
    shortName: "PNG → JPG",
    category: "image",
    tagline: "Convert PNGs to JPG with a background fill.",
    description: "Convert PNG images to JPG, with background handling for transparency.",
    longDescription:
      "PNG supports transparency but JPG does not. Pick a background color to replace transparent areas, set quality, and convert — one by one or in a batch.",
    icon: "ImageDown",
    accepts: ["image/png"],
    extensions: ["png"],
    supportsBatch: true,
    batchMin: 1,
    batchMax: 50,
    defaultSettings: { quality: 85, background: "ffffff" },
    settings: [
      { key: "quality", label: "Quality", type: "range", min: 20, max: 100, step: 5, unit: "%", default: 85 },
      { key: "background", label: "Background color", type: "color", default: "ffffff", description: "Used where the PNG has transparency." },
    ],
    examples: [{ from: "PNG with alpha", to: "JPG on white" }],
    faq: [
      { q: "What happens to transparent areas?", a: "They're filled with your chosen background color (white by default)." },
    ],
    seo: {
      title: "PNG to JPG — Convert PNG Images Online | FileMorph",
      description: "Convert PNG to JPG online with background handling for transparency. Free, fast, and private.",
    },
  },
  {
    code: "image-cropper",
    slug: "image-cropper",
    name: "Image Cropper",
    shortName: "Crop",
    category: "image",
    tagline: "Crop images to any size or aspect ratio.",
    description: "Crop JPG, PNG, and WebP images with presets.",
    longDescription:
      "Drag the crop box on a live preview, snap to popular aspect ratios like 1:1 or 16:9, and download your cropped image.",
    icon: "Crop",
    accepts: ["image/jpeg", "image/png", "image/webp"],
    extensions: ["jpg", "jpeg", "png", "webp"],
    supportsBatch: false,
    batchMin: 1,
    batchMax: 1,
    defaultSettings: { aspect: "free" },
    settings: [
      {
        key: "aspect",
        label: "Aspect ratio",
        type: "select",
        options: [
          { value: "free", label: "Free" },
          { value: "1:1", label: "1:1" },
          { value: "4:3", label: "4:3" },
          { value: "16:9", label: "16:9" },
          { value: "3:2", label: "3:2" },
        ],
        default: "free",
      },
    ],
    examples: [{ from: "Full image", to: "Cropped image" }],
    faq: [
      { q: "Is cropping destructive?", a: "No — the original file stays untouched. You download a new cropped image." },
    ],
    seo: {
      title: "Image Cropper — Crop Images Online | FileMorph",
      description: "Crop JPG, PNG and WebP images online with live preview and aspect-ratio presets. Free and private.",
    },
  },
];

export const TOOL_BY_CODE: Record<string, ToolDef> = Object.fromEntries(
  TOOLS.map((t) => [t.code, t]),
);
export const TOOL_BY_SLUG: Record<string, ToolDef> = Object.fromEntries(
  TOOLS.map((t) => [t.slug, t]),
);

export const PDF_TOOLS = TOOLS.filter((t) => t.category === "pdf");
export const IMAGE_TOOLS = TOOLS.filter((t) => t.category === "image");
