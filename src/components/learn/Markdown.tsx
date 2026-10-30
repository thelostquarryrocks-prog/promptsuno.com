// Renders a Learn module's Markdown tokens with PromptSuno's own components.
// Server component: the text ships as HTML; only the small widgets hydrate.
//
// Conventions in content/learn/*.md:
//   `inline code`          -> a copyable tag chip
//   ```style / ```lyrics   -> a Suno field with Copy (style also gets "Open in builder")
//   ```widget:syllables    -> live syllable counter (block text = starting lines)
//   ```widget:phonetic     -> spelling converter (block text = starting lines)
//   ```widget:library      -> the searchable style library
//   > quote                -> a callout

import type { ReactNode } from "react";
import type { Token, Tokens } from "marked";
import { slugify } from "@/lib/learn/content";
import type { LibraryStyle } from "@/lib/learn/library";
import { CopyChip, PromptBlock } from "./Interactive";
import { PhoneticConverter } from "./PhoneticConverter";
import { StyleLibrary } from "./StyleLibrary";
import { SyllableCounter } from "./SyllableCounter";

export function Markdown({ tokens, library }: { tokens: Token[]; library?: LibraryStyle[] }) {
  return <>{tokens.map((t, i) => block(t, i, library))}</>;
}

function block(t: Token, key: number, library?: LibraryStyle[]): ReactNode {
  switch (t.type) {
    case "space":
    case "html":
    case "def":
      return null;
    case "heading": {
      const h = t as Tokens.Heading;
      const id = slugify(h.text);
      const content = inline(h.tokens);
      if (h.depth <= 2) return <h2 key={key} id={id} className="lm-h2">{content}</h2>;
      return <h3 key={key} id={id} className="lm-h3">{content}</h3>;
    }
    case "paragraph":
      return <p key={key} className="lm-p">{inline((t as Tokens.Paragraph).tokens)}</p>;
    case "list": {
      const l = t as Tokens.List;
      const items = l.items.map((it, j) => <li key={j}>{it.tokens.map((c, k) => listChild(c, k, library))}</li>);
      return l.ordered ? <ol key={key} className="lm-list" start={typeof l.start === "number" ? l.start : undefined}>{items}</ol> : <ul key={key} className="lm-list">{items}</ul>;
    }
    case "table": {
      const tb = t as Tokens.Table;
      return (
        <div key={key} className="lm-table-wrap">
          <table className="lm-table">
            <thead>
              <tr>{tb.header.map((c, j) => <th key={j} scope="col">{inline(c.tokens)}</th>)}</tr>
            </thead>
            <tbody>
              {tb.rows.map((r, j) => (
                <tr key={j}>{r.map((c, k) => <td key={k}>{inline(c.tokens)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case "blockquote":
      return <aside key={key} className="lm-callout">{(t as Tokens.Blockquote).tokens.map((c, j) => block(c, j, library))}</aside>;
    case "code": {
      const c = t as Tokens.Code;
      const lang = c.lang ?? "";
      if (lang === "style") return <PromptBlock key={key} kind="style" text={c.text} />;
      if (lang === "lyrics") return <PromptBlock key={key} kind="lyrics" text={c.text} />;
      if (lang === "widget:syllables") return <SyllableCounter key={key} initial={c.text} />;
      if (lang === "widget:phonetic") return <PhoneticConverter key={key} initial={c.text} />;
      if (lang === "widget:library") return library ? <StyleLibrary key={key} styles={library} /> : null;
      return <pre key={key} className="out-text">{c.text}</pre>;
    }
    case "hr":
      return <hr key={key} className="lm-hr" />;
    default:
      return "tokens" in t && Array.isArray(t.tokens) ? <p key={key} className="lm-p">{inline(t.tokens as Token[])}</p> : null;
  }
}

/** List items hold "text" tokens for tight lists and full blocks for loose ones. */
function listChild(t: Token, key: number, library?: LibraryStyle[]): ReactNode {
  if (t.type === "text") {
    const tt = t as Tokens.Text;
    return <span key={key}>{tt.tokens ? inline(tt.tokens) : tt.text}</span>;
  }
  return block(t, key, library);
}

function inline(tokens: Token[] | undefined): ReactNode {
  if (!tokens) return null;
  return tokens.map((t, i) => {
    switch (t.type) {
      case "text": {
        const tt = t as Tokens.Text;
        return tt.tokens ? <span key={i}>{inline(tt.tokens)}</span> : decode(tt.text);
      }
      case "escape":
        return decode((t as Tokens.Escape).text);
      case "strong":
        return <strong key={i}>{inline((t as Tokens.Strong).tokens)}</strong>;
      case "em":
        return <em key={i}>{inline((t as Tokens.Em).tokens)}</em>;
      case "del":
        return <del key={i}>{inline((t as Tokens.Del).tokens)}</del>;
      case "codespan":
        return <CopyChip key={i} text={decode((t as Tokens.Codespan).text)} />;
      case "br":
        return <br key={i} />;
      case "link": {
        const l = t as Tokens.Link;
        const external = /^https?:/.test(l.href);
        return (
          <a key={i} href={l.href} className="lm-link" {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {inline(l.tokens)}
          </a>
        );
      }
      default:
        return "text" in t ? decode(String(t.text)) : null;
    }
  });
}

/** marked escapes a few characters in inline text; React escapes on its own. */
function decode(s: string): string {
  return s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
