import { useRef } from 'react';
import { Layout } from '@/components/Layout';
import { useOrangePage } from '@/lib/orange';
import { ORANGE_SUMMARY, ORANGE_PROJECT_STRIP } from '@/content/orange';
import { Hero } from '@/sections/orange/Hero';
import { RoleChain, JourneyStrip, ArchitectureDiagram, RoomResponse, PurposeStrip } from '@/sections/orange/interactive';
import { ActionPanels } from '@/sections/orange/ActionPanels';

const B = '../../';

function SectionHead({
  index,
  label,
  inverse,
  children,
}: {
  index: string;
  label: string;
  inverse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <header className={`section-head${inverse ? ' inverse' : ''} reveal`}>
      <div>
        <span>{index}</span>
        <p>{label}</p>
      </div>
      <h2>{children}</h2>
    </header>
  );
}

/** Orange Business New Executive Briefing Center — long-form case study. */
export function OrangePage() {
  useOrangePage();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openSummary = () => {
    const d = dialogRef.current;
    if (!d) return;
    if (typeof d.showModal === 'function') d.showModal();
    else d.setAttribute('open', '');
    document.body.classList.add('dialog-open');
  };
  const closeSummary = () => {
    const d = dialogRef.current;
    if (!d) return;
    if (typeof d.close === 'function') d.close();
    else d.removeAttribute('open');
    document.body.classList.remove('dialog-open');
  };

  return (
    <>
      <Layout activeHref="case-studies.html" pageClose base={B}>
        <article>
          <Hero />

        <div className="project-strip" aria-label="Project at a glance">
          <div className="container">
            {ORANGE_PROJECT_STRIP.map(([num, label]) => (
              <div key={num}>
                <span>{num}</span>
                <b>{label}</b>
              </div>
            ))}
            <button className="summary-open" type="button" onClick={openSummary}>
              <span>30 SEC READ</span>
              <i>↗</i>
            </button>
          </div>
        </div>

        {/* 02 WHY */}
        <section className="why section tracked" id="why" data-index="02" data-title="Why">
          <div className="container">
            <SectionHead index="02" label="Why">
              From briefing room
              <br />
              to <em>business experience.</em>
            </SectionHead>
            <div className="why-layout no-media">
              <div className="why-copy reveal">
                <p className="lead">
                  Orange Business created its Mumbai Executive Briefing Center as a destination for customers and
                  prospects to explore its capabilities, solutions and future-facing technologies in an executive
                  environment.
                </p>
                <p>
                  The brief called for a futuristic, minimal environment integrating interactive media, VR, audio,
                  networking, automation, branding and collaboration.
                </p>
              </div>
            </div>
            <div className="why-cards reveal">
              <article>
                <span>BUSINESS CONTEXT</span>
                <p>Complex enterprise capabilities across connectivity, cloud, cybersecurity and digital experience.</p>
              </article>
              <article>
                <span>STRATEGIC CHALLENGE</span>
                <p>Move executive audiences beyond static presentation into active understanding.</p>
              </article>
              <article>
                <span>EXPERIENCE OPPORTUNITY</span>
                <p>Create a journey from arrival and discovery to immersion and conversation.</p>
              </article>
              <article>
                <span>DESIGN RESPONSE</span>
                <p>Architect space, content and technology as one connected system.</p>
              </article>
            </div>
            <blockquote className="why-statement reveal">
              <span>
                THE CHALLENGE WAS NOT
                <br />
                TO INSTALL TECHNOLOGY.
              </span>
              <b>
                IT WAS TO MAKE
                <br />
                TECHNOLOGY, CONTENT,
                <br />
                SPACE AND PEOPLE
                <br />
                BEHAVE AS ONE EXPERIENCE.
              </b>
            </blockquote>
          </div>
        </section>

        {/* 03 MY ROLE */}
        <section className="role section section-muted tracked" id="role" data-index="03" data-title="My Role">
          <div className="container">
            <SectionHead index="03" label="My Role">
              Strategy before <em>execution.</em>
            </SectionHead>
            <p className="role-statement reveal">
              I worked across the chain from strategy and consultancy through creative direction, content, technology
              coordination and months of on-site realization.
            </p>
            <RoleChain />
            <blockquote className="role-authorship reveal">
              I did not just design the output.
              <br />
              <b>I helped lead the system that produced it.</b>
            </blockquote>
          </div>
        </section>

        {/* 04 THE EXPERIENCE */}
        <section className="experience section section-dark tracked" id="experience" data-index="04" data-title="The Experience">
          <div className="container">
            <SectionHead index="04" label="The Experience" inverse>
              Design the journey before <em>designing the room.</em>
            </SectionHead>
            <JourneyStrip />
          </div>
        </section>

        {/* 05 THE EXPERIENCE SYSTEM */}
        <section className="system section tracked" id="system" data-index="05" data-title="The Experience System">
          <div className="container">
            <SectionHead index="05" label="The Experience System">
              The intellectual center of <em>the room.</em>
            </SectionHead>
            <div className="system-intro reveal">
              <p className="lead">
                Instead of treating every technology as an isolated installation, the experience was designed as a
                connected system.
              </p>
              <blockquote>The technology disappeared behind the experience.</blockquote>
            </div>
            <ArchitectureDiagram />
            <RoomResponse />
          </div>
        </section>

        {/* 07 REAL MEDIA · REAL INTERACTION */}
        <section className="action section section-muted tracked" id="action" data-index="07" data-title="Experience in Action">
          <div className="container">
            <SectionHead index="07" label="Real Media · Real Interaction">
              Real media.
              <br />
              <em>Real interaction.</em>
            </SectionHead>
            <ActionPanels />
          </div>
        </section>

        {/* 08 TECHNOLOGY WITH PURPOSE */}
        <section className="purpose section tracked" id="purpose" data-index="08" data-title="Technology with Purpose">
          <div className="container">
            <SectionHead index="08" label="Technology with Purpose">
              Every system
              <br />
              <em>had a reason.</em>
            </SectionHead>
            <PurposeStrip />
            <blockquote className="purpose-closing reveal">
              Technology was not the destination.
              <br />
              <b>It was the enabler.</b>
            </blockquote>
          </div>
        </section>

        {/* 09 FROM STRATEGY TO SITE */}
        <section className="delivery section section-dark tracked" id="delivery" data-index="09" data-title="Strategy to Site">
          <div className="container">
            <SectionHead index="09" label="From Strategy to Site" inverse>
              The design wasn’t finished when <em>the drawings were approved.</em>
            </SectionHead>
            <div className="delivery-copy compact reveal">
              <p className="lead">
                I remained involved at the Experience Center for months while vendors worked through fabrication,
                installation, technology integration, content deployment, testing and refinement.
              </p>
              <p>
                The project required coordination across Orange Business stakeholders, Mumbai and Gurgaon teams, creative
                teams, technology teams, vendors and fabricators.
              </p>
              <div className="chair-note">
                <span>CUSTOM PHYSICAL DESIGN</span>
                <b>The VR chair was designed specifically for Orange, with direct involvement during fabrication and refinement.</b>
              </div>
            </div>
            <div className="delivery-timeline reveal">
              <span>STRATEGY</span>
              <i>→</i>
              <span>DESIGN</span>
              <i>→</i>
              <span>BUILD</span>
              <i>→</i>
              <span>TEST</span>
              <i>→</i>
              <span>REFINE</span>
              <i>→</i>
              <span>DELIVER</span>
            </div>
            <div className="authorship-strip reveal">
              <div>
                <span>I LED</span>
                <p>Strategy · Creative Direction · Experience Direction</p>
              </div>
              <div>
                <span>I DESIGNED</span>
                <p>UI/UX · Content · Storyboards · Interaction · VR Chair</p>
              </div>
              <div>
                <span>I COORDINATED</span>
                <p>Stakeholders · Teams · Vendors · Fabrication</p>
              </div>
              <div>
                <span>I DELIVERED</span>
                <p>Testing · Refinement · On-site Implementation</p>
              </div>
            </div>
          </div>
        </section>

        {/* 10 OUTCOME */}
        <section className="outcome section tracked" id="outcome" data-index="10" data-title="Outcome">
          <div className="container">
            <SectionHead index="10" label="Outcome">
              A briefing center became a <em>business experience platform.</em>
            </SectionHead>
            <p className="outcome-lead reveal">
              The completed environment brought together brand, content, interactive media, VR, high-performance
              computing, enterprise collaboration, visitor personalization, environmental automation and dynamic content
              into one physical-digital experience.
            </p>
            <div className="outcome-grid">
              <article className="reveal">
                <span>FOR THE VISITOR</span>
                <h3>A personalized, responsive and immersive journey.</h3>
              </article>
              <article className="reveal">
                <span>FOR ORANGE BUSINESS</span>
                <h3>A flexible environment for engagement, storytelling, demonstration and collaboration.</h3>
              </article>
              <article className="reveal">
                <span>FOR THE PLATFORM</span>
                <h3>A digital layer capable of evolving after launch.</h3>
              </article>
            </div>
            <div className="global-note reveal">
              <div>
                <span>GLOBAL CONTEXT</span>
                <p>
                  The Mumbai EBC connects the local experience to Orange Business’s wider Executive Briefing Center
                  network.
                </p>
              </div>
              <div>
                <span>LAUNCH</span>
                <p>
                  The completed Orange Business New Executive Briefing Center in Mumbai was inaugurated by the Global CEO
                  of Orange Business.
                </p>
                <a
                  href="https://www.linkedin.com/posts/abhijeetvarghese_teamwork-designinnovation-newexecutivebriefingcenter-ugcPost-7269018331293052929-lbyY/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Public project announcement ↗
                </a>
              </div>
            </div>
            <p className="accuracy-note reveal">
              No ROI, visitor-volume, sales-uplift, conversion-rate or financial result is claimed without supporting
              evidence.
            </p>
          </div>
        </section>

        {/* FINAL CLOSING */}
        <section className="closing tracked" data-index="11" data-title="Closing">
          <div className="closing-media">
            <picture>
              <source
                type="image/webp"
                srcSet={`${B}assets/media/orange-business-executive-briefing-center-mumbai-panoramic-640.webp 640w, ${B}assets/media/orange-business-executive-briefing-center-mumbai-panoramic-1280.webp 1280w`}
                sizes="100vw"
              />
              <img
                src={`${B}assets/media/orange-business-executive-briefing-center-mumbai-panoramic.jpeg`}
                alt="Panoramic final view of the Orange Business New Executive Briefing Center in Mumbai"
                width="1280"
                height="422"
                loading="lazy"
                decoding="async"
              />
            </picture>
          </div>
          <div className="closing-overlay" />
          <div className="container closing-content">
            <p className="reveal">
              THE TECHNOLOGY
              <br />
              WAS NEVER
              <br />
              THE DESTINATION.
            </p>
            <h2 className="reveal">THE EXPERIENCE WAS.</h2>
            <div className="closing-credit reveal">
              <span>
                ORANGE BUSINESS
                <br />
                NEW EXECUTIVE BRIEFING CENTER
                <br />
                Mumbai, India
              </span>
              <span>
                Experience Strategy &amp; Creative Technology Lead
                <br />
                <b>Abhijeet Varghese</b>
              </span>
            </div>
          </div>
        </section>
        </article>
      </Layout>

      <dialog
        className="summary-dialog"
        aria-labelledby="summary-title"
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeSummary();
        }}
        onClose={() => document.body.classList.remove('dialog-open')}
      >
        <button className="dialog-close" type="button" aria-label="Close 30 second summary" onClick={closeSummary}>
          Close <span>×</span>
        </button>
        <span>30 SEC READ</span>
        <h2 id="summary-title">{ORANGE_SUMMARY.title}</h2>
        <dl>
          {ORANGE_SUMMARY.rows.map(([dt, dd]) => (
            <div key={dt}>
              <dt>{dt}</dt>
              <dd>{dd}</dd>
            </div>
          ))}
        </dl>
      </dialog>
    </>
  );
}
