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
const hudLives = document.getElementById("hud-lives");
const hudCombo = document.getElementById("hud-combo");
const touchDrift = document.getElementById("touch-drift");
const touchBoost = document.getElementById("touch-boost");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0b0f14, 30, 240);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 600);
camera.position.set(0, 7.5, 14);

const hemi = new THREE.HemisphereLight(0xfff0e0, 0x0b1524, 0.9);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xff7a45, 1.0);
sun.position.set(18, 28, 14);
scene.add(sun);

const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x0c1016, roughness: 0.9 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.02;
scene.add(ground);

const arena = new THREE.Group();
const props = new THREE.Group();
scene.add(arena, props);

const WORLD_SIZE = 200;
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
    fog: 0x0b0f14,
    sky: 0x120b10,
    ground: 0x120b10,
    accents: [0xff4d2d, 0xffa24c],
    levels: [
      { name: "Heatline Run", time: 70, bots: 4, botSpeed: 36, spawnRate: 0.6 },
      { name: "Neon Harriers", time: 80, bots: 5, botSpeed: 40, spawnRate: 0.7 },
      { name: "Ashfall Siege", time: 90, bots: 6, botSpeed: 44, spawnRate: 0.75 }
    ]
  },
  {
    name: "Glacier Surge",
    fog: 0x0b141c,
    sky: 0x0a1a2a,
    ground: 0x0e1f2d,
    accents: [0x20d4ff, 0x5ee1ff],
    levels: [
      { name: "Frostbite Drift", time: 80, bots: 5, botSpeed: 38, spawnRate: 0.65 },
      { name: "Aurora Raiders", time: 90, bots: 6, botSpeed: 42, spawnRate: 0.75 },
      { name: "Polar Rift", time: 100, bots: 7, botSpeed: 46, spawnRate: 0.8 }
    ]
  },
  {
    name: "Solar Rift",
    fog: 0x120c06,
    sky: 0x2c0f07,
    ground: 0x1c0c05,
    accents: [0xff6b3f, 0xffc457],
    levels: [
      { name: "Helios Gate", time: 90, bots: 6, botSpeed: 40, spawnRate: 0.7 },
      { name: "Redline Tempest", time: 100, bots: 7, botSpeed: 46, spawnRate: 0.8 },
      { name: "Supernova Run", time: 110, bots: 8, botSpeed: 50, spawnRate: 0.85 }
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
  lastRampTime: 0,
  pendingAction: "next"
};

const obstacles = [];
const ramps = [];
const powerups = [];
const bots = [];

const tempVector = new THREE.Vector3();

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

function makeRamp() {
  const rampGeo = new THREE.BoxGeometry(6, 0.6, 8);
  const rampMat = new THREE.MeshStandardMaterial({ color: 0x202832, roughness: 0.6 });
  const ramp = new THREE.Mesh(rampGeo, rampMat);
  ramp.rotation.x = -Math.PI / 7;
  ramp.position.y = 0.35;
  ramp.userData.size = new THREE.Vector3(6, 0.6, 8);
  scene.add(ramp);
  return ramp;
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

function clearWorld() {
  obstacles.splice(0, obstacles.length);
  ramps.splice(0, ramps.length);
  powerups.forEach((powerup) => scene.remove(powerup));
  powerups.splice(0, powerups.length);
  arena.clear();
  props.clear();
}

function buildWorld() {
  clearWorld();
  const world = getWorld();
  scene.fog.color.setHex(world.fog);
  scene.background = new THREE.Color(world.sky);
  groundMaterial.color.setHex(world.ground);

  const accentColors = world.accents;
  for (let x = -90; x <= 90; x += 20) {
    for (let z = -90; z <= 90; z += 20) {
      if (Math.abs(x) < 40 && Math.abs(z) < 40) continue;
      if (Math.random() < 0.6) continue;
      const height = 6 + Math.random() * 18;
      const color = accentColors[Math.floor(Math.random() * accentColors.length)];
      makeBuilding(x + Math.random() * 4, z + Math.random() * 4, height, color);
    }
  }

  for (let i = 0; i < 6; i += 1) {
    makeBarrier(THREE.MathUtils.randFloatSpread(120), THREE.MathUtils.randFloatSpread(120), 8, 3);
  }

  ramps.length = 0;
  for (let i = 0; i < 4; i += 1) {
    const ramp = makeRamp();
    ramp.position.x = THREE.MathUtils.randFloatSpread(120);
    ramp.position.z = THREE.MathUtils.randFloatSpread(120);
    ramps.push(ramp);
  }

  for (let i = 0; i < 6; i += 1) {
    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 2.6, 12 + Math.random() * 12, 6),
      new THREE.MeshStandardMaterial({ color: accentColors[i % accentColors.length], roughness: 0.8 })
    );
    tower.position.set(THREE.MathUtils.randFloatSpread(160), 6, THREE.MathUtils.randFloatSpread(160));
    arena.add(tower);
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
  const level = getLevel();
  state.timeLeft = level.time;

  player.setPosition(0, 0, 0);
  player.velocity.set(0, 0, 0);
  player.speed = 0;
  player.heading = 0;
  player.moveHeading = 0;
  player.verticalVel = 0;

  buildWorld();
  spawnBots();
  spawnPowerups();
}

function spawnBots() {
  bots.forEach((bot) => scene.remove(bot.group));
  bots.splice(0, bots.length);
  const level = getLevel();
  const palette = getWorld().accents;
  for (let i = 0; i < level.bots; i += 1) {
    const bot = makeBot(palette[i % palette.length]);
    bot.setPosition(THREE.MathUtils.randFloatSpread(60), 0, THREE.MathUtils.randFloatSpread(60));
    bot.maxSpeed = level.botSpeed;
    bot.accel = 20 + level.bots;
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
    powerup.position.set(THREE.MathUtils.randFloatSpread(130), 1.4, THREE.MathUtils.randFloatSpread(130));
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
    state.lives = Math.min(5, state.lives + 1);
    state.score += 250;
  }
  if (type === "slow") {
    state.heat = Math.max(0, state.heat - 0.4);
    bots.forEach((bot) => (bot.maxSpeed *= 0.92));
    state.score += 120;
  }

  powerup.position.set(THREE.MathUtils.randFloatSpread(130), 1.4, THREE.MathUtils.randFloatSpread(130));
  powerup.userData.type = ["boost", "shield", "life", "slow"][Math.floor(Math.random() * 4)];
  powerup.material.color.setHex({
    boost: 0x28d7ff,
    shield: 0x7bff9d,
    life: 0xff4d2d,
    slow: 0xffc457
  }[powerup.userData.type]);
  powerup.material.emissive.setHex(powerup.material.color.getHex());
}

function updatePlayer(dt) {
  const steer = getSteer();
  const throttle = input.throttle ? 1 : 0;
  const brake = input.brake ? 1 : 0;
  const drift = input.drift;
  const boostActive = input.boost && state.boost > 0.05;

  const accel = player.accel * (boostActive ? 1.4 : 1);
  if (throttle) player.speed += accel * dt;
  if (brake) player.speed -= accel * dt * 0.8;

  if (!throttle && !brake) {
    player.speed -= Math.sign(player.speed) * 12 * dt;
  }

  player.speed = THREE.MathUtils.clamp(player.speed, -12, player.maxSpeed * (boostActive ? 1.25 : 1));

  const grip = drift ? player.driftGrip : player.normalGrip;
  player.heading += steer * player.turnRate * dt * (0.4 + Math.abs(player.speed) / player.maxSpeed);
  player.moveHeading = THREE.MathUtils.lerp(player.moveHeading, player.heading, grip * dt);

  const forward = new THREE.Vector3(Math.sin(player.moveHeading), 0, Math.cos(player.moveHeading));
  player.velocity.copy(forward).multiplyScalar(player.speed);

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
  }

  ramps.forEach((ramp) => {
    const size = ramp.userData.size;
    const withinX = Math.abs(car.position.x - ramp.position.x) < size.x * 0.5;
    const withinZ = Math.abs(car.position.z - ramp.position.z) < size.z * 0.5;
    const ready = performance.now() - state.lastRampTime > 600;
    if (withinX && withinZ && car.position.y <= 0.15 && ready && Math.abs(car.speed) > 6) {
      car.verticalVel = 10 + Math.abs(car.speed) * 0.1;
      car.speed = Math.min(car.maxSpeed, car.speed + 10);
      state.lastRampTime = performance.now();
      if (!car.isBot) state.score += 80;
    }
  });
}

