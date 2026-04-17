import React from 'react';

function Education() {
  const educationData = [
    {
      year: '2025 — 2028',
      degree: 'BSc. (Hons) Software Engineering',
      institution: 'Patan College of Professional Studies / University of Bedfordshire',
      description: 'Currently pursuing my degree, focusing on advanced software engineering methodologies, web technologies, and system design.'
    },
    {
      year: 'Higher Secondary',
      degree: 'High School Diploma (10+2)',
      institution: 'Moonlight Secondary School',
      description: 'Developed a rigorous understanding of computer science and mathematics, laying down the groundwork for algorithmic problem solving.'
    },
    {
      year: 'Secondary',
      degree: 'School Leaving Certificate',
      institution: 'Eden Garden Secondary Boarding School',
      description: 'Built a strong core foundation in academics and extracurricular activities leading up to secondary education.'
    }
  ];

  return (
    <>
      <style>{`
        .edu {
          position: relative;
          width: 100%;
          background: #04060b;
          color: #e8f0ff;
          padding: 120px 2rem 140px;
          overflow: hidden;
        }

        /* Subtle glowing background accents */
        .edu::before {
          content: '';
          position: absolute;
          top: -10%; left: -10%;
          width: 50%; height: 50%;
          background: radial-gradient(circle, rgba(77,163,255,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .edu::after {
          content: '';
          position: absolute;
          bottom: -10%; right: -10%;
          width: 60%; height: 60%;
          background: radial-gradient(circle, rgba(0,229,255,0.05) 0%, transparent 70%);
          pointer-events: none;
        }

        .edu__inner {
          position: relative;
          z-index: 2;
          max-width: 1100px;
          margin: 0 auto;
        }

        .edu__header {
          text-align: left;
          margin-bottom: 5rem;
        }

        .edu__title {
          font-family: var(--font-mono);
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 900;
          letter-spacing: 0.1em;
          color: #ffffff;
          text-transform: uppercase;
          line-height: 1.2;
          text-shadow: 0 10px 30px rgba(0,0,0,0.5);
          margin-bottom: 0.5rem;
        }
        .edu__title span {
          color: #ffffff;
        }

        .edu__subtitle {
          font-family: var(--font-sans);
          font-size: 1.1rem;
          color: rgba(77,163,255,0.8);
          font-weight: 600;
          letter-spacing: 0.05em;
          text-align: left;
        }

        .edu__timeline {
          position: relative;
          max-width: 800px;
          margin: 0 auto;
        }

        /* The glowing spine */
        .edu__timeline::before {
          content: '';
          position: absolute;
          top: 0; left: 24px;
          bottom: 0; width: 2px;
          background: linear-gradient(to bottom, rgba(77,163,255,0.8), rgba(0,229,255,0.2));
          box-shadow: 0 0 15px rgba(77,163,255,0.6);
        }

        .edu__item {
          position: relative;
          padding-left: 80px;
          margin-bottom: 4rem;
        }
        .edu__item:last-child {
          margin-bottom: 0;
        }

        /* Timeline Nodes */
        .edu__node {
          position: absolute;
          top: 0; left: 15px;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: #04060b;
          border: 3px solid #00e5ff;
          box-shadow: 0 0 12px rgba(0,229,255,0.8), inset 0 0 5px rgba(0,229,255,0.8);
          z-index: 2;
          transition: transform 0.3s ease, background 0.3s ease;
        }
        .edu__item:hover .edu__node {
          transform: scale(1.3);
          background: #00e5ff;
        }

        .edu__card {
          background: rgba(10,14,22,0.5);
          border: 1px solid rgba(77,163,255,0.2);
          border-radius: 16px;
          padding: 2rem;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
        }
        .edu__card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 100%; height: 4px;
          background: linear-gradient(90deg, #4da3ff, #00e5ff);
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .edu__item:hover .edu__card {
          transform: translateY(-5px);
          border-color: rgba(77,163,255,0.5);
          box-shadow: 0 15px 40px rgba(0,229,255,0.1), 0 5px 15px rgba(77,163,255,0.1);
          background: rgba(14,20,30,0.7);
        }
        .edu__item:hover .edu__card::before {
          opacity: 1;
        }

        .edu__year {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          color: #4da3ff;
          background: rgba(77,163,255,0.1);
          padding: 0.3rem 0.8rem;
          border-radius: 999px;
          margin-bottom: 1rem;
          border: 1px solid rgba(77,163,255,0.2);
        }

        .edu__degree {
          font-family: var(--font-sans);
          font-size: 1.4rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 0.4rem;
          letter-spacing: 0.02em;
        }

        .edu__inst {
          font-family: var(--font-sans);
          font-size: 1.05rem;
          font-weight: 600;
          color: rgba(0,229,255,0.8);
          margin: 0 0 1rem;
        }

        .edu__desc {
          font-family: var(--font-sans);
          font-size: 0.98rem;
          line-height: 1.7;
          color: rgba(210, 225, 255, 0.75);
          margin: 0;
        }

        @media (max-width: 768px) {
          .edu { padding: 80px 1.5rem; }
          .edu__timeline::before { left: 16px; }
          .edu__node { left: 7px; width: 18px; height: 18px; }
          .edu__item { padding-left: 50px; margin-bottom: 2.5rem; }
          .edu__card { padding: 1.5rem; }
        }
      `}</style>
      
      <section id="education" className="edu">
        <div className="edu__inner">
          <div className="edu__header">
            <h2 className="edu__title"><span>Education</span></h2>
            <p className="edu__subtitle">My Academic Journey</p>
          </div>

          <div className="edu__timeline">
            {educationData.map((item, index) => (
              <div className="edu__item" key={index}>
                <div className="edu__node"></div>
                <div className="edu__card">
                  <div className="edu__year">{item.year}</div>
                  <h3 className="edu__degree">{item.degree}</h3>
                  <p className="edu__inst">{item.institution}</p>
                  <p className="edu__desc">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default Education;
