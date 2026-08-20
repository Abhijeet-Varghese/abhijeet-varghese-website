import { useRef, useState } from 'react';
import { ORANGE_HOTSPOTS } from '@/content/orange';

const B = '../../';
const PANO = `${B}assets/media/orange-business-executive-briefing-center-mumbai-panoramic`;

interface Hotspot {
  className: string;
  label: string;
  title: string;
  copy: string;
}

export function Hero() {
  const [active, setActive] = useState(ORANGE_HOTSPOTS[0]! as Hotspot);
  const heroRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const drag = useRef({ dragging: false, moved: false, startX: 0, startOffset: 0, x: 0 });

  const clampPanorama = (value: number) => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return 0;
    const minimum = Math.min(0, viewport.clientWidth - track.scrollWidth);
    return Math.min(0, Math.max(minimum, value));
  };
  const setPanorama = (value: number) => {
    drag.current.x = clampPanorama(value);
    heroRef.current?.style.setProperty('--pan-x', `${drag.current.x}px`);
  };

  return (
    <section className="hero tracked" id="top" data-index="01" data-title="Hero" ref={heroRef}>
      <div className="hero-media" aria-label="Interactive panoramic overview of the Experience Center" ref={viewportRef}>
        <div
          className="panorama-track"
          ref={trackRef}
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest('.panorama-hotspot')) return;
            drag.current.dragging = true;
            drag.current.moved = false;
            drag.current.startX = e.clientX;
            drag.current.startOffset = drag.current.x;
            (e.currentTarget as HTMLElement).classList.add('dragging');
            (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drag.current.dragging) return;
            const delta = e.clientX - drag.current.startX;
            if (Math.abs(delta) > 5) drag.current.moved = true;
            setPanorama(drag.current.startOffset + delta);
          }}
          onPointerUp={() => {
            drag.current.dragging = false;
            trackRef.current?.classList.remove('dragging');
            setTimeout(() => {
              drag.current.moved = false;
            }, 60);
          }}
        >
          <picture>
            <source
              type="image/webp"
              srcSet={`${PANO}-640.webp 640w, ${PANO}-1280.webp 1280w`}
              sizes="(max-width:760px) 1280px, 100vw"
            />
            <img
              src={`${PANO}.jpeg`}
              alt="Panoramic view of the Orange Business New Executive Briefing Center in Mumbai showing the registration area, interactive Rotoscope, video wall, VR station and visitor lounge."
              width="1280"
              height="422"
              fetchPriority="high"
              decoding="async"
            />
          </picture>
          <div className="hero-image-shade" />
          {ORANGE_HOTSPOTS.map((h) => (
            <button
              className={`panorama-hotspot ${h.className}${active.title === h.title ? ' active' : ''}`}
              aria-label={`Show ${h.title} experience zone`}
              aria-pressed={active.title === h.title}
              data-title={h.title}
              data-copy={h.copy}
              type="button"
              key={h.title}
              onClick={() => {
                if (drag.current.moved) return;
                setActive(h);
              }}
            >
              <i />
              <span>{h.label}</span>
            </button>
          ))}
        </div>
        <div className="panorama-output" aria-live="polite">
          <span>EXPERIENCE ZONE</span>
          <b>{active.title}</b>
          <p>{active.copy}</p>
        </div>
        <div className="hero-focus" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
      <div className="hero-grid-lines" aria-hidden="true" />
      <div className="container hero-content">
        <div className="client-logo reveal">
          <picture>
            <source type="image/webp" srcSet={`${B}assets/media/orange-business-logo.webp`} />
            <img src={`${B}assets/media/orange-business-logo.jpg`} alt="Orange Business" width="310" height="125" decoding="async" />
          </picture>
        </div>
        <div className="hero-primary">
          <h1 className="hero-project-title reveal">
            <span>EXECUTIVE</span>
            <span>BRIEFING CENTER</span>
          </h1>
          <p className="hero-deck reveal">
            A strategy-led physical-digital experience created for executive engagement, product storytelling, immersive
            demonstration and collaboration.
          </p>
          <div className="hero-meta-line reveal">
            <span>EXPERIENCE STRATEGY</span>
            <span>CREATIVE TECHNOLOGY</span>
            <span>CONTENT</span>
            <span>XR / VR</span>
            <span>DELIVERY</span>
          </div>
          <div className="hero-author reveal">
            <b>ABHIJEET VARGHESE</b>
            <span>Experience Strategy &amp; Creative Technology Lead</span>
          </div>
        </div>
      </div>
    </section>
  );
}
