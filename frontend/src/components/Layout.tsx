import type { ReactNode } from 'react';
import { SkipLink } from './chrome/SkipLink';
import { Progress } from './chrome/Progress';
import { Nav } from './chrome/Nav';
import { PageClose } from './chrome/PageClose';
import { Footer } from './chrome/Footer';

/** Shared document chrome: skip link, progress, nav, footer. */
export function Layout({
  activeHref,
  pageClose = false,
  children,
}: {
  activeHref?: string;
  pageClose?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <SkipLink />
      <Progress />
      <Nav activeHref={activeHref} />
      {pageClose && <PageClose />}
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
