export interface ProcessInputFile {
  id: string;
  name: string;
  contentType: string;
  data: Buffer;
}

export interface ProcessOutputFile {
  name: string;
  contentType: string;
  data: Buffer;
  width?: number | null;
  height?: number | null;
  page?: number | null;
}

export interface ProcessContext {
  toolCode: string;
  settings: Record<string, unknown>;
  files: ProcessInputFile[];
  onProgress?: (pct: number, stage: string) => void;
}

export interface ProcessResult {
  outputs: ProcessOutputFile[];
  meta: Record<string, unknown>;
}

export type ToolHandler = (ctx: ProcessContext) => Promise<ProcessOutputFile[]>;
