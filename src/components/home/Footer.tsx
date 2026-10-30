// Site footer. Only links that go somewhere; socials return when the accounts exist.

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export function Footer() {
  return (
    <footer className="foot">
      <div className="foot-in">
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#ffffff" }}>
            <Logo idPrefix="lf" width={85} height={30} />
            <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>PromptSuno</span>
          </Link>
          <p className="foot-tag" style={{ margin: 0, fontSize: 13, lineHeight: 1.4, color: "rgba(255,255,255,0.6)", whiteSpace: "pre-line" }}>
            {"A more musical world\nbelongs to everyone."}
          </p>
        </div>
        <nav aria-label="Footer" className="foot-links">
          <Link href="/#build">Build</Link>
          <Link href="/learn">Learn</Link>
          <Link href="/#explore">Explore</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/#faq">FAQ</Link>
        </nav>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
          <p style={{ margin: "0 0 8px" }}>© 2026 PromptSuno. An independent tool, not affiliated with Suno.</p>
          <div className="legal">
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
