import React, { useEffect, useState } from 'react';

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{`
        .nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          padding: 0 2.5rem;
          transition: background 0.35s, box-shadow 0.35s;
        }
        .nav.scrolled {
          background: rgba(4, 6, 11, 0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 1px 0 rgba(77,163,255,0.12);
        }

        .nav__inner {
          max-width: 1140px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 68px;
        }

        /* ── logo ── */
        .nav__logo {
          display: flex;
          align-items: center;
          text-decoration: none;
          cursor: pointer;
        }
        .nav__logo-icon {
          width: 80px;
          height: 80px;
          flex-shrink: 0;
          transition: filter 0.25s, transform 0.25s;
        }
        .nav__logo:hover .nav__logo-icon {
          filter: drop-shadow(0 0 10px rgba(77,163,255,0.85));
          transform: rotate(15deg);
        }

        /* "Samar" bold, "| Maharjan" lighter — two weights same font */
        .nav__logo-text {
          font-family: var(--font-sans);
          font-size: 1.1rem;
          letter-spacing: 0.06em;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 0.18rem;
        }
        .nav__logo-first {
          font-weight: 900;
          color: #ffffff;
        }
        .nav__logo-sep {
          font-weight: 300;
          color: rgba(77,163,255,0.5);
          margin: 0 0.25rem;
          font-size: 1rem;
        }
        .nav__logo-last {
          font-weight: 400;
          color: rgba(200, 220, 255, 0.6);
          letter-spacing: 0.08em;
        }

        /* ── nav links ── */
        .nav__links {
          display: flex;
          align-items: center;
          gap: 2.8rem;
          list-style: none;
        }
        .nav__links a {
          font-family: var(--font-mono);
          font-weight: 400;
          font-size: 0.75rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(180, 210, 255, 0.6);
          text-decoration: none;
          position: relative;
          transition: color 0.2s;
          padding-bottom: 2px;
        }
        .nav__links a::after {
          content: '';
          position: absolute;
          bottom: -2px; left: 0;
          width: 0; height: 1.5px;
          background: linear-gradient(90deg, #4da3ff, #00e5ff);
          border-radius: 9999px;
          transition: width 0.25s ease;
          box-shadow: 0 0 8px rgba(77,163,255,0.6);
        }
        .nav__links a:hover {
          color: rgba(255, 255, 255, 0.95);
        }
        .nav__links a:hover::after {
          width: 100%;
        }
      `}</style>

      <header className={`nav${scrolled ? ' scrolled' : ''}`}>
        <div className="nav__inner">

          <a href="#about" className="nav__logo">
            <img
              src="/logo (2).png"
              alt="Samar logo"
              className="nav__logo-icon"
            />
            <span className="nav__logo-text">
              <span className="nav__logo-first">Samar</span>
              <span className="nav__logo-sep">|</span>
              <span className="nav__logo-last">Maharjan</span>
            </span>
          </a>

          <nav>
            <ul className="nav__links">
              <li><a href="#about">About</a></li>
              <li><a href="#projects">Projects</a></li>
              <li><a href="#skills">Skills</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </nav>

        </div>
      </header>
    </>
  );
}

export default Navbar;