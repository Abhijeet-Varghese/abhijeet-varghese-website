import useContent from '../hooks/useContent.js';
import useLoader from '../hooks/useLoader.js';
import useChrome from '../hooks/useChrome.js';
import useMenu from '../hooks/useMenu.js';
import useReveal from '../hooks/useReveal.js';
import useHeroStates from '../hooks/useHeroStates.js';
import useWorkStage from '../hooks/useWorkStage.js';
import useJourneyStage from '../hooks/useJourneyStage.js';
import useFooterArena from '../hooks/useFooterArena.js';
import useBooking from '../hooks/useBooking.js';
import Loader from '../components/Loader.jsx';
import SiteChrome from '../components/SiteChrome.jsx';
import SiteFooter from '../components/SiteFooter.jsx';
import Hero from '../sections/home/Hero.jsx';
import Trust from '../sections/home/Trust.jsx';
import Capabilities from '../sections/home/Capabilities.jsx';
import FeaturedWork from '../sections/home/FeaturedWork.jsx';
import PointOfView from '../sections/home/PointOfView.jsx';
import Journey from '../sections/home/Journey.jsx';
import AISection from '../sections/home/AISection.jsx';
import Focus from '../sections/home/Focus.jsx';
import Contact from '../sections/home/Contact.jsx';

export default function HomePage() {
  const { content, status } = useContent();
  useLoader(); useChrome(); useMenu(); useHeroStates(); useWorkStage();
  useJourneyStage(); useFooterArena(); useBooking(); useReveal([status]);
  return (
    <>
      <Loader />
      <SiteChrome content={content} />
      <main id="main">
        <Hero content={content} />
        <Trust content={content} />
        <Capabilities content={content} />
        <FeaturedWork content={content} />
        <PointOfView content={content} />
        <Journey content={content} />
        <AISection content={content} />
        <Focus content={content} />
        <Contact content={content} />
      </main>
      <SiteFooter content={content} />
    </>
  );
}
