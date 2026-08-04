import Nav            from './components/Nav';
import Hero           from './components/Hero';
import ProblemSection from './components/ProblemSection';
import FeaturesSection from './components/FeaturesSection';
import StickyScroll   from './components/StickyScroll';
import VendorParade   from './components/VendorParade';
import Timeline       from './components/Timeline';
import LatestFeature  from './components/LatestFeature';
import CTASection     from './components/CTASection';
import Footer         from './components/Footer';

export default function TwedotLanding() {
  return (
    <>
      <Nav />
      <Hero />
      <ProblemSection />
      <FeaturesSection />
      <StickyScroll />
      <VendorParade />
      <Timeline />
      <LatestFeature />
      <CTASection />
      <Footer />
    </>
  );
}
