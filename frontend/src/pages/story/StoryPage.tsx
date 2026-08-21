import { Layout } from '@/components/Layout';
import { useSiteChrome } from '@/lib/scroll';
import { useAboutPage } from '@/lib/about';
import { Prologue } from '@/sections/story/Prologue';
import { Identity } from '@/sections/story/Identity';
import { Evolution } from '@/sections/story/Evolution';
import { WhatNowCurious } from '@/sections/story/Closing';
import { Compass } from '@/sections/story/Compass';

const REEL_FRAMES = [
  'assets/about/about-motion.webp',
  'assets/about/about-experience.webp',
  'assets/about/about-environment.webp',
  'assets/about/about-people.webp',
  'assets/about/about-leadership.webp',
  'assets/about/about-credits.webp',
];

export function StoryPage() {
  useSiteChrome();
  useAboutPage();
  return (
    <Layout activeHref="/story" pageClose>
      <div className="about-atmo" id="aboutAtmo" aria-hidden="true" />
      <div className="about-reel" aria-hidden="true">
        <div className="about-reel__track" id="aboutReelTrack">
          {[...REEL_FRAMES, ...REEL_FRAMES].map((src, i) => (
            <span className="about-reel__frame" key={i} style={{ backgroundImage: `url('${src}')` }} />
          ))}
        </div>
      </div>
      <div className="about-grain" aria-hidden="true" />
      <Prologue />
      <Identity />
      <Evolution />
      <WhatNowCurious />
      <Compass />
    </Layout>
  );
}
