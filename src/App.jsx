import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Banner from './components/Banner';
import Navbar from './components/Navbar';
import About from './components/About';
import Skills from './components/Skills';
import Education from './components/Education';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Footer from './components/Footer';

// Reusable scroll-reveal wrapper
const FadeInSection = ({ children, delay = 0 }) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  const variants = {
    hidden: { opacity: 0, y: 40, filter: 'blur(5px)' },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      transition: { duration: 0.8, delay, ease: [0.17, 0.67, 0.83, 0.67] } 
    }
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants}
    >
      {children}
    </motion.div>
  );
};

function App() {
  return (
    <div className="bg-[#020306] min-h-screen overflow-x-hidden">
      <Navbar />
      
      <main>
        {/* Banner handles its own heavy 3D loading, doesn't need generic fade */}
        <Banner />
        
        <FadeInSection>
          <About />
        </FadeInSection>
        
        <FadeInSection>
          <Skills />
        </FadeInSection>
        
        <FadeInSection>
          <Education />
        </FadeInSection>
        
        <FadeInSection>
          <Projects />
        </FadeInSection>
        
        <FadeInSection>
          <Contact />
        </FadeInSection>
      </main>

      <Footer />
    </div>
  );
}

export default App;
