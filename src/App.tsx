import { useCallback, useEffect, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { bus } from './gl/bus';
import { CustomCursor, Footer, GLCanvas, Loader, Navbar, ScrollProgress, useSmoothScroll } from './components/Chrome';
import { Hero } from './components/Hero';
import { BrandStory, EnergyExperience } from './components/Story';
import { Products } from './components/Products';
import { NepalEnergy } from './components/World';
import { BrandStatement, Community, FinalCTA } from './components/Closing';

export default function App() {
  const [loaded, setLoaded] = useState(false);
  useSmoothScroll();

  const done = useCallback(() => setLoaded(true), []);

  useEffect(() => {
    document.documentElement.classList.toggle('is-loading', !loaded);
    if (loaded) {
      // layout is final once the loader leaves: re-measure scroll anchors
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        bus.stage?.refresh();
      });
    }
  }, [loaded]);

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    const onLoad = () => {
      ScrollTrigger.refresh();
      bus.stage?.refresh();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  return (
    <>
      <a className="skip" href="#story">
        Skip to content
      </a>
      <GLCanvas />
      <Navbar />
      <ScrollProgress />
      <CustomCursor />
      <main>
        <Hero />
        <BrandStory />
        <EnergyExperience />
        <Products />
        <NepalEnergy />
        <BrandStatement />
        <Community />
        <FinalCTA />
      </main>
      <Footer />
      {!loaded && <Loader onDone={done} />}
    </>
  );
}
