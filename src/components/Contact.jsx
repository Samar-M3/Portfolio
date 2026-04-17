import React, { useState } from 'react';

function Contact() {
  const [focused, setFocused] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  const handleFocus = (field) => setFocused(field);
  const handleBlur = () => setFocused(null);

  const onSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setResultMessage("");
    const formData = new FormData(event.target);

    // Provide the access key generated for samarmhrzn257@gmail.com
    formData.append("access_key", "f014a400-5ea5-4ebe-a074-7a78081978e3");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setResultMessage("Message Sent Successfully!");
        event.target.reset();
      } else {
        setResultMessage(data.message || "Something went wrong.");
      }
    } catch (error) {
      setResultMessage("Failed to send the message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        .cnt {
          position: relative;
          background: #020306;
          padding: 120px 2rem 100px;
          color: #e8f0ff;
          overflow: hidden;
        }

        .cnt::before {
          content: '';
          position: absolute;
          bottom: 0; left: 50%;
          transform: translateX(-50%);
          width: 80vw; height: 50vh;
          background: radial-gradient(ellipse at bottom, rgba(77,163,255,0.08) 0%, transparent 60%);
          pointer-events: none;
        }

        .cnt__inner {
          position: relative;
          max-width: 1000px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }

        .cnt__text {
          max-width: 450px;
        }

        .cnt__eyebrow {
          font-family: var(--font-mono);
          font-size: 0.8rem;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: #00e5ff;
          margin: 0 0 1rem;
        }

        .cnt__title {
          font-family: var(--font-sans);
          font-weight: 900;
          font-size: clamp(2.5rem, 6vw, 4rem);
          line-height: 1.1;
          color: #ffffff;
          margin: 0 0 1.5rem;
        }

        .cnt__subtitle {
          font-family: var(--font-sans);
          font-size: 1.1rem;
          line-height: 1.8;
          color: rgba(200, 220, 255, 0.7);
          margin: 0 0 2rem;
        }

        .cnt__socials {
          display: flex;
          gap: 1.5rem;
        }

        .cnt__social-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          border: 1px solid rgba(77,163,255,0.2);
          background: rgba(10,14,22,0.7);
          text-decoration: none;
          transition: all 0.3s ease;
          backdrop-filter: blur(8px);
        }
        .cnt__social-link img {
          width: 22px;
          height: 22px;
          object-fit: contain;
          transition: all 0.3s ease;
          filter: brightness(0.75) saturate(0.8);
        }
        .cnt__social-link:hover {
          transform: translateY(-3px);
          border-color: rgba(0,229,255,0.5);
          background: rgba(0,229,255,0.08);
          box-shadow: 0 8px 20px rgba(0,229,255,0.2);
        }
        .cnt__social-link:hover img {
          filter: brightness(1.2) saturate(1.2);
        }

        .cnt__form-wrap {
          background: rgba(10,14,22,0.4);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(77,163,255,0.15);
          border-radius: 20px;
          padding: 3rem 2.5rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          transition: border-color 0.4s ease, box-shadow 0.4s ease;
        }
        
        .cnt__form-wrap.focused {
          border-color: rgba(77,163,255,0.4);
          box-shadow: 0 20px 50px rgba(77,163,255,0.1);
        }

        .cnt__grp {
          position: relative;
          margin-bottom: 2rem;
        }

        .cnt__input, .cnt__textarea {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255,255,255,0.2);
          color: #ffffff;
          font-family: var(--font-sans);
          font-size: 1.05rem;
          padding: 0.5rem 0;
          outline: none;
          transition: border-color 0.3s ease;
        }

        .cnt__textarea {
          resize: vertical;
          min-height: 100px;
        }

        .cnt__label {
          position: absolute;
          left: 0;
          top: 0.5rem;
          font-family: var(--font-mono);
          font-size: 0.9rem;
          color: rgba(255,255,255,0.5);
          pointer-events: none;
          transition: all 0.3s ease;
        }

        .cnt__input:focus, .cnt__textarea:focus {
          border-bottom-color: #00e5ff;
        }

        .cnt__input:focus ~ .cnt__label, 
        .cnt__input:not(:placeholder-shown) ~ .cnt__label,
        .cnt__textarea:focus ~ .cnt__label, 
        .cnt__textarea:not(:placeholder-shown) ~ .cnt__label {
          top: -1.2rem;
          font-size: 0.75rem;
          color: #00e5ff;
        }

        .cnt__submit {
          display: block;
          width: 100%;
          background: linear-gradient(90deg, #4da3ff, #00e5ff);
          color: #04060b;
          font-family: var(--font-mono);
          font-weight: 500;
          font-size: 0.95rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border: none;
          border-radius: 8px;
          padding: 1rem;
          cursor: pointer;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 5px 15px rgba(0,229,255,0.3);
        }

        .cnt__submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0,229,255,0.5);
        }

        .cnt__submit:active {
          transform: translateY(0);
        }

        @media (max-width: 900px) {
          .cnt__inner { grid-template-columns: 1fr; gap: 3rem; }
          .cnt__form-wrap { padding: 2.5rem 1.5rem; }
        }
      `}</style>
      
      <section id="contact" className="cnt">
        <div className="cnt__inner">
          <div className="cnt__text">
            <p className="cnt__eyebrow">Get In Touch</p>
            <h2 className="cnt__title">Let's Build Something Great.</h2>
            <p className="cnt__subtitle">Whether you have an idea in mind, a project requiring development, or just want to say hi, my inbox is always open.</p>
            
            <div className="cnt__socials">
              <a href="https://github.com/Samar-M3" target="_blank" rel="noreferrer" className="cnt__social-link" title="GitHub">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg" alt="GitHub" style={{filter: 'invert(1) brightness(0.7)'}} />
              </a>
              <a href="https://www.linkedin.com/in/samar-maharjan/" target="_blank" rel="noreferrer" className="cnt__social-link" title="LinkedIn">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linkedin/linkedin-original.svg" alt="LinkedIn" />
              </a>
              <a href="https://www.instagram.com/samarmaharjan21/" target="_blank" rel="noreferrer" className="cnt__social-link" title="Instagram">
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" alt="Instagram" />
              </a>
            </div>
          </div>

          <div className={`cnt__form-wrap ${focused ? 'focused' : ''}`}>
            <form onSubmit={onSubmit}>
              <div className="cnt__grp">
                <input 
                  type="text" 
                  id="name" 
                  name="name"
                  className="cnt__input" 
                  placeholder=" " 
                  onFocus={() => handleFocus('name')} 
                  onBlur={handleBlur} 
                  required 
                />
                <label htmlFor="name" className="cnt__label">Name</label>
              </div>
              
              <div className="cnt__grp">
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  className="cnt__input" 
                  placeholder=" " 
                  onFocus={() => handleFocus('email')} 
                  onBlur={handleBlur} 
                  required 
                />
                <label htmlFor="email" className="cnt__label">Email Address</label>
              </div>
              
              <div className="cnt__grp">
                <textarea 
                  id="message" 
                  name="message"
                  className="cnt__textarea" 
                  placeholder=" " 
                  onFocus={() => handleFocus('message')} 
                  onBlur={handleBlur} 
                  required 
                ></textarea>
                <label htmlFor="message" className="cnt__label">Message</label>
              </div>
              
              <button type="submit" className="cnt__submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
              
              {resultMessage && (
                <div style={{ marginTop: '1rem', textAlign: 'center', fontFamily: "'DM Mono', monospace", color: resultMessage.includes('Success') ? '#00e5ff' : '#ff4d4d', fontSize: '0.9rem' }}>
                  {resultMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </>
  );
}

export default Contact;
