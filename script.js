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
const rampDensitySelect = document.getElementById("ramp-density-select");
const touchModeToggle = document.getElementById("touch-mode-toggle");
const touchControlsRoot = document.getElementById("touch-controls");
const touchSteerPad = document.getElementById("touch-steer-pad");
const touchSteerKnob = document.getElementById("touch-steer-knob");

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
const POWERUP_PICKUP_RADIUS = 3.1;
const POWERUP_VISUAL_SCALE = 1.45;
const GRAVITY = -20;
const PHYSICS_SUBSTEPS_BASE = 2;
const PHYSICS_SUBSTEPS_MAX = 7;
const RAMP_TRIGGER_THICKNESS = 1.4;
const RAMP_SPEED_MARGIN_MULT = 0.145;
const RAMP_LAUNCH_VERTICAL_MULT = 1.24;
const BOT_HIT_RADIUS = BOT_RADIUS + CAR_RADIUS + 0.65;
const BOT_VERTICAL_HIT_TOLERANCE = 1.05;
const BOT_COLLISION_HEIGHT = 0.8;
const BOT_HIT_COOLDOWN_MS = 420;
const POST_HIT_SAFE_FRAMES = 8;
const SPEED_TO_MPH_MULT = 2.32;
const PLAYER_MAX_SPEED = 64;
const PLAYER_BOOST_SPEED_MULT = 1.32;
const PLAYER_ACCEL_MULT = 1.12;
const CAMERA_HEIGHT = 6.2;
const CAMERA_BACK_DISTANCE = 11.4;
const CAMERA_LOOK_HEIGHT = 1.05;
const DEBUG_FLAGS = {
  enabled: false,
  input: false,
  world: false,
  ramps: false,
  hits: false,
  menu: false,
  powerups: false
};
const PLAYER_SPAWN_X = 0;
const PLAYER_SPAWN_Z = -90;

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
  focusCamera: false,
  touchEnabled: false,
  touchSteer: 0
};

const settings = {
  difficulty: "classic",
  invertSteer: true,
  cameraFocus: false,
  rampDensity: "normal"
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
  steerSmoothed: 0,
  isBuildingWorld: false,
  buildCount: 0,
  hitCount: 0,
  missedHitSamples: 0,
  missedVerticalHitSamples: 0,
  lastHitAt: 0,
  lastHitByBotId: -1,
  postHitSafeFrames: 0,
  slowBotsTimer: 0,
  effectToast: "",
  effectToastTimer: 0
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
let botIdSeed = 1;

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

function segmentSegmentDistance2D(a0x, a0z, a1x, a1z, b0x, b0z, b1x, b1z) {
  const distances = [
    pointSegmentDistance2D(a0x, a0z, b0x, b0z, b1x, b1z),
    pointSegmentDistance2D(a1x, a1z, b0x, b0z, b1x, b1z),
    pointSegmentDistance2D(b0x, b0z, a0x, a0z, a1x, a1z),
    pointSegmentDistance2D(b1x, b1z, a0x, a0z, a1x, a1z)
  ];
  return Math.min(...distances);
}

function debugLog(channel, ...args) {
  if (!DEBUG_FLAGS.enabled) return;
  if (!DEBUG_FLAGS[channel]) return;
  console.log(`[debug:${channel}]`, ...args);
}

function disposeObject3D(root) {
  if (!root) return;
  root.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (Array.isArray(child.material)) {
      child.material.forEach((mat) => mat && mat.dispose && mat.dispose());
    } else if (child.material && child.material.dispose) {
      child.material.dispose();
    }
  });
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
    this.maxSpeed = isBot ? 48 : PLAYER_MAX_SPEED;
    this.accel = isBot ? 18 : 22 * PLAYER_ACCEL_MULT;
    this.turnRate = isBot ? 2.3 : 2.8;
    this.driftGrip = 1.1;
    this.normalGrip = 3.4;
    this.verticalVel = 0;
    this.isBot = isBot;
    this.boosted = false;
    this.target = null;
    this.lastRampTime = 0;
    this.aiBurstCooldown = 0;
    this.prevPosition = new THREE.Vector3();

    this.group.position.copy(this.position);
    this.prevPosition.copy(this.position);
  }

  setPosition(x, y, z) {
    this.position.set(x, y, z);
    this.group.position.copy(this.position);
    this.prevPosition.copy(this.position);
  }

  updateWheels(speed) {
    this.wheels.forEach((wheel) => {
      wheel.rotation.x -= speed * 0.05;
    });
  }

  update(dt) {
    this.prevPosition.copy(this.position);
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
  bot.botId = botIdSeed++;
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
      speedMultiplier: 1.02,
      heatRamp: 0.75,
      teamwork: 0.15
    },
    classic: {
      botSkill: 0.92,
      leadFactor: 0.62,
      reaction: 2.4,
      burstChance: 0.11,
      speedMultiplier: 1.15,
      heatRamp: 1,
      teamwork: 0.62
    },
    brutal: {
      botSkill: 1.12,
      leadFactor: 0.84,
      reaction: 3.1,
      burstChance: 0.18,
      speedMultiplier: 1.35,
      heatRamp: 1.4,
      teamwork: 0.9
    }
  }[settings.difficulty];
}

