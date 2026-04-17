import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

function buildTechSphere(mount, onHover) {
  const W = mount.clientWidth;
  const H = mount.clientHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
  camera.position.set(0, 0, 7);

  const LABELS = [
    'TypeScript','Node.js','Python','Docker','Git',
    'Tailwind','HTML5','React','MongoDB','PostgreSQL',
    'CSS3','MySQL','Figma','Three.js','AWS','Linux','REST API',
  ];

  const RADIUS = 2.8;
  const nodes = LABELS.map((label, i) => {
    const phi   = Math.acos(1 - 2 * (i + 0.5) / LABELS.length);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const x = RADIUS * Math.sin(phi) * Math.cos(theta);
    const y = RADIUS * Math.sin(phi) * Math.sin(theta);
    const z = RADIUS * Math.cos(phi);
    return { label, x, y, z, phase: Math.random() * Math.PI * 2 };
  });

  const EDGE_DIST = 2.6;
  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dz = nodes[i].z - nodes[j].z;
      if (Math.sqrt(dx*dx + dy*dy + dz*dz) < EDGE_DIST) edges.push([i, j]);
    }
  }

  const group = new THREE.Group();
  scene.add(group);

  const nodeMeshes = nodes.map((n) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x4da3ff, emissive: 0x1a4a8a, emissiveIntensity: 0.8, roughness: 0.2, metalness: 0.4 })
    );
    mesh.position.set(n.x, n.y, n.z);
    group.add(mesh);
    return mesh;
  });

  const edgeLines = edges.map(([i, j]) => {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(nodes[i].x, nodes[i].y, nodes[i].z),
      new THREE.Vector3(nodes[j].x, nodes[j].y, nodes[j].z),
    ]);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x4da3ff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending }));
    group.add(line);
    return line;
  });

  const dustCount = 300;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    const r = 2.2 + Math.random() * 1.8;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.random() * Math.PI;
    dustPos[i*3]   = r * Math.sin(ph) * Math.cos(th);
    dustPos[i*3+1] = r * Math.sin(ph) * Math.sin(th);
    dustPos[i*3+2] = r * Math.cos(ph);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({ size: 0.025, color: 0x00e5ff, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending });
  group.add(new THREE.Points(dustGeo, dustMat));

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const pt = new THREE.PointLight(0x4da3ff, 2.5, 12);
  pt.position.set(3, 3, 4);
  scene.add(pt);
  const pt2 = new THREE.PointLight(0x00e5ff, 1.2, 10);
  pt2.position.set(-3, -2, 3);
  scene.add(pt2);

  const raycaster = new THREE.Raycaster();
  const mouse2D = new THREE.Vector2();
  let hoveredIdx = -1;

  const onMouseMove = (e) => {
    const rect = mount.getBoundingClientRect();
    mouse2D.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    mouse2D.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse2D, camera);
    const hits = raycaster.intersectObjects(nodeMeshes);
    const newIdx = hits.length > 0 ? nodeMeshes.indexOf(hits[0].object) : -1;
    if (newIdx !== hoveredIdx) {
      if (hoveredIdx >= 0) {
        nodeMeshes[hoveredIdx].material.color.set(0x4da3ff);
        nodeMeshes[hoveredIdx].material.emissiveIntensity = 0.8;
        nodeMeshes[hoveredIdx].scale.setScalar(1);
        edgeLines.forEach((l, li) => { edgeLines[li].material.opacity = 0.18; edgeLines[li].material.color.set(0x4da3ff); });
      }
      hoveredIdx = newIdx;
      if (hoveredIdx >= 0) {
        nodeMeshes[hoveredIdx].material.color.set(0x00e5ff);
        nodeMeshes[hoveredIdx].material.emissiveIntensity = 2.2;
        nodeMeshes[hoveredIdx].scale.setScalar(1.8);
        edges.forEach(([i, j], li) => {
          if (i === hoveredIdx || j === hoveredIdx) {
            edgeLines[li].material.opacity = 0.85;
            edgeLines[li].material.color.set(0x00e5ff);
          }
        });
        onHover(nodes[hoveredIdx].label);
      } else {
        onHover(null);
      }
    }
  };
  mount.addEventListener('mousemove', onMouseMove);

  let isDragging = false, prevMouse = { x:0, y:0 }, velX = 0, velY = 0;
  const onDown = (e) => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; velX = 0; velY = 0; };
  const onUp   = ()  => { isDragging = false; };
  const onDrag = (e) => {
    if (!isDragging) return;
    velX = (e.clientX - prevMouse.x) * 0.008;
    velY = (e.clientY - prevMouse.y) * 0.008;
    prevMouse = { x: e.clientX, y: e.clientY };
  };
  mount.addEventListener('mousedown', onDown);
  window.addEventListener('mouseup', onUp);
  mount.addEventListener('mousemove', onDrag);

  const timer = new THREE.Timer();
  let raf = 0;
  const animate = () => {
    raf = requestAnimationFrame(animate);
    timer.update();
    const t = timer.getElapsed();
    if (!isDragging) { velX *= 0.95; velY *= 0.95; group.rotation.y += 0.003 + velX; group.rotation.x += velY; }
    else { group.rotation.y += velX; group.rotation.x += velY; }
    nodeMeshes.forEach((m, i) => { if (hoveredIdx !== i) m.scale.setScalar(1 + Math.sin(t * 1.2 + nodes[i].phase) * 0.12); });
    pt.position.x = Math.sin(t * 0.4) * 4;
    pt.position.z = Math.cos(t * 0.4) * 4;
    renderer.render(scene, camera);
  };
  animate();

  const onResize = () => {
    const w = mount.clientWidth, h = mount.clientHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
  };
  const ro = new ResizeObserver(onResize);
  ro.observe(mount);

  return () => {
    cancelAnimationFrame(raf); ro.disconnect();
    mount.removeEventListener('mousemove', onMouseMove);
    mount.removeEventListener('mousedown', onDown);
    window.removeEventListener('mouseup', onUp);
    mount.removeEventListener('mousemove', onDrag);
    renderer.dispose();
    if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    dustGeo.dispose(); dustMat.dispose();
  };
}

