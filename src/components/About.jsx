import React from 'react';

function About() {
  return (
    <>
      <style>{`
        .abt {
          position: relative;
          width: 100%;
          padding: 120px 2rem;
          background: #020306;
          overflow: hidden;
        }

        .abt::before {
          content: '';
          position: absolute;
          top: -100px; left: -100px;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(77,163,255,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        .abt__inner {
          max-width: 1100px;
          margin: 0 auto;
          padding-left: clamp(1rem, 6vw, 5rem);
          position: relative;
          z-index: 2;
        }

        .abt__tag {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: #00e5ff;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 2rem;
        }
        .abt__tag::before {
          content: '';
          display: inline-block;
          width: 24px;
          height: 1px;
          background: #00e5ff;
        }

        .abt__title {
          font-family: var(--font-sans);
          font-size: clamp(2.8rem, 6vw, 5rem);
          font-weight: 900;
          color: #ffffff;
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin-bottom: 2.5rem;
        }

        .abt__bio {
          font-family: var(--font-sans);
          font-size: 1.08rem;
          line-height: 1.9;
          color: rgba(200, 218, 255, 0.78);
          margin-bottom: 2rem;
          max-width: 560px;
        }
        .abt__bio strong {
          color: #ffffff;
          font-weight: 700;
        }

        .abt__divider {
          width: 48px;
          height: 2px;
          background: linear-gradient(90deg, #4da3ff, #00e5ff);
          border-radius: 999px;
          margin: 2rem 0 2.5rem;
        }

        .abt__stats {
          display: flex;
          flex-wrap: wrap;
          gap: 0.8rem;
        }
        .abt__stat {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.55rem 1.1rem;
          border-radius: 100px;
          border: 1px solid rgba(77, 163, 255, 0.2);
          background: rgba(10, 14, 22, 0.6);
          backdrop-filter: blur(8px);
          transition: border-color 0.3s ease, transform 0.3s ease;
        }
        .abt__stat:hover {
          border-color: rgba(0, 229, 255, 0.5);
          transform: translateY(-2px);
        }
        .abt__stat-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #00e5ff;
          box-shadow: 0 0 8px #00e5ff;
          flex-shrink: 0;
          animation: blink 2s infinite alternate;
        }
        @keyframes blink {
          from { opacity: 0.5; }
          to { opacity: 1; box-shadow: 0 0 14px #00e5ff; }
        }
        .abt__stat-label {
          font-family: var(--font-mono);
          font-size: 0.78rem;
          color: rgba(200, 220, 255, 0.75);
          letter-spacing: 0.04em;
        }

        @media (max-width: 640px) {
          .abt { padding: 80px 1.25rem; }
          .abt__title { font-size: 2.2rem; }
        }
      `}</style>

      <section id="about" className="abt">
        <div className="abt__inner">
         

          <h2 className="abt__title">About Me</h2>

          <p className="abt__bio">
            A passionate <strong>full-stack developer</strong> from Nepal who loves turning ideas into real, working products. I focus on building efficient, scalable, and user-friendly applications that make a real impact.
          </p>
          <p className="abt__bio">
            I'm also a dedicated <strong>Hackathon Enthusiast</strong> — I thrive under pressure, building innovative prototypes alongside creative teams and constantly pushing the limits of what's possible in record time.
          </p>

          <div className="abt__divider" />

          <div className="abt__stats">
            {[
              'Full-Stack Developer',
              'Hackathon Enthusiast',
              'Based in Nepal 🇳🇵',
              'Open to Collaborate',
            ].map((label) => (
              <div className="abt__stat" key={label}>
                <span className="abt__stat-dot" />
                <span className="abt__stat-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default About;
