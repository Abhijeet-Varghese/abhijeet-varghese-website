import type { ReactNode } from 'react';
import { SkipLink } from './chrome/SkipLink';
import { Progress } from './chrome/Progress';
import { Nav } from './chrome/Nav';
import { Footer } from './chrome/Footer';

/** Shared document chrome: skip link, progress, nav, footer. */
export function Layout({ activeHref, children }: { activeHref?: string; children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <Progress />
      <Nav activeHref={activeHref} />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
