import { useRef, useState } from 'react';
import {
  ORANGE_ROLE_CHAIN,
  ORANGE_JOURNEY,
  ORANGE_ARCH_NODES,
  ORANGE_PURPOSE,
  ORANGE_VIDEO_MODES,
  withBaseSrcset,
} from '@/content/orange';

const B = '../../';

/* ------------------------------------------------------------------ */
/* Responsibility chain (strategy → site)                              */
/* ------------------------------------------------------------------ */
export function RoleChain() {
  const [active, setActive] = useState(0);
  return (
    <>
      <div className="role-chain reveal" role="group" aria-label="Project responsibility chain">
        {ORANGE_ROLE_CHAIN.map((step, i) => (
          <button
            className={active === i ? 'active' : undefined}
            data-copy={step.copy}
            type="button"
            aria-pressed={active === i}
            key={step.num}
            onClick={() => setActive(i)}
          >
            <span>{step.num}</span>
            <b>{step.label}</b>
            {i < ORANGE_ROLE_CHAIN.length - 1 && <i>→</i>}
          </button>
        ))}
      </div>
      <div className="role-chain-output reveal" aria-live="polite">
        <span>ACTIVE RESPONSIBILITY</span>
        <p>{ORANGE_ROLE_CHAIN[active]!.copy}</p>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Visitor journey (7 stages, evidence-led image transitions)          */
/* ------------------------------------------------------------------ */
export function JourneyStrip() {
  const [active, setActive] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const timerRef = useRef<number>(0);

  const select = (i: number) => {
    setActive(i);
    const step = ORANGE_JOURNEY[i]!;
    const img = imgRef.current;
    const stage = stageRef.current;
    if (img && stage && img.getAttribute('src') !== B + step.image) {
      stage.classList.add('switching');
      clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        img.onload = () => stage.classList.remove('switching');
        img.srcset = withBaseSrcset(B, step.srcset);
        img.sizes = '(max-width:760px) 100vw, 90vw';
        img.src = B + step.image;
        img.alt = `${step.title} stage of the Orange Business visitor experience`;
        if (img.complete) stage.classList.remove('switching');
      }, 150);
    }
  };

  return (
    <>
      <div className="journey-strip reveal" role="group" aria-label="Visitor experience journey">
        {ORANGE_JOURNEY.map((step, i) => (
          <button
            className={active === i ? 'active' : undefined}
            data-title={step.title}
            data-copy={step.copy}
            data-image={B + step.image}
            data-image-srcset={withBaseSrcset(B, step.srcset)}
            type="button"
            aria-pressed={active === i}
            key={step.num}
            onClick={() => select(i)}
          >
            <span>{step.num}</span>
            <b>{step.label}</b>
          </button>
        ))}
      </div>
      <div className="journey-stage reveal" ref={stageRef}>
        <img
          id="journey-media-image"
          src={B + ORANGE_JOURNEY[0]!.image}
          srcSet={withBaseSrcset(B, ORANGE_JOURNEY[0]!.srcset)}
          sizes="(max-width:760px) 100vw, 90vw"
          alt="Orange Business visitor registration touchscreen at the Experience Center entrance"
          width="848"
          height="478"
          loading="lazy"
          decoding="async"
          ref={imgRef}
        />
        <div className="journey-stage-overlay" />
        <div className="journey-stage-copy" aria-live="polite">
          <span>EXPERIENCE STAGE · {String(active + 1).padStart(2, '0')} / 07</span>
          <h3>{ORANGE_JOURNEY[active]!.title}</h3>
          <p>{ORANGE_JOURNEY[active]!.copy}</p>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* System architecture diagram + room response                         */
/* ------------------------------------------------------------------ */
export function ArchitectureDiagram() {
  const [active, setActive] = useState(0);
  const node = ORANGE_ARCH_NODES[active]!;
  return (
    <div className="architecture-diagram reveal">
      <div className="architecture-spine">
        <span>VISITOR</span>
        <i>↓</i>
        <span>REGISTRATION</span>
        <i>↓</i>
        <span>IDENTITY</span>
        <i>↓</i>
        <strong>EXPERIENCE LAYER</strong>
      </div>
      <div className="architecture-branches" role="group" aria-label="Experience system nodes">
        {ORANGE_ARCH_NODES.map((n, i) => (
          <button
            className={active === i ? 'active' : undefined}
            data-title={n.title}
            data-what={n.what}
            data-experience={n.experience}
            data-business={n.business}
            type="button"
            aria-pressed={active === i}
            key={n.title}
            onClick={() => setActive(i)}
          >
            {n.title.toUpperCase()}
          </button>
        ))}
      </div>
      <i className="architecture-down">↓</i>
      <div className="architecture-connected">CONNECTED EXPERIENCE</div>
      <i className="architecture-down">↕</i>
      <div className="architecture-backend">DYNAMIC BACKEND</div>
      <div className="architecture-output" aria-live="polite">
        <div>
          <span>ACTIVE SYSTEM</span>
          <b>{node.title}</b>
        </div>
        <div>
          <span>WHAT IT DOES</span>
          <p>{node.what}</p>
        </div>
        <div>
          <span>EXPERIENCE VALUE</span>
          <p>{node.experience}</p>
        </div>
        <div>
          <span>BUSINESS VALUE</span>
          <p>{node.business}</p>
        </div>
      </div>
    </div>
  );
}

export function RoomResponse() {
  const [active, setActive] = useState(false);
  const visitor = active ? 'DETECTED' : 'NO VISITOR';
  const curtains = active ? 'CLOSED' : 'OPEN';
  const lights = active ? 'ON' : 'OFF';
  const mode = active ? 'ACTIVE' : 'STANDBY';
  return (
    <div className="room-response reveal" data-state={active ? 'active' : 'standby'}>
      <div className="room-response-media">
        <img
          src={`${B}assets/media/orange-business-executive-briefing-center-mumbai-panoramic.jpeg`}
          alt="Panoramic Orange Business Executive Briefing Center used to demonstrate environmental automation"
          width="1280"
          height="422"
          loading="lazy"
          decoding="async"
        />
        <div className="response-curtain left" />
        <div className="response-curtain right" />
        <div className="response-light top" />
        <div className="response-light bottom" />
      </div>
      <div className="room-response-control">
        <span>06 · THE ROOM KNOWS YOU’RE THERE.</span>
        <h3>Environmental response, made visible.</h3>
        <div className="response-readout">
          <p>
            VISITOR <b className="response-visitor">{visitor}</b>
          </p>
          <p>
            CURTAINS <b className="response-curtains">{curtains}</b>
          </p>
          <p>
            LIGHTS <b className="response-lights">{lights}</b>
          </p>
          <p>
            EXPERIENCE <b className="response-mode">{mode}</b>
          </p>
        </div>
        <button
          className="response-toggle"
          type="button"
          aria-pressed={active}
          aria-label={active ? 'Set room to standby' : 'Activate room response'}
          onClick={() => setActive((v) => !v)}
        >
          {active ? 'LEAVE ROOM ' : 'ENTER ROOM '}
          <i />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Technology-with-purpose strip                                       */
/* ------------------------------------------------------------------ */
export function PurposeStrip() {
  const [active, setActive] = useState(0);
  const p = ORANGE_PURPOSE[active]!;
  return (
    <>
      <div className="purpose-strip reveal" role="group" aria-label="Technology value">
        {ORANGE_PURPOSE.map((item, i) => (
          <button
            className={active === i ? 'active' : undefined}
            data-experience={item.experience}
            data-business={item.business}
            type="button"
            aria-pressed={active === i}
            key={item.label}
            onClick={() => setActive(i)}
          >
            <span>{item.label}</span>
            <b>{item.value}</b>
          </button>
        ))}
      </div>
      <div className="purpose-output reveal" aria-live="polite">
        <div>
          <span>EXPERIENCE VALUE</span>
          <p>{p.experience}</p>
        </div>
        <div>
          <span>BUSINESS VALUE</span>
          <p>{p.business}</p>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Video wall modes (buttons live in the wall-video panel; copy lives  */
/* in the sibling wide-media-copy — shared state lifted here)          */
/* ------------------------------------------------------------------ */
export function VideoModeButtons({ active, onChange }: { active: number; onChange: (i: number) => void }) {
  return (
    <div className="video-modes" role="group" aria-label="Video wall modes">
      {ORANGE_VIDEO_MODES.map((m, i) => (
        <button
          className={active === i ? 'active' : undefined}
          data-copy={m.copy}
          type="button"
          aria-pressed={active === i}
          key={m.label}
          onClick={() => onChange(i)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
