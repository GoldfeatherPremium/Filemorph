declare module "pdfjs-dist/legacy/build/pdf.mjs" {
  export const GlobalWorkerOptions: {
    workerSrc: string;
    workerPort: unknown;
  };
  export function getDocument(src: unknown): PDFDocumentLoadingTask;
  export interface PDFDocumentLoadingTask {
    promise: Promise<PDFDocumentProxy>;
    destroy(): Promise<void>;
  }
  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
    destroy(): Promise<void>;
  }
  export interface PDFPageProxy {
    getViewport(opts: { scale: number; rotation?: number }): { width: number; height: number };
    render(params: {
      canvasContext: unknown;
      viewport: { width: number; height: number };
      canvasFactory?: unknown;
    }): { promise: Promise<unknown> };
    getTextContent(): Promise<{ items: Array<Record<string, unknown>> }>;
  }
}
