import type { Metadata } from "next";
import "./globals.css";

// Placeholder shell. Fonts, colors and layout come from the Claude Design work
// once it is brought into the repo.
export const metadata: Metadata = {
  title: "PromptSuno",
  description:
    "Better Suno v6 style prompts, backed by a style-relationship engine. An independent tool, not affiliated with Suno.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
