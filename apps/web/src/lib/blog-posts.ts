/**
 * Static blog content. Structured to be trivially replaced by a CMS later:
 * each post matches the shape a headless CMS (e.g. Contentful/Sanity) would
 * emit, so swapping this module is the only change required.
 */
export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readingTime: string;
  body: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "what-is-pdf-compression",
    title: "What does “compressing a PDF” actually do?",
    description: "A plain-language look at how PDF compression works, what you lose, and when not to bother.",
    date: "2025-09-10",
    readingTime: "4 min",
    body: [
      "A PDF is a container. It can hold vector text, fonts, metadata — and images. In most cases it's those images that make a PDF huge. A single high-resolution photograph can be several megabytes on its own.",
      "When you compress a PDF on FileMorph, we re-encode the embedded images at a lower quality setting and rebuild the document. Text-heavy PDFs stay crisp because the text itself is vector data, not pixels.",
      "We always show you the true before/after sizes, and if the result isn't smaller, we'll say so. No fake percentages.",
    ],
  },
  {
    slug: "png-vs-jpg-when-to-use-which",
    title: "PNG vs JPG: which one should you use?",
    description: "Understand transparency, compression, and the right format for your use case.",
    date: "2025-08-22",
    readingTime: "5 min",
    body: [
      "JPG is great for photographs: it compresses hard and takes full advantage of how our eyes perceive color detail. But JPG has no transparency — every pixel has a color.",
      "PNG supports transparency and is lossless, which makes it ideal for logos, UI assets, and crisp text. The tradeoff is size.",
      "If you're converting a PNG with transparency to JPG, choose a background color first — FileMorph will flatten it for you.",
    ],
  },
  {
    slug: "organizing-multiple-pdfs",
    title: "Quick tips for organizing multiple PDFs",
    description: "Merge, split, rotate and reorder — the workflows that save real time.",
    date: "2025-07-30",
    readingTime: "3 min",
    body: [
      "Start with merge: combine scans, chapters, and receipts into one document. Drag files into the order you want before you run the job.",
      "Use split to extract a cover page or break a large file into chapters. A page range like 1-3, 5 works great.",
      "Finally, organize — reorder pages visually and drop the ones you don't need before sharing.",
    ],
  },
];