function getBotRole(index, count, teamwork) {
  if (teamwork < 0.3) return "chase";
  if (index === 0) return "intercept";
  if (index % 4 === 1) return "left_flank";
  if (index % 4 === 2) return "right_flank";
  if (index === count - 1) return "cutoff";
  return "pressure";
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
  const geo = new THREE.IcosahedronGeometry(0.9 * POWERUP_VISUAL_SCALE, 0);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color: colors[type], emissive: colors[type], emissiveIntensity: 0.6 })
  );
  mesh.userData.type = type;
  mesh.userData.spin = Math.random() * Math.PI * 2;
  scene.add(mesh);
  return mesh;
}

function setEffectToast(text) {
  state.effectToast = text;
  state.effectToastTimer = 1.4;
}

function makeRamp(kind = "normal") {
  const isMega = kind === "mega";
  const isTitan = kind === "titan";
  const baseRadius = isTitan ? 21 : isMega ? 10.5 : 6.2;
  const jumpLift = isTitan ? 16 : isMega ? 8.8 : 4;
  const speedKick = isTitan ? 28 : isMega ? 16 : 11;
  const rampGroup = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(baseRadius, baseRadius, isTitan ? 0.9 : isMega ? 0.58 : 0.45, 32),
    new THREE.MeshStandardMaterial({ color: 0x1a2028, roughness: 0.5 })
  );
  base.position.y = isTitan ? 0.46 : isMega ? 0.28 : 0.22;
  const dome = new THREE.Mesh(
    new THREE.ConeGeometry(isTitan ? 14.2 : isMega ? 7.2 : 4.8, isTitan ? 5.4 : isMega ? 2.6 : 1.8, 32),
    new THREE.MeshStandardMaterial({ color: 0xff7a45, emissive: 0x5a1e10, roughness: 0.35 })
  );
  dome.position.y = isTitan ? 3.2 : isMega ? 1.6 : 1.1;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(baseRadius + 0.35, isTitan ? 0.5 : isMega ? 0.35 : 0.25, 12, 46),
    new THREE.MeshStandardMaterial({ color: 0xffa24c, emissive: 0xff6b2e, emissiveIntensity: 0.9, roughness: 0.2 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = isTitan ? 0.78 : isMega ? 0.5 : 0.38;

  rampGroup.add(base, dome, ring);
  rampGroup.userData.radius = isTitan ? 22 : isMega ? 10.8 : 6.4;
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

function getRampDensityConfig(density) {
  const table = {
    low: { randomCount: 6, spacing: 118, megaEvery: 9, extras: [{ x: 0, z: 108, kind: "normal" }] },
    normal: {
      randomCount: 18,
      spacing: 62,
      megaEvery: 5,
      extras: [
        { x: 0, z: 92, kind: "normal" },
        { x: -62, z: -44, kind: "mega" }
      ]
    },
    high: {
      randomCount: 56,
      spacing: 24,
      megaEvery: 3,
      extras: [
        { x: 0, z: 92, kind: "normal" },
        { x: -62, z: -44, kind: "mega" },
        { x: 74, z: -28, kind: "mega" },
        { x: -94, z: 34, kind: "mega" },
        { x: 96, z: 36, kind: "mega" },
        { x: -108, z: -84, kind: "normal" },
        { x: 108, z: -82, kind: "normal" }
      ]
    },
    extra_high: {
      randomCount: 110,
      spacing: 14,
      megaEvery: 2,
      extras: [
        { x: 0, z: 92, kind: "normal" },
        { x: -62, z: -44, kind: "mega" },
        { x: 74, z: -28, kind: "mega" },
        { x: -86, z: 78, kind: "normal" },
        { x: 86, z: 74, kind: "normal" },
        { x: -128, z: 0, kind: "mega" },
        { x: 128, z: 0, kind: "mega" },
        { x: 0, z: 128, kind: "mega" },
        { x: 0, z: -128, kind: "mega" },
        { x: -148, z: 96, kind: "normal" },
        { x: 148, z: 96, kind: "normal" },
        { x: -148, z: -96, kind: "normal" },
        { x: 148, z: -96, kind: "normal" }
      ]
    }
  };
  return table[density] ?? table.normal;
}

function spawnRampLayout(config) {
  ramps.length = 0;
  const titanRamp = makeRamp("titan");
  titanRamp.position.set(0, 0, 0);
  ramps.push(titanRamp);

  const rampPoints = generateSpacedPolarPoints(config.randomCount, 80, HALF_WORLD - 38, config.spacing);
  rampPoints.forEach(({ x, z }, index) => {
    const kind = index % config.megaEvery === 0 ? "mega" : "normal";
    const ramp = makeRamp(kind);
    ramp.position.set(x, 0, z);
    ramps.push(ramp);
  });

  config.extras.forEach(({ x, z, kind }) => {
    const ramp = makeRamp(kind);
    ramp.position.set(x, 0, z);
    ramps.push(ramp);
  });
}

function isMenuOpen() {
  return menu.classList.contains("show");
}

function setMenuOpen(open) {
  menu.classList.toggle("show", open);
  debugLog("menu", open ? "menu_open" : "menu_close");
}

function clearWorld() {
  obstacles.splice(0, obstacles.length);
  ramps.forEach((ramp) => {
    scene.remove(ramp);
    disposeObject3D(ramp);
  });
  ramps.splice(0, ramps.length);
  powerups.forEach((powerup) => {
    scene.remove(powerup);
    disposeObject3D(powerup);
  });
  powerups.splice(0, powerups.length);
  boostPads.forEach((pad) => {
    scene.remove(pad);
    disposeObject3D(pad);
  });
  boostPads.splice(0, boostPads.length);
  arena.children.forEach((child) => disposeObject3D(child));
  props.children.forEach((child) => disposeObject3D(child));
  arena.clear();
  props.clear();
}

function buildWorld() {
  if (state.isBuildingWorld) return;
  state.isBuildingWorld = true;
  try {
    clearWorld();
    const world = getWorld();
    scene.fog.color.setHex(world.fog);
    scene.background = new THREE.Color(world.sky);
    groundMaterial.color.setHex(world.ground);

    const rampConfig = getRampDensityConfig(settings.rampDensity);
    spawnRampLayout(rampConfig);

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
    state.buildCount += 1;
    debugLog("world", "buildWorld complete", {
      buildCount: state.buildCount,
      ramps: ramps.length,
      pads: boostPads.length,
      rampDensity: settings.rampDensity
    });
  } finally {
    state.isBuildingWorld = false;
  }
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
  state.slowBotsTimer = 0;
  state.effectToast = "";
  state.effectToastTimer = 0;
  const level = getLevel();
  state.timeLeft = level.time;

  player.setPosition(PLAYER_SPAWN_X, 0, PLAYER_SPAWN_Z);
  player.velocity.set(0, 0, 0);
  player.speed = 0;
  player.maxSpeed = PLAYER_MAX_SPEED;
  player.accel = 22 * PLAYER_ACCEL_MULT;
  player.heading = 0;
  player.moveHeading = 0;
  player.verticalVel = 0;
  player.lastRampTime = 0;
  player.prevPosition.copy(player.position);
  state.steerSmoothed = 0;
  state.lastHitAt = 0;
  state.lastHitByBotId = -1;
  state.postHitSafeFrames = 0;

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
    powerup.position.set(THREE.MathUtils.randFloatSpread(HALF_WORLD * 1.65), 1.8, THREE.MathUtils.randFloatSpread(HALF_WORLD * 1.65));
    powerups.push(powerup);
  }
}

function updatePowerups(dt) {
  powerups.forEach((powerup) => {
    powerup.userData.spin += dt * 1.4;
    powerup.rotation.y = powerup.userData.spin;
    powerup.position.y = 1.8 + Math.sin(powerup.userData.spin * 2) * 0.25;
  });
}

function consumePowerup(powerup) {
  const type = powerup.userData.type;
  if (type === "boost") {
    state.boost = 1;
    state.score += 200;
    setEffectToast("Boost Refilled");
    debugLog("powerups", "boost_applied");
  }
  if (type === "shield") {
    state.shield = Math.min(1, state.shield + 0.75);
    state.shieldTimer = 7.5;
    state.score += 150;
    setEffectToast("Shield Up");
    debugLog("powerups", "shield_applied");
  }
  if (type === "life") {
    const previousLives = state.lives;
    state.lives = Math.min(5, state.lives + 1);
    if (state.lives > previousLives) state.livesPulse = 1;
    state.score += 250;
    setEffectToast(state.lives > previousLives ? "Extra Life" : "Life Maxed");
    debugLog("powerups", "life_applied", { lives: state.lives });
  }
  if (type === "slow") {
    state.heat = Math.max(0, state.heat - 0.4);
    state.slowBotsTimer = Math.max(state.slowBotsTimer, 6);
    state.score += 120;
    setEffectToast("Bots Slowed");
    debugLog("powerups", "slow_applied");
  }

  powerup.position.set(THREE.MathUtils.randFloatSpread(HALF_WORLD * 1.65), 1.8, THREE.MathUtils.randFloatSpread(HALF_WORLD * 1.65));
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
  const accel = player.accel * (boostActive ? 1.45 : 1);
  if (throttle) player.speed += accel * dt;
  if (brake) player.speed -= accel * dt * (0.9 + speedRatio * 0.25);

  if (!throttle && !brake) {
    player.speed -= Math.sign(player.speed) * (7.3 + speedRatio * 4.6) * dt;
  }

  player.speed = THREE.MathUtils.clamp(player.speed, -14, player.maxSpeed * (boostActive ? PLAYER_BOOST_SPEED_MULT : 1));

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
  const speedAbs = Math.abs(car.speed);
  const substeps = THREE.MathUtils.clamp(Math.ceil(speedAbs / 17), PHYSICS_SUBSTEPS_BASE, PHYSICS_SUBSTEPS_MAX);
  const stepDt = dt / substeps;

  for (let step = 0; step < substeps; step += 1) {
    car.verticalVel += GRAVITY * stepDt;
    car.position.y += car.verticalVel * stepDt;

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
      state.airTime += stepDt;
      state.wasAirborne = true;
    }

    const phase = (step + 1) / substeps;
    const nowX = THREE.MathUtils.lerp(car.prevPosition.x, car.position.x, phase);
    const nowZ = THREE.MathUtils.lerp(car.prevPosition.z, car.position.z, phase);
    const nextX = nowX + car.velocity.x * stepDt;
    const nextZ = nowZ + car.velocity.z * stepDt;
    const hitTimeReady = performance.now() - car.lastRampTime > 140;

    for (let i = 0; i < ramps.length; i += 1) {
      const ramp = ramps[i];
      const radius = ramp.userData.radius;
      const jumpLift = ramp.userData.jumpLift ?? 4;
      const speedKick = ramp.userData.speedKick ?? 11;
      const prevDistance = Math.hypot(car.prevPosition.x - ramp.position.x, car.prevPosition.z - ramp.position.z);
      const currentDistance = Math.hypot(nowX - ramp.position.x, nowZ - ramp.position.z);
      const nextDistance = Math.hypot(nextX - ramp.position.x, nextZ - ramp.position.z);
      const sweptFromPrev = pointSegmentDistance2D(
        ramp.position.x,
        ramp.position.z,
        car.prevPosition.x,
        car.prevPosition.z,
        nowX,
        nowZ
      );
      const sweptDistance = pointSegmentDistance2D(ramp.position.x, ramp.position.z, nowX, nowZ, nextX, nextZ);
      const speedMargin = Math.min(12.5, speedAbs * RAMP_SPEED_MARGIN_MULT);
      const triggerRadius = radius + RAMP_TRIGGER_THICKNESS + speedMargin;
      const closestDistance = Math.min(prevDistance, currentDistance, nextDistance, sweptFromPrev, sweptDistance);
      const groundedEnough = car.position.y <= 0.72;
      if (closestDistance < triggerRadius && groundedEnough && hitTimeReady && speedAbs > 1.5) {
        const centerBoost = 1 - THREE.MathUtils.clamp(closestDistance / triggerRadius, 0, 1);
        car.verticalVel = (10 + speedAbs * 0.092 + centerBoost * jumpLift) * RAMP_LAUNCH_VERTICAL_MULT;
        const currentSign = Math.sign(car.speed || 1);
        car.speed = Math.min(car.maxSpeed * 1.45, speedAbs + speedKick) * currentSign;
        car.lastRampTime = performance.now();
        debugLog("ramps", "ramp contact", { carIsBot: car.isBot, rampKind: ramp.userData.kind, closestDistance, speedAbs });
        if (!car.isBot) state.score += Math.round(80 + centerBoost * (80 + jumpLift * 9));
        break;
      }
    }
  }
}

