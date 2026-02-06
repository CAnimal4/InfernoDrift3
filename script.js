import * as THREE from "https://unpkg.com/three@0.161.0/build/three.module.js";

const canvas = document.getElementById("game");
const overlay = document.getElementById("overlay");
const message = document.getElementById("message");
const messageTitle = document.getElementById("message-title");
const messageBody = document.getElementById("message-body");
const startBtn = document.getElementById("start-btn");
const tutorialBtn = document.getElementById("tutorial-btn");
const tips = document.getElementById("tips");
const nextBtn = document.getElementById("next-btn");
const retryBtn = document.getElementById("retry-btn");
const boostBar = document.getElementById("boost-bar");
const shieldBar = document.getElementById("shield-bar");
const progressBar = document.getElementById("progress");
const hudWorld = document.getElementById("hud-world");
const hudLevel = document.getElementById("hud-level");
const hudTime = document.getElementById("hud-time");
const hudScore = document.getElementById("hud-score");
const hudSpeed = document.getElementById("hud-speed");
const hudLives = document.getElementById("hud-lives");
const hudHearts = document.getElementById("hud-hearts");
const hudCombo = document.getElementById("hud-combo");
const touchDrift = document.getElementById("touch-drift");
const touchBoost = document.getElementById("touch-boost");
const minimapCanvas = document.getElementById("minimap");
const minimapCtx = minimapCanvas ? minimapCanvas.getContext("2d") : null;
const menu = document.getElementById("menu");
const menuBtn = document.getElementById("menu-btn");
const menuClose = document.getElementById("menu-close");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");
const difficultySelect = document.getElementById("difficulty-select");
const invertToggle = document.getElementById("invert-toggle");
const cameraToggle = document.getElementById("camera-toggle");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0b0f14, 48, 620);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 600);
camera.position.set(0, 7.5, 14);

const hemi = new THREE.HemisphereLight(0xf4fbff, 0x12334f, 1.05);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffd8aa, 1.15);
sun.position.set(18, 28, 14);
scene.add(sun);

const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x0c1016, roughness: 0.9 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.02;
scene.add(ground);

const arena = new THREE.Group();
const props = new THREE.Group();
scene.add(arena, props);

const WORLD_SIZE = 520;
const HALF_WORLD = WORLD_SIZE / 2;
const CAR_RADIUS = 1.4;
const BOT_RADIUS = 1.4;
const POWERUP_RADIUS = 1.6;
const GRAVITY = -20;

const colorWhite = new THREE.MeshStandardMaterial({ color: 0xfaf4ea, roughness: 0.4 });
const colorBlack = new THREE.MeshStandardMaterial({ color: 0x10131a, roughness: 0.6 });
const colorGlass = new THREE.MeshStandardMaterial({ color: 0x2d5b7a, roughness: 0.2, metalness: 0.3 });

const worldData = [
  {
    name: "Cinder City",
    fog: 0x121c2a,
    sky: 0x10263b,
    ground: 0x16283a,
    accents: [0xff4d2d, 0xffa24c],
    levels: [
      { name: "Heatline Run", time: 70, bots: 4, botSpeed: 36, spawnRate: 0.6 },
      { name: "Neon Harriers", time: 80, bots: 5, botSpeed: 40, spawnRate: 0.7 },
      { name: "Ashfall Siege", time: 90, bots: 6, botSpeed: 44, spawnRate: 0.75 },
      { name: "Molten Gauntlet", time: 100, bots: 7, botSpeed: 48, spawnRate: 0.82 }
    ]
  },
  {
    name: "Glacier Surge",
    fog: 0x0f2332,
    sky: 0x11425e,
    ground: 0x16394f,
    accents: [0x20d4ff, 0x5ee1ff],
    levels: [
      { name: "Frostbite Drift", time: 80, bots: 5, botSpeed: 38, spawnRate: 0.65 },
      { name: "Aurora Raiders", time: 90, bots: 6, botSpeed: 42, spawnRate: 0.75 },
      { name: "Polar Rift", time: 100, bots: 7, botSpeed: 46, spawnRate: 0.8 },
      { name: "Whiteout Pursuit", time: 110, bots: 8, botSpeed: 50, spawnRate: 0.85 }
    ]
  },
  {
    name: "Solar Rift",
    fog: 0x2a1a0f,
    sky: 0x47200f,
    ground: 0x372212,
    accents: [0xff6b3f, 0xffc457],
    levels: [
      { name: "Helios Gate", time: 90, bots: 6, botSpeed: 40, spawnRate: 0.7 },
      { name: "Redline Tempest", time: 100, bots: 7, botSpeed: 46, spawnRate: 0.8 },
      { name: "Supernova Run", time: 110, bots: 8, botSpeed: 50, spawnRate: 0.85 },
      { name: "Corona Breaker", time: 120, bots: 9, botSpeed: 54, spawnRate: 0.9 }
    ]
  },
  {
    name: "Tempest Grid",
    fog: 0x14172d,
    sky: 0x2b2f66,
    ground: 0x1d2450,
    accents: [0x7bb0ff, 0x80fff1],
    levels: [
      { name: "Ion Relay", time: 105, bots: 7, botSpeed: 46, spawnRate: 0.82 },
      { name: "Arc Flash Alley", time: 115, bots: 8, botSpeed: 50, spawnRate: 0.87 },
      { name: "Stormline Apex", time: 125, bots: 9, botSpeed: 54, spawnRate: 0.91 },
      { name: "Thunder Crown", time: 135, bots: 10, botSpeed: 58, spawnRate: 0.95 }
    ]
  },
  {
    name: "Obsidian Expanse",
    fog: 0x120f14,
    sky: 0x2f2134,
    ground: 0x1c1620,
    accents: [0xff80d0, 0xa7c0ff],
    levels: [
      { name: "Void Approach", time: 115, bots: 8, botSpeed: 50, spawnRate: 0.88 },
      { name: "Phantom Causeway", time: 125, bots: 9, botSpeed: 54, spawnRate: 0.92 },
      { name: "Nocturne Collider", time: 135, bots: 10, botSpeed: 58, spawnRate: 0.96 },
      { name: "Abyssal Finale", time: 145, bots: 11, botSpeed: 62, spawnRate: 1.0 }
    ]
  }
];

