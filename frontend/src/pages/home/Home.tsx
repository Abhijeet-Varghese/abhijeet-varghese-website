import { Layout } from '@/components/Layout';
import { useSiteChrome } from '@/lib/scroll';
import { Hero } from '@/sections/home/Hero';
import { Clients } from '@/sections/home/Clients';
import { Capabilities } from '@/sections/home/Capabilities';
import { Work } from '@/sections/home/Work';
import { Thinking } from '@/sections/home/Thinking';
import { Journey } from '@/sections/home/Journey';
import { AiMethod } from '@/sections/home/AiMethod';
import { Focus } from '@/sections/home/Focus';
import { Contact } from '@/sections/home/Contact';

export function Home() {
  useSiteChrome();
  return (
    <Layout activeHref="index.html">
      <Hero />
      <Clients />
      <Capabilities />
      <Work />
      <Thinking />
      <Journey />
      <AiMethod />
      <Focus />
      <Contact />
    </Layout>
  );
}