function updateBots(dt) {
  const level = getLevel();
  const targetSpeed = level.botSpeed + state.heat * 8;

  bots.forEach((bot, index) => {
    const toPlayer = player.position.clone().sub(bot.position);
    const distance = toPlayer.length();
    const desiredHeading = Math.atan2(toPlayer.x, toPlayer.z);
    const steer = THREE.MathUtils.clamp(angleDifference(bot.heading, desiredHeading), -1, 1);

    bot.heading += steer * bot.turnRate * dt * 0.8;
    bot.moveHeading = THREE.MathUtils.lerp(bot.moveHeading, bot.heading, 2.2 * dt);

    const speedBoost = distance > 40 ? 1.2 : 1;
    bot.speed += bot.accel * dt * 0.5;
    bot.speed = Math.min(targetSpeed * speedBoost, bot.maxSpeed + state.heat * 5);

    const forward = new THREE.Vector3(Math.sin(bot.moveHeading), 0, Math.cos(bot.moveHeading));
    bot.velocity.copy(forward).multiplyScalar(bot.speed);

    if (index % 2 === 0 && distance < 14) {
      bot.velocity.add(new THREE.Vector3(Math.cos(bot.heading), 0, -Math.sin(bot.heading)).multiplyScalar(6));
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

function updateCamera(dt) {
  const cameraTarget = player.position.clone();
  const back = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading)).multiplyScalar(-12);
  const desired = cameraTarget.clone().add(back).add(new THREE.Vector3(0, 7.5, 0));

  if (input.focusCamera) {
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
  state.elapsed += dt;
  if (state.elapsed > 10) {
    state.heat = Math.min(1.2, state.heat + dt * 0.015);
  }
}

function updateHud() {
  const level = getLevel();
  hudWorld.textContent = getWorld().name;
  hudLevel.textContent = level.name;
  hudScore.textContent = Math.floor(state.score).toString();
  hudLives.textContent = state.lives.toString();
  hudCombo.textContent = `x${state.combo.toFixed(1)}`;
  const minutes = Math.floor(state.timeLeft / 60);
  const seconds = Math.floor(state.timeLeft % 60).toString().padStart(2, "0");
  hudTime.textContent = `${minutes}:${seconds}`;
  boostBar.style.width = `${Math.round(state.boost * 100)}%`;
  shieldBar.style.width = `${Math.round(state.shield * 100)}%`;
  progressBar.style.width = `${Math.min(100, (1 - state.timeLeft / level.time) * 100)}%`;
}

function loseLife() {
  state.lives -= 1;
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
  return (input.left ? 1 : 0) - (input.right ? 1 : 0);
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

    if (state.timeLeft <= 0) {
      completeLevel();
    }
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

resetLevel();
updateHud();
requestAnimationFrame(animate);
