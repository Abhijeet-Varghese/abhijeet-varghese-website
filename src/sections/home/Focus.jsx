export default function Focus({ content }) {
  return (
    <>
<section className="chapter focus t-light" id="focus">
      <div className="container">
        <header className="chapter__head chapter__head--split">
          <div>
            <div className="chapter__meta" data-reveal={true}><span className="chapter__num">08</span><span className="chapter__rule"></span><span className="chapter__tag">Now</span></div>
            <h2 className="chapter__title" data-reveal={true}>Current focus.</h2>
          </div>
          <p className="chapter__lede" data-reveal={true}>If you have a hard problem and high standards, we should talk.</p>
        </header>
        <div className="focus__grid">
          <ul className="focus__list" data-reveal-group={true}><li data-reveal={true}><span className="focus__num">01</span>Enterprise Innovation</li><li data-reveal={true}><span className="focus__num">02</span>Creative Systems</li><li data-reveal={true}><span className="focus__num">03</span>Experience Design</li><li data-reveal={true}><span className="focus__num">04</span>AI-Enabled Creative Workflows</li><li data-reveal={true}><span className="focus__num">05</span>Innovation Consulting</li><li data-reveal={true}><span className="focus__num">06</span>Leadership</li></ul>
          <div className="focus__open" data-reveal-group={true}>
            <p className="label label--muted" data-reveal={true}>Open to</p>
            <ul className="open__list"><li data-reveal={true}>Leadership Roles</li><li data-reveal={true}>Enterprise Consulting</li><li data-reveal={true}>Innovation Partnerships</li><li data-reveal={true}>Speaking</li></ul>
            <p className="focus__note" data-reveal={true}>Every engagement starts the same way — an honest conversation about what actually needs to change.</p>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