const input = {
  left: false,
  right: false,
  throttle: false,
  brake: false,
  drift: false,
  boost: false,
  pointerActive: false,
  pointerX: 0,
  pointerStartX: 0,
  focusCamera: false
};

const settings = {
  difficulty: "classic",
  invertSteer: false,
  cameraFocus: false
};

const state = {
  running: false,
  worldIndex: 0,
  levelIndex: 0,
  score: 0,
  lives: 3,
  combo: 1,
  boost: 1,
  shield: 0,
  shieldTimer: 0,
  invincible: 0,
  timeLeft: 0,
  elapsed: 0,
  heat: 0,
  pendingAction: "next",
  airTime: 0,
  wasAirborne: false,
  livesPulse: 0,
  steerSmoothed: 0
};

const obstacles = [];
const ramps = [];
const powerups = [];
const boostPads = [];
const bots = [];

const tempVector = new THREE.Vector3();
const tempVectorB = new THREE.Vector3();
const tempVectorC = new THREE.Vector3();
let lastLivesRendered = -1;
const FX_POOL_SIZE = 160;
const fxPool = [];

const groundGrid = new THREE.GridHelper(WORLD_SIZE, 52, 0x4f6d88, 0x2f4357);
groundGrid.position.y = 0.01;
if (Array.isArray(groundGrid.material)) {
  groundGrid.material.forEach((material) => {
    material.transparent = true;
    material.opacity = 0.42;
  });
} else {
  groundGrid.material.transparent = true;
  groundGrid.material.opacity = 0.42;
}
scene.add(groundGrid);

function pointSegmentDistance2D(px, pz, ax, az, bx, bz) {
  const abx = bx - ax;
  const abz = bz - az;
  const apx = px - ax;
  const apz = pz - az;
  const abLenSq = abx * abx + abz * abz;
  if (abLenSq === 0) return Math.hypot(px - ax, pz - az);
  const t = THREE.MathUtils.clamp((apx * abx + apz * abz) / abLenSq, 0, 1);
  const cx = ax + abx * t;
  const cz = az + abz * t;
  return Math.hypot(px - cx, pz - cz);
}

class Car {
  constructor({ color = 0xff4d2d, accent = 0x10131a, isBot = false } = {}) {
    this.group = new THREE.Group();

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 3.2), new THREE.MeshStandardMaterial({ color, roughness: 0.4 }));
    body.position.y = 0.45;

    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 1.2), new THREE.MeshStandardMaterial({ color: accent, roughness: 0.5 }));
    hood.position.set(0, 0.65, 0.8);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.45, 1.2), colorGlass);
    cabin.position.set(0, 0.85, -0.1);

    const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 0.8), new THREE.MeshStandardMaterial({ color: accent, roughness: 0.5 }));
    trunk.position.set(0, 0.62, -1.2);

    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.4, 14);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0b0f14, roughness: 0.8 });

    this.wheels = [];
    const wheelOffsets = [
      [-0.9, 0.25, 1.1],
      [0.9, 0.25, 1.1],
      [-0.9, 0.25, -1.1],
      [0.9, 0.25, -1.1]
    ];

    wheelOffsets.forEach(([x, y, z]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, y, z);
      this.group.add(wheel);
      this.wheels.push(wheel);
    });

    const lightMat = new THREE.MeshStandardMaterial({ color: 0xffd4b5, emissive: 0xff7a45, emissiveIntensity: 1 });
    const lightGeo = new THREE.BoxGeometry(0.2, 0.15, 0.1);
    const lightLeft = new THREE.Mesh(lightGeo, lightMat);
    const lightRight = lightLeft.clone();
    lightLeft.position.set(-0.55, 0.55, 1.7);
    lightRight.position.set(0.55, 0.55, 1.7);

    const tailMat = new THREE.MeshStandardMaterial({ color: 0xff4d2d, emissive: 0xff4d2d, emissiveIntensity: 1 });
    const tailGeo = new THREE.BoxGeometry(0.22, 0.1, 0.1);
    const tailLeft = new THREE.Mesh(tailGeo, tailMat);
    const tailRight = tailLeft.clone();
    tailLeft.position.set(-0.55, 0.55, -1.7);
    tailRight.position.set(0.55, 0.55, -1.7);

    this.group.add(body, hood, cabin, trunk, lightLeft, lightRight, tailLeft, tailRight);
    this.group.castShadow = false;

    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.heading = 0;
    this.moveHeading = 0;
    this.speed = 0;
    this.maxSpeed = isBot ? 48 : 52;
    this.accel = isBot ? 18 : 22;
    this.turnRate = isBot ? 2.3 : 2.8;
    this.driftGrip = 1.1;
    this.normalGrip = 3.4;
    this.verticalVel = 0;
    this.isBot = isBot;
    this.boosted = false;
    this.target = null;
    this.lastRampTime = 0;
    this.aiBurstCooldown = 0;

    this.group.position.copy(this.position);
  }

  setPosition(x, y, z) {
    this.position.set(x, y, z);
    this.group.position.copy(this.position);
  }

  updateWheels(speed) {
    this.wheels.forEach((wheel) => {
      wheel.rotation.x -= speed * 0.05;
    });
  }

  update(dt) {
    this.position.addScaledVector(this.velocity, dt);
    this.group.position.copy(this.position);
    this.group.rotation.y = this.heading;
    this.updateWheels(this.speed * dt);
  }
}

const player = new Car({ color: 0xfff1d0, accent: 0x12151c, isBot: false });
scene.add(player.group);

function makeBot(color) {
  const bot = new Car({ color, accent: 0x14141a, isBot: true });
  scene.add(bot.group);
  return bot;
}

