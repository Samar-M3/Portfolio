import React from 'react';

function Projects() {
  const projects = [
    {
      id: 1,
      title: 'HEKTO',
      tech: ['React', 'Node.js', 'Express', 'MongoDB'],
      description: 'A full-scale e-commerce platform built on the MERN stack, featuring seamless product management, shopping cart functionality, and user authentication.',
      gradient: 'linear-gradient(135deg, #1A2980 0%, #26D0CE 100%)',
      image: '/hekto.png', // Assumes image is placed in public folder
      link: 'https://hekto-frontend-theta.vercel.app/'
    },
    {
      id: 2,
      title: 'ParkFasto',
      tech: ['React', 'Node.js', 'Express', 'MongoDB'],
      description: 'An intelligent parking allocation system that streamlines spot discovery, bookings, and manages facility capacity efficiently in real-time.',
      badge: '🏆 1st Runner-Up Sankalpa Hackathon',
      gradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      link: 'https://park-fasto-frontend.vercel.app/',
      image: '/Parkfasto.png'
    },
    {
      id: 3,
      title: 'MindSathi',
      tech: ['React', 'Firebase', 'Python', 'FastAPI'],
      description: 'A dedicated mental health community platform thoughtfully designed to connect struggling individuals with mental wellness resources, support channels, and safe spaces.',
      gradient: 'linear-gradient(135deg, #141E30 0%, #243B55 100%)',
      link: 'https://mind60-front.vercel.app/',
      image: '/Mindsathi.png'
    }
  ];

  return (
    <>
      <style>{`
        .prj {
          position: relative;
          background: #020306;
          padding: 120px 2rem;
          color: #e8f0ff;
        }

        .prj__inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        .prj__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 4rem;
          border-bottom: 1px solid rgba(77,163,255,0.15);
          padding-bottom: 1.5rem;
        }

        .prj__title {
          font-family: var(--font-mono);
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 900;
          color: #ffffff;
          margin: 0;
          line-height: 1;
          letter-spacing: -0.02em;
        }
        .prj__title span {
          color: #4da3ff;
          text-shadow: 0 0 15px rgba(77,163,255,0.6);
        }

        .prj__subtitle {
          font-family: var(--font-sans);
          color: rgba(200, 220, 255, 0.6);
          font-size: 1rem;
          max-width: 400px;
          text-align: right;
          margin: 0;
        }

        .prj__grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 2rem;
        }

        .prj__card {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          aspect-ratio: 4/3;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease;
          group;
        }

        .prj__card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0,229,255,0.2), 0 0 20px rgba(77,163,255,0.1);
        }

        .prj__bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background-size: cover !important;
          background-position: center !important;
          transition: transform 0.6s ease;
        }

        .prj__card:hover .prj__bg {
          transform: scale(1.1);
        }

        .prj__overlay {
          position: absolute;
          inset: 0;
          /* Dark overlay added from the top to ensure text readability against bright images */
          background: linear-gradient(to top, rgba(4,6,11,0.98) 0%, rgba(4,6,11,0.8) 50%, rgba(4,6,11,0.4) 100%);
          padding: 2rem;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          transition: background 0.4s ease;
        }

        .prj__card:hover .prj__overlay {
          background: linear-gradient(to top, rgba(4,6,11,1.0) 0%, rgba(4,6,11,0.9) 60%, rgba(4,6,11,0.6) 100%);
        }

        .prj__content {
          transform: translateY(20px);
          transition: transform 0.4s ease;
        }

        .prj__card:hover .prj__content {
          transform: translateY(0);
        }

        .prj__badge {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 0.65rem;
          font-weight: 700;
          color: #04060b;
          background: #00e5ff;
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          margin-bottom: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 0 10px rgba(0,229,255,0.4);
        }

        .prj__tech-stack {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.8rem;
        }

        .prj__tech-item {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: #00e5ff;
          background: rgba(0,229,255,0.1);
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
          border: 1px solid rgba(0,229,255,0.3);
        }

        .prj__name {
          font-family: var(--font-sans);
          font-weight: 800;
          font-size: 1.4rem;
          color: #ffffff;
          margin: 0 0 0.5rem;
        }

        .prj__desc {
          font-family: var(--font-sans);
          font-size: 0.9rem;
          line-height: 1.5;
          color: rgba(200, 220, 255, 0.7);
          margin: 0 0 1.2rem;
          opacity: 0;
          transition: opacity 0.4s ease 0.1s;
        }

        .prj__card:hover .prj__desc {
          opacity: 1;
        }

        .prj__btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-family: var(--font-mono);
          font-size: 0.8rem;
          color: #ffffff;
          text-decoration: none;
          padding: 0.5rem 1rem;
          background: rgba(77,163,255,0.2);
          border: 1px solid rgba(77,163,255,0.5);
          border-radius: 8px;
          transition: all 0.3s ease;
          opacity: 0;
          transform: translateY(10px);
        }

        .prj__btn:hover {
          background: rgba(77,163,255,0.4);
          box-shadow: 0 0 15px rgba(77,163,255,0.4);
        }

        .prj__card:hover .prj__btn {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 0.15s;
        }

        @media (max-width: 768px) {
          .prj { padding: 80px 1.5rem; }
          .prj__header { flex-direction: column; align-items: flex-start; gap: 1rem; }
          .prj__subtitle { text-align: left; }
          .prj__desc, .prj__btn { opacity: 1; transform: translateY(0); }
          .prj__content { transform: translateY(0); }
          .prj__overlay { background: linear-gradient(to top, rgba(4,6,11,0.98) 0%, rgba(4,6,11,0.7) 60%, rgba(4,6,11,0.3) 100%); }
        }
      `}</style>
      
      <section id="projects" className="prj">
        <div className="prj__inner">
          <div className="prj__header">
            <h2 className="prj__title">Selected <span>Work</span></h2>
            <p className="prj__subtitle">Showcasing a few of my recent projects, built with modern web technologies and a focus on performance.</p>
          </div>

          <div className="prj__grid">
            {projects.map(p => (
              <div key={p.id} className="prj__card">
                <div 
                  className="prj__bg" 
                  style={{ 
                    background: p.image ? `url(${p.image})` : p.gradient 
                  }}
                ></div>
                <div className="prj__overlay">
                  <div className="prj__content">
                    {p.badge && (
                      <div className="prj__badge">{p.badge}</div>
                    )}
                    <div className="prj__tech-stack">
                      {p.tech.map((t, i) => (
                        <span key={i} className="prj__tech-item">{t}</span>
                      ))}
                    </div>
                    <h3 className="prj__name">{p.title}</h3>
                    <p className="prj__desc">{p.description}</p>
                    <a href={p.link} className="prj__btn">View Project ↗</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default Projects;
