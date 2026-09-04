import { Layout } from '@/components/Layout';
import { useSiteChrome } from '@/lib/scroll';
import { Arrow } from '@/components/Arrow';
import './bpcl-case.css';

const IMG = '/assets/case-bpcl.webp';

export function BPCLCase() {
  useSiteChrome();

  return (
    <Layout activeHref="/case-studies" pageClose>
      <main className="bpcl-case">
        <header className="bpcl-hero">
          <div className="bpcl-hero__copy">
            <p className="bpcl-kicker">BPCL / PALAKKAD INSTALLATION</p>
            <h1>Making the<br />Future <span>Visible.</span></h1>
            <p className="bpcl-hero__lede">
              Leading the visualization of BPCL's Palakkad Installation from technical site information to a highly detailed physical miniature and a detailed 3D architectural walkthrough.
            </p>
            <div className="bpcl-meta">
              <div><small>Client</small><strong>Bharat Petroleum Corporation Limited</strong></div>
              <div><small>Role</small><strong>Project Director / Creative Lead</strong></div>
              <div><small>Scope</small><strong>Concept → Production → Delivery</strong></div>
              <div><small>Mediums</small><strong>Physical + Digital</strong></div>
            </div>
          </div>
          <div className="bpcl-hero__media">
            <img src={IMG} alt="BPCL Palakkad installation visualization" width="1536" height="864" fetchPriority="high" />
          </div>
        </header>

        <section className="bpcl-section bpcl-intro">
          <div className="bpcl-section__label">01 / The Challenge</div>
          <div>
            <h2>How do you show a facility before it exists?</h2>
            <p>BPCL's Palakkad installation began as site information and a 2D installation layout. The challenge was to turn technical information into something stakeholders could understand as a future place.</p>
            <p>I led the project from concept through delivery, coordinating with BPCL stakeholders and directing two distinct visualization workstreams.</p>
          </div>
        </section>

        <section className="bpcl-section bpcl-dark">
          <div className="bpcl-section__label">02 / The Starting Point</div>
          <div>
            <h2>From technical drawing<br />to visual world.</h2>
            <p className="bpcl-muted">The actual BPCL installation layout became the technical foundation for every visual decision — scale, circulation, infrastructure and relationships.</p>
          </div>
          <div className="bpcl-plan">
            <div className="bpcl-plan__grid" aria-hidden="true" />
            <div className="bpcl-plan__lines" aria-hidden="true" />
            <div className="bpcl-plan__title">BPCL PALAKKAD / INSTALLATION LAYOUT</div>
            <div className="bpcl-plan__legend">TANK FARM · PROCESS AREA · BUILDINGS · PARKING · ROAD NETWORK · GREEN AREA · WATER BODY · UTILITY AREA</div>
          </div>
        </section>

        <section className="bpcl-section bpcl-work">
          <div className="bpcl-section__label">03 / Workstream One</div>
          <div className="bpcl-work__grid">
            <div>
              <h2>The 8 × 10 ft<br />physical miniature.</h2>
              <p>A highly detailed physical representation of the planned installation, developed so stakeholders could stand around the site, inspect its relationships and understand the whole facility.</p>
              <p>Industrial infrastructure, buildings, roads, landscaping, water bodies, fencing, street elements and fine site details were translated into one large-scale physical experience.</p>
            </div>
            <figure><img src={IMG} alt="Detailed BPCL Palakkad miniature visualization" loading="lazy" width="1536" height="864" /><figcaption>Physical experience — the installation translated into a single spatial interface.</figcaption></figure>
          </div>
        </section>

        <section className="bpcl-bleed">
          <img src={IMG} alt="BPCL Palakkad installation detail" loading="lazy" width="1536" height="864" />
        </section>

        <section className="bpcl-section bpcl-night">
          <div className="bpcl-section__label">04 / Day + Night</div>
          <div className="bpcl-night__copy">
            <h2>Then we gave<br />the future a night mode.</h2>
            <p>Integrated lighting brings the miniature to life after dark, creating a second reading of the same installation and making circulation, buildings and site relationships legible in a different condition.</p>
          </div>
          <div className="bpcl-night__visual"><div className="bpcl-lights" aria-hidden="true" />{Array.from({ length: 18 }).map((_, i) => <i key={i} style={{ left: `${8 + ((i * 17) % 84)}%`, top: `${18 + ((i * 29) % 65)}%` }} />)}</div>
        </section>

        <section className="bpcl-section bpcl-digital">
          <div className="bpcl-section__label">05 / Workstream Two</div>
          <div>
            <h2>The plant,<br />experienced in motion.</h2>
            <p>A detailed 3D architectural walkthrough allows stakeholders to move through the installation and experience scale, space, circulation and relationships — before the physical environment exists.</p>
          </div>
          <div className="bpcl-screen"><img src={IMG} alt="BPCL 3D walkthrough visualization" loading="lazy" width="1536" height="864" /><div className="bpcl-play" aria-hidden="true">▶</div><div className="bpcl-progress"><span /></div></div>
        </section>

        <section className="bpcl-section bpcl-system">
          <div className="bpcl-section__label">06 / Two Experiences</div>
          <h2>See the installation.<br /><em>Experience</em> the installation.</h2>
          <div className="bpcl-system__steps">
            <div><span>01</span><b>PLAN</b><small>2D INSTALLATION LAYOUT</small></div>
            <div><span>02</span><b>PLACE</b><small>PHYSICAL MINIATURE</small></div>
            <div><span>03</span><b>EXPERIENCE</b><small>3D WALKTHROUGH</small></div>
          </div>
          <p className="bpcl-statement">One site. Three levels of understanding.<br />Aligned. Connected. Easy to see.<br />Easy to discuss. Easy to decide.</p>
        </section>

        <section className="bpcl-section bpcl-leadership">
          <div className="bpcl-section__label">07 / Project Direction</div>
          <div className="bpcl-leadership__grid">
            <h2>From concept<br />to delivery.</h2>
            <div>
              <p>I directed the visualization journey across concept, production and delivery — translating technical information into a coherent physical and digital experience.</p>
              <div className="bpcl-roles"><span>STRATEGY</span><span>CREATIVE DIRECTION</span><span>VISUALIZATION</span><span>STAKEHOLDER COORDINATION</span><span>PRODUCTION</span><span>DELIVERY</span></div>
            </div>
          </div>
        </section>

        <section className="bpcl-outcome">
          <div className="bpcl-section__label">08 / Outcome</div>
          <h2>Making a complex future<br /><span>possible to see.</span></h2>
          <p>The project turned one technical installation plan into connected physical and digital ways of understanding the future site — giving stakeholders something they could see, navigate and discuss.</p>
        </section>

        <footer className="bpcl-footer">
          <a href="/case-studies" className="link-arrow">Back to case studies <Arrow /></a>
          <a href="/portfolio" className="link-arrow">Explore the portfolio <Arrow /></a>
        </footer>
      </main>
    </Layout>
  );
}
