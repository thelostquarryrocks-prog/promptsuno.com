import { getStyle } from "@/lib/catalog";
import { pickerGroups, type PickerGroupId } from "@/lib/catalog/picker";
import type { StyleCategory } from "@/lib/catalog/types";
import { parseIdea } from "@/lib/idea";
import { authEnabled, DAILY_FREE_PROMPTS } from "@/lib/site";
import { Explore } from "@/components/home/Explore";
import { Footer } from "@/components/home/Footer";
import { Hero } from "@/components/home/Hero";
import { PricingFaq, type Faq } from "@/components/home/PricingFaq";
import { WhatIs, type DemoTag } from "@/components/home/WhatIs";

const DEMO_IDEA = "late-night drive, a bit 80s, dreamy synths, female vocals";

const GROUP_OF: Partial<Record<StyleCategory, PickerGroupId>> = {
  genre: "genre",
  era: "genre",
  mood: "mood",
  energy: "mood",
  instrument: "instruments",
  rhythm: "instruments",
  vocal: "vocals",
  production: "production",
  texture: "production",
  structure: "production",
};

function demoTags(): DemoTag[] {
  return parseIdea(DEMO_IDEA)
    .tags.map((name): DemoTag | null => {
      const style = getStyle(name);
      const group = style ? GROUP_OF[style.category] : undefined;
      return style && group ? { label: style.name, group } : null;
    })
    .filter((t): t is DemoTag => t !== null)
    .slice(0, 6);
}

function faqs(signInLive: boolean): Faq[] {
  return [
    {
      q: "What is PromptSuno?",
      a: "A free tool that turns a description of the sound you want into a prompt for Suno: the style text, what to leave out, and a lyrics structure to write into. You paste it into Suno yourself.",
    },
    {
      q: "Is PromptSuno part of Suno?",
      a: "No. PromptSuno is an independent tool and isn't affiliated with Suno. It writes prompts; Suno makes the music.",
    },
    {
      q: "How many prompts can I make?",
      a: signInLive
        ? `You can try one without an account. Sign in free with Google for up to ${DAILY_FREE_PROMPTS} prompts a day.`
        : "You can try one without an account today. Free accounts with daily prompts are coming in the next few days.",
    },
    {
      q: "Why doesn't my prompt name the artist I mentioned?",
      a: "Suno rejects artist names in prompts. PromptSuno describes the sound instead (the era, instruments, vocals and production) so Suno can get close without the name.",
    },
    {
      q: "Who owns the music I make?",
      a: "Ownership and commercial rights to the audio come from Suno's terms and your Suno plan, not from PromptSuno. Check Suno's current terms before you release anything. The prompts PromptSuno writes for you are yours to use however you like.",
    },
    {
      q: "What will Premium include?",
      a: "More prompts each day, a stronger AI model for the writing, the full style library, and early access to new tools like the lyric writer. It isn't available yet.",
    },
  ];
}

export default function Home() {
  const groups = pickerGroups();
  const signInLive = authEnabled();
  return (
    <div className="ps" style={{ position: "relative", background: "#050304", color: "#ffffff", WebkitFontSmoothing: "antialiased" }}>
      <Hero groups={groups} authEnabled={signInLive} />
      <WhatIs demoIdea={DEMO_IDEA} demoTags={demoTags()} />
      <Explore />
      <PricingFaq faqs={faqs(signInLive)} dailyFree={DAILY_FREE_PROMPTS} authEnabled={signInLive} />
      <Footer />
    </div>
  );
}
