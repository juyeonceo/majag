// ========================================================
// 3D Platformer Adventure (Three.js Implementation)
// Unreal Engine 5 Style 3D Platformer Mechanics
// ========================================================

(function () {
  'use strict';

  // --- 1. Sound Synthesis Engine (Web Audio API) ---
  const AudioEngine = {
    ctx: null,
    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    },
    playJump() {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    },
    playDoubleJump() {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    },
    playJumpPad() {
      this.init();
      const now = this.ctx.currentTime;
      // Low boom + high sweep
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.35);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    },
    playCoin() {
      this.init();
      const now = this.ctx.currentTime;
      // Arpeggio chime: B5 (987Hz) -> E6 (1318Hz)
      const playTone = (freq, start, duration) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };
      playTone(987.77, now, 0.12);
      playTone(1318.51, now + 0.08, 0.25);
    },
    playFall() {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    },
    playVictory() {
      this.init();
      const now = this.ctx.currentTime;
      const chords = [523.25, 659.25, 783.99, 1046.5]; // C, E, G, High C
      chords.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const start = now + idx * 0.12;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.35, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.65);
      });
    }
  };

  // --- 2. Procedural Texture Helper (No external image loading required) ---
  function createGridTexture(bgColor, lineColor, size = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, size, size);
    // Subtle cross in center
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // --- 3. Scene, Camera, Renderer ---
  const container = document.getElementById('game-container');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c1322);
  scene.fog = new THREE.FogExp2(0x0c1322, 0.015);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // --- 4. Lights ---
  const ambientLight = new THREE.HemisphereLight(0x90b4e8, 0x1f293d, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xfff7e6, 1.2);
  dirLight.position.set(40, 60, 30);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 200;
  dirLight.shadow.camera.left = -40;
  dirLight.shadow.camera.right = 40;
  dirLight.shadow.camera.top = 40;
  dirLight.shadow.camera.bottom = -40;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);

  // Secondary soft colored fill light
  const fillLight = new THREE.DirectionalLight(0x00d2ff, 0.4);
  fillLight.position.set(-30, 20, -30);
  scene.add(fillLight);

  // --- 5. Game State & HUD ---
  const state = {
    coins: 0,
    totalCoins: 12,
    startTime: null,
    elapsedTime: 0,
    isCleared: false,
    isRespawning: false
  };

  const coinCounterEl = document.getElementById('coin-counter');
  const timerEl = document.getElementById('timer');
  const jump1Pill = document.getElementById('jump-1');
  const jump2Pill = document.getElementById('jump-2');
  const fadeOverlay = document.getElementById('fade-overlay');
  const clearScreen = document.getElementById('clear-screen');
  const finalCoinsEl = document.getElementById('final-coins');
  const finalTimeEl = document.getElementById('final-time');
  const retryBtn = document.getElementById('retry-btn');

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins.toString().padStart(2, '0')}:${secs.padStart(4, '0')}`;
  }

  // --- 6. Input Handler & Camera Orbit ---
  const input = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jumpPressed: false
  };

  const cameraState = {
    yaw: 0, // Horizontal rotation
    pitch: 0.25, // Vertical angle
    distance: 10,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0
  };

  window.addEventListener('keydown', (e) => {
    AudioEngine.init();
    if (!state.startTime && !state.isCleared) state.startTime = performance.now();

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp': input.forward = true; break;
      case 'KeyS':
      case 'ArrowDown': input.backward = true; break;
      case 'KeyA':
      case 'ArrowLeft': input.left = true; break;
      case 'KeyD':
      case 'ArrowRight': input.right = true; break;
      case 'Space':
        if (!input.jumpPressed) {
          input.jumpPressed = true;
          handleJump();
        }
        e.preventDefault();
        break;
      case 'KeyR':
        resetGame();
        break;
    }
  });

  window.addEventListener('keyup', (e) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp': input.forward = false; break;
      case 'KeyS':
      case 'ArrowDown': input.backward = false; break;
      case 'KeyA':
      case 'ArrowLeft': input.left = false; break;
      case 'KeyD':
      case 'ArrowRight': input.right = false; break;
      case 'Space': input.jumpPressed = false; break;
    }
  });

  // Mouse drag for camera orbit
  window.addEventListener('mousedown', (e) => {
    if (e.target.closest('#hud') || e.target.closest('#clear-screen') || e.target.closest('#controls-guide')) return;
    cameraState.isDragging = true;
    cameraState.lastMouseX = e.clientX;
    cameraState.lastMouseY = e.clientY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!cameraState.isDragging) return;
    const dx = e.clientX - cameraState.lastMouseX;
    const dy = e.clientY - cameraState.lastMouseY;
    cameraState.lastMouseX = e.clientX;
    cameraState.lastMouseY = e.clientY;

    cameraState.yaw -= dx * 0.006;
    cameraState.pitch += dy * 0.005;
    cameraState.pitch = Math.max(0.05, Math.min(Math.PI / 2.3, cameraState.pitch));
  });

  window.addEventListener('mouseup', () => { cameraState.isDragging = false; });

  // Touch controls for mobile
  const touchJump = document.getElementById('touch-jump');
  if (touchJump) {
    touchJump.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleJump();
    });
  }

  // --- 7. Player Character Construction ---
  const player = {
    group: new THREE.Group(),
    bodyMesh: null,
    shadowMesh: null,
    position: new THREE.Vector3(0, 3, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    radius: 0.75,
    height: 1.5,
    isGrounded: false,
    jumpCount: 0,
    maxJumps: 2,
    moveSpeed: 11,
    accel: 45,
    gravity: -32,
    jumpVelocity: 14.0,
    doubleJumpVelocity: 14.5,
    facingAngle: 0,
    activePlatform: null
  };

  function createPlayer() {
    // Stylized capsule robot
    const bodyGeo = new THREE.CylinderGeometry(0.55, 0.55, 1.0, 16);
    const topCapGeo = new THREE.SphereGeometry(0.55, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.2,
      metalness: 0.3
    });

    const body = new THREE.Mesh(bodyGeo, mat);
    body.castShadow = true;
    body.position.y = 0.5;

    const topCap = new THREE.Mesh(topCapGeo, mat);
    topCap.position.y = 1.0;
    topCap.castShadow = true;

    // Glowing Visor / Eyes
    const visorGeo = new THREE.BoxGeometry(0.65, 0.22, 0.3);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.95, 0.45);

    // Jetpack on back
    const packGeo = new THREE.BoxGeometry(0.5, 0.65, 0.3);
    const packMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const pack = new THREE.Mesh(packGeo, packMat);
    pack.position.set(0, 0.6, -0.45);

    player.group.add(body);
    player.group.add(topCap);
    player.group.add(visor);
    player.group.add(pack);

    // Projected ground shadow blob
    const shadowGeo = new THREE.PlaneGeometry(1.6, 1.6);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    player.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    player.shadowMesh.rotation.x = -Math.PI / 2;
    scene.add(player.shadowMesh);

    scene.add(player.group);
  }
  createPlayer();

  function handleJump() {
    if (state.isRespawning || state.isCleared) return;

    if (player.isGrounded) {
      player.velocity.y = player.jumpVelocity;
      player.isGrounded = false;
      player.jumpCount = 1;
      player.activePlatform = null;
      AudioEngine.playJump();
      spawnDustParticles(player.position, 12, 0x38bdf8);
      updateJumpUI();
    } else if (player.jumpCount < player.maxJumps) {
      player.velocity.y = player.doubleJumpVelocity;
      player.jumpCount = 2;
      AudioEngine.playDoubleJump();
      spawnDustParticles(player.position, 20, 0x10b981);
      updateJumpUI();
    }
  }

  function updateJumpUI() {
    if (player.jumpCount === 0) {
      jump1Pill.classList.add('active');
      jump2Pill.classList.add('active');
    } else if (player.jumpCount === 1) {
      jump1Pill.classList.remove('active');
      jump2Pill.classList.add('active');
    } else {
      jump1Pill.classList.remove('active');
      jump2Pill.classList.remove('active');
    }
  }

  // --- 8. Particle System ---
  const particles = [];
  const particleGeo = new THREE.SphereGeometry(0.12, 6, 6);

  function spawnDustParticles(pos, count, colorHex) {
    const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 1 });
    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(particleGeo, mat.clone());
      p.position.copy(pos);
      p.position.y += 0.2;
      const speed = 2.0 + Math.random() * 4.0;
      const angle = Math.random() * Math.PI * 2;
      p.userData = {
        vx: Math.cos(angle) * speed,
        vy: (Math.random() * 2.5) + 0.5,
        vz: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7
      };
      scene.add(p);
      particles.push(p);
    }
  }

  function spawnFireworks(pos) {
    const colors = [0xffd700, 0xff007f, 0x00f3ff, 0x10b981];
    for (let c = 0; c < 4; c++) {
      setTimeout(() => {
        const offset = new THREE.Vector3(
          pos.x + (Math.random() - 0.5) * 4,
          pos.y + 2 + Math.random() * 4,
          pos.z + (Math.random() - 0.5) * 4
        );
        spawnDustParticles(offset, 30, colors[c]);
      }, c * 180);
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.userData.life -= dt;
      if (p.userData.life <= 0) {
        scene.remove(p);
        p.geometry.dispose();
        p.material.dispose();
        particles.splice(i, 1);
      } else {
        p.position.x += p.userData.vx * dt;
        p.position.y += p.userData.vy * dt;
        p.position.z += p.userData.vz * dt;
        p.userData.vy -= 12 * dt;
        p.material.opacity = p.userData.life / p.userData.maxLife;
      }
    }
  }

  // --- 9. Environment, Platforms & Gimmicks Build ---
  const platforms = []; // AABB solid collision platforms
  const movingPlatforms = []; // Moving platforms
  const jumpPads = []; // Super jump pads
  const rotatingObstacles = []; // Rotating beams
  const coins = []; // Collectibles
  let goalPortal = null;

  // Platform Textures
  const floorTex = createGridTexture('#1e293b', '#334155');
  floorTex.repeat.set(4, 4);
  const platformTex = createGridTexture('#0f172a', '#38bdf8');
  platformTex.repeat.set(2, 2);

  const matStandard = new THREE.MeshStandardMaterial({
    map: platformTex,
    roughness: 0.3,
    metalness: 0.1
  });

  const matMoving = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a,
    emissive: 0x0e245a,
    roughness: 0.3
  });

  function addPlatform(x, y, z, w, h, d, material = matStandard) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const box = {
      mesh,
      minX: x - w / 2,
      maxX: x + w / 2,
      topY: y + h,
      bottomY: y,
      minZ: z - d / 2,
      maxZ: z + d / 2,
      width: w,
      height: h,
      depth: d
    };
    platforms.push(box);
    return box;
  }

  function addMovingPlatform(startX, startY, startZ, endX, endY, endZ, w, h, d, duration = 3.0) {
    const box = addPlatform(startX, startY, startZ, w, h, d, matMoving);
    box.isMoving = true;
    box.startPos = new THREE.Vector3(startX, startY + h / 2, startZ);
    box.endPos = new THREE.Vector3(endX, endY + h / 2, endZ);
    box.duration = duration;
    box.prevPos = box.mesh.position.clone();
    box.delta = new THREE.Vector3();
    movingPlatforms.push(box);
    return box;
  }

  function addJumpPad(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Base ring
    const baseGeo = new THREE.CylinderGeometry(1.4, 1.6, 0.3, 16);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.15;
    base.receiveShadow = true;
    group.add(base);

    // Glowing center pad
    const padGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.2, 16);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = 0.3;
    group.add(pad);

    scene.add(group);

    jumpPads.push({
      group,
      pad,
      position: new THREE.Vector3(x, y, z),
      radius: 1.4,
      launchForce: 28.0,
      squash: 0
    });
  }

  function addRotatingObstacle(centerX, centerY, centerZ, length = 7.0, speed = 1.4) {
    const group = new THREE.Group();
    group.position.set(centerX, centerY, centerZ);

    // Center pivot pillar
    const pivotGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 16);
    const pivotMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    const pivot = new THREE.Mesh(pivotGeo, pivotMat);
    pivot.position.y = 0.9;
    group.add(pivot);

    // Rotating bar
    const barGeo = new THREE.CylinderGeometry(0.3, 0.3, length, 16);
    const barMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0x991b1b,
      emissiveIntensity: 0.5
    });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.y = 0.9;
    bar.castShadow = true;
    group.add(bar);

    scene.add(group);

    rotatingObstacles.push({
      group,
      bar,
      position: new THREE.Vector3(centerX, centerY, centerZ),
      length,
      speed,
      angle: 0
    });
  }

  function addCoin(x, y, z) {
    const coinGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.1, 16);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xb45309,
      emissiveIntensity: 0.4,
      metalness: 0.8,
      roughness: 0.2
    });
    const mesh = new THREE.Mesh(coinGeo, coinMat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    scene.add(mesh);

    coins.push({
      mesh,
      baseY: y,
      collected: false,
      radius: 0.75
    });
  }

  function createGoalPortal(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Base podium
    const baseGeo = new THREE.CylinderGeometry(2.4, 2.8, 0.4, 16);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x059669 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.2;
    group.add(base);

    // Glowing Arch Ring
    const ringGeo = new THREE.TorusGeometry(1.8, 0.18, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 1.0
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 2.2;
    group.add(ring);

    // Inner Energy Core
    const coreGeo = new THREE.OctahedronGeometry(0.8, 0);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 2.2;
    group.add(core);

    scene.add(group);

    goalPortal = {
      group,
      ring,
      core,
      position: new THREE.Vector3(x, y, z),
      radius: 2.2
    };
  }

  // --- 10. Level Design Setup ---
  function buildLevel() {
    // 1. Starting Island (Safe Area)
    addPlatform(0, 0, 0, 12, 1.5, 12);

    // Coins on starting island
    addCoin(0, 2.0, -3.5);
    addCoin(3.0, 2.0, 0);

    // 2. Stepping Bridges
    addPlatform(0, 0.5, -11, 4, 1.2, 4);
    addCoin(0, 2.5, -11);

    addPlatform(0, 1.2, -19, 4, 1.2, 4);
    addCoin(0, 3.2, -19);

    // 3. Ping-Pong Moving Platform 1 (Moves laterally X: -6 to +6)
    addMovingPlatform(-6, 2.0, -28, 6, 2.0, -28, 5, 0.8, 5, 3.5);
    addCoin(0, 4.0, -28);

    // 4. Middle Checkpoint with Rotating Obstacle
    addPlatform(0, 2.5, -39, 10, 1.5, 10);
    addRotatingObstacle(0, 3.25, -39, 8.5, 1.5);
    addCoin(-3.0, 4.5, -39);
    addCoin(3.0, 4.5, -39);

    // 5. Super Jump Pad! (Blasts player up to high cliff)
    addJumpPad(0, 3.25, -46);
    addCoin(0, 8.0, -46); // Coin high in the jump trajectory!

    // 6. High Platform (Y: 10)
    addPlatform(0, 9.5, -58, 8, 1.5, 8);
    addCoin(0, 11.5, -58);

    // 7. Vertical Moving Elevator Platform (Y: 10 to 17)
    addMovingPlatform(0, 9.5, -69, 0, 16.5, -69, 5, 0.8, 5, 4.0);
    addCoin(0, 14.0, -69);

    // 8. Narrow Sky Bridges with Rotating Obstacle 2
    addPlatform(0, 17.0, -80, 5, 1.2, 8);
    addRotatingObstacle(0, 17.6, -80, 7.5, 2.2);
    addCoin(0, 19.0, -80);

    // 9. Final Stepping Stones
    addPlatform(-3.5, 18.0, -90, 3.5, 1.0, 3.5);
    addCoin(-3.5, 20.0, -90);

    addPlatform(3.5, 19.0, -97, 3.5, 1.0, 3.5);
    addCoin(3.5, 21.0, -97);

    // 10. Goal Sanctuary Island!
    addPlatform(0, 19.5, -108, 12, 1.5, 12);
    createGoalPortal(0, 20.25, -108);
  }
  buildLevel();

  // --- 11. Physics & Collision Engine ---
  function updatePlayerPhysics(dt) {
    if (state.isRespawning) return;

    // Movement Intent based on Camera Direction
    const camAngle = cameraState.yaw;
    const moveX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const moveZ = (input.backward ? 1 : 0) - (input.forward ? 1 : 0);

    let wishDir = new THREE.Vector3(0, 0, 0);
    if (moveX !== 0 || moveZ !== 0) {
      // Calculate wish dir rotated by camera angle
      const forward = new THREE.Vector3(-Math.sin(camAngle), 0, -Math.cos(camAngle));
      const right = new THREE.Vector3(Math.cos(camAngle), 0, -Math.sin(camAngle));
      wishDir.addScaledVector(forward, -moveZ);
      wishDir.addScaledVector(right, moveX);
      wishDir.normalize();

      // Smooth rotate player facing
      const targetAngle = Math.atan2(wishDir.x, wishDir.z);
      let diff = targetAngle - player.facingAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      player.facingAngle += diff * 12 * dt;
      player.group.rotation.y = player.facingAngle;
    }

    // Horizontal Acceleration / Friction
    const targetVelX = wishDir.x * player.moveSpeed;
    const targetVelZ = wishDir.z * player.moveSpeed;
    const accelRate = player.isGrounded ? player.accel : player.accel * 0.7; // High air control!

    player.velocity.x += (targetVelX - player.velocity.x) * Math.min(1.0, accelRate * dt);
    player.velocity.z += (targetVelZ - player.velocity.z) * Math.min(1.0, accelRate * dt);

    // Apply Gravity
    player.velocity.y += player.gravity * dt;

    // If standing on a moving platform, add platform velocity delta
    if (player.activePlatform && player.isGrounded) {
      player.position.add(player.activePlatform.delta);
    }

    // Apply Velocity to Position
    player.position.x += player.velocity.x * dt;
    player.position.z += player.velocity.z * dt;
    player.position.y += player.velocity.y * dt;

    // --- Ground & Ceiling Collision Detection ---
    player.isGrounded = false;
    let highestFloor = -999;
    let standingPlatform = null;

    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      // Check horizontal footprint bounds (with player radius margin)
      const buffer = player.radius * 0.6;
      if (
        player.position.x >= p.minX - buffer &&
        player.position.x <= p.maxX + buffer &&
        player.position.z >= p.minZ - buffer &&
        player.position.z <= p.maxZ + buffer
      ) {
        // Landing on top surface
        const floorY = p.topY;
        if (
          player.position.y >= floorY - 0.4 &&
          player.position.y <= floorY + 1.2 &&
          player.velocity.y <= 0
        ) {
          if (floorY > highestFloor) {
            highestFloor = floorY;
            standingPlatform = p;
          }
        }
      }
    }

    if (standingPlatform) {
      player.position.y = highestFloor;
      player.velocity.y = 0;
      player.isGrounded = true;
      player.jumpCount = 0;
      player.activePlatform = standingPlatform;
      updateJumpUI();
    } else {
      player.activePlatform = null;
    }

    // Update Player Model
    player.group.position.copy(player.position);

    // Update Ground Shadow Blob
    player.shadowMesh.position.x = player.position.x;
    player.shadowMesh.position.z = player.position.z;
    player.shadowMesh.position.y = player.isGrounded ? player.position.y + 0.03 : Math.max(highestFloor + 0.03, -15);
    const heightAboveGround = Math.max(0, player.position.y - player.shadowMesh.position.y);
    const shadowScale = Math.max(0.3, 1.0 - heightAboveGround * 0.05);
    player.shadowMesh.scale.set(shadowScale, shadowScale, shadowScale);
    player.shadowMesh.material.opacity = Math.max(0.1, 0.5 - heightAboveGround * 0.04);

    // --- Kill Zone Fall Check (BP_KillZone) ---
    if (player.position.y < -12 && !state.isRespawning) {
      triggerFallRespawn();
    }
  }

  // --- 12. Gimmick Interactions ---
  function updateGimmicks(dt, time) {
    // 1. Moving Platforms Update (Ping-Pong)
    for (let i = 0; i < movingPlatforms.length; i++) {
      const mp = movingPlatforms[i];
      const cycle = (time / mp.duration) % 2;
      // Ping pong progress: 0 -> 1 -> 0 with smooth sine easing
      const t = cycle < 1 ? cycle : 2 - cycle;
      const smoothT = (1 - Math.cos(t * Math.PI)) / 2;

      const newPos = new THREE.Vector3().lerpVectors(mp.startPos, mp.endPos, smoothT);
      mp.delta.copy(newPos).sub(mp.mesh.position);
      mp.mesh.position.copy(newPos);

      // Update collision boundaries
      mp.minX = newPos.x - mp.width / 2;
      mp.maxX = newPos.x + mp.width / 2;
      mp.topY = newPos.y + mp.height / 2;
      mp.bottomY = newPos.y - mp.height / 2;
      mp.minZ = newPos.z - mp.depth / 2;
      mp.maxZ = newPos.z + mp.depth / 2;
    }

    // 2. Rotating Obstacles (RotatingMovement)
    for (let i = 0; i < rotatingObstacles.length; i++) {
      const obs = rotatingObstacles[i];
      obs.angle += obs.speed * dt;
      obs.group.rotation.y = obs.angle;

      // Hit test with player
      const distToCenter = obs.position.distanceTo(player.position);
      if (distToCenter < obs.length / 2 + player.radius) {
        if (Math.abs(player.position.y - obs.position.y) < 1.4) {
          // Calculate obstacle bar direction
          const barDir = new THREE.Vector3(Math.cos(obs.angle), 0, -Math.sin(obs.angle));
          const toPlayer = new THREE.Vector3().subVectors(player.position, obs.position);
          toPlayer.y = 0;
          const proj = toPlayer.dot(barDir);

          if (Math.abs(proj) < obs.length / 2) {
            // Player is hit by the rotating arm! Knockback!
            const normal = new THREE.Vector3().subVectors(toPlayer, barDir.clone().multiplyScalar(proj));
            if (normal.length() < 0.6) {
              normal.normalize();
              player.velocity.x += normal.x * 16.0;
              player.velocity.z += normal.z * 16.0;
              player.velocity.y = 6.0;
              AudioEngine.playJump();
              spawnDustParticles(player.position, 15, 0xef4444);
            }
          }
        }
      }
    }

    // 3. Super Jump Pads (BP_JumpPad: Launch Character)
    for (let i = 0; i < jumpPads.length; i++) {
      const pad = jumpPads[i];
      const dist = new THREE.Vector2(player.position.x - pad.position.x, player.position.z - pad.position.z).length();
      if (dist < pad.radius && Math.abs(player.position.y - pad.position.y) < 0.8) {
        // Step on Jump Pad!
        player.velocity.y = pad.launchForce;
        player.jumpCount = 1; // Allows 1 more double jump in mid-air
        player.isGrounded = false;
        AudioEngine.playJumpPad();
        spawnDustParticles(player.position, 25, 0xf59e0b);

        // Visual squash animation
        pad.squash = 0.4;
      }

      if (pad.squash > 0) {
        pad.squash = Math.max(0, pad.squash - dt * 2.0);
        pad.pad.scale.y = 1.0 - pad.squash;
      }
    }

    // 4. Gold Coins (BP_Coin: Rotate + Collect)
    for (let i = 0; i < coins.length; i++) {
      const coin = coins[i];
      if (coin.collected) continue;

      coin.mesh.rotation.z += 3.0 * dt;
      coin.mesh.position.y = coin.baseY + Math.sin(time * 3 + i) * 0.15;

      const dist = player.position.distanceTo(coin.mesh.position);
      if (dist < player.radius + coin.radius) {
        coin.collected = true;
        scene.remove(coin.mesh);
        state.coins++;
        coinCounterEl.textContent = `${state.coins} / ${state.totalCoins}`;
        AudioEngine.playCoin();
        spawnDustParticles(coin.mesh.position, 20, 0xffd700);
      }
    }

    // 5. Goal Portal Animation & Clear Trigger (BP_Goal: WBP_ClearScreen)
    if (goalPortal && !state.isCleared) {
      goalPortal.ring.rotation.z += 1.5 * dt;
      goalPortal.core.rotation.x += 2.0 * dt;
      goalPortal.core.rotation.y += 2.5 * dt;

      const dist = player.position.distanceTo(goalPortal.position);
      if (dist < goalPortal.radius) {
        triggerStageClear();
      }
    }
  }

  // --- 13. Fall & Respawn (BP_KillZone) ---
  function triggerFallRespawn() {
    state.isRespawning = true;
    AudioEngine.playFall();
    fadeOverlay.classList.add('active');

    setTimeout(() => {
      // Teleport player back to start position
      player.position.set(0, 3, 0);
      player.velocity.set(0, 0, 0);
      player.facingAngle = 0;
      player.jumpCount = 0;
      updateJumpUI();

      fadeOverlay.classList.remove('active');
      setTimeout(() => {
        state.isRespawning = false;
      }, 200);
    }, 300);
  }

  // --- 14. Stage Clear Event (WBP_ClearScreen) ---
  function triggerStageClear() {
    state.isCleared = true;
    AudioEngine.playVictory();
    spawnFireworks(goalPortal.position);

    finalCoinsEl.textContent = `${state.coins} / ${state.totalCoins}`;
    finalTimeEl.textContent = formatTime(state.elapsedTime);

    setTimeout(() => {
      clearScreen.classList.remove('hidden');
    }, 700);
  }

  function resetGame() {
    clearScreen.classList.add('hidden');
    state.coins = 0;
    state.isCleared = false;
    state.startTime = null;
    state.elapsedTime = 0;
    coinCounterEl.textContent = `0 / ${state.totalCoins}`;
    timerEl.textContent = '00:00.0';

    // Respawn coins
    for (let i = 0; i < coins.length; i++) {
      const c = coins[i];
      if (c.collected) {
        c.collected = false;
        scene.add(c.mesh);
      }
    }

    // Reset Player
    player.position.set(0, 3, 0);
    player.velocity.set(0, 0, 0);
    player.facingAngle = 0;
    player.jumpCount = 0;
    updateJumpUI();
  }

  retryBtn.addEventListener('click', () => {
    AudioEngine.init();
    resetGame();
  });

  // --- 15. Smooth Follow Camera ---
  function updateCamera(dt) {
    const target = player.position.clone();
    target.y += 1.2; // Aim around chest height

    const horizDist = cameraState.distance * Math.cos(cameraState.pitch);
    const vertDist = cameraState.distance * Math.sin(cameraState.pitch);

    const camX = target.x + horizDist * Math.sin(cameraState.yaw);
    const camZ = target.z + horizDist * Math.cos(cameraState.yaw);
    const camY = target.y + vertDist;

    const desiredCamPos = new THREE.Vector3(camX, camY, camZ);
    // Smooth camera damping
    camera.position.lerp(desiredCamPos, Math.min(1.0, 10 * dt));
    camera.lookAt(target);
  }

  // --- 16. Main Game Loop ---
  let lastTime = performance.now();

  function animate(currentTime) {
    requestAnimationFrame(animate);

    const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;
    const time = currentTime / 1000;

    // Timer Update
    if (state.startTime && !state.isCleared) {
      state.elapsedTime = (currentTime - state.startTime) / 1000;
      timerEl.textContent = formatTime(state.elapsedTime);
    }

    updatePlayerPhysics(dt);
    updateGimmicks(dt, time);
    updateParticles(dt);
    updateCamera(dt);

    renderer.render(scene, camera);
  }

  // Initial UI state
  updateJumpUI();
  requestAnimationFrame(animate);

  // Resize Handling
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
