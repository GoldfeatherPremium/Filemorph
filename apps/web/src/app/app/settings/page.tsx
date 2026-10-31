import type { Metadata } from "next";
import { getDataStore } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { SettingsForm } from "@/components/app/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await requireUser();
  const store = await getDataStore();
  const profile = await store.getProfile(session.userId);
  const prefs = await store.getPreferences(session.userId);

  return (
    <>
      <PageHeader title="Settings" description="Manage your profile and preferences." />
      <SettingsForm
        profile={
          profile
            ? { id: profile.id, fullName: profile.full_name, email: profile.email, avatarUrl: profile.avatar_url }
            : null
        }
        prefs={
          prefs
            ? {
                theme: prefs.theme,
                marketingOptIn: prefs.marketing_opt_in,
                notifyJobCompletion: prefs.notify_job_completion,
                notifyProductUpdates: prefs.notify_product_updates,
              }
            : null
        }
      />
    </>
  );
}