function getDifficultyProfile() {
  return {
    casual: {
      botSkill: 0.72,
      leadFactor: 0.38,
      reaction: 1.9,
      burstChance: 0.06,
      speedMultiplier: 0.92,
      heatRamp: 0.75
    },
    classic: {
      botSkill: 0.92,
      leadFactor: 0.62,
      reaction: 2.4,
      burstChance: 0.11,
      speedMultiplier: 1,
      heatRamp: 1
    },
    brutal: {
      botSkill: 1.12,
      leadFactor: 0.84,
      reaction: 3.1,
      burstChance: 0.18,
      speedMultiplier: 1.12,
      heatRamp: 1.4
    }
  }[settings.difficulty];
}

function createFxPool() {
  for (let i = 0; i < FX_POOL_SIZE; i += 1) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
    );
    mesh.visible = false;
    scene.add(mesh);
    fxPool.push({
      mesh,
      velocity: new THREE.Vector3(),
      life: 0,
      maxLife: 0.45
    });
  }
}

function spawnFx(position, velocity, color, scale = 1, life = 0.45) {
  const particle = fxPool.find((item) => item.life <= 0);
  if (!particle) return;
  particle.mesh.visible = true;
  particle.mesh.position.copy(position);
  particle.mesh.scale.setScalar(scale);
  particle.mesh.material.color.setHex(color);
  particle.mesh.material.opacity = 1;
  particle.velocity.copy(velocity);
  particle.life = life;
  particle.maxLife = life;
}

function updateFx(dt) {
  for (const particle of fxPool) {
    if (particle.life <= 0) continue;
    particle.life -= dt;
    if (particle.life <= 0) {
      particle.mesh.visible = false;
      particle.mesh.material.opacity = 0;
      continue;
    }
    particle.velocity.multiplyScalar(0.96);
    particle.velocity.y += 0.5 * dt;
    particle.mesh.position.addScaledVector(particle.velocity, dt);
    const alpha = particle.life / particle.maxLife;
    particle.mesh.material.opacity = alpha;
    particle.mesh.scale.setScalar(0.18 + alpha * 0.55);
  }
}

function makePowerup(type) {
  const colors = {
    boost: 0x28d7ff,
    shield: 0x7bff9d,
    life: 0xff4d2d,
    slow: 0xffc457
  };
  const geo = new THREE.IcosahedronGeometry(0.9, 0);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color: colors[type], emissive: colors[type], emissiveIntensity: 0.6 })
  );
  mesh.userData.type = type;
  mesh.userData.spin = Math.random() * Math.PI * 2;
  scene.add(mesh);
  return mesh;
}

function makeRamp(kind = "normal") {
  const isMega = kind === "mega";
  const baseRadius = isMega ? 10.5 : 6.2;
  const jumpLift = isMega ? 8.8 : 4;
  const speedKick = isMega ? 16 : 11;
  const rampGroup = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(baseRadius, baseRadius, isMega ? 0.58 : 0.45, 32),
    new THREE.MeshStandardMaterial({ color: 0x1a2028, roughness: 0.5 })
  );
  base.position.y = isMega ? 0.28 : 0.22;
  const dome = new THREE.Mesh(
    new THREE.ConeGeometry(isMega ? 7.2 : 4.8, isMega ? 2.6 : 1.8, 32),
    new THREE.MeshStandardMaterial({ color: 0xff7a45, emissive: 0x5a1e10, roughness: 0.35 })
  );
  dome.position.y = isMega ? 1.6 : 1.1;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(baseRadius + 0.35, isMega ? 0.35 : 0.25, 12, 46),
    new THREE.MeshStandardMaterial({ color: 0xffa24c, emissive: 0xff6b2e, emissiveIntensity: 0.9, roughness: 0.2 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = isMega ? 0.5 : 0.38;

  rampGroup.add(base, dome, ring);
  rampGroup.userData.radius = isMega ? 10.8 : 6.4;
  rampGroup.userData.jumpLift = jumpLift;
  rampGroup.userData.speedKick = speedKick;
  rampGroup.userData.kind = kind;
  scene.add(rampGroup);
  return rampGroup;
}

function makeBuilding(x, z, height, color) {
  const geo = new THREE.BoxGeometry(10, height, 10);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, height / 2, z);
  arena.add(mesh);
  obstacles.push({
    mesh,
    size: new THREE.Vector3(10, height, 10)
  });
}

