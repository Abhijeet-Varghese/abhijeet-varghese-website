import { useEffect } from 'react';
import type { TrackPayload } from '../types';

function deviceKind(): 'mobile' | 'tablet' | 'desktop' {
  if (/Mobi|Android/i.test(navigator.userAgent)) return 'mobile';
  if (/iPad|Tablet/i.test(navigator.userAgent)) return 'tablet';
  return 'desktop';
}

/** First-party analytics ported from the existing homepage inline tracker. */
export function useAnalytics(): void {
  useEffect(() => {
    let visitor = '';
    try {
      visitor = localStorage.getItem('av_visitor') ?? '';
    } catch {
      // Private browsing/storage policy must never affect the homepage.
    }

    const params = new URLSearchParams(location.search);
    const base: TrackPayload = {
      event_type: 'pageview',
      path: location.pathname,
      referrer: document.referrer || '',
      visitor_id: visitor,
      device: deviceKind(),
    };
    (['utm_source', 'utm_medium', 'utm_campaign'] as const).forEach((key) => {
      const value = params.get(key);
      if (value) base[key] = value;
    });

    const track = (extra: Partial<TrackPayload>) => {
      const payload = { ...base, ...extra };
      void fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => undefined);
    };

    void fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(base),
    })
      .then((response) => response.json() as Promise<unknown>)
      .then((payload) => {
        const record = payload as { data?: { visitor_id?: unknown } };
        const id = record.data?.visitor_id;
        if (!visitor && typeof id === 'string' && id) {
          try {
            localStorage.setItem('av_visitor', id);
          } catch {
            // Storage remains optional.
          }
        }
      })
      .catch(() => undefined);

    // Preserve the legacy content-view classification for the migrated routes
    // (and retain its existing coverage for untouched static paths).
    const contentPath = location.pathname || '';
    let contentMatch: RegExpMatchArray | null = null;
    if ((contentMatch = contentPath.match(/\/essay-[^/]+\.html/))) {
      track({ event_type: 'essay_view', path: contentPath, content: contentMatch[0] });
    } else if ((contentMatch = contentPath.match(/\/journal-[^/]+\.html/))) {
      track({ event_type: 'journal_view', path: contentPath, content: contentMatch[0] });
    } else if (
      (contentMatch = contentPath.match(/\/case-studies\/[^/]+\/?/))
      || (contentMatch = contentPath.match(/\/case-studies\//))
      || (contentMatch = contentPath.match(/\/case-study-[^/]+\.html/))
      || (contentMatch = contentPath.match(/\/experience-design\/[^/]+\/?/))
    ) {
      track({ event_type: 'case_study_view', path: contentPath, content: contentMatch[0] });
    } else if (contentPath.includes('experience')) {
      track({ event_type: 'project_view', path: contentPath });
    }

    const mediaListeners = new Map<HTMLVideoElement, EventListener>();
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const action = target?.closest<HTMLElement>('a, button');
      if (action) {
        const href = action.getAttribute('href') ?? '';
        const text = action.textContent ?? '';
        // Keep the original tracker’s mutually exclusive download path: a
        // résumé/download click reports `download`, not an invented second
        // CTA event merely because the link also has `.btn` styling.
        const download = href.includes('.pdf') || action.hasAttribute('download');
        if (download) {
          track({ event_type: 'download', path: location.pathname, content: href });
        } else {
          if (action.closest('.hero, .cta, .btn, .page-hero') || /book|calendly|schedule|contact/i.test(`${href} ${text}`)) {
            track({ event_type: 'cta_click', path: location.pathname, content: href });
          }
          if (/^(https?:)?\/\//.test(href) && !href.startsWith(location.origin)) {
            track({ event_type: 'external_link', path: location.pathname, content: href });
          }
        }
      }

      if (target?.closest('[data-gallery], .gallery, .media-grid')) {
        track({ event_type: 'gallery_open', path: location.pathname });
      }
      const video = target?.closest<HTMLVideoElement>('video');
      if (video && !mediaListeners.has(video)) {
        const onPlay: EventListener = () => {
          track({ event_type: 'video_play', path: location.pathname, content: video.currentSrc || '' });
          video.removeEventListener('play', onPlay);
          mediaListeners.delete(video);
        };
        mediaListeners.set(video, onPlay);
        video.addEventListener('play', onPlay);
      }
    };

    let scrollTimer = 0;
    const sent = new Set<number>();
    const onScroll = () => {
      if (scrollTimer) return;
      scrollTimer = window.setTimeout(() => {
        scrollTimer = 0;
        const root = document.documentElement;
        const percent = Math.round(((root.scrollTop + window.innerHeight) / root.scrollHeight) * 100);
        [25, 50, 75, 100].forEach((threshold) => {
          if (percent >= threshold && !sent.has(threshold)) {
            sent.add(threshold);
            track({ event_type: 'scroll_depth', path: location.pathname, content: String(threshold) });
          }
        });
      }, 400);
    };

    const form = document.getElementById('contactForm') ?? document.getElementById('bookForm');
    let contactStarted = false;
    const onContactFocus = () => {
      if (contactStarted) return;
      contactStarted = true;
      track({ event_type: 'contact_start', path: location.pathname });
    };

    document.addEventListener('click', onClick);
    window.addEventListener('scroll', onScroll, { passive: true });
    form?.addEventListener('focusin', onContactFocus, true);

    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('scroll', onScroll);
      form?.removeEventListener('focusin', onContactFocus, true);
      if (scrollTimer) window.clearTimeout(scrollTimer);
      mediaListeners.forEach((listener, video) => video.removeEventListener('play', listener));
    };
  }, []);
}
