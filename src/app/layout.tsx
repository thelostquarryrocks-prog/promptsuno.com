import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SITE_URL } from "@/lib/site";
import "./globals.css";
import "./home.css";

// Self-hosted (OFL, see fonts/OFL.txt): no build-time dependency on Google Fonts.
const jakarta = localFont({
  src: "./fonts/PlusJakartaSans-latin-variable.woff2",
  weight: "200 800",
  style: "normal",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const title = "PromptSuno: Suno prompts that land the sound you hear";
const description =
  "Describe the sound in your head and get a Suno v6 prompt that lands it: style text, excludes and a lyrics structure, checked against a map of how Suno styles combine. Free to try.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: title, template: "%s · PromptSuno" },
  description,
  applicationName: "PromptSuno",
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: "/", siteName: "PromptSuno", title, description },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: "#050304",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={jakarta.className}>
      <body>{children}</body>
    </html>
  );
}
