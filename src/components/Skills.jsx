import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const SKILLS = [
  { name: 'HTML5', path: 'html5/html5-original.svg' },
  { name: 'CSS3', path: 'css3/css3-original.svg' },
  { name: 'JavaScript', path: 'javascript/javascript-original.svg' },
  { name: 'TypeScript', path: 'typescript/typescript-original.svg' },
  { name: 'Express.js', path: 'express/express-original.svg' },
  { name: 'Node.js', path: 'nodejs/nodejs-original.svg' },
  { name: 'MongoDB', path: 'mongodb/mongodb-original.svg' },
  { name: 'React', path: 'react/react-original.svg' },
  { name: 'C', path: 'c/c-original.svg' },
  { name: 'Java', path: 'java/java-original.svg' },
  { name: 'Python', path: 'python/python-original.svg' },
  { name: 'Git', path: 'git/git-original.svg' },
  { name: 'MySQL', path: 'mysql/mysql-original.svg' },
  { name: 'Firebase', path: 'firebase/firebase-original.svg' }
];

function Skills() {
  const mountRef = useRef(null);
  const [hoveredSkill, setHoveredSkill] = useState(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth;
    const H = mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x020306, 8, 30);

    const camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 100);
    camera.position.set(0, 9, 16);
    camera.lookAt(0, -1, 0);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');
    const BASE_URL = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/';

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const mainLight = new THREE.DirectionalLight(0x4da3ff, 1);
    mainLight.position.set(5, 15, 5);
    scene.add(mainLight);

    const gridGrp = new THREE.Group();
    scene.add(gridGrp);

    // Enhanced floor grid
    const floorGeo = new THREE.PlaneGeometry(40, 40, 20, 20);
    const floorMat = new THREE.MeshBasicMaterial({ 
      color: 0x00e5ff, 
      transparent: true, 
      opacity: 0.08, 
      wireframe: true 
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.5;
    gridGrp.add(floorMesh);

    const interactables = [];
    const beams = [];
    const rings = [];
    const logos = [];

    // Increased spacing as requested
    const spacingX = 2.8;
    const spacingZ = 4.8; 
    const itemsPerRow = 6;
    const totalRows = Math.ceil(SKILLS.length / itemsPerRow);

    SKILLS.forEach((skill, i) => {
      const col = i % itemsPerRow;
      const row = Math.floor(i / itemsPerRow);

      // Determine how many items are actually in this row to ensure perfect centering
      const itemsInThisRow = Math.min(itemsPerRow, SKILLS.length - row * itemsPerRow);
      
      const x = (col - (itemsInThisRow - 1) / 2) * spacingX;
      
      // Center the rows along the Z axis 
      const rowOffset = row - (totalRows - 1) / 2;
      const z = rowOffset * spacingZ; 
      
      // Slight arch in the rows to make them curve around the viewer slightly
      const curveOffset = Math.abs(col - (itemsInThisRow - 1) / 2) * 0.2;
      const finalZ = z + curveOffset;

      const itemGrp = new THREE.Group();
      itemGrp.position.set(x, 0, finalZ);
      gridGrp.add(itemGrp);

      // Pedestal Base
      const pedGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.6, 8);
      const pedMat = new THREE.MeshStandardMaterial({ 
        color: 0x060a12, 
        roughness: 0.1, 
        metalness: 0.9 
      });
      const pedestal = new THREE.Mesh(pedGeo, pedMat);
      pedestal.position.y = -0.2;
      itemGrp.add(pedestal);

      // Rotating glowing ring
      const ringGeo = new THREE.TorusGeometry(1.0, 0.02, 16, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.3 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.1;
      itemGrp.add(ring);
      rings.push(ring);

      // Holographic Beam
      // Translate geometry up so scale.y visually shoots UP from the base
      const beamGeo = new THREE.CylinderGeometry(0.7, 0.7, 4, 32, 1, true);
      beamGeo.translate(0, 2, 0); 
      const beamMat = new THREE.MeshBasicMaterial({ 
        color: 0x00e5ff, 
        transparent: true, 
        opacity: 0.0, 
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = 0.1;
      beam.scale.y = 0; // Starts with zero height
      itemGrp.add(beam);
      beams.push(beam);

      // Floating Coin background
      const coinGeo = new THREE.CircleGeometry(0.7, 32);
      const coinMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 0.4, metalness: 0.1 });
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.position.y = 1.4;
      itemGrp.add(coin);

      // Load Logo
      const texUrl = BASE_URL + skill.path;
      textureLoader.load(texUrl, (texture) => {
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        const logoGeo = new THREE.PlaneGeometry(0.9, 0.9);
        const logoMat = new THREE.MeshBasicMaterial({ 
          map: texture, 
          transparent: true, 
          side: THREE.DoubleSide 
        });
        const logo = new THREE.Mesh(logoGeo, logoMat);
        logo.position.y = 1.4;
        logo.position.z = 0.03; 
        
        const logoBack = logo.clone();
        logoBack.rotation.y = Math.PI;
        logoBack.position.z = -0.03;

        itemGrp.add(logo);
        itemGrp.add(logoBack);
        logos.push({ coin, logo, logoBack, group: itemGrp, index: i });
      });

      // Hitbox
      const hitGeo = new THREE.CylinderGeometry(1.2, 1.2, 3, 8);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.y = 1.5;
      hitMesh.userData = { index: i, name: skill.name };
      itemGrp.add(hitMesh);
      interactables.push(hitMesh);
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let currentHoverIndex = -1;

    const onMouseMove = (e) => {
      const rect = mount.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(interactables);

      if (hits.length > 0) {
        const idx = hits[0].object.userData.index;
        if (currentHoverIndex !== idx) {
          currentHoverIndex = idx;
          setHoveredSkill(hits[0].object.userData.name);
          document.body.style.cursor = 'pointer';
        }
      } else {
        if (currentHoverIndex !== -1) {
          currentHoverIndex = -1;
          setHoveredSkill(null);
          document.body.style.cursor = 'default';
        }
      }
      
      targetGridRotation.x = mouse.y * 0.03;
      targetGridRotation.y = mouse.x * 0.05;
    };

    mount.addEventListener('mousemove', onMouseMove);

    const clock = new THREE.Clock();
    let raf;
    const targetGridRotation = { x: 0, y: 0 };

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      gridGrp.rotation.x += (targetGridRotation.x - gridGrp.rotation.x) * 4 * delta;
      gridGrp.rotation.y += (targetGridRotation.y - gridGrp.rotation.y) * 4 * delta;

      for (let i = 0; i < SKILLS.length; i++) {
        const isActive = (i === currentHoverIndex);

        // Ring animation
        rings[i].rotation.z += (isActive ? 4 : 0.5) * delta;
        rings[i].material.opacity += ((isActive ? 1.0 : 0.3) - rings[i].material.opacity) * 10 * delta;

        // Beam animation (Shoots up via scale)
        const targetBeamScale = isActive ? 1.0 : 0.0;
        const targetBeamOpacity = isActive ? 0.25 : 0.0;
        beams[i].scale.y += (targetBeamScale - beams[i].scale.y) * 8 * delta;
        beams[i].material.opacity += (targetBeamOpacity - beams[i].material.opacity) * 10 * delta;
        
        // Add pulse to beam
        if (isActive) {
           beams[i].material.opacity = 0.2 + Math.sin(time * 15) * 0.05;
        }

        const l = logos.find(lo => lo.index === i);
        if (l) {
          // Bobbing
          const baseY = 1.4 + Math.sin(time * 2 + i) * 0.15;
          const targetY = baseY + (isActive ? 0.8 : 0);
          l.coin.position.y += (targetY - l.coin.position.y) * 8 * delta;
          l.logo.position.y = l.coin.position.y;
          l.logoBack.position.y = l.coin.position.y;

          // Rotation
          const targetRot = isActive ? time * 4 : Math.sin(time * 0.5 + i) * 0.2;
          l.coin.rotation.y = targetRot;
          l.logo.rotation.y = targetRot;
          l.logoBack.rotation.y = targetRot + Math.PI;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mount.removeEventListener('mousemove', onMouseMove);
      document.body.style.cursor = 'default';
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <>
      <style>{`
        .sk {
          position: relative;
          background: #020306;
          padding: 100px 2rem 80px;
          overflow: hidden;
          color: #e8f0ff;
        }
        .sk__inner {
          max-width: 1300px;
          margin: 0 auto;
          position: relative;
        }
        .sk__header {
          text-align: left;
          margin-bottom: 2rem;
          position: relative;
          z-index: 10;
          padding-left: clamp(1rem, 4vw, 4rem);
        }
        .sk__title {
          font-family: var(--font-mono);
          font-size: clamp(2.2rem, 5vw, 3.2rem);
          font-weight: 700;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 0 0 0.5rem;
        }
        .sk__title span { color: #ffffff; }
        .sk__subtitle {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: rgba(77,163,255,0.7);
        }
        .sk__canvas-wrap {
          position: relative;
          width: 100%;
          height: 650px;
          border-radius: 20px;
          box-shadow: inset 0 0 80px rgba(0,0,0,0.9), 0 20px 50px rgba(0,0,0,0.5);
          background: radial-gradient(circle at center, rgba(10,14,22,0.6) 0%, rgba(2,3,6,1) 85%);
          border: 1px solid rgba(0, 229, 255, 0.1);
        }
        .sk__hover-badge {
          position: absolute;
          top: 40px;
          left: 50%;
          transform: translateX(-50%) translateY(20px);
          font-family: var(--font-mono);
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          color: #ffffff;
          text-shadow: 0 0 15px #00e5ff, 0 0 30px #00e5ff;
          opacity: 0;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          pointer-events: none;
          z-index: 20;
        }
        .sk__hover-badge.visible {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        .sk__decor {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          font-family: var(--font-mono);
          font-size: 0.7rem;
          letter-spacing: 0.4em;
          color: rgba(0, 229, 255, 0.3);
          pointer-events: none;
        }

        @media (max-width: 900px) {
          .sk__canvas-wrap { height: 500px; }
        }
        @media (max-width: 600px) {
          .sk { padding: 60px 1.5rem; }
          .sk__canvas-wrap { height: 400px; }
          .sk__hover-badge { font-size: 1.5rem; }
        }
      `}</style>

      <section id="skills" className="sk">
        <div className="sk__inner">
          <div className="sk__header">
            <h2 className="sk__title"><span>Skills</span></h2>
            <p className="sk__subtitle">The Tangible Toolkit</p>
          </div>

          <div className="sk__canvas-wrap">
            <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
            
            <div className={`sk__hover-badge ${hoveredSkill ? 'visible' : ''}`}>
              {hoveredSkill || 'SKILL'}
            </div>
            
            <div className="sk__decor">SYSTEM ALIGNED</div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Skills;
