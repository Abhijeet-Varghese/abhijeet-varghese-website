export default function Trust({ content }) {
  const clients = (content && Array.isArray(content.clients) && content.clients.length) ? content.clients : null;
  return (
    <>
<section className="chapter clients t-light" id="clients">
      <div className="container">
        <header className="chapter__head chapter__head--split">
          <div>
            <div className="chapter__meta" data-reveal={true}><span className="chapter__num">02</span><span className="chapter__rule"></span><span className="chapter__tag">Trust</span></div>
            <h2 className="chapter__title" data-reveal={true}>Experiences built for.</h2>
          </div>
          <p className="chapter__lede" data-reveal={true}>Global enterprises, national institutions and culture-defining brands — organizations that trusted the work when it mattered.</p>
        </header>
        <ul className="logo-wall" data-reveal={true} aria-label="Selected clients">
        {clients
          ? clients.map((c) => (
              <li className="logo-tile" data-reveal={true} key={c.id || c.name}>
                <img src={`/assets/logos/${c.logo}`} alt={c.name} width="160" height="48" loading="lazy" decoding="async" />
              </li>
            ))
          : (<>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/amazon.webp" alt="Amazon" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/orange-business.webp" alt="Orange Business" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/indian-army.webp" alt="Indian Army" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/tata-advanced-systems.webp" alt="TATA Advanced Systems" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/indian-oil.webp" alt="Indian Oil" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/bpcl.webp" alt="Bharat Petroleum Corporation Limited" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/samsung-sds.webp" alt="Samsung SDS" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/sony-bbc-earth.webp" alt="Sony BBC Earth" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/nickelodeon.webp" alt="Nickelodeon" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/rockwell-automation.webp" alt="Rockwell Automation" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/govt-of-rajasthan.webp" alt="Govt. of Rajasthan" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/metabloqs.webp" alt="Metabloqs" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/papa-johns.webp" alt="Papa John&#039;s" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/dunkin.webp" alt="Dunkin&#039; Donuts" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/jk-lakshmi-cement.webp" alt="JK Lakshmi Cement" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/regional-express.webp" alt="Regional Express" width="160" height="48" loading="lazy" decoding="async" /></li>
          </>)}
      </ul>
        <p className="clients__note" data-reveal={true}>Delivering work across enterprise, defence, manufacturing, technology, retail, aviation, government, media and emerging industries.</p>
      </div>
    </section>
    </>
  );
}