function makeBarrier(x, z, width, depth) {
  const geo = new THREE.BoxGeometry(width, 2, depth);
  const mat = new THREE.MeshStandardMaterial({ color: 0x2a2f3b, roughness: 0.7 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, 1, z);
  props.add(mesh);
  obstacles.push({ mesh, size: new THREE.Vector3(width, 2, depth) });
}

function makeBoostPad() {
  const padGroup = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(3.2, 3.2, 0.18, 24),
    new THREE.MeshStandardMaterial({ color: 0x0d3c4d, emissive: 0x0b8fb8, emissiveIntensity: 0.45, roughness: 0.35 })
  );
  disc.position.y = 0.09;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.8, 0.24, 12, 40),
    new THREE.MeshStandardMaterial({ color: 0x27f2ff, emissive: 0x27f2ff, emissiveIntensity: 0.9, roughness: 0.2 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.24;
  padGroup.add(disc, ring);
  padGroup.userData.radius = 3.3;
  scene.add(padGroup);
  return padGroup;
}

function generateSpacedPolarPoints(count, minRadius, maxRadius, minSpacing, maxAttempts = 2200) {
  const points = [];
  let attempts = 0;
  while (points.length < count && attempts < maxAttempts) {
    attempts += 1;
    const angle = Math.random() * Math.PI * 2;
    const radius = THREE.MathUtils.lerp(minRadius, maxRadius, Math.pow(Math.random(), 0.85));
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    let tooClose = false;
    for (let i = 0; i < points.length; i += 1) {
      const dx = x - points[i].x;
      const dz = z - points[i].z;
      if (dx * dx + dz * dz < minSpacing * minSpacing) {
        tooClose = true;
        break;
      }
    }
    if (!tooClose) points.push({ x, z });
  }
  return points;
}

function clearWorld() {
  obstacles.splice(0, obstacles.length);
  ramps.splice(0, ramps.length);
  powerups.forEach((powerup) => scene.remove(powerup));
  powerups.splice(0, powerups.length);
  boostPads.forEach((pad) => scene.remove(pad));
  boostPads.splice(0, boostPads.length);
  arena.clear();
  props.clear();
}

function buildWorld() {
  clearWorld();
  const world = getWorld();
  scene.fog.color.setHex(world.fog);
  scene.background = new THREE.Color(world.sky);
  groundMaterial.color.setHex(world.ground);

  ramps.length = 0;
  const rampPoints = generateSpacedPolarPoints(18, 80, HALF_WORLD - 38, 62);
  rampPoints.forEach(({ x, z }, index) => {
    const kind = index % 5 === 0 ? "mega" : "normal";
    const ramp = makeRamp(kind);
    ramp.position.set(x, 0, z);
    ramps.push(ramp);
  });
  [
    { x: 0, z: 58, kind: "normal" },
    { x: -62, z: -44, kind: "mega" }
  ].forEach(({ x, z, kind }) => {
    const ramp = makeRamp(kind);
    ramp.position.set(x, 0, z);
    ramps.push(ramp);
  });

  boostPads.length = 0;
  const padPoints = generateSpacedPolarPoints(12, 70, HALF_WORLD - 40, 58);
  padPoints.forEach(({ x, z }) => {
    const pad = makeBoostPad();
    pad.position.set(x, 0, z);
    boostPads.push(pad);
  });
  [
    { x: 20, z: 20 },
    { x: -20, z: 35 }
  ].forEach(({ x, z }) => {
    const pad = makeBoostPad();
    pad.position.set(x, 0, z);
    boostPads.push(pad);
  });
}

function getWorld() {
  return worldData[state.worldIndex];
}

function getLevel() {
  return getWorld().levels[state.levelIndex];
}

function resetLevel() {
  state.combo = 1;
  state.boost = 1;
  state.shield = 0;
  state.shieldTimer = 0;
  state.invincible = 0;
  state.elapsed = 0;
  state.heat = 0;
  state.airTime = 0;
  state.wasAirborne = false;
  const level = getLevel();
  state.timeLeft = level.time;

  player.setPosition(0, 0, 0);
  player.velocity.set(0, 0, 0);
  player.speed = 0;
  player.heading = 0;
  player.moveHeading = 0;
  player.verticalVel = 0;
  player.lastRampTime = 0;
  state.steerSmoothed = 0;

  buildWorld();
  spawnBots();
  spawnPowerups();
}

function spawnBots() {
  bots.forEach((bot) => scene.remove(bot.group));
  bots.splice(0, bots.length);
  const level = getLevel();
  const palette = getWorld().accents;
  const difficultyScale = {
    casual: 0.7,
    classic: 1,
    brutal: 1.25
  }[settings.difficulty];
  const profile = getDifficultyProfile();
  const botCount = Math.max(2, Math.round(level.bots * difficultyScale));
  for (let i = 0; i < botCount; i += 1) {
    const bot = makeBot(palette[i % palette.length]);
    bot.setPosition(THREE.MathUtils.randFloatSpread(HALF_WORLD * 1.25), 0, THREE.MathUtils.randFloatSpread(HALF_WORLD * 1.25));
    bot.maxSpeed = level.botSpeed * difficultyScale * profile.speedMultiplier;
    bot.accel = (18 + level.bots * difficultyScale) * profile.botSkill;
    bot.turnRate = 2.1 * profile.botSkill;
    bot.aiBurstCooldown = Math.random() * 1.2;
    bot.lastRampTime = 0;
    bots.push(bot);
  }
}

function spawnPowerups() {
  powerups.forEach((powerup) => scene.remove(powerup));
  powerups.splice(0, powerups.length);
  const types = ["boost", "shield", "life", "slow"];
  for (let i = 0; i < 6; i += 1) {
    const type = types[Math.floor(Math.random() * types.length)];
    const powerup = makePowerup(type);
    powerup.position.set(THREE.MathUtils.randFloatSpread(HALF_WORLD * 1.65), 1.4, THREE.MathUtils.randFloatSpread(HALF_WORLD * 1.65));
    powerups.push(powerup);
  }
}

function updatePowerups(dt) {
  powerups.forEach((powerup) => {
    powerup.userData.spin += dt * 1.4;
    powerup.rotation.y = powerup.userData.spin;
    powerup.position.y = 1.4 + Math.sin(powerup.userData.spin * 2) * 0.2;
  });
}

function consumePowerup(powerup) {
  const type = powerup.userData.type;
  if (type === "boost") {
    state.boost = 1;
    state.score += 200;
  }
  if (type === "shield") {
    state.shield = Math.min(1, state.shield + 0.6);
    state.shieldTimer = 6;
    state.score += 150;
  }
  if (type === "life") {
    const previousLives = state.lives;
    state.lives = Math.min(5, state.lives + 1);
    if (state.lives > previousLives) state.livesPulse = 1;
    state.score += 250;
  }
  if (type === "slow") {
    state.heat = Math.max(0, state.heat - 0.4);
    bots.forEach((bot) => (bot.maxSpeed *= 0.92));
    state.score += 120;
  }

  powerup.position.set(THREE.MathUtils.randFloatSpread(HALF_WORLD * 1.65), 1.4, THREE.MathUtils.randFloatSpread(HALF_WORLD * 1.65));
  powerup.userData.type = ["boost", "shield", "life", "slow"][Math.floor(Math.random() * 4)];
  powerup.material.color.setHex({
    boost: 0x28d7ff,
    shield: 0x7bff9d,
    life: 0xff4d2d,
    slow: 0xffc457
  }[powerup.userData.type]);
  powerup.material.emissive.setHex(powerup.material.color.getHex());
}

function emitDrivingFx(dt, steer, driftActive, boostActive) {
  const speedAbs = Math.abs(player.speed);
  if (player.position.y > 0.25 || speedAbs < 6) return;

  const heading = player.moveHeading;
  const forward = tempVector.set(Math.sin(heading), 0, Math.cos(heading));
  const right = tempVectorB.set(Math.cos(heading), 0, -Math.sin(heading));
  const rearCenter = tempVectorC.copy(player.position).addScaledVector(forward, -1.35);

  if (driftActive && speedAbs > 10 && Math.abs(steer) > 0.18) {
    const intensity = THREE.MathUtils.clamp(speedAbs / 50, 0.25, 1);
    const jitter = (Math.random() - 0.5) * 0.35;
    const sideForce = Math.sign(steer || 1) * 2.5;
    const leftSpawn = rearCenter.clone().addScaledVector(right, -0.8 + jitter);
    const rightSpawn = rearCenter.clone().addScaledVector(right, 0.8 + jitter);
    const baseVel = forward.clone().multiplyScalar(-5 - speedAbs * 0.08);
    spawnFx(leftSpawn, baseVel.clone().addScaledVector(right, -sideForce), 0x9de8ff, 0.45 * intensity, 0.34);
    spawnFx(rightSpawn, baseVel.addScaledVector(right, sideForce), 0x9de8ff, 0.45 * intensity, 0.34);
  }

  if (boostActive && speedAbs > 8) {
    const flameSpawn = rearCenter.clone().addScaledVector(forward, -0.45);
    const boostVel = forward.clone().multiplyScalar(-14 - speedAbs * 0.2);
    boostVel.x += (Math.random() - 0.5) * 1.2;
    boostVel.z += (Math.random() - 0.5) * 1.2;
    boostVel.y += (Math.random() - 0.5) * 0.6;
    spawnFx(flameSpawn, boostVel, 0xff9f45, 0.62, 0.28);
    if (Math.random() < 0.45) {
      spawnFx(flameSpawn, boostVel.clone().multiplyScalar(0.75), 0xffe09b, 0.38, 0.22);
    }
  }
}

function updatePlayer(dt) {
  const inputSteer = getSteer() * (settings.invertSteer ? -1 : 1);
  const steerFilter = input.drift ? 5.2 : 8.2;
  state.steerSmoothed += (inputSteer - state.steerSmoothed) * dt * steerFilter;
  const steer = state.steerSmoothed;
  const throttle = input.throttle ? 1 : 0;
  const brake = input.brake ? 1 : 0;
  const drift = input.drift;
  const boostActive = input.boost && state.boost > 0.05;

  const speedAbs = Math.abs(player.speed);
  const speedRatio = THREE.MathUtils.clamp(speedAbs / player.maxSpeed, 0, 1);
  const accel = player.accel * (boostActive ? 1.35 : 1);
  if (throttle) player.speed += accel * dt;
  if (brake) player.speed -= accel * dt * (0.9 + speedRatio * 0.25);

  if (!throttle && !brake) {
    player.speed -= Math.sign(player.speed) * (8.5 + speedRatio * 5.5) * dt;
  }

  player.speed = THREE.MathUtils.clamp(player.speed, -12, player.maxSpeed * (boostActive ? 1.25 : 1));

  const turnAssist = 0.78 + (1 - speedRatio) * 0.42;
  const turnPower = player.turnRate * turnAssist * (drift ? 1.18 : 1);
  const direction = player.speed >= 0 ? 1 : -1;
  player.heading += steer * turnPower * dt * direction;

  const grip = drift ? 1.25 : 3.9;
  const slipAmount = drift ? 0.58 : 0.18;
  player.moveHeading = THREE.MathUtils.lerp(player.moveHeading, player.heading, grip * dt);

  const forward = new THREE.Vector3(Math.sin(player.moveHeading), 0, Math.cos(player.moveHeading));
  player.velocity.copy(forward).multiplyScalar(player.speed);
  const lateral = new THREE.Vector3(Math.cos(player.moveHeading), 0, -Math.sin(player.moveHeading));
  player.velocity.addScaledVector(lateral, steer * speedAbs * slipAmount * 0.08);

  if (boostActive) {
    state.boost = Math.max(0, state.boost - dt * 0.18);
  } else {
    state.boost = Math.min(1, state.boost + dt * 0.08);
  }

  if (state.shieldTimer > 0) {
    state.shieldTimer -= dt;
  }

  state.invincible = Math.max(0, state.invincible - dt);

  updateVerticalPhysics(player, dt);
  player.update(dt);
  updateCombo(dt, steer);
  emitDrivingFx(dt, steer, drift, boostActive);

  if (boostActive) {
    state.score += dt * 6 * state.combo;
  }
}

function updateVerticalPhysics(car, dt) {
  car.verticalVel += GRAVITY * dt;
  car.position.y += car.verticalVel * dt;

  if (car.position.y <= 0) {
    car.position.y = 0;
    car.verticalVel = 0;
    if (!car.isBot && state.wasAirborne) {
      const bonus = Math.min(2.5, state.airTime);
      if (bonus > 0.2) {
        state.score += Math.round(120 * bonus);
        state.boost = Math.min(1, state.boost + bonus * 0.15);
      }
      state.airTime = 0;
      state.wasAirborne = false;
    }
  } else if (!car.isBot) {
    state.airTime += dt;
    state.wasAirborne = true;
  }

  ramps.forEach((ramp) => {
    const radius = ramp.userData.radius;
    const jumpLift = ramp.userData.jumpLift ?? 4;
    const speedKick = ramp.userData.speedKick ?? 11;
    const currentDistance = Math.hypot(car.position.x - ramp.position.x, car.position.z - ramp.position.z);
    const nextX = car.position.x + car.velocity.x * dt;
    const nextZ = car.position.z + car.velocity.z * dt;
    const nextDistance = Math.hypot(nextX - ramp.position.x, nextZ - ramp.position.z);
    const sweptDistance = pointSegmentDistance2D(
      ramp.position.x,
      ramp.position.z,
      car.position.x,
      car.position.z,
      nextX,
      nextZ
    );
    const speedAbs = Math.abs(car.speed);
    const speedMargin = Math.min(5.2, speedAbs * 0.07);
    const triggerRadius = radius + speedMargin;
    const closestDistance = Math.min(currentDistance, nextDistance, sweptDistance);
    const ready = performance.now() - car.lastRampTime > 220;
    if (closestDistance < triggerRadius && car.position.y <= 0.32 && ready && speedAbs > 1.8) {
      const centerBoost = 1 - THREE.MathUtils.clamp(closestDistance / triggerRadius, 0, 1);
      car.verticalVel = 9.2 + Math.abs(car.speed) * 0.085 + centerBoost * jumpLift;
      const currentSign = Math.sign(car.speed || 1);
      car.speed = Math.min(car.maxSpeed * 1.35, Math.abs(car.speed) + speedKick) * currentSign;
      car.lastRampTime = performance.now();
      if (!car.isBot) state.score += Math.round(70 + centerBoost * (70 + jumpLift * 8));
    }
  });
}

function updateBots(dt) {
  const level = getLevel();
  const profile = getDifficultyProfile();
  const targetSpeed = (level.botSpeed + state.heat * 8 * profile.heatRamp) * profile.speedMultiplier;

  bots.forEach((bot, index) => {
    bot.aiBurstCooldown = Math.max(0, bot.aiBurstCooldown - dt);
    const predictionTime = THREE.MathUtils.clamp((bot.position.distanceTo(player.position) / 60) * profile.leadFactor, 0.05, 0.85);
    const predicted = tempVector
      .copy(player.position)
      .addScaledVector(player.velocity, predictionTime)
      .addScaledVector(new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading)), 2.8);

    const toPlayer = tempVectorB.copy(predicted).sub(bot.position);
    const distance = toPlayer.length();
    const desiredHeading = Math.atan2(toPlayer.x, toPlayer.z);
    let steer = THREE.MathUtils.clamp(angleDifference(bot.heading, desiredHeading), -1, 1);
    steer *= profile.botSkill;

    // Simple local separation prevents all bots stacking on one vector.
    for (let j = 0; j < bots.length; j += 1) {
      if (j === index) continue;
      const other = bots[j];
      const dx = bot.position.x - other.position.x;
      const dz = bot.position.z - other.position.z;
      const d2 = dx * dx + dz * dz;
      if (d2 > 0.01 && d2 < 36) {
        steer += (dx - dz) * 0.003;
      }
    }
    steer = THREE.MathUtils.clamp(steer, -1, 1);

    bot.heading += steer * bot.turnRate * dt * profile.reaction;
    bot.moveHeading = THREE.MathUtils.lerp(bot.moveHeading, bot.heading, (1.9 + profile.botSkill) * dt);

    const closePressure = THREE.MathUtils.clamp((55 - distance) / 55, 0, 1);
    let speedBoost = distance > 50 ? 1.28 : 1;
    if (bot.aiBurstCooldown <= 0 && Math.random() < profile.burstChance * dt * 12) {
      bot.aiBurstCooldown = THREE.MathUtils.randFloat(1.1, 2.1);
      speedBoost += 0.28;
    }
    bot.speed += bot.accel * dt * (0.5 + closePressure * 0.55);
    bot.speed = Math.min(targetSpeed * speedBoost, bot.maxSpeed + state.heat * 6.5 * profile.heatRamp);

    const forward = tempVectorC.set(Math.sin(bot.moveHeading), 0, Math.cos(bot.moveHeading));
    bot.velocity.copy(forward).multiplyScalar(bot.speed);

    if (index % 2 === 0 && distance < 16) {
      bot.velocity.add(new THREE.Vector3(Math.cos(bot.heading), 0, -Math.sin(bot.heading)).multiplyScalar(5.5 * profile.botSkill));
    }

    updateVerticalPhysics(bot, dt);
    bot.update(dt);

    if (distance < BOT_RADIUS + CAR_RADIUS && state.invincible <= 0) {
      if (state.shield > 0.2) {
        state.shield = Math.max(0, state.shield - 0.3);
      } else {
        loseLife();
      }
      state.invincible = 2.2;
      bot.speed *= 0.6;
    }
  });
}

