import type { Metadata } from "next";
import Link from "next/link";
import { SettingsForm } from "@/components/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <SettingsForm />
      <p className="mx-auto max-w-3xl px-4 pb-10 text-sm text-muted md:px-8">
        <Link href="/about" className="text-gold">
          About and credits
        </Link>
        <span aria-hidden="true"> · </span>
        <Link href="/terms" className="text-gold">
          Terms of use
        </Link>
      </p>
    </>
  );
}
