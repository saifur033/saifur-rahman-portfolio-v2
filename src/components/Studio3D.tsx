import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Studio3DProps {
  guideDialogue?: string;
  onNavigateToSection: (roomId: string, opts?: { scroll?: boolean }) => void;
  selectedRoute: 'journey' | 'research';
  tourStatus: string;
  setTourStatus: (status: string) => void;
  guideSpeech: string;
  setGuideSpeech: (speech: string) => void;
}

export const Studio3D: React.FC<Studio3DProps> = ({
  guideDialogue = '',
  onNavigateToSection,
  selectedRoute,
  tourStatus,
  setTourStatus,
  guideSpeech,
  setGuideSpeech,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fallbackActive, setFallbackActive] = useState(false);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

    let animId: number;
    let renderer: THREE.WebGLRenderer | null = null;

    try {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const width = Math.max(host.clientWidth, 320);
      const height = Math.max(host.clientHeight, 280);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#242a30');
      scene.fog = new THREE.Fog('#242a30', 36, 76);

      // Equirectangular reflection
      const reflectionCanvas = document.createElement('canvas');
      reflectionCanvas.width = 1024;
      reflectionCanvas.height = 512;
      const reflectionContext = reflectionCanvas.getContext('2d');
      if (reflectionContext) {
        const reflectionGradient = reflectionContext.createLinearGradient(0, 0, 0, 512);
        reflectionGradient.addColorStop(0, '#3d484b');
        reflectionGradient.addColorStop(0.48, '#222a2c');
        reflectionGradient.addColorStop(1, '#121617');
        reflectionContext.fillStyle = reflectionGradient;
        reflectionContext.fillRect(0, 0, 1024, 512);
        for (let x = 70; x < 1024; x += 190) {
          reflectionContext.fillStyle = '#c5a66b18';
          reflectionContext.fillRect(x, 72, 90, 310);
          reflectionContext.fillStyle = '#ffe4ad';
          reflectionContext.fillRect(x, 66, 90, 8);
        }
      }
      const reflectionTexture = new THREE.CanvasTexture(reflectionCanvas);
      reflectionTexture.mapping = THREE.EquirectangularReflectionMapping;
      reflectionTexture.colorSpace = THREE.SRGBColorSpace;
      scene.environment = reflectionTexture;
      scene.environmentIntensity = 0.42;

      const mobileView = width < 650;
      const camera = new THREE.PerspectiveCamera(mobileView ? 49 : 45, width / height, 0.1, 100);
      camera.position.set(0, 6.35, 15.8);
      const lookTarget = new THREE.Vector3(0, 2.15, -1.7);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.14;

      renderer.domElement.setAttribute('aria-hidden', 'true');
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';

      // Clear any prior children except signage
      const priorCanvases = host.querySelectorAll('canvas');
      priorCanvases.forEach((c) => c.remove());
      host.appendChild(renderer.domElement);

      const signageLayer = document.createElement('div');
      signageLayer.className = 'room-sign-overlays';
      signageLayer.setAttribute('aria-hidden', 'true');
      host.appendChild(signageLayer);

      let signageHalfWidth = 0;
      const sizeSignage = (hostWidth: number) => {
        const signWidth = Math.max(32, Math.min(126, hostWidth * 0.104));
        signageHalfWidth = (signWidth / hostWidth) * 50;
        signageLayer.style.setProperty('--sign-font-size', `${Math.max(7.5, Math.min(14, hostWidth * 0.023))}px`);
        signageLayer.style.setProperty('--sign-width', `${signWidth}px`);
      };
      sizeSignage(width);

      // Lighting
      scene.add(new THREE.HemisphereLight(0xe3e9ef, 0x4a4137, 1.75));
      const sunlight = new THREE.DirectionalLight(0xffe8c6, 2.1);
      sunlight.position.set(-7, 12, 8);
      sunlight.castShadow = true;
      scene.add(sunlight);

      const warmLamp = new THREE.PointLight(0xffd294, 14, 16, 2);
      warmLamp.position.set(3.4, 4.1, 1.8);
      scene.add(warmLamp);

      const cyanWash = new THREE.PointLight(0x54bfc7, 3, 17, 2);
      cyanWash.position.set(-7.4, 3.1, -2.5);
      scene.add(cyanWash);

      const lobbyFill = new THREE.PointLight(0xf3dfbd, 12, 20, 2);
      lobbyFill.position.set(0, 5.8, 1.2);
      scene.add(lobbyFill);

      const warmFill = new THREE.PointLight(0xffd5a0, 9, 18, 2);
      warmFill.position.set(-1, 5, -5);
      scene.add(warmFill);

      const material = (color: string | number, roughness = 0.72, metalness = 0) =>
        new THREE.MeshStandardMaterial({ color, roughness, metalness });

      function walnutTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
          gradient.addColorStop(0, '#39251d');
          gradient.addColorStop(0.48, '#60402e');
          gradient.addColorStop(1, '#38241c');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          for (let i = 0; i < 38; i++) {
            const x = i * 14;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.bezierCurveTo(x + Math.sin(i * 1.7) * 12, 160, x + Math.cos(i * 0.8) * 9, 340, x + Math.sin(i) * 8, 512);
            ctx.strokeStyle = i % 5 === 0 ? '#bd906126' : '#e4bd8d0c';
            ctx.lineWidth = i % 5 === 0 ? 3 : 1;
            ctx.stroke();
          }
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
      }

      const M = {
        ivory: material('#f7f2e8'),
        wall: material('#e8d8c3'),
        navy: material('#173347', 0.55),
        oak: material('#91643d', 0.58),
        oakLight: material('#bd9565', 0.55),
        walnut: new THREE.MeshStandardMaterial({ map: walnutTexture(), roughness: 0.52, metalness: 0.025 }),
        walnutLight: material('#745035', 0.38),
        brass: material('#c7a15d', 0.32, 0.55),
        bronze: material('#433a32', 0.34, 0.72),
        teal: material('#0f766e', 0.52),
        glass: new THREE.MeshPhysicalMaterial({ color: '#d5e2e6', roughness: 0.14, metalness: 0.04, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false }),
        doorGlass: new THREE.MeshPhysicalMaterial({ color: '#d8e3e6', roughness: 0.16, metalness: 0.035, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false }),
        skin: material('#c9845b'),
        skin2: material('#e0a77e'),
        hair: material('#282321', 0.82),
        hair2: material('#211b1a'),
        shirt: material('#f7f6f1'),
        trousers: material('#c7b08d'),
        black: material('#202a31', 0.4),
        chairLeather: material('#46535a', 0.58),
        chairFrame: material('#927850', 0.48, 0.28),
        white: material('#fffdf8'),
        green: material('#4f806a'),
        soil: material('#514031'),
        floor: material('#ded2bf', 0.82),
        sofa: material('#c9c2b5'),
        rust: material('#b94722'),
      };

      function mesh(geometry: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0, cast = true) {
        const object = new THREE.Mesh(geometry, mat);
        object.position.set(x, y, z);
        object.castShadow = cast;
        object.receiveShadow = true;
        parent.add(object);
        return object;
      }

      function box(parent: THREE.Object3D, w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, cast = true) {
        return mesh(new THREE.BoxGeometry(w, h, d), mat, parent, x, y, z, cast);
      }

      function cylinder(parent: THREE.Object3D, top: number, bottom: number, h: number, mat: THREE.Material, x: number, y: number, z: number, segments = 16) {
        return mesh(new THREE.CylinderGeometry(top, bottom, h, segments), mat, parent, x, y, z);
      }

      function sphere(parent: THREE.Object3D, r: number, mat: THREE.Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) {
        const item = mesh(new THREE.SphereGeometry(r, 18, 14), mat, parent, x, y, z);
        item.scale.set(sx, sy, sz);
        return item;
      }

      function marbleTexture(baseColor: string, veinColor: string, repeatX = 1, repeatY = 1) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = baseColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          for (let i = 0; i < 8; i++) {
            const startY = ((i * 73 + 31) % 570) - 30;
            const slope = ((i % 3) - 1) * 52;
            ctx.beginPath();
            ctx.moveTo(-30, startY);
            ctx.bezierCurveTo(120, startY + slope, 300, startY - slope * 0.7, 545, startY + slope * 0.3);
            ctx.strokeStyle = veinColor;
            ctx.globalAlpha = i % 3 === 0 ? 0.42 : 0.19;
            ctx.lineWidth = i % 3 === 0 ? 2.1 : 1;
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeatX, repeatY);
        return texture;
      }

      const blackMarble = marbleTexture('#292b2d', '#c8aa7b', 1.4, 1);
      const charcoalMarble = marbleTexture('#383633', '#c8aa7b', 2, 1.5);
      const lobbyStone = marbleTexture('#57534d', '#b79a6a', 2.4, 1.8);

      // Floor & Wall
      const marbleFloor = new THREE.MeshStandardMaterial({ map: lobbyStone, roughness: 0.3, metalness: 0.045 });
      box(scene, 28, 0.28, 25, marbleFloor, 0, -0.18, -1.2, false);
      box(scene, 22, 0.08, 0.16, M.oak, 0, 0.02, -5.7, false);
      box(scene, 21.2, 7.4, 0.22, new THREE.MeshStandardMaterial({
        map: charcoalMarble,
        roughness: 0.38,
        metalness: 0.16,
      }), 0, 3.7, -11.28, false);

      const coveLight = new THREE.MeshStandardMaterial({
        color: '#fff0d2',
        emissive: '#f2c987',
        emissiveIntensity: 0.8,
        roughness: 0.25,
      });
      box(scene, 20.8, 0.055, 0.045, coveLight, 0, 7.15, -11.12, false);
      box(scene, 20.8, 0.045, 0.04, M.brass, 0, 0.16, -11.12, false);

      [-10.35, -7.8, -5.2, -2.6, 0, 2.6, 5.2, 7.8, 10.35].forEach((x) => {
        box(scene, 0.035, 7.1, 0.04, M.brass, x, 3.7, -11.12, false);
      });

      [-7, 0, 7].forEach((x) => {
        const wallWash = new THREE.PointLight(0xffd49a, 5.5, 9, 2);
        wallWash.position.set(x, 5.2, -8.7);
        scene.add(wallWash);
      });

      // Ceiling Downlights
      const ceilingDownlight = new THREE.MeshStandardMaterial({
        color: '#fff3dc',
        emissive: '#f6ddb0',
        emissiveIntensity: 0.65,
        roughness: 0.3,
      });
      [-7.2, -3.6, 0, 3.6, 7.2].forEach((x) => {
        [-2.6, 1.7].forEach((z) => {
          box(scene, 1.65, 0.07, 0.62, M.bronze, x, 6.48, z, false);
          box(scene, 1.42, 0.035, 0.4, ceilingDownlight, x, 6.42, z, false);
          const downlight = new THREE.PointLight(0xffe0b2, 3.8, 9, 2);
          downlight.position.set(x, 6.16, z);
          scene.add(downlight);
        });
      });

      // Window and outdoor greenery
      box(scene, 0.16, 5.4, 10, M.oak, -10.6, 2.7, -0.1, false);
      box(scene, 0.1, 4.6, 8.9, M.glass, -10.48, 2.8, -0.2, false);
      for (let i = 0; i < 7; i++) {
        const trunk = cylinder(scene, 0.055, 0.075, 1.2 + (i % 3) * 0.35, M.oak, -11.0, 0.8, -4.1 + i * 1.25, 8);
        trunk.rotation.z = i % 2 ? -0.12 : 0.12;
        sphere(scene, 0.42 + (i % 3) * 0.08, M.green, -11.05, 1.65 + (i % 2) * 0.35, -4.1 + i * 1.25, 1.0, 1.25, 0.8);
      }

      // Door Definitions
      const doorDefs = [
        { key: 'about', label: 'ABOUT & CAREER', x: -8.85, accent: '#54d9e8' },
        { key: 'projects', label: 'PROJECTS & INNOVATION', x: -6.32, accent: '#a78bfa' },
        { key: 'publications', label: 'PUBLICATIONS', x: -3.79, accent: '#55cdb6' },
        { key: 'outreach', label: 'CLUBS & OUTREACH', x: -1.26, accent: '#f2bd67' },
        { key: 'certificates', label: 'CERTIFICATES', x: 1.26, accent: '#67b7ff' },
        { key: 'trophies', label: 'TROPHY ROOM', x: 3.79, accent: '#f2a86b' },
        { key: 'gallery', label: 'EVENT GALLERY', x: 6.32, accent: '#df86d8' },
        { key: 'contact', label: 'CONTACT', x: 8.85, accent: '#69ddad' },
      ];

      const doorGroups: Record<string, any> = {};
      const pickableDoors: { object: THREE.Object3D; id: string }[] = [];
      const signOverlays: { element: HTMLElement; position: THREE.Vector3; projected: THREE.Vector3 }[] = [];

      function textTexture(text: string, accent = '#e8c98a') {
        const canvas = document.createElement('canvas');
        const welcomePlaque = text === 'Welcome';
        canvas.width = welcomePlaque ? 1024 : 2048;
        canvas.height = welcomePlaque ? 256 : 1024;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = welcomePlaque ? '#11151b' : '#111920';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = welcomePlaque ? '#c7a15d' : accent;
          ctx.lineWidth = welcomePlaque ? 8 : 10;
          ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
          ctx.fillStyle = welcomePlaque ? '#f4d38d' : '#f4f7ff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const parts = text.split(' & ');
          const lines = welcomePlaque
            ? [text]
            : parts.length > 1
            ? [`${parts[0]} &`, parts[1]]
            : text.length > 9 && text.includes(' ')
            ? text.split(' ')
            : [text];
          let fontSize = welcomePlaque ? 132 : lines.length > 1 ? 270 : 260;
          ctx.font = `700 ${fontSize}px Manrope, sans-serif`;
          const lineHeight = lines.length > 1 ? 300 : 0;
          lines.forEach((line, index) => {
            ctx.fillText(
              line,
              canvas.width / 2,
              lines.length > 1 ? canvas.height / 2 + (index - (lines.length - 1) / 2) * lineHeight : canvas.height / 2,
              canvas.width - 96
            );
          });
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return new THREE.MeshBasicMaterial({ map: texture, depthWrite: true });
      }

      // Room Bays & Doorways
      doorDefs.forEach((d) => {
        box(scene, 0.14, 4.2, 0.16, M.brass, d.x - 1.0, 2.1, -5.82, false);
        box(scene, 0.14, 4.2, 0.16, M.brass, d.x + 1.0, 2.1, -5.82, false);
        box(scene, 2.2, 0.28, 0.3, M.brass, d.x, 4.42, -5.82, false);

        const hinge = new THREE.Group();
        hinge.position.set(d.x - 0.91, 0, -5.68);
        scene.add(hinge);

        const doorLeaf = box(hinge, 1.68, 3.38, 0.07, M.doorGlass, 0.91, 1.78, 0, true);
        box(hinge, 0.075, 3.58, 0.1, M.bronze, 0.08, 1.78, 0.07, false);
        box(hinge, 0.075, 3.58, 0.1, M.bronze, 1.74, 1.78, 0.07, false);

        box(scene, 2.49, 1.29, 0.1, M.bronze, d.x, 5.26, -5.68, false);
        const sign = mesh(new THREE.PlaneGeometry(2.4, 1.2), textTexture(d.label, d.accent), scene, d.x, 5.26, -5.585, false);

        const signOverlay = document.createElement('div');
        signOverlay.className = 'room-sign-overlay';
        signOverlay.textContent = d.label;
        signOverlay.style.setProperty('--sign-accent', d.accent);
        signageLayer.appendChild(signOverlay);
        signOverlays.push({
          element: signOverlay,
          position: new THREE.Vector3(d.x, 5.26, -5.585),
          projected: new THREE.Vector3(),
        });

        const signGlow = new THREE.PointLight(d.accent, 1.1, 4.2, 2);
        signGlow.position.set(d.x, 4.55, -4.8);
        scene.add(signGlow);

        doorGroups[d.key] = { hinge, sign, x: d.x, label: d.label };
        pickableDoors.push({ object: doorLeaf, id: d.key });
        pickableDoors.push({ object: sign, id: d.key });

        // Room interior decorative backdrop
        const interior = new THREE.Group();
        interior.position.set(d.x, 0, -9.15);
        scene.add(interior);
        box(interior, 2.2, 2.85, 0.1, M.walnut, 0, 1.58, -1.35, false);
        box(interior, 2.22, 0.14, 2.65, M.oak, 0, 0.07, 0.15, false);
      });

      // Reception desk
      const desk = new THREE.Group();
      desk.position.set(3.4, 0, 1.5);
      desk.scale.set(1.35, 0.8, 1.2);
      scene.add(desk);
      box(desk, 5.7, 1.18, 1.55, new THREE.MeshStandardMaterial({ map: blackMarble, roughness: 0.24, metalness: 0.2 }), 0, 0.68, 0);
      box(desk, 5.88, 0.18, 1.72, new THREE.MeshStandardMaterial({ map: blackMarble, roughness: 0.12, metalness: 0.24 }), 0, 1.34, 0);
      box(desk, 2.9, 0.5, 0.055, M.brass, 0, 0.72, 0.94, false);
      mesh(new THREE.PlaneGeometry(2.8, 0.42), textTexture('Welcome'), desk, 0, 0.72, 0.975, false);

      // Characters: Guide & Receptionist
      function makeCharacter({ x, z, isGuide = false, seated = false }: { x: number; z: number; isGuide?: boolean; seated?: boolean }) {
        const root = new THREE.Group();
        root.position.set(x, 0, z);
        scene.add(root);
        const body = new THREE.Group();
        root.add(body);
        const skin = isGuide ? M.skin2 : M.skin;
        const jacket = isGuide ? M.navy : M.teal;

        box(body, seated ? 0.72 : 0.66, seated ? 0.78 : 0.88, 0.36, jacket, 0, seated ? 1.56 : 1.23, 0);
        cylinder(body, 0.105, 0.11, 0.22, skin, 0, seated ? 1.87 : 1.78, 0, 12);
        sphere(body, 0.37, skin, 0, seated ? 2.23 : 2.15, 0.02, 0.9, 1.05, 0.86);
        sphere(body, 0.375, isGuide ? M.hair : M.hair2, 0, seated ? 2.43 : 2.35, -0.015, 1.02, 0.6, 0.92);

        const arms: THREE.Group[] = [];
        [-1, 1].forEach((side) => {
          const arm = new THREE.Group();
          arm.position.set(side * 0.38, seated ? 1.78 : 1.5, 0);
          body.add(arm);
          arms.push(arm);
          cylinder(arm, 0.105, 0.12, 0.52, jacket, side * 0.03, -0.2, 0, 12).rotation.z = side * -0.14;
        });

        if (seated) {
          box(body, 0.25, 0.28, 0.62, M.trousers, -0.2, 0.72, 0.32).rotation.x = Math.PI / 2;
          box(body, 0.25, 0.28, 0.62, M.trousers, 0.2, 0.72, 0.32).rotation.x = Math.PI / 2;
        } else {
          [-0.17, 0.17].forEach((lx) => {
            cylinder(body, 0.115, 0.14, 0.72, M.trousers, lx, 0.43, 0, 12);
          });
        }

        root.userData = { body, arms, isGuide, seated, home: new THREE.Vector3(x, 0, z) };
        return root;
      }

      const guide = makeCharacter({ x: -2.8, z: 2.7, isGuide: true });
      const receptionist = makeCharacter({ x: 3.05, z: -0.1, seated: true });
      receptionist.rotation.y = 0.62;

      const roomMap: Record<string, { x: number; z: number; label: string; door: string }> = {
        about: { x: -8.85, z: -9.1, label: 'About & Career', door: 'about' },
        projects: { x: -6.32, z: -9.1, label: 'Projects & Innovation', door: 'projects' },
        publications: { x: -3.79, z: -9.1, label: 'Publications', door: 'publications' },
        outreach: { x: -1.26, z: -9.1, label: 'Clubs & Outreach', door: 'outreach' },
        certificates: { x: 1.26, z: -9.1, label: 'Certificates', door: 'certificates' },
        trophies: { x: 3.79, z: -9.1, label: 'Trophy Room', door: 'trophies' },
        gallery: { x: 6.32, z: -9.1, label: 'Event Gallery', door: 'gallery' },
        contact: { x: 8.85, z: -9.1, label: 'Contact', door: 'contact' },
      };

      let state: 'idle' | 'walking' | 'opening' | 'entering' | 'resetting' = 'idle';
      let route: { x: number; z: number }[] = [];
      let target: any = null;
      let doorState: any = null;
      let lastTime = performance.now();
      let elapsed = 0;
      let cameraX = camera.position.x;
      let cameraZ = camera.position.z;
      let cameraY = camera.position.y;
      let cameraLookX = lookTarget.x;
      let cameraLookZ = lookTarget.z;

      function go(id: string) {
        const room = roomMap[id];
        if (!room || state !== 'idle') return false;
        target = { id, ...room };
        setActiveRoom(id);
        state = 'walking';
        route = [
          { x: -2.8, z: 2.7 },
          { x: -2.8, z: 3.0 },
          { x: room.x, z: 3.6 },
          { x: room.x, z: -4.65 },
        ];
        setTourStatus(`Your guide is walking to ${room.label}.`);
        setGuideSpeech(guideDialogue || `Follow me to ${room.label}.`);
        onNavigateToSection(id, { scroll: false });
        return true;
      }

      function finishTour() {
        const finished = target;
        state = 'resetting';
        route = [];
        doorState = null;
        setTourStatus(`Arrived at ${finished.label}. The related section is ready below.`);
        setGuideSpeech(`Here we are: ${finished.label}. Explore the details below!`);
        onNavigateToSection(finished.id, { scroll: true });

        window.setTimeout(() => {
          if (doorGroups[finished.door]) doorGroups[finished.door].hinge.rotation.y = 0;
          guide.position.copy(guide.userData.home);
          guide.rotation.y = 0;
          target = null;
          state = 'idle';
          cameraX = 0;
          cameraZ = 15.8;
          cameraY = 6.35;
          cameraLookX = 0;
          cameraLookZ = -1.7;
        }, reducedMotion ? 0 : 1400);
      }

      // Pointer / Raycasting for clickable doors
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const pickableObjects = pickableDoors.map((d) => d.object);

      const roomAtPointer = (event: MouseEvent) => {
        if (!renderer) return null;
        const bounds = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const intersection = raycaster.intersectObjects(pickableObjects, false)[0];
        const selectedDoor = intersection && intersection.object;
        return pickableDoors.find((door) => door.object === selectedDoor);
      };

      const handlePointerMove = (event: MouseEvent) => {
        if (!renderer) return;
        renderer.domElement.style.cursor = roomAtPointer(event) ? 'pointer' : 'default';
      };

      const handleClick = (event: MouseEvent) => {
        const found = roomAtPointer(event);
        if (found) go(found.id);
      };

      renderer.domElement.addEventListener('mousemove', handlePointerMove);
      renderer.domElement.addEventListener('click', handleClick);

      // Global navigation hook
      (window as any).sr3dNavigate = (id: string) => go(id);

      // Animation Loop
      function animate(now: number) {
        animId = requestAnimationFrame(animate);
        const dt = Math.min((now - lastTime) / 1000, 0.045);
        lastTime = now;
        elapsed += dt;

        if (!reducedMotion) {
          guide.userData.body.position.y = Math.sin(elapsed * 2.5) * 0.018;
          receptionist.rotation.y = 0.62 + Math.sin(elapsed * 0.7) * 0.035;
        }

        if (state === 'walking' && route.length) {
          const next = route[0];
          const dx = next.x - guide.position.x;
          const dz = next.z - guide.position.z;
          const distance = Math.hypot(dx, dz);
          if (distance < 0.11) {
            guide.position.x = next.x;
            guide.position.z = next.z;
            route.shift();
            if (!route.length && target) {
              state = 'opening';
              const door = doorGroups[target.door];
              doorState = { door, started: now };
              setTourStatus(`Opening the ${target.label} door.`);
            }
          } else {
            const step = Math.min(distance, dt * (reducedMotion ? 2.8 : 1.65));
            guide.position.x += (dx / distance) * step;
            guide.position.z += (dz / distance) * step;
            guide.rotation.y = Math.atan2(dx, dz);
          }
        } else if (state === 'opening' && doorState) {
          const t = Math.min((now - doorState.started) / (reducedMotion ? 1 : 650), 1);
          doorState.door.hinge.rotation.y = -1.12 * t;
          if (t >= 1) {
            state = 'entering';
            route = [{ x: target.x, z: target.z }];
          }
        } else if (state === 'entering' && route.length) {
          const next = route[0];
          const dx = next.x - guide.position.x;
          const dz = next.z - guide.position.z;
          const distance = Math.hypot(dx, dz);
          if (distance < 0.12) {
            guide.position.x = next.x;
            guide.position.z = next.z;
            route = [];
            finishTour();
          } else {
            const step = Math.min(distance, dt * (reducedMotion ? 2.8 : 1.35));
            guide.position.x += (dx / distance) * step;
            guide.position.z += (dz / distance) * step;
            guide.rotation.y = Math.atan2(dx, dz);
          }
        }

        if (state === 'walking' || state === 'opening' || state === 'entering') {
          cameraX = guide.position.x;
          cameraZ = guide.position.z + 1.7;
          cameraY = 4.6;
          cameraLookX = guide.position.x;
          cameraLookZ = guide.position.z - 1.2;
        }

        camera.position.x += (cameraX - camera.position.x) * Math.min(1, dt * 1.8);
        camera.position.z += (cameraZ - camera.position.z) * Math.min(1, dt * 1.8);
        camera.position.y += (cameraY - camera.position.y) * Math.min(1, dt * 1.4);
        lookTarget.x += (cameraLookX - lookTarget.x) * Math.min(1, dt * 1.5);
        lookTarget.z += (cameraLookZ - lookTarget.z) * Math.min(1, dt * 1.5);
        camera.lookAt(lookTarget);

        // Sign overlays positioning
        signOverlays.forEach(({ element, position, projected }) => {
          projected.copy(position).project(camera);
          const visible =
            projected.z >= -1 &&
            projected.z <= 1 &&
            projected.x >= -1 &&
            projected.x <= 1 &&
            projected.y >= -1 &&
            projected.y <= 1;
          element.style.visibility = visible ? 'visible' : 'hidden';
          if (visible) {
            const screenX = (projected.x * 0.5 + 0.5) * 100;
            element.style.left = `${Math.max(signageHalfWidth, Math.min(100 - signageHalfWidth, screenX))}%`;
            element.style.top = `${(-projected.y * 0.5 + 0.5) * 100}%`;
          }
        });

        if (renderer) renderer.render(scene, camera);
      }

      animId = requestAnimationFrame(animate);

      // Resize Observer
      const handleResize = () => {
        if (!host || !renderer) return;
        const w = host.clientWidth;
        const h = host.clientHeight;
        if (!w || !h) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        sizeSignage(w);
      };

      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(host);

      return () => {
        cancelAnimationFrame(animId);
        resizeObserver.disconnect();
        if (renderer) {
          renderer.domElement.removeEventListener('mousemove', handlePointerMove);
          renderer.domElement.removeEventListener('click', handleClick);
          renderer.dispose();
          if (renderer.domElement.parentElement) {
            renderer.domElement.parentElement.removeChild(renderer.domElement);
          }
        }
        signageLayer.remove();
      };
    } catch (e) {
      console.warn('3D Studio initialization failed; activating accessible fallback', e);
      setFallbackActive(true);
    }
  }, [guideDialogue, onNavigateToSection]);

  const handleRoomClick = (roomId: string) => {
    setActiveRoom(roomId);
    if ((window as any).sr3dNavigate) {
      const navigated = (window as any).sr3dNavigate(roomId);
      if (!navigated) {
        onNavigateToSection(roomId);
      }
    } else {
      onNavigateToSection(roomId);
    }
  };

  const rooms = [
    { id: 'about', label: 'About & Career' },
    { id: 'projects', label: 'Projects & Innovation' },
    { id: 'publications', label: 'Publications' },
    { id: 'outreach', label: 'Clubs & Outreach' },
    { id: 'certificates', label: 'Certificates' },
    { id: 'trophies', label: 'Trophy Room' },
    { id: 'gallery', label: 'Event Gallery' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <div className="studio-wrap">
      <div
        id="studio3d"
        ref={containerRef}
        data-guide-dialogue={guideDialogue}
        aria-label="Interactive 3D office. Choose a room button to follow the guide."
        style={{ position: 'relative', width: '100%', minHeight: '340px' }}
      >
        {fallbackActive && (
          <div className="scene-fallback">
            <div className="fallback-window" aria-hidden="true">☀</div>
            <div className="fallback-shelf" aria-hidden="true">▰　▰　▰</div>
            <div className="fallback-guide" aria-hidden="true">◉<small>Tour guide</small></div>
            <div className="fallback-desk" aria-hidden="true">RECEPTION</div>
            <div className="fallback-person" aria-hidden="true">◉<small>Receptionist</small></div>
          </div>
        )}
      </div>

      <p className="tour-status" id="tourStatus" aria-live="polite">
        {tourStatus || 'Choose a room to begin exploring.'}
      </p>

      <nav className="room-nav" aria-label="Portfolio rooms">
        {rooms.map((room) => (
          <button
            key={room.id}
            data-room={room.id}
            type="button"
            className={activeRoom === room.id ? 'active' : ''}
            aria-pressed={activeRoom === room.id}
            onClick={() => handleRoomClick(room.id)}
          >
            {room.label}
          </button>
        ))}
      </nav>
    </div>
  );
};