function updateObstacles(entity) {
  obstacles.forEach((obstacle) => {
    const size = obstacle.size;
    const mesh = obstacle.mesh;
    if (
      Math.abs(entity.position.x - mesh.position.x) < size.x / 2 + CAR_RADIUS &&
      Math.abs(entity.position.z - mesh.position.z) < size.z / 2 + CAR_RADIUS
    ) {
      const pushX = entity.position.x - mesh.position.x;
      const pushZ = entity.position.z - mesh.position.z;
      const push = new THREE.Vector3(pushX, 0, pushZ).normalize();
      entity.position.addScaledVector(push, 2.4);
      entity.speed *= 0.5;
    }
  });

  entity.position.x = THREE.MathUtils.clamp(entity.position.x, -HALF_WORLD + 4, HALF_WORLD - 4);
  entity.position.z = THREE.MathUtils.clamp(entity.position.z, -HALF_WORLD + 4, HALF_WORLD - 4);
}

function updatePowerupCollisions() {
  powerups.forEach((powerup) => {
    const dist = powerup.position.distanceTo(player.position);
    if (dist < POWERUP_RADIUS) {
      consumePowerup(powerup);
    }
  });
}

function updateBoostPads() {
  boostPads.forEach((pad) => {
    const distance = Math.hypot(player.position.x - pad.position.x, player.position.z - pad.position.z);
    if (distance < pad.userData.radius && player.position.y <= 0.2) {
      player.speed = Math.min(player.maxSpeed * 1.2, player.speed + 14);
      state.boost = Math.min(1, state.boost + 0.2);
      state.score += 40;
    }
  });
}