function isValidBotHit(playerCar, botCar, segmentDistance) {
  const horizontalTouch = segmentDistance < BOT_HIT_RADIUS;
  const verticalTouch = Math.abs(playerCar.position.y - botCar.position.y) < BOT_VERTICAL_HIT_TOLERANCE + BOT_COLLISION_HEIGHT;
  return { valid: horizontalTouch && verticalTouch, horizontalTouch, verticalTouch };
}

function updateBots(dt) {
  const level = getLevel();
  const profile = getDifficultyProfile();
  const slowMultiplier = state.slowBotsTimer > 0 ? 0.72 : 1;
  const targetSpeed = (level.botSpeed + state.heat * 8 * profile.heatRamp) * profile.speedMultiplier * slowMultiplier;
  if (bots.length === 0) return;

  const packCenter = new THREE.Vector3();
  for (let i = 0; i < bots.length; i += 1) {
    packCenter.add(bots[i].position);
  }
  packCenter.multiplyScalar(1 / bots.length);

  const playerForward = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading));
  const playerRight = new THREE.Vector3(Math.cos(player.heading), 0, -Math.sin(player.heading));

  bots.forEach((bot, index) => {
    bot.aiBurstCooldown = Math.max(0, bot.aiBurstCooldown - dt);
    const predictionTime = THREE.MathUtils.clamp((bot.position.distanceTo(player.position) / 60) * profile.leadFactor, 0.05, 0.85);
    const predicted = tempVector
      .copy(player.position)
      .addScaledVector(player.velocity, predictionTime)
      .addScaledVector(playerForward, 2.8 + Math.abs(player.speed) * 0.04);

    const role = getBotRole(index, bots.length, profile.teamwork);
    const roleTarget = tempVectorB.copy(predicted);
    const flankOffset = 12 + profile.teamwork * 10;
    if (role === "intercept") roleTarget.addScaledVector(playerForward, 11);
    if (role === "left_flank") roleTarget.addScaledVector(playerRight, -flankOffset).addScaledVector(playerForward, 4);
    if (role === "right_flank") roleTarget.addScaledVector(playerRight, flankOffset).addScaledVector(playerForward, 4);
    if (role === "cutoff") roleTarget.addScaledVector(playerForward, 18 + Math.abs(player.speed) * 0.24);
    if (role === "pressure") roleTarget.addScaledVector(playerForward, 6);

    // Team convergence keeps bots coordinated into a moving net on classic/brutal.
    roleTarget.addScaledVector(tempVectorC.copy(packCenter).sub(bot.position), profile.teamwork * 0.18);

    const toTarget = tempVectorC.copy(roleTarget).sub(bot.position);
    const distance = toTarget.length();
    const desiredHeading = Math.atan2(toTarget.x, toTarget.z);
    let steer = THREE.MathUtils.clamp(angleDifference(bot.heading, desiredHeading), -1, 1);
    steer *= profile.botSkill;

    let nearestBotDistance = 999;
    // Local separation keeps bots from stacking and helps flanking spread.
    for (let j = 0; j < bots.length; j += 1) {
      if (j === index) continue;
      const other = bots[j];
      const dx = bot.position.x - other.position.x;
      const dz = bot.position.z - other.position.z;
      const d2 = dx * dx + dz * dz;
      const d = Math.sqrt(d2);
      if (d < nearestBotDistance) nearestBotDistance = d;
      if (d2 > 0.01 && d2 < 36) {
        steer += (dx - dz) * 0.0045;
      }
    }
    steer = THREE.MathUtils.clamp(steer, -1, 1);

    bot.heading += steer * bot.turnRate * dt * profile.reaction;
    bot.moveHeading = THREE.MathUtils.lerp(bot.moveHeading, bot.heading, (1.9 + profile.botSkill) * dt);

    const desiredRange =
      role === "cutoff" ? 20 : role === "left_flank" || role === "right_flank" ? 14 : role === "intercept" ? 9 : 11;
    const rangeError = distance - desiredRange;
    let throttleFactor = THREE.MathUtils.clamp(rangeError / 26 + 0.55, 0.18, 1.28);
    if (distance < desiredRange * 0.8) throttleFactor *= 0.62;
    if (nearestBotDistance < 7) throttleFactor *= 0.7;

    let speedBoost = distance > 50 ? 1.28 : 1;
    if (bot.aiBurstCooldown <= 0 && distance > desiredRange * 1.15 && Math.random() < profile.burstChance * dt * 12) {
      bot.aiBurstCooldown = THREE.MathUtils.randFloat(1.1, 2.1);
      speedBoost += 0.28;
    }
    bot.speed += bot.accel * dt * throttleFactor * slowMultiplier;
    if (distance < desiredRange * 0.65) {
      bot.speed *= 1 - dt * 0.9;
    }
    const roleCap =
      role === "cutoff" ? 1.2 : role === "left_flank" || role === "right_flank" ? 1.12 : role === "intercept" ? 1.08 : 1;
    bot.speed = Math.min(targetSpeed * speedBoost * roleCap, bot.maxSpeed + state.heat * 6.5 * profile.heatRamp);

    const forward = tempVectorC.set(Math.sin(bot.moveHeading), 0, Math.cos(bot.moveHeading));
    bot.velocity.copy(forward).multiplyScalar(bot.speed);

    if (index % 2 === 0 && distance < 18) {
      bot.velocity.add(new THREE.Vector3(Math.cos(bot.heading), 0, -Math.sin(bot.heading)).multiplyScalar(6 * profile.botSkill));
    }

    updateVerticalPhysics(bot, dt);
    bot.update(dt);

    const segmentDistance = segmentSegmentDistance2D(
      player.prevPosition.x,
      player.prevPosition.z,
      player.position.x,
      player.position.z,
      bot.prevPosition.x,
      bot.prevPosition.z,
      bot.position.x,
      bot.position.z
    );
    const nowDistance = Math.hypot(player.position.x - bot.position.x, player.position.z - bot.position.z);
    const hitDistance = Math.min(segmentDistance, nowDistance);
    const hitEval = isValidBotHit(player, bot, hitDistance);
    if (hitEval.valid) {
      handlePlayerHit(bot.botId);
      bot.speed *= 0.65;
    } else if (hitEval.horizontalTouch && !hitEval.verticalTouch) {
      state.missedVerticalHitSamples += 1;
      debugLog("hits", "rejected_vertical_overlap", { botId: bot.botId, playerY: player.position.y, botY: bot.position.y });
    } else if (state.running && Math.abs(bot.speed) + Math.abs(player.speed) > 62 && hitDistance < BOT_HIT_RADIUS * 1.6) {
      state.missedHitSamples += 1;
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
    if (dist < POWERUP_PICKUP_RADIUS) {
      consumePowerup(powerup);
    }
  });
}

