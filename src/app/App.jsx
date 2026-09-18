import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage.jsx';
import NotFound from '../pages/NotFound.jsx';
import InnerPage from '../pages/inner/InnerPage.jsx';
import Story from '../pages/inner/Story.jsx';
import Experience from '../pages/inner/Experience.jsx';
import CaseStudies from '../pages/inner/CaseStudies.jsx';
import CaseOrange from '../pages/inner/CaseOrange.jsx';
import CaseArmy from '../pages/inner/CaseArmy.jsx';
import Portfolio from '../pages/inner/Portfolio.jsx';
import Consulting from '../pages/inner/Consulting.jsx';
import ContactPage from '../pages/inner/ContactPage.jsx';
import Insights from '../pages/inner/Insights.jsx';
import InsightHuman from '../pages/inner/InsightHuman.jsx';
import InsightAI from '../pages/inner/InsightAI.jsx';
import InsightRemember from '../pages/inner/InsightRemember.jsx';
import InsightFail from '../pages/inner/InsightFail.jsx';
import Journal from '../pages/inner/Journal.jsx';
import JournalAI from '../pages/inner/JournalAI.jsx';
import JournalCentre from '../pages/inner/JournalCentre.jsx';
import Recruiter from '../pages/inner/Recruiter.jsx';
import Privacy from '../pages/inner/Privacy.jsx';
import Terms from '../pages/inner/Terms.jsx';
import usePortfolioReel from '../hooks/usePortfolioReel.js';
import { useCaseOrange, useCaseArmy } from '../hooks/useCasePages.js';
import useBooking from '../hooks/useBooking.js';

// Migrated routes render from React (each is also prerendered to its own
// dist/<route>/index.html at build time). Everything else still resolves to
// the legacy static files via the AV OS router — incremental takeover.
// Legacy island (documented): /case-studies/bharat-petroleum-corporation-limited/
// (self-contained micro-app: config registry + core engine + walkthrough video).
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/story" element={<InnerPage name="Story"><Story /></InnerPage>} />
      <Route path="/experience" element={<InnerPage name="Experience"><Experience /></InnerPage>} />
      <Route path="/case-studies" element={<InnerPage name="CaseStudies"><CaseStudies /></InnerPage>} />
      <Route path="/case-studies/orange-business" element={<InnerPage name="CaseOrange" hook={useCaseOrange}><CaseOrange /></InnerPage>} />
      <Route path="/case-studies/indian-army" element={<InnerPage name="CaseArmy" hook={useCaseArmy}><CaseArmy /></InnerPage>} />
      <Route path="/portfolio" element={<InnerPage name="Portfolio" hook={usePortfolioReel}><Portfolio /></InnerPage>} />
      <Route path="/consulting" element={<InnerPage name="Consulting"><Consulting /></InnerPage>} />
      <Route path="/contact" element={<InnerPage name="ContactPage" hook={useBooking}><ContactPage /></InnerPage>} />
      <Route path="/insights" element={<InnerPage name="Insights"><Insights /></InnerPage>} />
      <Route path="/insights/technology-should-feel-human" element={<InnerPage name="InsightHuman"><InsightHuman /></InnerPage>} />
      <Route path="/insights/ai-isnt-replacing-creativity" element={<InnerPage name="InsightAI"><InsightAI /></InnerPage>} />
      <Route path="/insights/designing-experiences-people-remember" element={<InnerPage name="InsightRemember"><InsightRemember /></InnerPage>} />
      <Route path="/insights/why-enterprise-experiences-fail" element={<InnerPage name="InsightFail"><InsightFail /></InnerPage>} />
      <Route path="/journal" element={<InnerPage name="Journal"><Journal /></InnerPage>} />
      <Route path="/journal-what-a-year-of-ai-enabled-production-taught-me" element={<InnerPage name="JournalAI"><JournalAI /></InnerPage>} />
      <Route path="/journal-the-experience-centre-as-a-strategic-instrument" element={<InnerPage name="JournalCentre"><JournalCentre /></InnerPage>} />
      <Route path="/recruiter" element={<InnerPage name="Recruiter"><Recruiter /></InnerPage>} />
      <Route path="/privacy-policy" element={<InnerPage name="Privacy"><Privacy /></InnerPage>} />
      <Route path="/terms" element={<InnerPage name="Terms"><Terms /></InnerPage>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
