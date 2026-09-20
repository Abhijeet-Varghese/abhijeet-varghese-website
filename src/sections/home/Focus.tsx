export default function Focus() {
  return (
    <>
<section className="chapter focus t-light" id="focus">
      <div className="container">
        <header className="chapter__head chapter__head--split">
          <div>
            <div className="chapter__meta" data-reveal={true}><span className="chapter__rule"></span><span className="chapter__tag">Now</span></div>
            <h2 className="chapter__title" data-reveal={true}>Current focus.</h2>
          </div>
          <p className="chapter__lede" data-reveal={true}>If you have a hard problem and high standards, we should talk.</p>
        </header>
        <div className="focus__grid">
          <ul className="focus__list" data-reveal-group={true}><li data-reveal={true}>Enterprise Innovation</li><li data-reveal={true}>Creative Systems</li><li data-reveal={true}>Experience Design</li><li data-reveal={true}>AI-Enabled Creative Workflows</li><li data-reveal={true}>Innovation Consulting</li><li data-reveal={true}>Leadership</li></ul>
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
