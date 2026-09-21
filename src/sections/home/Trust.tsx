import { useCmsContent } from '../../hooks/useCmsContent';
import { cmsMediaUrl, findSection } from '../../lib/cms';
import type { CmsClient, CmsSection } from '../../lib/cms';

const FALLBACK = {
  kicker: 'Trust',
  title: 'Experiences built for.',
  lede: 'Global enterprises, national institutions and culture-defining brands — organizations that trusted the work when it mattered.',
  note: 'Delivering work across enterprise, defence, manufacturing, technology, retail, aviation, government, media and emerging industries.',
  clients: [
    { id: 'c1', name: 'Amazon', logo: 'amazon.webp' },
    { id: 'c2', name: 'Orange Business', logo: 'orange-business.webp' },
    { id: 'c3', name: 'Indian Army', logo: 'indian-army.webp' },
    { id: 'c4', name: 'TATA Advanced Systems', logo: 'tata-advanced-systems.webp' },
    { id: 'c5', name: 'Indian Oil', logo: 'indian-oil.webp' },
    { id: 'c6', name: 'Bharat Petroleum Corporation Limited', logo: 'bpcl.webp' },
    { id: 'c7', name: 'Samsung SDS', logo: 'samsung-sds.webp' },
    { id: 'c8', name: 'Sony BBC Earth', logo: 'sony-bbc-earth.webp' },
    { id: 'c9', name: 'Nickelodeon', logo: 'nickelodeon.webp' },
    { id: 'c10', name: 'Rockwell Automation', logo: 'rockwell-automation.webp' },
    { id: 'c11', name: 'Govt. of Rajasthan', logo: 'govt-of-rajasthan.webp' },
    { id: 'c12', name: 'Metabloqs', logo: 'metabloqs.webp' },
    { id: 'c13', name: "Papa John's", logo: 'papa-johns.webp' },
    { id: 'c14', name: 'Dunkin\' Donuts', logo: 'dunkin.webp' },
    { id: 'c15', name: 'JK Lakshmi Cement', logo: 'jk-lakshmi-cement.webp' },
    { id: 'c16', name: 'Regional Express', logo: 'regional-express.webp' },
  ] as { id: string; name: string; logo: string }[],
};

export default function Trust() {
  const { data: sectionsData, source: secSource } = useCmsContent('sections', null);
  const { data: clientsData, source: cliSource } = useCmsContent('clients', null);
  const section: CmsSection | null = secSource === 'cms' ? findSection(sectionsData, 'clients') : null;
  const cmsClients = cliSource === 'cms' && Array.isArray(clientsData) ? (clientsData as CmsClient[]) : null;

  const kicker = section?.kicker ? String(section.kicker) : FALLBACK.kicker;
  const title = section?.title ? String(section.title) : FALLBACK.title;
  const lede = section?.lede ? String(section.lede) : FALLBACK.lede;
  const note = section?.note ? String(section.note) : FALLBACK.note;

  // CMS clients overrides fallback logos when available; keep approved fallback when CMS empty
  const clients = cmsClients?.length
    ? cmsClients.map((c) => ({ id: c.id, name: c.name, logo: c.logo }))
    : FALLBACK.clients;

  // Respect CMS ordering via clientIds if provided
  const ordered = section?.clientIds && Array.isArray(section.clientIds) && (section.clientIds as string[]).length
    ? (section.clientIds as string[]).map((cid) => clients.find((c) => c.id === cid)).filter(Boolean) as typeof clients
    : clients;

  const displayClients = ordered.length ? ordered : clients;

  return (
    <>
<section className="chapter clients t-light" id="clients" data-cms-source={section || cmsClients ? 'cms' : 'fallback'}>
      <div className="container">
        <header className="chapter__head chapter__head--split">
          <div>
            <div className="chapter__meta" data-reveal={true}><span className="chapter__rule"></span><span className="chapter__tag">{kicker}</span></div>
            <h2 className="chapter__title" data-reveal={true}>{title}</h2>
          </div>
          <p className="chapter__lede" data-reveal={true}>{lede}</p>
        </header>
        <ul className="logo-wall" data-reveal-group aria-label="Selected clients">
          {displayClients.map((c) => {
            const src = c.logo.includes('/') ? cmsMediaUrl(c.logo) : cmsMediaUrl(`media/logos/${c.logo}`.replace('media/media/','media/'));
            // fallback logos live at /assets/logos/<file>; CMS media at /media/logos/<file> → /media/ will fallback to assets in production
            const fallbackSrc = `/assets/logos/${c.logo}`;
            // Prefer CMS media when CMS source, else fallback asset path
            const finalSrc = cmsClients?.length ? (c.logo.startsWith('media/') ? cmsMediaUrl(c.logo) : src) : fallbackSrc;
            return (
              <li key={c.id} className="logo-tile" data-reveal={true}><img src={finalSrc} alt={c.name} width="160" height="48" loading="lazy" decoding="async" onError={(e: React.SyntheticEvent<HTMLImageElement>) => { const img = e.currentTarget; if (img.src !== fallbackSrc) img.src = fallbackSrc; }} /></li>
            );
          })}
      </ul>
        <p className="clients__note" data-reveal={true}>{note}</p>
      </div>
    </section>
    </>
  );
}
