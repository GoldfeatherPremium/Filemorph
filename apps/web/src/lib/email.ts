import { serverEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export type EmailTemplate =
  | "welcome"
  | "job_completed"
  | "job_failed"
  | "subscription_activated"
  | "payment_failed"
  | "subscription_cancelled"
  | "usage_limit_reached";

interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

function buildMessage(template: EmailTemplate, data: Record<string, string>): EmailMessage {
  const app = "FileMorph";
  switch (template) {
    case "welcome":
      return {
        to: data.email,
        subject: `Welcome to ${app} 🎉`,
        text: `Hi${data.name ? " " + data.name : ""},\n\nWelcome to ${app}. Your files are ready to transform — convert, compress and organize them in one beautiful workspace.\n\nGet started: ${data.url}\n\n— The ${app} team`,
      };
    case "job_completed":
      return {
        to: data.email,
        subject: "Your files are ready",
        text: `Your ${data.tool} job finished successfully.\n\nDownload your files: ${data.url}`,
      };
    case "job_failed":
      return {
        to: data.email,
        subject: "A job couldn't be completed",
        text: `Your ${data.tool} job failed: ${data.error}\n\nRetry: ${data.url}`,
      };
    case "subscription_activated":
      return {
        to: data.email,
        subject: "Your plan is active",
        text: `Your ${data.plan} subscription is active. Enjoy ${data.features}.\n\nManage billing: ${data.url}`,
      };
    case "payment_failed":
      return {
        to: data.email,
        subject: "Payment needs attention",
        text: `We couldn't process your latest payment. Update your payment method to keep ${data.plan} active.\n\nManage billing: ${data.url}`,
      };
    case "subscription_cancelled":
      return {
        to: data.email,
        subject: "Subscription cancelled",
        text: `Your ${data.plan} subscription will end at the end of the billing period.\n\nYou can resubscribe anytime: ${data.url}`,
      };
    case "usage_limit_reached":
      return {
        to: data.email,
        subject: "You've reached your usage limit",
        text: `You've used up your ${data.plan} allowance this period. Upgrade for more headroom: ${data.url}`,
      };
    default:
      return { to: data.email, subject: "FileMorph update", text: "" };
  }
}

/**
 * Send a transactional email via Resend. When RESEND_API_KEY is not configured
 * (local/demo), we log the attempt instead of failing.
 */
export async function sendEmail(template: EmailTemplate, data: Record<string, string>): Promise<{ sent: boolean; reason?: string }> {
  const env = serverEnv();
  const msg = buildMessage(template, data);
  if (!env.resendApiKey) {
    logger.warn("email.not_configured", { template, to: msg.to, subject: msg.subject });
    return { sent: false, reason: "resend_not_configured" };
  }
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(env.resendApiKey);
    const result = await resend.emails.send({
      from: "FileMorph <no-reply@filemorph.com>",
      to: [msg.to],
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
    });
    if (result.error) {
      logger.error("email.send_failed", { template, error: result.error.message });
      return { sent: false, reason: result.error.message };
    }
    return { sent: true };
  } catch (e) {
    logger.error("email.send_exception", { template, error: e instanceof Error ? e.message : String(e) });
    return { sent: false, reason: "exception" };
  }
}