function Banner() {
  const bgRef       = useRef(null);
  const sphereRef   = useRef(null);
  const mouseRef    = useRef({ x: 0, y: 0 });
  const targetRef   = useRef({ x: 0, y: 0 });
  const parallaxRef = useRef(null);
  const [hoveredLabel, setHoveredLabel] = useState(null);

  useEffect(() => {
    const mount = bgRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x04060b, 0.07);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    if ('outputColorSpace' in renderer) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    mount.appendChild(renderer.domElement);
    const camera = new THREE.PerspectiveCamera(55, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0.8, 5.2);

    const mkCloud = (n, spread, color, size, opacity) => {
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { pos[i*3]=(Math.random()-0.5)*spread[0]; pos[i*3+1]=(Math.random()-0.5)*spread[1]; pos[i*3+2]=(Math.random()-0.5)*spread[2]; }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({ size, color: new THREE.Color(color), transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
      return { points: new THREE.Points(geo, mat), geo, mat };
    };
    const c1 = mkCloud(800, [20,12,14], '#4da3ff', 0.048, 0.9);
    const c2 = mkCloud(280, [26,16,8],  '#ffffff', 0.018, 0.35);
    const c3 = mkCloud(140, [7,7,7],    '#00e5ff', 0.035, 0.5);
    [c1,c2,c3].forEach(c => scene.add(c.points));

    const onMouse = (e) => {
      targetRef.current.x =  ((e.clientX / window.innerWidth)  - 0.5) * 2;
      targetRef.current.y = -((e.clientY / window.innerHeight) - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouse);

    const timer = new THREE.Timer();
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      timer.update();
      const t = timer.getElapsed();
      mouseRef.current.x += (targetRef.current.x - mouseRef.current.x) * 0.09;
      mouseRef.current.y += (targetRef.current.y - mouseRef.current.y) * 0.09;
      const mx = mouseRef.current.x, my = mouseRef.current.y;
      c1.points.rotation.y = t*0.035 + mx*0.55; c1.points.rotation.x = Math.sin(t*0.1)*0.05 + my*0.38;
      c2.points.rotation.y = t*0.012 + mx*0.22; c2.points.rotation.x = my*0.15;
      c3.points.rotation.y = t*0.08  + mx*0.42; c3.points.rotation.x = my*0.28;
      camera.position.x += (mx*1.1 - camera.position.x)*0.06;
      camera.position.y += (0.8 + my*0.7 - camera.position.y)*0.06;
      camera.lookAt(scene.position);
      if (parallaxRef.current) parallaxRef.current.style.transform = `translate(${mx*12}px,${my*-8}px)`;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => { camera.aspect = mount.clientWidth / mount.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(mount.clientWidth, mount.clientHeight); };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize); window.removeEventListener('mousemove', onMouse);
      cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      [c1,c2,c3].forEach(c => { c.geo.dispose(); c.mat.dispose(); });
    };
  }, []);

  useEffect(() => {
    const mount = sphereRef.current;
    if (!mount) return;
    return buildTechSphere(mount, setHoveredLabel);
  }, []);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .bnr {
          position: relative;
          width: 100%;
          height: 100vh;
          background: #04060b;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          color: #e8f0ff;
        }

        .bnr__canvas { position: absolute; inset: 0; width: 100%; height: 100%; }

        .bnr__glow-a {
          position: absolute; left: -8rem; top: 0;
          width: 30rem; height: 30rem; border-radius: 50%;
          background: radial-gradient(circle, rgba(77,163,255,0.2), transparent 70%);
          filter: blur(60px); pointer-events: none;
        }
        .bnr__glow-b {
          position: absolute; right: -4rem; bottom: -2rem;
          width: 24rem; height: 24rem; border-radius: 50%;
          background: radial-gradient(circle, rgba(0,229,255,0.1), transparent 70%);
          filter: blur(80px); pointer-events: none;
        }
        .bnr__grid {
          position: absolute; inset: 0; pointer-events: none;
          mix-blend-mode: screen; opacity: 0.03;
          background-image:
            linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px),
            linear-gradient(0deg,  rgba(255,255,255,0.09) 1px, transparent 1px);
          background-size: 100px 100px;
        }

        /* ── centred body ── */
        .bnr__body {
          position: relative; z-index: 10;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center;
          width: 100%; height: 100%;
          padding: 5rem 2rem 2rem;
          gap: 0;
        }

        .bnr__hw {
          font-family: var(--font-mono);
          font-weight: 400;
          font-size: 0.78rem;
          color: rgba(77,163,255,0.65);
          letter-spacing: 0.46em;
          text-transform: uppercase;
          margin-bottom: 1.4rem;
          animation: rise 0.65s ease both, pulseHw 3s 0.65s infinite alternate ease-in-out;
        }

        /* name wrap */
        .bnr__name-wrap {
          display: flex; flex-direction: column; align-items: center;
          margin-bottom: 1.4rem;
          animation: rise 0.85s 0.1s ease both;
          will-change: transform;
        }

        /* headline — unchanged size, sharper shadow */
        .bnr__headline {
          font-family: var(--font-sans);
          font-weight: 900;
          font-size: clamp(3.2rem, 7.8vw, 6.4rem);
          color: #ffffff;
          letter-spacing: -0.01em;
          line-height: 1.1;
          display: block;
          text-shadow:
            0 1px 0 rgba(255,255,255,0.08),
            0 4px 32px rgba(0,0,0,0.9);
        }
        .bnr__headline em {
          font-style: normal;
          background: linear-gradient(270deg, #00e5ff, #4da3ff, #00e5ff);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradeFlow 4s ease infinite;
        }

        /* accent line */
        .bnr__name-line {
          display: block; width: 3rem; height: 2px;
          background: linear-gradient(90deg, #4da3ff, #00e5ff);
          border-radius: 9999px; margin: 0.8rem auto 0;
          box-shadow: 0 0 14px rgba(77,163,255,0.7);
          animation: lineGrow 0.6s 0.5s ease both;
          transform-origin: left center;
        }

        /* tagline — bumped opacity and weight for real legibility */
        .bnr__tagline {
          font-family: var(--font-sans);
          font-weight: 400;
          font-size: clamp(1rem, 1.8vw, 1.2rem);
          color: rgba(200, 225, 255, 0.7);
          letter-spacing: 0.02em;
          line-height: 1.75;
          margin-bottom: 0.6rem;
          animation: rise 1s 0.25s ease both;
          max-width: 460px;
        }
        .bnr__tagline em {
          font-style: normal;
          font-weight: 800;
          background: linear-gradient(90deg, #4da3ff, #00e5ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* sphere */
        .bnr__sphere-wrap {
          position: relative;
          width: min(380px, 82vw);
          height: min(280px, 55vw);
          animation: rise 1s 0.35s ease both;
          margin-bottom: 0.5rem;
          cursor: grab;
        }
        .bnr__sphere-wrap:active { cursor: grabbing; }

        /* hovered node label — larger, easier to read */
        .bnr__sphere-label {
          position: absolute;
          top: 10px; left: 50%;
          transform: translateX(-50%);
          font-family: var(--font-mono);
          font-weight: 400;
          font-size: 0.78rem;
          letter-spacing: 0.2em;
          color: #00e5ff;
          text-transform: uppercase;
          pointer-events: none;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s;
          text-shadow: 0 0 16px rgba(0,229,255,0.9);
          background: rgba(4,6,11,0.55);
          padding: 0.2rem 0.7rem;
          border-radius: 4px;
        }
        .bnr__sphere-label.visible { opacity: 1; }

        /* hint — slightly brighter */
        .bnr__sphere-hint {
          font-family: var(--font-mono);
          font-weight: 300;
          font-size: 0.6rem;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: rgba(77,163,255,0.38);
          margin-bottom: 1.6rem;
          animation: rise 1s 0.45s ease both;
        }

        /* scroll */
        .bnr__scroll {
          display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
          animation: rise 1s 0.55s ease both;
        }
        .bnr__scroll-lbl {
          font-family: var(--font-mono);
          font-weight: 400;
          font-size: 0.58rem;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: rgba(77,163,255,0.45);
        }
        .bnr__scroll-mouse {
          width: 20px; height: 32px;
          border: 1px solid rgba(77,163,255,0.3);
          border-radius: 10px;
          display: flex; justify-content: center; padding-top: 5px;
        }
        .bnr__scroll-wheel {
          width: 2px; height: 6px;
          background: rgba(77,163,255,0.65);
          border-radius: 9999px;
          animation: wheelScroll 1.8s ease-in-out infinite;
        }

        @keyframes rise {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes lineGrow {
          from { transform: scaleX(0); opacity: 0; }
          to   { transform: scaleX(1); opacity: 1; }
        }
        @keyframes wheelScroll {
          0%   { opacity: 1; transform: translateY(0);   }
          75%  { opacity: 0; transform: translateY(9px); }
          100% { opacity: 0; transform: translateY(0);   }
        }
        @keyframes pulseHw {
          from { opacity: 0.6; text-shadow: 0 0 0px transparent; }
          to { opacity: 1; text-shadow: 0 0 10px rgba(77, 163, 255, 0.6); }
        }
        @keyframes gradeFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <section id="hero" className="bnr">
        <div ref={bgRef} className="bnr__canvas" />
        <div className="bnr__glow-a" />
        <div className="bnr__glow-b" />
        <div className="bnr__grid"   />

        <div className="bnr__body">

          <p className="bnr__hw">Hello, World</p>

          <div className="bnr__name-wrap" ref={parallaxRef}>
            <span className="bnr__headline">Hi, I'm <em>Samar</em></span>
            <span className="bnr__name-line" aria-hidden="true" />
          </div>
          
          <p className="bnr__tagline">
            Where <em>function </em> finds its elegance,&nbsp;I&nbsp;build.
          </p>

          <div className="bnr__sphere-wrap">
            <div ref={sphereRef} style={{ width:'100%', height:'100%' }} />
            <span className={`bnr__sphere-label${hoveredLabel ? ' visible' : ''}`}>
              {hoveredLabel || ''}
            </span>
          </div>

          <p className="bnr__sphere-hint">drag to explore · hover nodes</p>

          <div className="bnr__scroll">
            <span className="bnr__scroll-lbl">Scroll</span>
            <div className="bnr__scroll-mouse">
              <div className="bnr__scroll-wheel" />
            </div>
          </div>

        </div>
      </section>
    </>
  );
}

export default Banner;