function updateBoostPads() {
  boostPads.forEach((pad) => {
    const distance = Math.hypot(player.position.x - pad.position.x, player.position.z - pad.position.z);
    if (distance < pad.userData.radius && player.position.y <= 0.2) {
      player.speed = Math.min(player.maxSpeed * PLAYER_BOOST_SPEED_MULT, player.speed + 18);
      state.boost = Math.min(1, state.boost + 0.24);
      state.score += 40;
    }
  });
}

function updateCamera(dt) {
  const cameraTarget = player.position.clone();
  const back = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading)).multiplyScalar(-CAMERA_BACK_DISTANCE);
  const desired = cameraTarget.clone().add(back).add(new THREE.Vector3(0, CAMERA_HEIGHT, 0));

  if (input.focusCamera || settings.cameraFocus) {
    desired.add(new THREE.Vector3(0, 4, 0));
  }

  camera.position.lerp(desired, dt * 3.2);
  camera.lookAt(player.position.clone().add(new THREE.Vector3(0, CAMERA_LOOK_HEIGHT, 0)));
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
  if (state.slowBotsTimer > 0) state.slowBotsTimer = Math.max(0, state.slowBotsTimer - dt);
  if (state.effectToastTimer > 0) {
    state.effectToastTimer = Math.max(0, state.effectToastTimer - dt);
    if (state.effectToastTimer === 0) state.effectToast = "";
  }
}