function updateCamera(dt) {
  const cameraTarget = player.position.clone();
  const back = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading)).multiplyScalar(-12);
  const desired = cameraTarget.clone().add(back).add(new THREE.Vector3(0, 7.5, 0));

  if (input.focusCamera || settings.cameraFocus) {
    desired.add(new THREE.Vector3(0, 4, 0));
  }

  camera.position.lerp(desired, dt * 3.2);
  camera.lookAt(player.position.clone().add(new THREE.Vector3(0, 1.2, 0)));
}

function updateCombo(dt, steer) {
  if (input.drift && Math.abs(steer) > 0.2 && Math.abs(player.speed) > 12) {
    state.combo = Math.min(6, state.combo + dt * 0.8);
    state.score += dt * 12 * state.combo;
  } else {
    state.combo = Math.max(1, state.combo - dt * 0.5);
  }
}

function updateDifficulty(dt) {
  const profile = getDifficultyProfile();
  state.elapsed += dt;
  if (state.elapsed > 10) {
    state.heat = Math.min(1.35, state.heat + dt * 0.015 * profile.heatRamp);
  }
}

function worldToMinimap(x, z, size, padding) {
  const usable = size - padding * 2;
  const nx = (x + HALF_WORLD) / WORLD_SIZE;
  const nz = (z + HALF_WORLD) / WORLD_SIZE;
  return {
    x: padding + THREE.MathUtils.clamp(nx, 0, 1) * usable,
    y: padding + THREE.MathUtils.clamp(nz, 0, 1) * usable
  };
}

