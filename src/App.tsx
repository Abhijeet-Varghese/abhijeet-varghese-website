import SiteChrome from './components/SiteChrome';
import SiteFooter from './components/SiteFooter';
import AISection from './sections/home/AISection';
import Capabilities from './sections/home/Capabilities';
import Contact from './sections/home/Contact';
import FeaturedWork from './sections/home/FeaturedWork';
import Focus from './sections/home/Focus';
import Hero from './sections/home/Hero';
import Journey from './sections/home/Journey';
import PointOfView from './sections/home/PointOfView';
import Trust from './sections/home/Trust';
import { useAnalytics } from './hooks/useAnalytics';
import { useBooking } from './hooks/useBooking';
import { useCmsSeo } from './hooks/useCmsSeo';
import { useElevate } from './hooks/useElevate';
import { useHeroMotion } from './hooks/useHeroMotion';
import { useLoader } from './hooks/useLoader';
import { useMenu } from './hooks/useMenu';
import { useMobileHomeMotion } from './hooks/useMobileHomeMotion';
import { usePageMotion } from './hooks/usePageMotion';
import { useReveal } from './hooks/useReveal';
import { useServiceWorker } from './hooks/useServiceWorker';

/**
 * The public homepage is deliberately static-content React. Its reviewed HTML
 * content lives in semantic section components; imperative animation concerns
 * are kept in isolated, cleanup-safe hooks so they do not touch the legacy
 * inner pages that remain in public/.
 */
export default function App() {
  useLoader();
  useMenu();
  useReveal();
  usePageMotion();
  useMobileHomeMotion();
  useHeroMotion();
  useElevate();
  useBooking();
  useAnalytics();
  useServiceWorker();
  useCmsSeo('/', { title: 'Abhijeet Varghese — Experience Design & Innovation Leadership', description: 'Abhijeet Varghese is a multidisciplinary creative systems leader with 12+ years across experience design, enterprise innovation, immersive technology and AI-enabled creative production.' });

  return (
    <>
      <SiteChrome />
      <main id="main">
        <Hero />
        <Trust />
        <Capabilities />
        <FeaturedWork />
        <PointOfView />
        <Journey />
        <AISection />
        <Focus />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