function drawMinimap() {
  if (!minimapCtx || !minimapCanvas) return;
  const size = minimapCanvas.width;
  const pad = 10;
  const center = size * 0.5;
  const mapRadius = center - pad;
  const scale = mapRadius / HALF_WORLD;
  const cos = Math.cos(-player.heading);
  const sin = Math.sin(-player.heading);

  const project = (wx, wz) => {
    const dx = wx - player.position.x;
    const dz = wz - player.position.z;
    const rx = dx * cos - dz * sin;
    const rz = dx * sin + dz * cos;
    return {
      x: center + rx * scale,
      y: center - rz * scale,
      inRange: rx * rx + rz * rz <= HALF_WORLD * HALF_WORLD
    };
  };

  const drawHeadingMarker = (x, y, heading, color, sizePx) => {
    const rel = heading - player.heading;
    const fx = Math.sin(rel);
    const fy = Math.cos(rel);
    const tail = sizePx * 1.25;
    const nose = sizePx * 1.45;
    const wing = sizePx * 0.58;

    // Direction stem removes ambiguity and makes travel heading obvious.
    minimapCtx.strokeStyle = color;
    minimapCtx.lineWidth = Math.max(1.4, sizePx * 0.34);
    minimapCtx.beginPath();
    minimapCtx.moveTo(x - fx * tail, y + fy * tail);
    minimapCtx.lineTo(x + fx * nose, y - fy * nose);
    minimapCtx.stroke();

    minimapCtx.fillStyle = color;
    minimapCtx.beginPath();
    minimapCtx.moveTo(x + fx * nose, y - fy * nose);
    minimapCtx.lineTo(x - fy * wing, y - fx * wing);
    minimapCtx.lineTo(x + fy * wing, y + fx * wing);
    minimapCtx.closePath();
    minimapCtx.fill();

    minimapCtx.beginPath();
    minimapCtx.arc(x, y, Math.max(1.8, sizePx * 0.33), 0, Math.PI * 2);
    minimapCtx.fill();
  };

  minimapCtx.clearRect(0, 0, size, size);
  minimapCtx.fillStyle = "rgba(6, 12, 20, 0.96)";
  minimapCtx.fillRect(0, 0, size, size);

  minimapCtx.save();
  minimapCtx.beginPath();
  minimapCtx.arc(center, center, mapRadius, 0, Math.PI * 2);
  minimapCtx.clip();

  minimapCtx.strokeStyle = "rgba(123, 161, 199, 0.75)";
  minimapCtx.lineWidth = 1;
  minimapCtx.strokeRect(center - mapRadius, center - mapRadius, mapRadius * 2, mapRadius * 2);

  minimapCtx.strokeStyle = "rgba(123, 161, 199, 0.28)";
  const step = (mapRadius * 2) / 4;
  for (let i = 1; i < 4; i += 1) {
    const p = center - mapRadius + step * i;
    minimapCtx.beginPath();
    minimapCtx.moveTo(p, center - mapRadius);
    minimapCtx.lineTo(p, center + mapRadius);
    minimapCtx.stroke();
    minimapCtx.beginPath();
    minimapCtx.moveTo(center - mapRadius, p);
    minimapCtx.lineTo(center + mapRadius, p);
    minimapCtx.stroke();
  }

  minimapCtx.strokeStyle = "rgba(135, 185, 228, 0.55)";
  minimapCtx.lineWidth = 1.2;
  const worldCorners = [
    project(-HALF_WORLD, -HALF_WORLD),
    project(HALF_WORLD, -HALF_WORLD),
    project(HALF_WORLD, HALF_WORLD),
    project(-HALF_WORLD, HALF_WORLD)
  ];
  minimapCtx.beginPath();
  minimapCtx.moveTo(worldCorners[0].x, worldCorners[0].y);
  for (let i = 1; i < worldCorners.length; i += 1) {
    minimapCtx.lineTo(worldCorners[i].x, worldCorners[i].y);
  }
  minimapCtx.closePath();
  minimapCtx.stroke();

  // Explicit north marker centered to current heading so map top is always your forward direction.
  minimapCtx.strokeStyle = "rgba(126, 255, 255, 0.78)";
  minimapCtx.lineWidth = 1.2;
  minimapCtx.beginPath();
  minimapCtx.moveTo(center, center - mapRadius + 8);
  minimapCtx.lineTo(center, center - mapRadius + 18);
  minimapCtx.stroke();

  minimapCtx.fillStyle = "rgba(255, 171, 92, 0.94)";
  ramps.forEach((ramp) => {
    const p = project(ramp.position.x, ramp.position.z);
    if (!p.inRange) return;
    const r = ramp.userData.kind === "titan" ? 4.2 : ramp.userData.kind === "mega" ? 3 : 2;
    minimapCtx.beginPath();
    minimapCtx.arc(p.x, p.y, r, 0, Math.PI * 2);
    minimapCtx.fill();
  });

  bots.forEach((bot) => {
    const p = project(bot.position.x, bot.position.z);
    if (!p.inRange) return;
    drawHeadingMarker(p.x, p.y, bot.heading, "rgba(255, 98, 98, 0.95)", 4.2);
  });

  drawHeadingMarker(center, center, player.heading, "#7effff", 6.4);

  minimapCtx.restore();
}