function drawMinimap() {
  if (!minimapCtx || !minimapCanvas) return;
  const size = minimapCanvas.width;
  const pad = 10;

  minimapCtx.clearRect(0, 0, size, size);
  minimapCtx.fillStyle = "rgba(6, 12, 20, 0.96)";
  minimapCtx.fillRect(0, 0, size, size);

  minimapCtx.strokeStyle = "rgba(123, 161, 199, 0.75)";
  minimapCtx.lineWidth = 1;
  minimapCtx.strokeRect(pad, pad, size - pad * 2, size - pad * 2);

  minimapCtx.strokeStyle = "rgba(123, 161, 199, 0.28)";
  const step = (size - pad * 2) / 4;
  for (let i = 1; i < 4; i += 1) {
    const p = pad + step * i;
    minimapCtx.beginPath();
    minimapCtx.moveTo(p, pad);
    minimapCtx.lineTo(p, size - pad);
    minimapCtx.stroke();
    minimapCtx.beginPath();
    minimapCtx.moveTo(pad, p);
    minimapCtx.lineTo(size - pad, p);
    minimapCtx.stroke();
  }

  minimapCtx.fillStyle = "rgba(255, 171, 92, 0.92)";
  ramps.forEach((ramp) => {
    const p = worldToMinimap(ramp.position.x, ramp.position.z, size, pad);
    const r = ramp.userData.kind === "mega" ? 2.9 : 2;
    minimapCtx.beginPath();
    minimapCtx.arc(p.x, p.y, r, 0, Math.PI * 2);
    minimapCtx.fill();
  });

  minimapCtx.fillStyle = "rgba(255, 93, 93, 0.95)";
  bots.forEach((bot) => {
    const p = worldToMinimap(bot.position.x, bot.position.z, size, pad);
    minimapCtx.beginPath();
    minimapCtx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
    minimapCtx.fill();
  });

  const playerPoint = worldToMinimap(player.position.x, player.position.z, size, pad);
  const heading = player.heading;
  const dirX = Math.sin(heading);
  const dirY = Math.cos(heading);
  minimapCtx.fillStyle = "#7effff";
  minimapCtx.beginPath();
  minimapCtx.moveTo(playerPoint.x + dirX * 6, playerPoint.y + dirY * 6);
  minimapCtx.lineTo(playerPoint.x - dirY * 3.8, playerPoint.y + dirX * 3.8);
  minimapCtx.lineTo(playerPoint.x + dirY * 3.8, playerPoint.y - dirX * 3.8);
  minimapCtx.closePath();
  minimapCtx.fill();
}

function updateHud() {
  const level = getLevel();
  hudWorld.textContent = getWorld().name;
  hudLevel.textContent = level.name;
  hudScore.textContent = Math.floor(state.score).toString();
  hudSpeed.textContent = `${Math.round(Math.abs(player.speed) * 8.2)} KPH`;
  renderLivesHud();
  hudCombo.textContent = `x${state.combo.toFixed(1)}`;
  const minutes = Math.floor(state.timeLeft / 60);
  const seconds = Math.floor(state.timeLeft % 60).toString().padStart(2, "0");
  hudTime.textContent = `${minutes}:${seconds}`;
  boostBar.style.width = `${Math.round(state.boost * 100)}%`;
  shieldBar.style.width = `${Math.round(state.shield * 100)}%`;
  progressBar.style.width = `${Math.min(100, (1 - state.timeLeft / level.time) * 100)}%`;
  drawMinimap();
}

function renderLivesHud() {
  if (state.lives !== lastLivesRendered || state.livesPulse !== 0) {
    const maxLives = 5;
    const change = state.livesPulse;
    const lostIndex = change < 0 ? state.lives : -1;
    const gainedIndex = change > 0 ? state.lives - 1 : -1;
    hudHearts.innerHTML = "";
    for (let i = 0; i < maxLives; i += 1) {
      const heart = document.createElement("span");
      heart.className = "heart";
      heart.textContent = "♥";
      if (i >= state.lives) heart.classList.add("off");
      if (i === lostIndex) heart.classList.add("lost");
      if (i === gainedIndex) heart.classList.add("gained");
      hudHearts.appendChild(heart);
    }
    hudLives.textContent = `${state.lives}/${maxLives}`;
    lastLivesRendered = state.lives;
    state.livesPulse = 0;
  }
}

function loseLife() {
  state.lives -= 1;
  state.livesPulse = -1;
  state.score = Math.max(0, state.score - 200);
  player.setPosition(0, 0, 0);
  player.speed = 0;
  player.velocity.set(0, 0, 0);
  player.heading = 0;
  player.moveHeading = 0;
  if (state.lives <= 0) {
    showMessage("System Critical", "The hunters caught you. Press Enter to retry.", "Retry", "retry");
  }
}

