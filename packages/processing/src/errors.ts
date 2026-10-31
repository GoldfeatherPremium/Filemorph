export class ProcessingError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ProcessingError";
  }
}

export function isProcessingError(e: unknown): e is ProcessingError {
  return e instanceof ProcessingError;
}

export function toProcessingError(e: unknown): ProcessingError {
  if (e instanceof ProcessingError) return e;
  return new ProcessingError("processing_failed", e instanceof Error ? e.message : "Processing failed");
}