function updateHud() {
  const level = getLevel();
  hudWorld.textContent = getWorld().name;
  hudLevel.textContent = state.effectToast ? `${level.name} - ${state.effectToast}` : level.name;
  hudScore.textContent = Math.floor(state.score).toString();
  hudSpeed.textContent = `${Math.round(Math.abs(player.speed) * SPEED_TO_MPH_MULT)} MPH`;
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
  player.setPosition(PLAYER_SPAWN_X, 0, PLAYER_SPAWN_Z);
  player.speed = 0;
  player.velocity.set(0, 0, 0);
  player.verticalVel = 0;
  player.heading = 0;
  player.moveHeading = 0;
  player.prevPosition.copy(player.position);
}

function handlePlayerHit(sourceBotId = -1) {
  const now = performance.now();
  if (state.postHitSafeFrames > 0) {
    debugLog("hits", "suppressed_by_post_safe_frames", { sourceBotId, postHitSafeFrames: state.postHitSafeFrames });
    return;
  }
  if (state.invincible > 0) {
    debugLog("hits", "suppressed_by_invincibility", { sourceBotId, invincible: state.invincible });
    return;
  }
  if (now - state.lastHitAt < BOT_HIT_COOLDOWN_MS) {
    debugLog("hits", "suppressed_by_hit_cooldown", { sourceBotId, deltaMs: now - state.lastHitAt });
    return;
  }

  state.lastHitAt = now;
  state.lastHitByBotId = sourceBotId;
  state.hitCount += 1;
  debugLog("hits", "detected", { sourceBotId, hitCount: state.hitCount });

  if (state.shield > 0.2) {
    state.shield = Math.max(0, state.shield - 0.3);
  } else {
    loseLife();
    debugLog("hits", "life_decremented", { lives: state.lives });
  }
  state.invincible = 1.15;
  state.postHitSafeFrames = POST_HIT_SAFE_FRAMES;

  for (let i = 0; i < bots.length; i += 1) {
    const bot = bots[i];
    if (bot.position.distanceToSquared(player.position) < 26 * 26) {
      bot.prevPosition.copy(bot.position);
    }
  }

  if (state.lives <= 0) {
    dispatchGameAction("retry");
    debugLog("hits", "restart_triggered");
  }
}