function getSteer() {
  if (input.pointerActive) {
    const delta = (input.pointerStartX - input.pointerX) / (window.innerWidth * 0.4);
    return THREE.MathUtils.clamp(delta, -1, 1);
  }
  return (input.left ? 1 : 0) + (input.right ? -1 : 0);
}

function angleDifference(a, b) {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

function startRun(resetLives = false) {
  overlay.classList.remove("show");
  message.classList.remove("show");
  if (resetLives) {
    state.lives = 3;
    state.livesPulse = 0;
    state.score = 0;
  }
  state.running = true;
  resetLevel();
}

function showMessage(title, body, nextLabel = "Next", action = "next") {
  messageTitle.textContent = title;
  messageBody.textContent = body;
  nextBtn.textContent = nextLabel;
  message.classList.add("show");
  state.running = false;
  state.pendingAction = action;
}

function completeLevel() {
  const world = getWorld();
  const level = getLevel();
  const isLastLevel = state.levelIndex === world.levels.length - 1;
  if (isLastLevel) {
    const isLastWorld = state.worldIndex === worldData.length - 1;
    if (isLastWorld) {
      showMessage("Champion Crowned", "You outran every hunter. Press Enter to restart.", "Restart Saga");
    } else {
      showMessage(`World Cleared: ${world.name}`, "New realm unlocked. Press Enter to ignite.");
    }
  } else {
    showMessage(`Level Cleared: ${level.name}`, "Momentum locked. Press Enter for the next heat.");
  }
}

function advanceNext() {
  const world = getWorld();
  if (state.levelIndex < world.levels.length - 1) {
    state.levelIndex += 1;
  } else if (state.worldIndex < worldData.length - 1) {
    state.worldIndex += 1;
    state.levelIndex = 0;
  } else {
    state.worldIndex = 0;
    state.levelIndex = 0;
  }
  startRun();
}

let lastTime = performance.now();
function animate(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  if (state.running) {
    state.timeLeft = Math.max(0, state.timeLeft - dt);
    updateDifficulty(dt);

    updatePlayer(dt);
    updateBots(dt);

    updateObstacles(player);
    bots.forEach((bot) => updateObstacles(bot));
    updatePowerups(dt);
    updatePowerupCollisions();
    updateBoostPads();
    updateFx(dt);

    if (state.timeLeft <= 0) {
      completeLevel();
    }
  } else {
    updateFx(dt);
  }

  updateCamera(dt);
  updateHud();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
});

window.addEventListener("keydown", (event) => {
  if (event.code === "ArrowLeft" || event.code === "KeyA") input.left = true;
  if (event.code === "ArrowRight" || event.code === "KeyD") input.right = true;
  if (event.code === "ArrowUp" || event.code === "KeyW") input.throttle = true;
  if (event.code === "ArrowDown" || event.code === "KeyS") input.brake = true;
  if (event.code === "Space") input.drift = true;
  if (event.code === "ShiftLeft" || event.code === "ShiftRight") input.boost = true;
  if (event.code === "KeyC") input.focusCamera = true;
  if (event.code === "KeyR") startRun(false);
  if (event.code === "Enter") {
    if (overlay.classList.contains("show")) {
      startRun(true);
    } else if (message.classList.contains("show")) {
      message.classList.remove("show");
      if (state.pendingAction === "retry") {
        startRun(true);
      } else {
        advanceNext();
      }
    }
  }
  if (event.code === "Escape") {
    menu.classList.toggle("show");
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "ArrowLeft" || event.code === "KeyA") input.left = false;
  if (event.code === "ArrowRight" || event.code === "KeyD") input.right = false;
  if (event.code === "ArrowUp" || event.code === "KeyW") input.throttle = false;
  if (event.code === "ArrowDown" || event.code === "KeyS") input.brake = false;
  if (event.code === "Space") input.drift = false;
  if (event.code === "ShiftLeft" || event.code === "ShiftRight") input.boost = false;
  if (event.code === "KeyC") input.focusCamera = false;
});

canvas.addEventListener("pointerdown", (event) => {
  input.pointerActive = true;
  input.pointerStartX = event.clientX;
  input.pointerX = event.clientX;
});

canvas.addEventListener("pointermove", (event) => {
  if (!input.pointerActive) return;
  input.pointerX = event.clientX;
});

window.addEventListener("pointerup", () => {
  input.pointerActive = false;
});

touchDrift.addEventListener("pointerdown", () => (input.drift = true));
touchDrift.addEventListener("pointerup", () => (input.drift = false));
touchDrift.addEventListener("pointerleave", () => (input.drift = false));
touchBoost.addEventListener("pointerdown", () => (input.boost = true));
touchBoost.addEventListener("pointerup", () => (input.boost = false));
touchBoost.addEventListener("pointerleave", () => (input.boost = false));

startBtn.addEventListener("click", () => startRun(true));
tutorialBtn.addEventListener("click", () => {
  tips.style.display = tips.style.display === "none" ? "grid" : "none";
});
nextBtn.addEventListener("click", () => {
  message.classList.remove("show");
  if (state.pendingAction === "retry") {
    startRun(true);
  } else {
    advanceNext();
  }
});
retryBtn.addEventListener("click", () => {
  message.classList.remove("show");
  if (state.pendingAction === "retry") {
    startRun(true);
  } else {
    startRun(false);
  }
});

menuBtn.addEventListener("click", () => {
  menu.classList.add("show");
});
menuClose.addEventListener("click", () => {
  menu.classList.remove("show");
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    tabPanels.forEach((panel) => panel.classList.remove("active"));
    button.classList.add("active");
    const target = document.getElementById(`tab-${button.dataset.tab}`);
    if (target) target.classList.add("active");
  });
});

difficultySelect.addEventListener("change", (event) => {
  settings.difficulty = event.target.value;
  spawnBots();
});

invertToggle.addEventListener("change", (event) => {
  settings.invertSteer = event.target.checked;
});

cameraToggle.addEventListener("change", (event) => {
  settings.cameraFocus = event.target.checked;
});

createFxPool();
resetLevel();
updateHud();
requestAnimationFrame(animate);
