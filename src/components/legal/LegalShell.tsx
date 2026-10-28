import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Footer } from "@/components/home/Footer";

export const contactEmail = () => process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "";

export function ContactLine() {
  const email = contactEmail();
  return email ? <a href={`mailto:${email}`}>{email}</a> : <span>the contact address on this page (being set up)</span>;
}

export function LegalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="ps" style={{ minHeight: "100vh", background: "#050304", color: "#fff" }}>
      <header style={{ maxWidth: 1440, margin: "0 auto", height: 96, padding: "0 clamp(20px, 5.4vw, 78px)", display: "flex", alignItems: "center" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#ffffff" }}>
          <Logo idPrefix="lg" />
          <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>PromptSuno</span>
        </Link>
      </header>
      <main className="legal-page">{children}</main>
      <Footer />
    </div>
  );
}
