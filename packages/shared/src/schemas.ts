import { z } from "zod";
import { TOOL_BY_CODE } from "./tools";

export const positiveInt = z.number().int().nonnegative();

export const createJobSchema = z
  .object({
    toolCode: z.string().refine((v) => Boolean(TOOL_BY_CODE[v]), { message: "unknown_tool" }),
    fileIds: z.array(z.string().uuid()).min(1).max(50).default([]),
    settings: z.record(z.unknown()).default({}),
  })
  .strict();

export const uploadUrlSchema = z
  .object({
    filename: z.string().min(1).max(255),
    contentType: z.string().min(1).max(120),
    size: z.number().int().positive().max(524_288_000),
    toolCode: z.string().optional(),
  })
  .strict();

export const uploadCompleteSchema = z
  .object({
    path: z.string().min(3).max(512),
    filename: z.string().min(1).max(255),
    contentType: z.string().min(1).max(120),
    size: z.number().int().positive().max(524_288_000),
    sha256: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
  })
  .strict();

export const updateMeSchema = z
  .object({
    fullName: z.string().max(120).optional(),
    avatarUrl: z.string().url().max(500).nullable().optional(),
    preferences: z
      .object({
        theme: z.enum(["light", "dark"]).optional(),
        marketingOptIn: z.boolean().optional(),
        notifyJobCompletion: z.boolean().optional(),
        notifyProductUpdates: z.boolean().optional(),
      })
      .optional(),
  })
  .strict();

export const cancelJobSchema = z.object({}).strict();
export const retryJobSchema = z.object({}).strict();

export const checkoutSchema = z
  .object({
    plan: z.enum(["plus", "pro"]),
    cadence: z.enum(["monthly", "yearly"]),
    returnUrl: z.string().url().max(500).optional(),
  })
  .strict();

export const supportTicketSchema = z
  .object({
    subject: z.string().min(3).max(200),
    message: z.string().min(10).max(5000),
    category: z.string().max(60).default("general"),
    email: z.string().email().optional(),
  })
  .strict();

export const guestJobSchema = z.object({});

export const adminUserLookupSchema = z.object({
  q: z.string().min(1).max(200),
});

export const adminSuspendSchema = z.object({
  userId: z.string().uuid(),
  suspended: z.boolean(),
  reason: z.string().max(500).optional(),
});

export const adminPlanUpdateSchema = z.object({
  planId: z.string().uuid(),
  fields: z
    .object({
      price_monthly_usd: z.number().nonnegative().optional(),
      price_yearly_usd: z.number().nonnegative().optional(),
      monthly_job_quota: z.number().int().nonnegative().nullable().optional(),
      daily_job_quota: z.number().int().nonnegative().nullable().optional(),
      max_batch_size: z.number().int().positive().optional(),
      max_file_bytes: z.number().int().positive().optional(),
      batch_enabled: z.boolean().optional(),
      advanced_compression: z.boolean().optional(),
      priority: z.number().int().nonnegative().optional(),
      retention_hours: z.number().int().positive().optional(),
      is_active: z.boolean().optional(),
    })
    .strict(),
});

export const adminTicketUpdateSchema = z.object({
  ticketId: z.string().uuid(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
});