function getSteer() {
  if (input.touchEnabled) {
    return input.touchSteer;
  }
  if (input.pointerActive) {
    const delta = (input.pointerStartX - input.pointerX) / (window.innerWidth * 0.4);
    return THREE.MathUtils.clamp(delta, -1, 1);
  }
  return (input.left ? -1 : 0) + (input.right ? 1 : 0);
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
  setMenuOpen(false);
  if (resetLives) {
    state.lives = 3;
    state.livesPulse = 0;
    state.score = 0;
  }
  state.running = true;
  resetLevel();
}

function dispatchGameAction(action) {
  if (action === "retry") {
    showMessage("System Critical", "The hunters caught you. Press Enter to retry.", "Retry", "retry");
    return;
  }
  if (action === "start") {
    startRun(true);
    return;
  }
  if (action === "restart-level") {
    startRun(false);
    return;
  }
  if (action === "message-next") {
    if (!message.classList.contains("show")) return;
    message.classList.remove("show");
    if (state.pendingAction === "retry") startRun(true);
    else advanceNext();
  }
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
  const pausedByMenu = isMenuOpen();

  if (state.running && !pausedByMenu) {
    if (state.postHitSafeFrames > 0) state.postHitSafeFrames -= 1;
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
  if (event.code === "Space") event.preventDefault();
  if (event.code === "ArrowLeft" || event.code === "KeyA") input.left = true;
  if (event.code === "ArrowRight" || event.code === "KeyD") input.right = true;
  if (event.code === "ArrowUp" || event.code === "KeyW") input.throttle = true;
  if (event.code === "ArrowDown" || event.code === "KeyS") input.brake = true;
  if (event.code === "Space") input.drift = true;
  if (event.code === "ShiftLeft" || event.code === "ShiftRight") input.boost = true;
  if (event.code === "KeyC") input.focusCamera = true;
  if (event.code === "KeyR") dispatchGameAction("restart-level");
  if (event.code === "Enter") {
    if (overlay.classList.contains("show")) {
      dispatchGameAction("start");
    } else if (message.classList.contains("show")) {
      dispatchGameAction("message-next");
    }
  }
  if (event.code === "Escape") {
    setMenuOpen(!isMenuOpen());
  }
  debugLog("input", "keydown", event.code);
});

