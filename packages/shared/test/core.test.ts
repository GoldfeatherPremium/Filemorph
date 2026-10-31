import { describe, expect, it } from "vitest";
import {
  TOOLS,
  TOOL_BY_CODE,
  FREE_ENTITLEMENTS,
  toEntitlements,
  checkBatch,
  checkToolEligibility,
  humanizeCheckReason,
  formatBytes,
  createJobSchema,
  SITE_URL,
  APP_URL,
  GUEST_DAILY_JOBS,
  THROTTLE,
  JOB_STATUSES,
} from "../src";

const FREE_PLAN = {
  code: "free",
  name: "Free",
  monthly_job_quota: null,
  daily_job_quota: 10,
  max_batch_size: 1,
  max_file_bytes: 20 * 1024 * 1024,
  batch_enabled: false,
  advanced_compression: false,
  priority: 0,
  retention_hours: 24,
} as const;

const PLUS_PLAN = {
  code: "plus",
  name: "Plus",
  monthly_job_quota: 300,
  daily_job_quota: null,
  max_batch_size: 20,
  max_file_bytes: 100 * 1024 * 1024,
  batch_enabled: true,
  advanced_compression: false,
  priority: 1,
  retention_hours: 168,
} as const;

describe("entitlements", () => {
  it("maps plan rows to entitlements", () => {
    const ent = toEntitlements(FREE_PLAN);
    expect(ent.planCode).toBe("free");
    expect(ent.dailyJobQuota).toBe(10);
    expect(ent.maxBatchSize).toBe(1);
    expect(ent.maxFileBytes).toBe(20 * 1024 * 1024);
    expect(ent.batchEnabled).toBe(false);
    expect(ent.retentionHours).toBe(24);
  });

  it("free entitlements match the published plan", () => {
    expect(FREE_ENTITLEMENTS.maxBatchSize).toBe(1);
    expect(FREE_ENTITLEMENTS.dailyJobQuota).toBe(10);
    expect(FREE_ENTITLEMENTS.maxFileBytes).toBe(20 * 1024 * 1024);
    expect(FREE_ENTITLEMENTS.batchEnabled).toBe(false);
  });
});

describe("checkBatch", () => {
  it("rejects zero files", () => {
    expect(checkBatch(toEntitlements(FREE_PLAN), 0, 0)).toEqual({ ok: false, reason: "no_files" });
  });

  it("free plan rejects multi-file batches", () => {
    const res = checkBatch(toEntitlements(FREE_PLAN), 2, 1024);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("batch_requires_plus");
  });

  it("free plan allows a single file within the size limit", () => {
    expect(checkBatch(toEntitlements(FREE_PLAN), 1, 5 * 1024 * 1024).ok).toBe(true);
  });

  it("rejects batches exceeding total size limit", () => {
    const res = checkBatch(toEntitlements(FREE_PLAN), 1, 21 * 1024 * 1024);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("size_limit");
  });

  it("plus plan allows batches up to its limit", () => {
    expect(checkBatch(toEntitlements(PLUS_PLAN), 10, 50 * 1024 * 1024).ok).toBe(true);
  });

  it("plus plan rejects oversized batches", () => {
    const res = checkBatch(toEntitlements(PLUS_PLAN), 21, 1024);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("batch_too_large");
  });
});

describe("tool eligibility", () => {
  it("batch tools require a paid plan", () => {
    const mergeTool = TOOL_BY_CODE["merge-pdf"];
    const res = checkToolEligibility(toEntitlements(FREE_PLAN), mergeTool);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("batch_requires_plus");
  });
});

describe("reason copy", () => {
  it("humanizes limit reasons", () => {
    expect(humanizeCheckReason("batch_requires_plus")).toContain("Plus");
    expect(humanizeCheckReason("monthly_limit")).toContain("monthly");
    expect(humanizeCheckReason(undefined, "Free")).toContain("Free");
  });
});

describe("formatBytes", () => {
  it("formats byte sizes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(3.5 * 1024 * 1024)).toBe("3.5 MB");
  });
});

describe("createJobSchema", () => {
  it("accepts a valid body and applies defaults", () => {
    const parsed = createJobSchema.safeParse({ toolCode: "merge-pdf", fileIds: ["uuid"] });
    // fileIds must be valid UUIDs; use a real one to pass validation.
    const uuid = "123e4567-e89b-12d3-a456-426614174000";
    const ok = createJobSchema.safeParse({ toolCode: "merge-pdf", fileIds: [uuid] });
    expect(ok.success).toBe(true);
    expect(parsed.success).toBe(false);
  });

  it("rejects unknown tools", () => {
    const res = createJobSchema.safeParse({ toolCode: "nope", fileIds: ["123e4567-e89b-12d3-a456-426614174000"] });
    expect(res.success).toBe(false);
  });
});

describe("catalog", () => {
  it("defines all 12 tools with unique slugs and SEO", () => {
    expect(TOOLS.length).toBe(12);
    const slugs = new Set(TOOLS.map((t) => t.slug));
    expect(slugs.size).toBe(12);
    for (const t of TOOLS) {
      expect(t.seo.title.length).toBeGreaterThan(10);
      expect(t.seo.description.length).toBeGreaterThan(20);
      expect(t.accepts.length).toBeGreaterThan(0);
    }
  });

  it("exposes stable environment constants", () => {
    expect(SITE_URL).toBe("https://filemorph.com");
    expect(APP_URL).toBe("https://app.filemorph.com");
    expect(GUEST_DAILY_JOBS).toBeGreaterThan(0);
    expect(THROTTLE.maxJobsPerMinute).toBeGreaterThan(0);
    expect(JOB_STATUSES).toContain("queued");
    expect(JOB_STATUSES).toContain("completed");
  });
});
