import React, { useState, useEffect } from 'react';

function Footer() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <>
      <style>{`
        .ft {
          background: #020306;
          border-top: 1px solid rgba(77, 163, 255, 0.08);
          padding: 1.2rem 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ft__copy {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: rgba(200, 220, 255, 0.3);
          letter-spacing: 0.1em;
          margin: 0;
        }

        /* Fixed scroll-to-top button */
        .ft__up {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 999;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(10,14,22,0.85);
          border: 1px solid rgba(0, 229, 255, 0.35);
          color: #00e5ff;
          font-size: 1.1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(12px);
          box-shadow: 0 4px 20px rgba(0,229,255,0.15);
          opacity: 0;
          transform: translateY(16px);
          pointer-events: none;
          transition: opacity 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
        }

        .ft__up.show {
          opacity: 1;
          transform: translateY(0);
          pointer-events: all;
        }

        .ft__up:hover {
          background: rgba(0, 229, 255, 0.12);
          border-color: #00e5ff;
          box-shadow: 0 8px 28px rgba(0,229,255,0.35);
          transform: translateY(-2px);
        }
      `}</style>

      <footer className="ft">
        <p className="ft__copy">© {new Date().getFullYear()} Samar Maharjan</p>
      </footer>

      {/* Floating scroll-to-top button */}
      <button
        className={`ft__up${visible ? ' show' : ''}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        ↑
      </button>
    </>
  );
}

export default Footer;
