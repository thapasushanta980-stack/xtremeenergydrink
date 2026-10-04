import { useCallback, useEffect, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { bus } from './gl/bus';
import { isDashain } from './dashain';
import { Boundary } from './components/Boundary';
import { Soundtrack } from './components/Soundtrack';
import { CustomCursor, Footer, GLCanvas, Loader, Navbar, ScrollProgress, useSmoothScroll } from './components/Chrome';
import { Hero } from './components/Hero';
import { BrandStory, EnergyExperience } from './components/Story';
import { Products } from './components/Products';
import { NepalEnergy } from './components/World';
import { BrandStatement, Community, FinalCTA } from './components/Closing';

/** Page order, and the label each section reports under if it ever fails. */
const SECTIONS: [string, () => JSX.Element][] = [
  ['hero', Hero],
  ['brand story', BrandStory],
  ['energy experience', EnergyExperience],
  ['products', Products],
  ['Nepal', NepalEnergy],
  ['brand statement', BrandStatement],
  ['community', Community],
  ['final call to action', FinalCTA],
];

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

  // One flag for the whole document, so the seasonal accents are a CSS concern
  // rather than a prop threaded through every section.
  useEffect(() => {
    document.documentElement.classList.toggle('dashain', isDashain());
  }, []);

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
      {/* The 3D stage, the progress bar and the cursor are enhancements: if one
          throws it leaves quietly and the page carries on without it. */}
      <Boundary label="3D stage">
        <GLCanvas />
      </Boundary>
      <Boundary label="navigation">
        <Navbar />
      </Boundary>
      <Boundary label="soundtrack">
        <Soundtrack />
      </Boundary>
      <Boundary label="scroll progress">
        <ScrollProgress />
      </Boundary>
      <Boundary label="custom cursor">
        <CustomCursor />
      </Boundary>
      <main>
        {/* Per section, so one failure costs that section and not the page. */}
        {SECTIONS.map(([label, Section]) => (
          <Boundary key={label} label={label}>
            <Section />
          </Boundary>
        ))}
      </main>
      <Boundary label="footer">
        <Footer />
      </Boundary>
      {!loaded && <Loader onDone={done} />}
    </>
  );
}
