import { useState } from 'react';
import { useContent } from '@/content/provider';
import { VideoModeButtons } from './interactive';

const B = '../../';

type PanelKey = 'rotoscope' | 'wall' | 'vr';

const TABS: { key: PanelKey; label: string }[] = [
  { key: 'rotoscope', label: 'ROTOSCOPE' },
  { key: 'wall', label: 'VIDEO WALL' },
  { key: 'vr', label: 'VR' },
];

/** Experience-proof tabs (rotoscope / video wall / VR) with keyboard nav. */
export function ActionPanels() {
  const { content } = useContent();
  const { ORANGE_VIDEO_MODES, ORANGE_WALL_DEFAULT_COPY } = content.orange;
  const [panel, setPanel] = useState<PanelKey>('rotoscope');
  const [wallMode, setWallMode] = useState(0);
  const [wallModeSelected, setWallModeSelected] = useState(false);

  const select = (i: number) => setPanel(TABS[i]!.key);

  return (
    <>
      <div
        className="action-switcher reveal"
        role="tablist"
        aria-label="Experience proof"
        onKeyDown={(e) => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
          e.preventDefault();
          const index = TABS.findIndex((t) => t.key === panel);
          let next = index;
          if (e.key === 'ArrowRight') next = (index + 1) % TABS.length;
          if (e.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
          if (e.key === 'Home') next = 0;
          if (e.key === 'End') next = TABS.length - 1;
          select(next);
          document.getElementById(`proof-tab-${TABS[next]!.key}`)?.focus();
        }}
      >
        {TABS.map((tab, i) => (
          <button
            className={panel === tab.key ? 'active' : undefined}
            id={`proof-tab-${tab.key}`}
            role="tab"
            aria-selected={panel === tab.key}
            aria-controls={`proof-panel-${tab.key}`}
            data-panel={tab.key}
            type="button"
            tabIndex={panel === tab.key ? 0 : -1}
            key={tab.key}
            onClick={() => select(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="action-panels">
        <article
          className={`action-panel${panel === 'rotoscope' ? ' active' : ''}`}
          id="proof-panel-rotoscope"
          role="tabpanel"
          aria-labelledby="proof-tab-rotoscope"
          data-panel="rotoscope"
          hidden={panel !== 'rotoscope'}
        >
          <div className="media-intro">
            <figure className="proof-image">
              <picture>
                <source
                  type="image/webp"
                  srcSet={`${B}assets/media/orange-business-rotoscope-experience-480.webp 480w, ${B}assets/media/orange-business-rotoscope-experience-848.webp 848w`}
                  sizes="(max-width:760px) 100vw, 50vw"
                />
                <img
                  src={`${B}assets/media/orange-business-rotoscope-experience.jpg`}
                  alt="Interactive Rotoscope display at the Orange Business New Executive Briefing Center."
                  width="848"
                  height="478"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            </figure>
            <div className="media-copy">
              <span>MOVE THE INTERFACE.</span>
              <h3>Physical movement becomes digital navigation.</h3>
              <p>
                The Rotoscope turns physical movement into digital navigation. Sliding the display changes the content
                state, allowing visitors to move through video, presentations and interactive media.
              </p>
            </div>
          </div>
          <div className="video-proof">
            <video
              className="evidence-video"
              muted
              loop
              playsInline
              preload="none"
              poster={`${B}assets/media/orange-business-rotoscope-experience-848.webp`}
              aria-label="Physical movement of the Orange Business Rotoscope changing digital content"
            />
            <div className="video-overlay">
              <span>PHYSICAL MOVEMENT</span>
              <i>→</i>
              <span>SCREEN MOVEMENT</span>
              <i>→</i>
              <span>DIGITAL CHANGE</span>
            </div>
          </div>
        </article>

        <article
          className={`action-panel${panel === 'wall' ? ' active' : ''}`}
          id="proof-panel-wall"
          role="tabpanel"
          aria-labelledby="proof-tab-wall"
          data-panel="wall"
          hidden={panel !== 'wall'}
        >
          <div className="video-proof wall-video">
            <video
              className="evidence-video"
              muted
              loop
              playsInline
              preload="none"
              poster={`${B}assets/media/orange-business-interactive-video-wall-848.webp`}
              aria-label="Interactive video wall in use at the Orange Business New Executive Briefing Center"
            />
            <VideoModeButtons
              active={wallMode}
              onChange={(i) => {
                setWallMode(i);
                setWallModeSelected(true);
              }}
            />
          </div>
          <div className="wide-media-copy">
            <span>ONE WALL. MULTIPLE MODES.</span>
            <h3>A multifunctional executive interface.</h3>
            <p>{wallModeSelected ? ORANGE_VIDEO_MODES[wallMode]!.copy : ORANGE_WALL_DEFAULT_COPY}</p>
            <small>High-performance computing · Camera · Professional audio · Conferencing capability</small>
          </div>
        </article>

        <article
          className={`action-panel${panel === 'vr' ? ' active' : ''}`}
          id="proof-panel-vr"
          role="tabpanel"
          aria-labelledby="proof-tab-vr"
          data-panel="vr"
          hidden={panel !== 'vr'}
        >
          <div className="media-intro">
            <figure className="proof-image vr-proof">
              <picture>
                <source
                  type="image/webp"
                  srcSet={`${B}assets/media/orange-business-vr-experience-480.webp 480w, ${B}assets/media/orange-business-vr-experience-848.webp 848w`}
                  sizes="(max-width:760px) 100vw, 50vw"
                />
                <img
                  src={`${B}assets/media/orange-business-vr-experience.jpg`}
                  alt="Custom Orange Business VR experience chair inside the New Executive Briefing Center in Mumbai."
                  width="848"
                  height="478"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
              <figcaption>
                <span>CUSTOM PHYSICAL INTERFACE</span>
                The VR chair was custom-designed specifically for Orange. I worked directly with the fabricator during
                its physical realization and refinement.
              </figcaption>
            </figure>
            <div className="media-copy">
              <span>ENTER THE PRODUCT.</span>
              <h3>Product knowledge became immersive.</h3>
              <p>Multiple VR modules were developed for product knowledge, immersive storytelling and sales enablement.</p>
              <blockquote>
                From “Let me explain the product” to “Let me show you the experience.”
              </blockquote>
            </div>
          </div>
          <div className="video-proof">
            <video
              className="evidence-video"
              muted
              loop
              playsInline
              preload="none"
              poster={`${B}assets/media/orange-business-vr-experience-848.webp`}
              aria-label="Visitor using the Orange Business immersive VR experience"
            />
            <div className="video-overlay">
              <span>IMMERSION</span>
              <i>·</i>
              <span>PRODUCT KNOWLEDGE</span>
              <i>·</i>
              <span>SALES ENABLEMENT</span>
            </div>
          </div>
        </article>
      </div>
    </>
  );
}