window.addEventListener("keyup", (event) => {
  if (event.code === "Space") event.preventDefault();
  if (event.code === "ArrowLeft" || event.code === "KeyA") input.left = false;
  if (event.code === "ArrowRight" || event.code === "KeyD") input.right = false;
  if (event.code === "ArrowUp" || event.code === "KeyW") input.throttle = false;
  if (event.code === "ArrowDown" || event.code === "KeyS") input.brake = false;
  if (event.code === "Space") input.drift = false;
  if (event.code === "ShiftLeft" || event.code === "ShiftRight") input.boost = false;
  if (event.code === "KeyC") input.focusCamera = false;
  debugLog("input", "keyup", event.code);
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

function updateTouchInput(clientX, clientY) {
  const rect = touchSteerPad.getBoundingClientRect();
  const cx = rect.left + rect.width * 0.5;
  const cy = rect.top + rect.height * 0.5;
  const dx = clientX - cx;
  const dy = clientY - cy;
  const radius = rect.width * 0.42;
  const dist = Math.hypot(dx, dy);
  const clampedDist = Math.min(radius, dist);
  const nx = dist > 0 ? dx / dist : 0;
  const ny = dist > 0 ? dy / dist : 0;
  const knobX = nx * clampedDist;
  const knobY = ny * clampedDist;
  touchSteerKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;
  input.touchSteer = THREE.MathUtils.clamp(knobX / radius, -1, 1);
  input.throttle = ny < -0.1 || clampedDist > radius * 0.2;
  input.brake = ny > 0.45;
}

function resetTouchSteer() {
  input.touchSteer = 0;
  touchSteerKnob.style.transform = "translate(0px, 0px)";
  if (input.touchEnabled) {
    input.throttle = false;
    input.brake = false;
  }
}

function initTouchControls() {
  if (!touchSteerPad) return;
  touchSteerPad.style.touchAction = "none";
  touchSteerPad.addEventListener("pointerdown", (event) => {
    if (!input.touchEnabled) return;
    touchSteerPad.setPointerCapture(event.pointerId);
    updateTouchInput(event.clientX, event.clientY);
  });
  touchSteerPad.addEventListener("pointermove", (event) => {
    if (!input.touchEnabled) return;
    if (event.pressure === 0 && event.buttons === 0) return;
    updateTouchInput(event.clientX, event.clientY);
  });
  const endSteer = () => resetTouchSteer();
  touchSteerPad.addEventListener("pointerup", endSteer);
  touchSteerPad.addEventListener("pointercancel", endSteer);
  touchSteerPad.addEventListener("pointerleave", endSteer);

  touchDrift.addEventListener("pointerdown", () => {
    if (input.touchEnabled) input.drift = true;
  });
  touchDrift.addEventListener("pointerup", () => {
    if (input.touchEnabled) input.drift = false;
  });
  touchDrift.addEventListener("pointerleave", () => {
    if (input.touchEnabled) input.drift = false;
  });
  touchBoost.addEventListener("pointerdown", () => {
    if (input.touchEnabled) input.boost = true;
  });
  touchBoost.addEventListener("pointerup", () => {
    if (input.touchEnabled) input.boost = false;
  });
  touchBoost.addEventListener("pointerleave", () => {
    if (input.touchEnabled) input.boost = false;
  });
}

startBtn.addEventListener("click", () => startRun(true));
tutorialBtn.addEventListener("click", () => {
  tips.style.display = tips.style.display === "none" ? "grid" : "none";
});
nextBtn.addEventListener("click", () => {
  dispatchGameAction("message-next");
});
retryBtn.addEventListener("click", () => {
  message.classList.remove("show");
  if (state.pendingAction === "retry") {
    dispatchGameAction("start");
  } else {
    dispatchGameAction("restart-level");
  }
});

menuBtn.addEventListener("click", () => {
  setMenuOpen(true);
});
menuClose.addEventListener("click", () => {
  setMenuOpen(false);
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

if (rampDensitySelect) {
  rampDensitySelect.addEventListener("change", (event) => {
    settings.rampDensity = event.target.value;
    buildWorld();
  });
}

invertToggle.addEventListener("change", (event) => {
  settings.invertSteer = event.target.checked;
});

cameraToggle.addEventListener("change", (event) => {
  settings.cameraFocus = event.target.checked;
});

if (touchModeToggle) {
  touchModeToggle.addEventListener("change", (event) => {
    input.touchEnabled = event.target.checked;
    touchControlsRoot.classList.toggle("enabled", input.touchEnabled);
    if (!input.touchEnabled) {
      resetTouchSteer();
      input.drift = false;
      input.boost = false;
    }
  });
}

createFxPool();
initTouchControls();
invertToggle.checked = settings.invertSteer;
cameraToggle.checked = settings.cameraFocus;
if (rampDensitySelect) rampDensitySelect.value = settings.rampDensity;
resetLevel();
updateHud();
requestAnimationFrame(animate);
