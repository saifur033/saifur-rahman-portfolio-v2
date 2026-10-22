/* Saifur Rahman Digital Studio — procedural Three.js scene.
 * Three.js 0.180.0 is loaded by the pinned import map in home.html.
 * The HTML portfolio and room navigation remain usable if WebGL/CDN fails.
 */
(() => {
    const $ = (selector) => document.querySelector(selector);
    const host = $('#studio3d');
    if (!host) return;

    const fallback = host.querySelector('.scene-fallback');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    import ('three').then((THREE) => {
        const width = Math.max(host.clientWidth, 320);
        const height = Math.max(host.clientHeight, 280);
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#242a30');
        scene.fog = new THREE.Fog('#242a30', 36, 76);
        const reflectionCanvas = document.createElement('canvas');
        reflectionCanvas.width = 1024;
        reflectionCanvas.height = 512;
        const reflectionContext = reflectionCanvas.getContext('2d');
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
        const reflectionTexture = new THREE.CanvasTexture(reflectionCanvas);
        reflectionTexture.mapping = THREE.EquirectangularReflectionMapping;
        reflectionTexture.colorSpace = THREE.SRGBColorSpace;
        scene.environment = reflectionTexture;
        scene.environmentIntensity = 0.42;

        const mobileView = width < 650;
        const camera = new THREE.PerspectiveCamera(mobileView ? 49 : 45, width / height, 0.1, 100);
        camera.position.set(0, 6.35, 15.8);
        const lookTarget = new THREE.Vector3(0, 2.15, -1.7);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.14;
        host.appendChild(renderer.domElement);
        renderer.domElement.setAttribute('aria-hidden', 'true');
        if (fallback) fallback.style.display = 'none';
        host.classList.add('scene-ready');
        const signageLayer = document.createElement('div');
        signageLayer.className = 'room-sign-overlays';
        signageLayer.setAttribute('aria-hidden', 'true');
        host.appendChild(signageLayer);
        let signageHalfWidth = 0;
        const sizeSignage = (hostWidth) => {
            const signWidth = Math.max(32, Math.min(126, hostWidth * 0.104));
            signageHalfWidth = signWidth / hostWidth * 50;
            signageLayer.style.setProperty('--sign-font-size', `${Math.max(7.5, Math.min(14, hostWidth * 0.023))}px`);
            signageLayer.style.setProperty('--sign-width', `${signWidth}px`);
        };
        sizeSignage(width);

        scene.add(new THREE.HemisphereLight(0xe3e9ef, 0x4a4137, 1.75));
        const sunlight = new THREE.DirectionalLight(0xffe8c6, 2.1);
        sunlight.position.set(-7, 12, 8);
        sunlight.castShadow = true;
        sunlight.shadow.mapSize.set(2048, 2048);
        sunlight.shadow.camera.left = -13;
        sunlight.shadow.camera.right = 13;
        sunlight.shadow.camera.top = 12;
        sunlight.shadow.camera.bottom = -12;
        sunlight.shadow.bias = -0.00025;
        sunlight.shadow.normalBias = 0.025;
        sunlight.shadow.radius = 4;
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

        const material = (color, roughness = 0.72, metalness = 0) =>
            new THREE.MeshStandardMaterial({ color, roughness, metalness });
        function walnutTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
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
            glass: new THREE.MeshPhysicalMaterial({ color: '#d5e2e6', roughness: 0.14, metalness: 0.04, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.5, clearcoat: 0.9, clearcoatRoughness: 0.1 }),
            doorGlass: new THREE.MeshPhysicalMaterial({ color: '#d8e3e6', roughness: 0.16, metalness: 0.035, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.55, clearcoat: 0.92, clearcoatRoughness: 0.08 }),
            frostedGlass: new THREE.MeshPhysicalMaterial({ color: '#d7dedc', roughness: 0.36, metalness: 0.12, transparent: true, opacity: 0.34, side: THREE.DoubleSide, depthWrite: false, clearcoat: 0.45 }),
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
            rust: material('#b94722')
        };

        function mesh(geometry, mat, parent, x = 0, y = 0, z = 0, cast = true) {
            const object = new THREE.Mesh(geometry, mat);
            object.position.set(x, y, z);
            object.castShadow = cast;
            object.receiveShadow = true;
            parent.add(object);
            return object;
        }

        function box(parent, w, h, d, mat, x, y, z, cast = true) {
            return mesh(new THREE.BoxGeometry(w, h, d), mat, parent, x, y, z, cast);
        }

        function cylinder(parent, top, bottom, h, mat, x, y, z, segments = 16) {
            return mesh(new THREE.CylinderGeometry(top, bottom, h, segments), mat, parent, x, y, z);
        }

        function sphere(parent, r, mat, x, y, z, sx = 1, sy = 1, sz = 1) {
            const item = mesh(new THREE.SphereGeometry(r, 18, 14), mat, parent, x, y, z);
            item.scale.set(sx, sy, sz);
            return item;
        }

        function marbleTexture(baseColor, veinColor, repeatX = 1, repeatY = 1) {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = baseColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const glow = ctx.createRadialGradient(180, 120, 15, 260, 280, 420);
            glow.addColorStop(0, '#ffffff12');
            glow.addColorStop(1, '#00000024');
            ctx.fillStyle = glow;
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
                if (i % 2 === 0) {
                    ctx.beginPath();
                    ctx.moveTo(205 + i * 9, startY + slope * 0.15);
                    ctx.quadraticCurveTo(245 + i * 8, startY + 18, 286 + i * 7, startY + 36);
                    ctx.strokeStyle = veinColor;
                    ctx.globalAlpha = 0.13;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
            ctx.globalAlpha = 1;
            const texture = new THREE.CanvasTexture(canvas);
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(repeatX, repeatY);
            return texture;
        }
        const blackMarble = marbleTexture('#292b2d', '#c8aa7b', 1.4, 1);
        const charcoalMarble = marbleTexture('#383633', '#c8aa7b', 2, 1.5);
        const ivoryMarble = marbleTexture('#d8d3c8', '#938c7e', 4, 3);
        const lobbyStone = marbleTexture('#57534d', '#b79a6a', 2.4, 1.8);

        // Architectural shell, polished floor, oak trims and large daylight window.
        const marbleFloor = new THREE.MeshStandardMaterial({ map: lobbyStone, roughness: 0.3, metalness: 0.045 });
        box(scene, 28, 0.28, 25, marbleFloor, 0, -0.18, -1.2, false);
        box(scene, 22, 0.08, 0.16, M.oak, 0, 0.02, -5.7, false);
        box(scene, 21.2, 7.4, 0.22, new THREE.MeshStandardMaterial({
            map: charcoalMarble,
            roughness: 0.38,
            metalness: 0.16
        }), 0, 3.7, -11.28, false);
        const coveLight = new THREE.MeshStandardMaterial({
            color: '#fff0d2',
            emissive: '#f2c987',
            emissiveIntensity: 0.8,
            roughness: 0.25,
            metalness: 0.12
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
        const ceilingDownlight = new THREE.MeshStandardMaterial({
            color: '#fff3dc',
            emissive: '#f6ddb0',
            emissiveIntensity: 0.65,
            roughness: 0.3
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
        // Windows on the left wall.
        box(scene, 0.16, 5.4, 10, M.oak, -10.6, 2.7, -0.1, false);
        box(scene, 0.1, 4.6, 8.9, M.glass, -10.48, 2.8, -0.2, false);
        [-4.4, -1.5, 1.4].forEach((z) => box(scene, 0.14, 4.8, 0.12, M.brass, -10.36, 2.8, z, false));
        box(scene, 0.14, 0.12, 8.9, M.brass, -10.36, 2.8, -0.2, false);
        // Soft outdoor silhouettes beyond the glass.
        for (let i = 0; i < 7; i++) {
            const trunk = cylinder(scene, 0.055, 0.075, 1.2 + (i % 3) * 0.35, M.oak, -11.0, 0.8, -4.1 + i * 1.25, 8);
            trunk.rotation.z = (i % 2 ? -0.12 : 0.12);
            sphere(scene, 0.42 + (i % 3) * 0.08, M.green, -11.05, 1.65 + (i % 2) * 0.35, -4.1 + i * 1.25, 1.0, 1.25, 0.8);
        }

        // Wall bays and doors. Each door is a real hinged group so it can open/close.
        const doorDefs = [
            { key: 'about', label: 'ABOUT & CAREER', x: -8.85, accent: '#54d9e8' },
            { key: 'projects', label: 'PROJECTS & INNOVATION', x: -6.32, accent: '#a78bfa' },
            { key: 'publications', label: 'PUBLICATIONS', x: -3.79, accent: '#55cdb6' },
            { key: 'outreach', label: 'CLUBS & OUTREACH', x: -1.26, accent: '#f2bd67' },
            { key: 'certificates', label: 'CERTIFICATES', x: 1.26, accent: '#67b7ff' },
            { key: 'trophies', label: 'TROPHY ROOM', x: 3.79, accent: '#f2a86b' },
            { key: 'gallery', label: 'EVENT GALLERY', x: 6.32, accent: '#df86d8' },
            { key: 'contact', label: 'CONTACT', x: 8.85, accent: '#69ddad' }
        ];
        const doorGroups = {};
        const pickableDoors = [];
        const signOverlays = [];

        function textTexture(text, accent = '#e8c98a') {
            const canvas = document.createElement('canvas');
            const welcomePlaque = text === 'Welcome';
            canvas.width = welcomePlaque ? 1024 : 2048;
            canvas.height = welcomePlaque ? 256 : 1024;
            const ctx = canvas.getContext('2d');
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            ctx.fillStyle = welcomePlaque ? '#11151b' : '#111920';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.strokeStyle = welcomePlaque ? '#c7a15d' : accent;
            ctx.lineWidth = welcomePlaque ? 8 : 10;
            ctx.strokeRect(8, 8, canvasWidth - 16, canvasHeight - 16);
            ctx.shadowColor = welcomePlaque ? '#c7a15d' : accent;
            ctx.shadowBlur = welcomePlaque ? 0 : 8;
            ctx.fillStyle = welcomePlaque ? '#f4d38d' : '#f4f7ff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const parts = text.split(' & ');
            const lines = welcomePlaque ? [text] :
                (parts.length > 1 ? [`${parts[0]} &`, parts[1]] :
                    (text.length > 9 && text.includes(' ') ? text.split(' ') : [text]));
            let fontSize = welcomePlaque ? 132 : (lines.length > 1 ? 270 : 260);
            const fontFamily = welcomePlaque ? '"Playfair Display", Georgia, serif' : 'Manrope, "Noto Sans Bengali", Arial, sans-serif';
            ctx.font = `700 ${fontSize}px ${fontFamily}`;
            while (fontSize > 90 && Math.max(...lines.map((line) => ctx.measureText(line).width)) > canvasWidth - 96) {
                fontSize -= 2;
                ctx.font = `700 ${fontSize}px ${fontFamily}`;
            }
            const lineHeight = lines.length > 1 ? 300 : 0;
            lines.forEach((line, index) => {
                ctx.fillText(
                    line,
                    canvasWidth / 2,
                    lines.length > 1 ? canvasHeight / 2 + (index - (lines.length - 1) / 2) * lineHeight : canvasHeight / 2,
                    canvasWidth - 96
                );
            });
            ctx.shadowBlur = 0;
            const texture = new THREE.CanvasTexture(canvas);
            texture.colorSpace = THREE.SRGBColorSpace;
            return new THREE.MeshBasicMaterial({ map: texture, depthWrite: true });
        }
        const roomBoundaries = [-10.18, ...doorDefs.slice(0, -1).map((door, index) => (door.x + doorDefs[index + 1].x) / 2), 10.18];
        roomBoundaries.forEach((x) => {
            box(scene, 0.1, 4.1, 5.35, M.glass, x, 2.05, -8.35, false);
            box(scene, 0.08, 4.15, 0.08, M.brass, x, 2.05, -5.78, false);
            box(scene, 0.08, 4.15, 0.08, M.brass, x, 2.05, -10.9, false);
            box(scene, 0.1, 0.08, 5.35, M.brass, x, 4.12, -8.35, false);
            box(scene, 0.06, 0.035, 5.25, M.bronze, x, 2.78, -8.35, false);
            box(scene, 0.06, 0.035, 5.25, M.bronze, x, 1.24, -8.35, false);
            box(scene, 0.1, 0.08, 5.35, M.brass, x, 0.08, -8.35, false);
        });
        box(scene, 20.36, 4.1, 0.1, M.glass, 0, 2.05, -11.0, false);
        box(scene, 20.4, 0.08, 0.08, M.brass, 0, 4.12, -11.0, false);
        box(scene, 20.3, 0.035, 0.06, M.bronze, 0, 2.78, -10.94, false);
        doorDefs.forEach((d, index) => {
            const halfWidth = 0.91;
            const leftEdge = index === 0 ? -10.18 : doorDefs[index - 1].x + halfWidth;
            const rightEdge = index === doorDefs.length - 1 ? 10.18 : doorDefs[index + 1].x - halfWidth;
            if (d.x - halfWidth > leftEdge) {
                box(scene, d.x - halfWidth - leftEdge, 4.1, 0.1, M.glass, (leftEdge + d.x - halfWidth) / 2, 2.05, -5.9, false);
            }
            if (rightEdge > d.x + halfWidth) {
                box(scene, rightEdge - d.x - halfWidth, 4.1, 0.1, M.glass, (rightEdge + d.x + halfWidth) / 2, 2.05, -5.9, false);
            }
            box(scene, 0.14, 4.2, 0.16, M.brass, d.x - 1.0, 2.1, -5.82, false);
            box(scene, 0.14, 4.2, 0.16, M.brass, d.x + 1.0, 2.1, -5.82, false);
            box(scene, 2.2, 0.28, 0.3, M.brass, d.x, 4.42, -5.82, false);
            const hinge = new THREE.Group();
            hinge.position.set(d.x - 0.91, 0, -5.68);
            scene.add(hinge);
            const doorLeaf = box(hinge, 1.68, 3.38, 0.07, M.doorGlass, 0.91, 1.78, 0, true);
            box(hinge, 0.075, 3.58, 0.1, M.bronze, 0.08, 1.78, 0.07, false);
            box(hinge, 0.075, 3.58, 0.1, M.bronze, 1.74, 1.78, 0.07, false);
            box(hinge, 1.72, 0.08, 0.1, M.bronze, 0.91, 0.02, 0.07, false);
            box(hinge, 1.72, 0.08, 0.1, M.bronze, 0.91, 3.54, 0.07, false);
            box(hinge, 0.045, 0.46, 0.08, M.brass, 1.55, 1.73, 0.12, false);
            box(scene, 1.75, 0.13, 0.28, M.brass, d.x, 0.08, -5.56, false);
            box(scene, 2.49, 1.29, 0.1, M.bronze, d.x, 5.26, -5.68, false);
            box(scene, 2.43, 1.23, 0.035, material('#111920', 0.5), d.x, 5.26, -5.61, false);
            const sign = mesh(new THREE.PlaneGeometry(2.4, 1.2), textTexture(d.label, d.accent), scene, d.x, 5.26, -5.585, false);
            sign.rotation.y = 0;
            const signOverlay = document.createElement('div');
            signOverlay.className = 'room-sign-overlay';
            signOverlay.textContent = d.label;
            signOverlay.style.setProperty('--sign-accent', d.accent);
            signageLayer.appendChild(signOverlay);
            signOverlays.push({
                element: signOverlay,
                position: new THREE.Vector3(d.x, 5.26, -5.585),
                projected: new THREE.Vector3()
            });
            const signGlow = new THREE.PointLight(d.accent, 1.1, 4.2, 2);
            signGlow.position.set(d.x, 4.55, -4.8);
            scene.add(signGlow);
            box(scene, 1.58, 0.035, 0.04, new THREE.MeshBasicMaterial({ color: d.accent }), d.x, 0.105, -5.48, false);
            doorGroups[d.key] = { hinge, sign, x: d.x, label: d.label };
            pickableDoors.push({ object: doorLeaf, id: d.key });
            pickableDoors.push({ object: sign, id: d.key });
        });

        const displayColors = [M.teal, M.brass, M.rust, M.navy, M.oakLight];
        doorDefs.forEach((room) => {
            const interior = new THREE.Group();
            interior.position.set(room.x, 0, -9.15);
            scene.add(interior);
            const interiorGlow = new THREE.PointLight(room.accent, 1.8, 4.6, 2);
            interiorGlow.position.set(room.x, 2.3, -8.15);
            scene.add(interiorGlow);
            box(interior, 2.2, 2.85, 0.1, M.walnut, 0, 1.58, -1.35, false);
            box(interior, 2.22, 0.14, 2.65, M.oak, 0, 0.07, 0.15, false);
            box(interior, 1.95, 0.055, 0.045, M.brass, 0, 2.78, -1.27, false);

            if (room.key === 'about') {
                for (let shelf = 0; shelf < 3; shelf++) {
                    const y = 0.88 + shelf * 0.56;
                    box(interior, 1.75, 0.07, 0.52, M.oakLight, 0, y, -0.72, false);
                    for (let book = 0; book < 6; book++) {
                        box(interior, 0.13, 0.28 + (book % 2) * 0.08, 0.28, displayColors[(book + shelf) % displayColors.length], -0.68 + book * 0.27, y + 0.16, -0.76, false);
                    }
                }
                [-0.68, 0, 0.68].forEach((x, index) => {
                    cylinder(interior, 0.025, 0.025, 0.72, M.brass, x, 0.46, 0.02, 8);
                    sphere(interior, 0.09, displayColors[index], x, 0.86, 0.02, 1.0, 0.85, 0.45);
                });
            } else if (room.key === 'projects') {
                box(interior, 1.55, 1.02, 0.08, M.black, 0, 1.92, -0.75, false);
                box(interior, 1.42, 0.88, 0.025, material('#145b5b', 0.24), 0, 1.94, -0.69, false);
                for (let bar = 0; bar < 4; bar++) {
                    box(interior, 0.92 - bar * 0.12, 0.055, 0.025, displayColors[bar], -0.2 + bar * 0.04, 2.2 - bar * 0.18, -0.65, false);
                }
                [-0.62, 0, 0.62].forEach((x, index) => {
                    box(interior, 0.46, 0.42, 0.42, M.oakLight, x, 0.37, 0.05, false);
                    sphere(interior, 0.18, displayColors[index], x, 0.76, 0.05, 1.0, 0.7, 1.0);
                });
            } else if (room.key === 'publications') {
                for (let shelf = 0; shelf < 4; shelf++) {
                    const y = 0.62 + shelf * 0.48;
                    box(interior, 1.76, 0.07, 0.56, M.oakLight, 0, y, -0.73, false);
                    for (let book = 0; book < 7; book++) {
                        box(interior, 0.15, 0.26 + ((book + shelf) % 3) * 0.045, 0.3, displayColors[(book + shelf * 2) % displayColors.length], -0.7 + book * 0.23, y + 0.15, -0.74, false);
                    }
                }
                box(interior, 1.15, 0.12, 0.55, M.navy, 0, 0.38, 0.28, false);
                box(interior, 0.88, 0.1, 0.48, M.rust, 0, 0.49, 0.28, false);
            } else if (room.key === 'outreach') {
                cylinder(interior, 0.72, 0.78, 0.14, M.oakLight, 0, 0.88, -0.05, 28);
                cylinder(interior, 0.08, 0.12, 0.76, M.bronze, 0, 0.43, -0.05, 16);
                for (let seat = 0; seat < 4; seat++) {
                    const angle = (seat / 4) * Math.PI * 2;
                    const x = Math.cos(angle) * 0.92;
                    const z = Math.sin(angle) * 0.92;
                    box(interior, 0.42, 0.12, 0.42, M.teal, x, 0.52, z, false);
                    box(interior, 0.42, 0.58, 0.12, M.navy, x, 0.86, z - 0.1, false);
                }
                cylinder(interior, 0.15, 0.2, 0.32, M.brass, 0, 1.13, -0.05, 16);
                sphere(interior, 0.18, M.teal, 0, 1.39, -0.05, 1.1, 0.75, 1.1);
            } else if (room.key === 'certificates') {
                [-0.66, 0, 0.66].forEach((x, index) => {
                    box(interior, 0.5, 0.72, 0.08, M.brass, x, 1.8, -0.72, false);
                    box(interior, 0.42, 0.64, 0.035, M.ivory, x, 1.8, -0.66, false);
                    box(interior, 0.25, 0.045, 0.018, displayColors[index], x, 1.95, -0.63, false);
                    box(interior, 0.3, 0.025, 0.018, M.oakLight, x, 1.78, -0.63, false);
                    box(interior, 0.22, 0.025, 0.018, M.oakLight, x, 1.68, -0.63, false);
                });
                box(interior, 1.6, 0.11, 0.56, M.oakLight, 0, 0.62, 0.2, false);
                box(interior, 1.08, 0.09, 0.42, M.navy, 0, 0.73, 0.2, false);
            } else if (room.key === 'trophies') {
                [-0.64, 0, 0.64].forEach((x, index) => {
                    const height = 0.42 + index * 0.22;
                    box(interior, 0.46, height, 0.48, M.navy, x, height / 2 + 0.12, 0.06, false);
                    cylinder(interior, 0.055, 0.09, 0.3 + index * 0.05, M.brass, x, height + 0.38, 0.06, 14);
                    sphere(interior, 0.13, M.brass, x, height + 0.58, 0.06, 1, 1.2, 0.55);
                });
            } else if (room.key === 'gallery') {
                [-0.68, 0, 0.68].forEach((x, index) => {
                    box(interior, 0.55, 1.0, 0.08, M.brass, x, 1.72, -0.78, false);
                    box(interior, 0.46, 0.9, 0.035, displayColors[index], x, 1.72, -0.72, false);
                    sphere(interior, 0.16, M.ivory, x, 1.8, -0.68, 1.0, 1.2, 0.35);
                    box(interior, 0.3, 0.05, 0.02, M.oakLight, x, 1.42, -0.68, false);
                    cylinder(interior, 0.12, 0.18, 0.26, M.walnut, x, 0.27, 0.13, 14);
                });
            } else if (room.key === 'contact') {
                box(interior, 1.65, 0.18, 0.76, M.walnut, 0, 0.92, -0.05, false);
                box(interior, 0.12, 0.86, 0.65, M.bronze, -0.62, 0.44, -0.05, false);
                box(interior, 0.12, 0.86, 0.65, M.bronze, 0.62, 0.44, -0.05, false);
                box(interior, 0.42, 0.34, 0.28, M.black, -0.25, 1.18, -0.12, false);
                cylinder(interior, 0.05, 0.08, 0.46, M.brass, 0.45, 1.22, -0.12, 12);
                sphere(interior, 0.2, M.green, 0.45, 1.57, -0.12, 0.8, 1.4, 0.8);
            }
        });

        // Reception area: marble counter, walnut slats, brass details and workstation.
        const desk = new THREE.Group();
        desk.position.set(3.4, 0, 1.5);
        desk.scale.set(1.35, 0.8, 1.2);
        scene.add(desk);
        box(desk, 5.7, 1.18, 1.55, new THREE.MeshStandardMaterial({
            map: blackMarble,
            roughness: 0.24,
            metalness: 0.2
        }), 0, 0.68, 0);
        box(desk, 5.88, 0.18, 1.72, new THREE.MeshStandardMaterial({
            map: blackMarble,
            roughness: 0.12,
            metalness: 0.24
        }), 0, 1.34, 0);
        box(desk, 5.34, 0.82, 0.07, M.walnut, 0, 0.69, 0.79);
        for (let x = -2.5; x <= 2.5; x += 0.18) {
            const slatMaterial = Math.round((x + 2.5) * 10) % 3 === 0 ? M.walnutLight : M.walnut;
            box(desk, 0.055, 0.76, 0.055, slatMaterial, x, 0.69, 0.855, false);
        }
        box(desk, 5.5, 0.035, 0.045, M.brass, 0, 1.14, 0.89, false);
        box(desk, 5.55, 0.09, 0.14, M.brass, 0, 0.12, 0.81, false);
        const led = new THREE.MeshStandardMaterial({
            color: '#ffd579',
            emissive: '#f2a92f',
            emissiveIntensity: 1.8,
            roughness: 0.22
        });
        box(desk, 5.28, 0.035, 0.035, led, 0, 0.2, 0.91, false);
        const counterGlow = new THREE.PointLight(0xffbd59, 4.5, 6, 2);
        counterGlow.position.set(0, 0.22, 1.03);
        desk.add(counterGlow);
        box(desk, 2.9, 0.5, 0.055, M.brass, 0, 0.72, 0.94, false);
        const deskPlaque = mesh(new THREE.PlaneGeometry(2.8, 0.42), textTexture('Welcome'), desk, 0, 0.72, 0.975, false);
        deskPlaque.rotation.x = 0;
        // Monitor angled slightly toward the receptionist so screen and bezel stay aligned.
        const monitorBezel = box(desk, 1.28, 0.84, 0.12, M.black, 0.15, 2.0, -0.64);
        monitorBezel.rotation.y = -0.3;
        const monitorScreen = box(desk, 1.16, 0.7, 0.025, material('#8fd9e7', 0.25), 0.15, 2.02, -0.7, false);
        monitorScreen.rotation.y = -0.3;
        box(desk, 0.13, 0.3, 0.13, M.black, 0.15, 1.45, -0.6);
        box(desk, 0.68, 0.08, 0.42, M.black, 0.15, 1.31, -0.6);
        box(desk, 2.0, 0.1, 0.52, M.black, 0.3, 1.34, -0.67, false);
        box(desk, 0.9, 0.035, 0.32, M.black, 0.15, 1.46, -1.08, false);
        for (let row = 0; row < 3; row++) {
            for (let column = 0; column < 10; column++) {
                box(desk, 0.055, 0.012, 0.045, M.oakLight, -0.24 + column * 0.085, 1.486, -0.65 + row * 0.075, false);
            }
        }
        // Books, small lamp and plant on desk.
        box(desk, 0.72, 0.09, 0.48, M.navy, 1.4, 1.42, -0.3);
        box(desk, 0.65, 0.08, 0.44, M.rust, 1.42, 1.51, -0.3);
        cylinder(desk, 0.05, 0.05, 0.55, M.brass, 2.05, 1.62, -0.3, 12);
        sphere(desk, 0.23, M.brass, 2.05, 1.95, -0.3, 1, 0.65, 1);

        function makePlant(x, z, scale = 1) {
            const g = new THREE.Group();
            g.position.set(x, 0, z);
            g.scale.setScalar(scale);
            scene.add(g);
            cylinder(g, 0.24, 0.32, 0.42, M.oakLight, 0, 0.21, 0, 14);
            cylinder(g, 0.24, 0.24, 0.05, M.soil, 0, 0.43, 0, 14);
            for (let i = 0; i < 7; i++) {
                const leaf = sphere(g, 0.18, M.green, Math.sin(i * 0.9) * 0.2, 0.68 + (i % 3) * 0.16, Math.cos(i * 0.9) * 0.13, 0.55, 1.75, 0.5);
                leaf.rotation.z = Math.sin(i * 0.9) * 0.65;
            }
        }
        makePlant(-8.9, 3.1, 1.25);
        makePlant(8.6, -0.5, 1.1);
        makePlant(7.9, 3.2, 0.8);

        // Waiting nook with sofa and side table gives the reception depth and warmth.
        box(scene, 2.35, 0.55, 0.82, M.sofa, -7.5, 0.43, 2.2);
        box(scene, 2.35, 0.82, 0.22, M.sofa, -7.5, 0.82, 2.55);
        box(scene, 0.13, 0.7, 0.75, M.oak, -8.45, 0.35, 2.2);
        box(scene, 0.13, 0.7, 0.75, M.oak, -6.55, 0.35, 2.2);
        cylinder(scene, 0.42, 0.48, 0.12, M.oakLight, -5.65, 0.6, 2.1, 24);
        cylinder(scene, 0.06, 0.06, 0.5, M.brass, -5.65, 0.3, 2.1, 12);

        // Adult stylized character with a readable face, hair, collar, hands and shoes.
        function makeCharacter({ x, z, guide = false, seated = false }) {
            const root = new THREE.Group();
            root.position.set(x, 0, z);
            scene.add(root);
            const body = new THREE.Group();
            root.add(body);
            const skin = guide ? M.skin2 : M.skin;
            const jacket = guide ? M.navy : M.teal;
            // torso and neck
            box(body, seated ? 0.72 : 0.66, seated ? 0.78 : 0.88, 0.36, jacket, 0, seated ? 1.56 : 1.23, 0);
            box(body, 0.23, 0.58, 0.055, M.shirt, 0, seated ? 1.56 : 1.28, 0.205);
            box(body, 0.18, 0.1, 0.07, M.brass, 0, seated ? 1.3 : 1.12, 0.24, false);
            cylinder(body, 0.105, 0.11, 0.22, skin, 0, seated ? 1.87 : 1.78, 0, 12);
            // head, ears, hair cap and side hair
            sphere(body, 0.37, skin, 0, seated ? 2.23 : 2.15, 0.02, 0.9, 1.05, 0.86);
            sphere(body, 0.375, guide ? M.hair : M.hair2, 0, seated ? 2.43 : 2.35, -0.015, 1.02, 0.6, 0.92);
            sphere(body, 0.19, guide ? M.hair : M.hair2, -0.25, seated ? 2.32 : 2.25, 0.035, 0.65, 1.0, 0.88);
            sphere(body, 0.065, skin, -0.34, seated ? 2.22 : 2.14, 0.02, 0.55, 1.0, 0.8);
            sphere(body, 0.065, skin, 0.34, seated ? 2.22 : 2.14, 0.02, 0.55, 1.0, 0.8);
            // eyes, brows, nose and smile
            [-0.13, 0.13].forEach((ex) => {
                sphere(body, 0.058, M.white, ex, seated ? 2.24 : 2.16, 0.326, 0.9, 1.0, 0.42);
                sphere(body, 0.028, M.black, ex, seated ? 2.235 : 2.155, 0.351, 0.8, 1.0, 0.4);
                box(body, 0.12, 0.025, 0.035, M.hair, ex, seated ? 2.33 : 2.25, 0.33, false);
            });
            sphere(body, 0.045, skin, 0, seated ? 2.13 : 2.05, 0.35, 0.65, 0.9, 0.7);
            const smile = mesh(new THREE.TorusGeometry(0.105, 0.018, 6, 16, Math.PI), M.hair, body, 0, seated ? 2.045 : 1.965, 0.33, false);
            smile.rotation.z = Math.PI;
            // Arms with pivot points for a gentle wave/typing animation.
            const arms = [];
            [-1, 1].forEach((side) => {
                const arm = new THREE.Group();
                arm.position.set(side * 0.38, seated ? 1.78 : 1.5, 0);
                if (seated) arm.rotation.x = -0.75;
                body.add(arm);
                arms.push(arm);
                cylinder(arm, 0.105, 0.12, 0.52, jacket, side * 0.03, -0.2, 0, 12).rotation.z = side * -0.14;
                sphere(arm, 0.105, skin, side * 0.06, -0.48, 0.02, 0.95, 0.9, 0.9);
            });
            // Legs and shoes: seated receptionist legs extend toward desk, guide stands upright.
            if (seated) {
                box(body, 0.25, 0.28, 0.62, M.trousers, -0.2, 0.72, 0.32).rotation.x = Math.PI / 2;
                box(body, 0.25, 0.28, 0.62, M.trousers, 0.2, 0.72, 0.32).rotation.x = Math.PI / 2;
                box(body, 0.23, 0.46, 0.23, M.trousers, -0.2, 0.43, 0.57);
                box(body, 0.23, 0.46, 0.23, M.trousers, 0.2, 0.43, 0.57);
                box(body, 0.3, 0.12, 0.42, M.black, -0.2, 0.13, 0.69);
                box(body, 0.3, 0.12, 0.42, M.black, 0.2, 0.13, 0.69);
                box(body, 1.06, 0.16, 0.78, M.chairLeather, 0, 1.02, -0.08);
                const chairBack = box(body, 1.12, 1.18, 0.18, M.chairLeather, 0, 1.55, -0.48);
                chairBack.rotation.x = -0.08;
                box(body, 0.88, 0.24, 0.16, M.chairLeather, 0, 2.3, -0.51);
                box(body, 0.04, 1.12, 0.045, M.chairFrame, -0.59, 1.55, -0.365, false);
                box(body, 0.04, 1.12, 0.045, M.chairFrame, 0.59, 1.55, -0.365, false);
                box(body, 0.88, 0.035, 0.045, M.chairFrame, 0, 2.12, -0.365, false);
                box(body, 0.66, 0.3, 0.055, M.black, 0, 1.33, -0.365);
                box(body, 0.1, 0.38, 0.1, M.black, -0.59, 1.13, -0.05);
                box(body, 0.1, 0.38, 0.1, M.black, 0.59, 1.13, -0.05);
                box(body, 0.14, 0.1, 0.52, M.chairLeather, -0.59, 1.2, 0.14);
                box(body, 0.14, 0.1, 0.52, M.chairLeather, 0.59, 1.2, 0.14);
                cylinder(body, 0.1, 0.13, 0.72, M.black, 0, 0.58, -0.2, 20);
                const chairBase = new THREE.Group();
                chairBase.position.set(0, 0.12, -0.2);
                body.add(chairBase);
                sphere(chairBase, 0.13, M.black, 0, 0, 0, 1, 0.5, 1);
                for (let spoke = 0; spoke < 5; spoke++) {
                    const angle = (spoke / 5) * Math.PI * 2;
                    const casterX = Math.cos(angle) * 0.42;
                    const casterZ = Math.sin(angle) * 0.42;
                    const spokeMesh = box(chairBase, 0.46, 0.045, 0.065, M.black, casterX / 2, 0, casterZ / 2, false);
                    spokeMesh.rotation.y = angle;
                    cylinder(chairBase, 0.055, 0.055, 0.16, M.black, casterX, -0.04, casterZ, 10);
                }
            } else {
                [-0.17, 0.17].forEach((lx) => {
                    cylinder(body, 0.115, 0.14, 0.72, M.trousers, lx, 0.43, 0, 12);
                    box(body, 0.26, 0.12, 0.42, M.black, lx, 0.08, 0.1);
                });
            }
            root.userData = { body, arms, guide, seated, home: new THREE.Vector3(x, 0, z) };
            return root;
        }
        // The guide is separate and walks in front of reception; the receptionist stays seated at the computer.
        const guide = makeCharacter({ x: -2.8, z: 2.7, guide: true });
        const receptionist = makeCharacter({ x: 3.05, z: -0.1, seated: true });
        receptionist.position.y = 0;
        receptionist.scale.setScalar(0.96);
        receptionist.rotation.y = 0.62;

        const roomMap = {
            about: { x: -8.85, z: -9.1, label: 'About & Career', door: 'about', section: 'about' },
            projects: { x: -6.32, z: -9.1, label: 'Projects & Innovation', door: 'projects', section: 'projects' },
            publications: { x: -3.79, z: -9.1, label: 'Publications', door: 'publications', section: 'publications' },
            outreach: { x: -1.26, z: -9.1, label: 'Clubs & Outreach', door: 'outreach', section: 'outreach' },
            certificates: { x: 1.26, z: -9.1, label: 'Certificates', door: 'certificates', section: 'certificates' },
            trophies: { x: 3.79, z: -9.1, label: 'Trophy Room', door: 'trophies', section: 'trophies' },
            gallery: { x: 6.32, z: -9.1, label: 'Event Gallery', door: 'gallery', section: 'gallery' },
            contact: { x: 8.85, z: -9.1, label: 'Contact', door: 'contact', section: 'contact' }
        };

        let state = 'idle';
        let route = [];
        let target = null;
        let doorState = null;
        let lastTime = performance.now();
        let elapsed = 0;
        let cameraX = camera.position.x;
        let cameraZ = camera.position.z;
        let cameraY = camera.position.y;
        let cameraLookX = lookTarget.x;
        let cameraLookZ = lookTarget.z;

        function setStatus(message, speech) {
            const status = $('#tourStatus');
            if (status) status.textContent = message;
            const bubble = $('#guideSpeech');
            if (bubble) bubble.textContent = speech;
        }

        function go(id) {
            const room = roomMap[id];
            if (!room || state !== 'idle') return false;
            target = { id, ...room };
            state = 'walking';
            // Clear, unobstructed aisle: cross the front lane first, then approach the selected doorway.
            route = [
                { x: -2.8, z: 2.7 },
                { x: -2.8, z: 3.0 },
                { x: room.x, z: 3.6 },
                { x: room.x, z: -4.65 }
            ];
            const introduction = host.dataset.guideDialogue.trim();
            setStatus('Your guide is walking to ' + room.label + '.', introduction || 'Follow me to ' + room.label + '.');
            document.querySelectorAll('[data-room]').forEach((button) => button.classList.toggle('active', button.dataset.room === id));
            window.srNavigateToSection?.(id, { scroll: false });
            return true;
        }
        window.sr3dNavigate = (id) => go(id);
        window.sr3dReady = true;

        document.querySelectorAll('[data-room]').forEach((button) => {
            button.addEventListener('click', (event) => {
                if (go(button.dataset.room)) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                } else if (state !== 'idle') {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                }
            }, true);
        });
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        const pickableObjects = pickableDoors.map((door) => door.object);

        function roomAtPointer(event) {
            const bounds = renderer.domElement.getBoundingClientRect();
            pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
            pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
            raycaster.setFromCamera(pointer, camera);
            const intersection = raycaster.intersectObjects(pickableObjects, false)[0];
            const selectedDoor = intersection && intersection.object;
            return pickableDoors.find((door) => door.object === selectedDoor);
        }
        renderer.domElement.addEventListener('pointermove', (event) => {
            renderer.domElement.style.cursor = roomAtPointer(event) ? 'pointer' : 'grab';
        });
        renderer.domElement.addEventListener('pointerleave', () => {
            renderer.domElement.style.cursor = 'grab';
        });
        renderer.domElement.addEventListener('click', (event) => {
            const room = roomAtPointer(event);
            if (room) go(room.id);
        });
        const startTour = $('#startTour');
        if (startTour) startTour.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            const activeRoute = document.querySelector('[data-route].active');
            const selectedRoute = activeRoute && activeRoute.dataset.route;
            if (state === 'idle') go(selectedRoute === 'research' ? 'projects' : 'about');
        }, true);
        document.querySelectorAll('[data-route]').forEach((button) => button.addEventListener('click', () => {
            document.querySelectorAll('[data-route]').forEach((b) => b.classList.toggle('active', b === button));
            const firstRoom = button.dataset.route === 'research' ? 'projects' : 'about';
            setStatus(button.dataset.route === 'research' ? 'Projects & Research route selected.' : 'Professional Journey route selected.', 'Welcome! I can show you ' + (button.dataset.route === 'research' ? 'projects and publications.' : 'my journey and experience.'));
            if (!reducedMotion && state === 'idle') cameraLookX = roomMap[firstRoom].x * 0.12;
        }));

        function finishTour() {
            const finished = target;
            // Keep navigation locked until the door closes and the guide resets.
            state = 'resetting';
            route = [];
            doorState = null;
            setStatus('Arrived at ' + finished.label + '. The related section is ready below.', 'Here we are: ' + finished.label + '. Explore the details below, then choose another room.');
            window.srNavigateToSection?.(finished.id);
            // Let the visitor see the door open before it closes and the guide returns to reception.
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

        function animate(now) {
            requestAnimationFrame(animate);
            const dt = Math.min((now - lastTime) / 1000, 0.045);
            lastTime = now;
            elapsed += dt;
            if (!reducedMotion) {
                guide.userData.body.position.y = Math.sin(elapsed * 2.5) * 0.018;
                receptionist.userData.arms[0].rotation.z = Math.sin(elapsed * 2.1) * 0.035;
                receptionist.userData.arms[1].rotation.z = Math.sin(elapsed * 2.1 + 1.4) * 0.035;
                receptionist.rotation.y = -0.08 + Math.sin(elapsed * 0.7) * 0.035;
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
                        doorState = { door, started: now, phase: 'open' };
                        setStatus('Opening the ' + target.label + ' door.', 'One moment — opening the ' + target.label + ' room.');
                    }
                } else {
                    const step = Math.min(distance, dt * (reducedMotion ? 2.8 : 1.65));
                    guide.position.x += dx / distance * step;
                    guide.position.z += dz / distance * step;
                    guide.rotation.y = Math.atan2(dx, dz);
                    if (!reducedMotion) {
                        const stride = Math.sin(elapsed * 10) * 0.05;
                        guide.userData.body.rotation.z = stride;
                    }
                }
            } else if (state === 'opening' && doorState) {
                const t = Math.min((now - doorState.started) / (reducedMotion ? 1 : 650), 1);
                doorState.door.hinge.rotation.y = -1.12 * t;
                if (t >= 1) {
                    state = 'entering';
                    route = [{ x: target.x, z: target.z }];
                    setStatus('Entering ' + target.label + '.', 'Come on in — this is ' + target.label + '.');
                }
            } else if (state === 'entering' && route.length) {
                const next = route[0];
                const dx = next.x - guide.position.x,
                    dz = next.z - guide.position.z;
                const distance = Math.hypot(dx, dz);
                if (distance < 0.12) {
                    guide.position.x = next.x;
                    guide.position.z = next.z;
                    route = [];
                    finishTour();
                } else {
                    const step = Math.min(distance, dt * (reducedMotion ? 2.8 : 1.35));
                    guide.position.x += dx / distance * step;
                    guide.position.z += dz / distance * step;
                    guide.rotation.y = Math.atan2(dx, dz);
                }
            }
            if (state === 'walking' || state === 'opening' || state === 'entering') {
                // Camera tracks the guide with a gentle eased follow; the look
                // target leads slightly ahead so the room door stays in frame.
                cameraX = guide.position.x;
                cameraZ = guide.position.z + 1.7;
                cameraY = 4.6;
                cameraLookX = guide.position.x;
                cameraLookZ = guide.position.z - 1.2;
            } else if (state === 'resetting' || state === 'idle') {
                guide.userData.body.rotation.z = 0;
            }
            camera.position.x += (cameraX - camera.position.x) * Math.min(1, dt * 1.8);
            camera.position.z += (cameraZ - camera.position.z) * Math.min(1, dt * 1.8);
            camera.position.y += (cameraY - camera.position.y) * Math.min(1, dt * 1.4);
            lookTarget.x += (cameraLookX - lookTarget.x) * Math.min(1, dt * 1.5);
            lookTarget.z += (cameraLookZ - lookTarget.z) * Math.min(1, dt * 1.5);
            camera.lookAt(lookTarget);
            signOverlays.forEach(({ element, position, projected }) => {
                projected.copy(position).project(camera);
                const visible = projected.z >= -1 && projected.z <= 1 &&
                    projected.x >= -1 && projected.x <= 1 &&
                    projected.y >= -1 && projected.y <= 1;
                element.style.visibility = visible ? 'visible' : 'hidden';
                if (visible) {
                    const screenX = (projected.x * 0.5 + 0.5) * 100;
                    element.style.left = `${Math.max(signageHalfWidth, Math.min(100 - signageHalfWidth, screenX))}%`;
                    element.style.top = `${(-projected.y * 0.5 + 0.5) * 100}%`;
                }
            });
            renderer.render(scene, camera);
        }

        const resize = () => {
            const w = host.clientWidth,
                h = host.clientHeight;
            if (!w || !h) return;
            const isMobile = w < 650;
            camera.fov = isMobile ? 51 : 47;
            if (state === 'idle') {
                cameraX = 0;
                cameraZ = 15.8;
                cameraY = 6.35;
                cameraLookX = 0;
                cameraLookZ = -1.7;
            }
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
            sizeSignage(w);
        };
        if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host);
        else window.addEventListener('resize', resize);
        requestAnimationFrame(animate);
    }).catch((error) => {
        console.warn('3D reception unavailable; accessible portfolio fallback remains active.', error);
        if (fallback) fallback.style.display = 'block';
        host.classList.add('scene-fallback-active');
    });
})();