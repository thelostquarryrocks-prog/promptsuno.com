import type { Metadata } from "next";
import { ContactLine, LegalShell } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms for using PromptSuno.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalShell>
      <h1>Terms</h1>
      <p>Last updated October 28, 2026. By using PromptSuno you agree to these terms.</p>

      <h2>What PromptSuno is</h2>
      <p>PromptSuno writes text prompts for Suno. It doesn&apos;t make music. PromptSuno is an independent tool and isn&apos;t affiliated with or endorsed by Suno.</p>

      <h2>Your prompts</h2>
      <p>The prompts PromptSuno writes for you are yours to use. Anything you make with them in Suno is governed by Suno&apos;s own terms and your Suno plan, including who owns the music and whether you can use it commercially.</p>
      <p>Prompts are written by AI. They&apos;re provided as they are, and we can&apos;t promise any particular result from Suno.</p>

      <h2>Fair use of the service</h2>
      <ul>
        <li>Don&apos;t try to get around the free prompt or daily limits, for example with scripts or many accounts.</li>
        <li>Don&apos;t use PromptSuno to create content that&apos;s illegal or that breaks Suno&apos;s or OpenAI&apos;s rules.</li>
        <li>Don&apos;t scrape, overload or attack the service.</li>
      </ul>
      <p>We may limit or close accounts that break these rules.</p>

      <h2>Changes and availability</h2>
      <p>PromptSuno is new and will change. Free allowances, features and these terms may change over time. We&apos;ll update the date above when the terms change.</p>

      <h2>Contact</h2>
      <p>Questions about these terms: <ContactLine />.</p>
    </LegalShell>
  );
}
