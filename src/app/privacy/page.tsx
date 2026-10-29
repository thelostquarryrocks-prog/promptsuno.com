import type { Metadata } from "next";
import { ContactLine, LegalShell } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What PromptSuno collects, why, and who helps run it.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalShell>
      <h1>Privacy</h1>
      <p>Last updated October 28, 2026. This page explains in plain language what PromptSuno collects and why.</p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Your Google account basics</strong>, if you sign in: your name, email address and profile picture, so we can give you an account and your daily prompts.</li>
        <li><strong>What you type into the builder</strong>: your idea, the styles you pick and anything you exclude. We send it to OpenAI to write your prompt. We don&apos;t keep a copy of your idea text.</li>
        <li><strong>Usage records</strong>: when a prompt was made, whether it succeeded, and how much it cost us to make. This is how daily limits work and how we keep the service affordable.</li>
        <li><strong>For visitors who aren&apos;t signed in</strong>: a random token stored in your browser and a scrambled (hashed) version of your IP address, so the free prompt can&apos;t be used over and over by scripts.</li>
      </ul>

      <h2>Who helps run PromptSuno</h2>
      <ul>
        <li><strong>OpenAI</strong> writes the prompts. Your request is processed under OpenAI&apos;s API terms, and we ask OpenAI not to store it.</li>
        <li><strong>Supabase</strong> stores accounts and usage records.</li>
        <li><strong>Vercel</strong> hosts the website.</li>
        <li><strong>Google</strong> handles sign-in when you choose to sign in with Google.</li>
      </ul>
      <p>We don&apos;t sell your data, and we don&apos;t run ads.</p>

      <h2>Cookies</h2>
      <p>We use only the cookies and browser storage PromptSuno needs to work: keeping you signed in, counting the free prompt, and holding your work in the builder while you sign in.</p>

      <h2>Your choices</h2>
      <p>You can use PromptSuno without an account. If you have one and want it deleted, contact <ContactLine />, and we&apos;ll remove your account and its usage records.</p>

      <h2>Changes</h2>
      <p>If this page changes in a way that matters, we&apos;ll update the date at the top.</p>
    </LegalShell>
  );
}
