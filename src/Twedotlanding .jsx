import Nav            from './components/Nav';
import Hero           from './components/Hero';
import FeaturesSection from './components/FeaturesSection';
import StickyScroll   from './components/StickyScroll';
import VendorParade   from './components/VendorParade';
import Timeline       from './components/Timeline';
import CTASection     from './components/CTASection';
import Footer         from './components/Footer';

export default function TwedotLanding() {
  return (
    <>
      <Nav />
      <Hero />
      <FeaturesSection />
      <StickyScroll />
      <VendorParade />
      <Timeline />
      <CTASection />
      <Footer />
    </>
  );
}
